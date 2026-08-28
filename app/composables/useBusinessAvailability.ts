import type { MaybeRef } from 'vue'
import type { EntityId, LoadStatus } from '~/types/common'
import type {
  AvailabilityDay,
  BusinessScheduleView,
  EmployeeScheduleSummary,
  EmployeeScheduleView,
  ScheduleInput
} from '~/types/availability'
import { toServiceError } from '~/utils/errors'

/**
 * ساعات کاری یک کسب‌وکار — برنامهٔ هفتهٔ کسب‌وکار + برنامهٔ پرسنلش (فاز ۱۱).
 *
 *   Page → useBusinessAvailability → services.availabilityManagement (mock | api)
 *
 * همان دو قاعدهٔ فاز ۹ و ۱۰، بدون استثنا:
 *   ۱) کش به‌ازای `businessId` — «آخرین کسب‌وکار باز شده» نداریم؛ با سوییچ
 *      زمینه، اسکلت می‌آید نه دادهٔ قبلی. برنامهٔ پرسنل هم *داخل* همان بستهٔ
 *      کسب‌وکار می‌آید، پس پرسنل کسب‌وکار الف در ب قابل دیدن/ویرایش نیست.
 *   ۲) هر نوشتن، کش همان کسب‌وکار را بازنویسی می‌کند (نه mutate کردن آرایهٔ
 *      بیرونی، نه refetch در هر صفحه). برای همین «ذخیرهٔ ساعت کسب‌وکار» بی‌reload
 *      در فهرست پرسنل، کارت خلاصه و ساعت‌های پیشنهادی رزرو مشتری دیده می‌شود —
 *      چون همه از یک دلتا می‌خوانند.
 *
 * خطاها `ServiceError` فارسی‌اند و ۴۰۱ از همان مسیر مرکزی احراز هویت رد می‌شود.
 */

export type AvailabilityAction = 'saving-business' | 'saving-employee' | 'resetting-employee'

export interface AvailabilityWriteOutcome {
  ok: boolean
  message: string | null
  /** نمای تازهٔ پرسنل (برای توضیح تناقض بعد از ذخیره)؛ برای کسب‌وکار `null` */
  view: EmployeeScheduleView | null
  /** `true` وقتی خطا از «منقضی‌شدن نشست» آمد — صفحه نباید پیام تکراری بدهد */
  sessionExpired?: boolean
}

const failed: AvailabilityWriteOutcome = { ok: false, message: null, view: null }

interface BusinessAvailabilityBundle {
  business: BusinessScheduleView | null
  employees: EmployeeScheduleSummary[]
}

function useBusinessAvailabilityStore() {
  const services = useServices()
  const authRecovery = useAuthRecovery()

  const data = useState<Record<EntityId, BusinessAvailabilityBundle>>(
    'owner:availability:data',
    () => ({})
  )
  const statuses = useState<Record<EntityId, LoadStatus>>('owner:availability:status', () => ({}))
  const errors = useState<Record<EntityId, string | null>>('owner:availability:error', () => ({}))
  /** شلوغی به‌ازای کلید ('business' یا employeeId) — یک سطر در حال ذخیره بقیه را قفل نمی‌کند */
  const busy = useState<Record<string, AvailabilityAction | null>>('owner:availability:busy', () => ({}))
  const actionErrors = useState<Record<string, string | null>>('owner:availability:action-error', () => ({}))

  const inflight = new Map<EntityId, Promise<void>>()

  const patch = <T,>(map: Record<EntityId, T>, id: EntityId, value: T): Record<EntityId, T> =>
    ({ ...map, [id]: value })

  const bundleFor = (businessId: EntityId | null): BusinessAvailabilityBundle | null =>
    businessId ? data.value[businessId] ?? null : null

  const statusFor = (businessId: EntityId | null): LoadStatus =>
    businessId ? statuses.value[businessId] ?? 'idle' : 'idle'

  async function load(businessId: EntityId): Promise<void> {
    statuses.value = patch(statuses.value, businessId, 'loading')
    errors.value = patch(errors.value, businessId, null)
    try {
      const [business, employees] = await Promise.all([
        services.availabilityManagement.getBusiness(businessId),
        services.availabilityManagement.listEmployees(businessId)
      ])
      data.value = patch(data.value, businessId, { business, employees })
      statuses.value = patch(statuses.value, businessId, 'ready')
    }
    catch (e) {
      if (await authRecovery.recover(e)) {
        statuses.value = patch(statuses.value, businessId, 'idle')
        return
      }
      statuses.value = patch(statuses.value, businessId, 'error')
      errors.value = patch(errors.value, businessId, authRecovery.message(e))
    }
  }

  /** یک‌بار بارگذاری به‌ازای هر کسب‌وکار؛ درخواست‌های هم‌زمان ادغام می‌شوند. */
  async function ensure(businessId: EntityId | null, force = false): Promise<void> {
    if (!businessId) return
    const pending = inflight.get(businessId)
    if (pending) return pending
    if (!force && statusFor(businessId) === 'ready') return
    const run = load(businessId).finally(() => { inflight.delete(businessId) })
    inflight.set(businessId, run)
    return run
  }

  async function write(
    key: string,
    action: AvailabilityAction,
    fn: () => Promise<EmployeeScheduleView | null>
  ): Promise<AvailabilityWriteOutcome> {
    busy.value = { ...busy.value, [key]: action }
    actionErrors.value = { ...actionErrors.value, [key]: null }
    try {
      const view = await fn()
      return { ok: true, message: null, view }
    }
    catch (e) {
      if (await authRecovery.recover(e)) return { ...failed, sessionExpired: true }
      const message = authRecovery.message(e)
      actionErrors.value = { ...actionErrors.value, [key]: message }
      return { ...failed, message }
    }
    finally {
      busy.value = { ...busy.value, [key]: null }
    }
  }

  /** برنامهٔ تازه را در کش همان کسب‌وکار می‌گذارد (بدون refetch کل فهرست). */
  function setBusiness(businessId: EntityId, business: BusinessScheduleView): void {
    const current = bundleFor(businessId)
    data.value = patch(data.value, businessId, {
      business,
      employees: current?.employees ?? []
    })
  }

  function setEmployee(businessId: EntityId, employee: EmployeeScheduleSummary): void {
    const current = bundleFor(businessId)
    const rest = (current?.employees ?? []).filter(e => e.employeeId !== employee.employeeId)
    data.value = patch(data.value, businessId, {
      business: current?.business ?? null,
      employees: [...rest, employee].sort((a, b) => a.displayName.localeCompare(b.displayName, 'fa'))
    })
  }

  /**
   * صفحهٔ ویرایش باید *تنها* رکورد خودش را تازه بخواند (deep link/refresh):
   * `getEmployee` را مستقیم صدا می‌زنیم و نتیجه را در کش می‌گذاریم.
   */
  async function loadOne(businessId: EntityId, employeeId: EntityId): Promise<{
    view: EmployeeScheduleView | null
    message: string | null
    missing: boolean
  }> {
    try {
      const view = await services.availabilityManagement.getEmployee(businessId, employeeId)
      setEmployee(businessId, view)
      return { view, message: null, missing: false }
    }
    catch (e) {
      if (await authRecovery.recover(e)) return { view: null, message: null, missing: false }
      const error = toServiceError(e)
      return { view: null, message: error.message, missing: error.code === 'NOT_FOUND' }
    }
  }

  const saveBusiness = (businessId: EntityId, days: AvailabilityDay[]): Promise<AvailabilityWriteOutcome> =>
    write('business', 'saving-business', async () => {
      const view = await services.availabilityManagement.saveBusiness(businessId, days)
      setBusiness(businessId, view)
      return null
    })

  const saveEmployee = async (
    businessId: EntityId,
    employeeId: EntityId,
    input: ScheduleInput
  ): Promise<AvailabilityWriteOutcome> =>
    write(employeeId, 'saving-employee', async () => {
      const view = await services.availabilityManagement.saveEmployee(businessId, employeeId, input)
      setEmployee(businessId, view)
      return view
    })

  const resetEmployee = async (businessId: EntityId, employeeId: EntityId): Promise<AvailabilityWriteOutcome> =>
    write(employeeId, 'resetting-employee', async () => {
      const view = await services.availabilityManagement.resetEmployeeToBusinessDefault(businessId, employeeId)
      setEmployee(businessId, view)
      return view
    })

  /** فقط از پلاگین دامنهٔ کاربر (خروج/تغییر حساب). */
  function reset(): void {
    data.value = {}
    statuses.value = {}
    errors.value = {}
    busy.value = {}
    actionErrors.value = {}
    inflight.clear()
  }

  return {
    bundleFor,
    statusFor,
    errors,
    busy,
    actionErrors,
    ensure,
    load,
    loadOne,
    saveBusiness,
    saveEmployee,
    resetEmployee,
    reset
  }
}

/** نمای بسته‌شده به یک کسب‌وکار. */
export function useBusinessAvailability(businessId: MaybeRef<EntityId | null>) {
  const store = useBusinessAvailabilityStore()
  const id = computed(() => toValue(businessId))

  const bundle = computed(() => store.bundleFor(id.value))
  const business = computed<BusinessScheduleView | null>(() => bundle.value?.business ?? null)
  const employees = computed<EmployeeScheduleSummary[]>(() => bundle.value?.employees ?? [])
  const status = computed<LoadStatus>(() => store.statusFor(id.value))

  return {
    businessId: id,
    business,
    employees,
    status: readonly(status),
    error: computed(() => (id.value ? store.errors.value[id.value] ?? null : null)),

    loading: computed(() => status.value === 'loading'),
    /** داده داریم و دوباره خوانده می‌شود → «در حال تازه‌سازی»، نه اسکلت */
    refreshing: computed(() => status.value === 'loading' && bundle.value !== null),
    initializing: computed(
      () => status.value === 'idle' || (status.value === 'loading' && !bundle.value)
    ),
    isReady: computed(() => status.value === 'ready'),

    ensure: (force = false) => store.ensure(id.value, force),
    refresh: () => (id.value ? store.load(id.value) : Promise.resolve()),
    loadOne: (employeeId: EntityId) =>
      id.value
        ? store.loadOne(id.value, employeeId)
        : Promise.resolve({ view: null, message: null, missing: true }),

    findEmployee: (employeeId: EntityId | null) =>
      employeeId ? employees.value.find(e => e.employeeId === employeeId) ?? null : null,

    saveBusiness: (days: AvailabilityDay[]) =>
      id.value
        ? store.saveBusiness(id.value, days)
        : Promise.resolve({ ...failed, message: 'کسب‌وکار مشخص نشده است.' }),
    saveEmployee: (employeeId: EntityId, input: ScheduleInput) =>
      id.value
        ? store.saveEmployee(id.value, employeeId, input)
        : Promise.resolve({ ...failed, message: 'کسب‌وکار مشخص نشده است.' }),
    resetEmployee: (employeeId: EntityId) =>
      id.value
        ? store.resetEmployee(id.value, employeeId)
        : Promise.resolve({ ...failed, message: 'کسب‌وکار مشخص نشده است.' }),

    busy: store.busy,
    busyFor: (key: string) => store.busy.value[key] ?? null,
    isBusy: (key: string) => (store.busy.value[key] ?? null) !== null,
    actionErrorFor: (key: string) => store.actionErrors.value[key] ?? null,
    clearActionError: (key: string) => {
      store.actionErrors.value = { ...store.actionErrors.value, [key]: null }
    }
  }
}

/** پاک‌سازی کش ساعات کاری — فقط از پلاگین دامنهٔ کاربر. */
export function useBusinessAvailabilityCache() {
  return { reset: useBusinessAvailabilityStore().reset }
}
