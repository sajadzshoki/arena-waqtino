import type { MaybeRef } from 'vue'
import type { EntityId, LoadStatus } from '~/types/common'
import type { EmployeeInput, EmployeeStatus, ManagedEmployee } from '~/types/employee'
import { toServiceError } from '~/utils/errors'

/**
 * پرسنل یک کسب‌وکار — نمای مدیر (همهٔ وضعیت‌ها) + اکشن‌های چرخهٔ حیات و اختصاص
 * سرویس.
 *
 *   Page → useBusinessEmployees → services.employeeManagement (mock | api)
 *
 * همان دو قاعده‌ای که فاز ۹ را از «CRUD معمولی» جدا کرد، اینجا هم برقرار است:
 *   ۱) انزوا به‌ازای businessId: کش `Record<businessId, ManagedEmployee[]>`؛
 *      پرسنل کسب‌وکار الف *ساختاراً* نمی‌تواند داخل کسب‌وکار ب دیده/ویرایش شود.
 *      هنگام سوییچ هم اسکلت می‌آید، نه دادهٔ قبلی.
 *   ۲) هر نوشتن، کش همان کسب‌وکار را بازنویسی می‌کند (upsert/remove) — نه mutate
 *      کردن آرایهٔ بیرونی، نه refetch هر صفحه. فهرست، جزئیات، شیت «اختصاص
 *      سرویس» و شمارش داشبورد از همین کش می‌خورند؛ برای همین «ذخیره کن و
 *      برگرد» بی‌reload درست کار می‌کند و انتخاب پرسنل در رزرو مشتری هم‌زمان
 *      می‌شود (چون لایهٔ سرویس همان دلتا را می‌خواند).
 *
 * خطاها از لایهٔ سرویس به شکل `ServiceError` با پیام فارسی می‌آیند و ۴۰۱ از همان
 * مسیر مرکزی احراز هویت رد می‌شود (پاک‌سازی نشست + هدایت به /login).
 */

export type EmployeeAction = 'creating' | 'saving' | 'status' | 'assigning' | 'deleting'

/** نتیجهٔ یکنواخت اکشن‌های نوشتن — صفحه try/catch نمی‌نویسد. */
export interface EmployeeActionOutcome {
  ok: boolean
  employee: ManagedEmployee | null
  /** پیام فارسی خطا؛ `null` وقتی موفق بود یا خطای نشست (خودش مدیریت شد) */
  message: string | null
}

const failedOutcome: EmployeeActionOutcome = { ok: false, employee: null, message: null }

/** همان ترتیب فهرست مدیر (الفبای فارسی) — کش و صفحه یکی بمانند. */
function sortEmployees(items: ManagedEmployee[]): ManagedEmployee[] {
  return [...items].sort((a, b) => a.displayName.localeCompare(b.displayName, 'fa'))
}

function useBusinessEmployeesStore() {
  const services = useServices()
  const authRecovery = useAuthRecovery()
  const dashboardCache = useOwnerDashboardCache()

  const lists = useState<Record<EntityId, ManagedEmployee[]>>('owner:employees:data', () => ({}))
  const statuses = useState<Record<EntityId, LoadStatus>>('owner:employees:status', () => ({}))
  const errors = useState<Record<EntityId, string | null>>('owner:employees:error', () => ({}))
  /** شلوغی به‌ازای کلید (employeeId یا `new`) — یک سطر در حال ذخیره، بقیه را قفل نمی‌کند */
  const busy = useState<Record<string, EmployeeAction | null>>('owner:employees:busy', () => ({}))
  const actionErrors = useState<Record<string, string | null>>('owner:employees:action-error', () => ({}))

  const inflight = new Map<EntityId, Promise<void>>()

  const patch = <T,>(map: Record<EntityId, T>, id: EntityId, value: T): Record<EntityId, T> =>
    ({ ...map, [id]: value })

  const statusFor = (businessId: EntityId): LoadStatus => statuses.value[businessId] ?? 'idle'

  const listFor = (businessId: EntityId | null): ManagedEmployee[] =>
    businessId ? lists.value[businessId] ?? [] : []

  /** upsert نتیجهٔ اکشن در کش همان کسب‌وکار (ساخت = append، ویرایش = جایگزینی). */
  function upsertCached(businessId: EntityId, employee: ManagedEmployee): void {
    const current = listFor(businessId)
    const next = current.some(e => e.id === employee.id)
      ? current.map(e => (e.id === employee.id ? employee : e))
      : [...current, employee]
    lists.value = patch(lists.value, businessId, sortEmployees(next))
  }

  function dropCached(businessId: EntityId, employeeId: EntityId): void {
    lists.value = patch(lists.value, businessId, listFor(businessId).filter(e => e.id !== employeeId))
  }

  async function load(businessId: EntityId): Promise<void> {
    statuses.value = patch(statuses.value, businessId, 'loading')
    errors.value = patch(errors.value, businessId, null)
    try {
      const items = await services.employeeManagement.list(businessId)
      lists.value = patch(lists.value, businessId, sortEmployees(items))
      statuses.value = patch(statuses.value, businessId, 'ready')
    }
    catch (e) {
      // نشست نامعتبر → پاک‌سازی مرکزی + redirect؛ پیام inline نمی‌سازیم
      if (await authRecovery.recover(e)) {
        statuses.value = patch(statuses.value, businessId, 'idle')
        return
      }
      statuses.value = patch(statuses.value, businessId, 'error')
      errors.value = patch(errors.value, businessId, authRecovery.message(e))
    }
  }

  /** بارگذاری یک‌بار به‌ازای هر کسب‌وکار؛ درخواست‌های هم‌زمان ادغام می‌شوند. */
  async function ensure(businessId: EntityId | null, force = false): Promise<void> {
    if (!businessId) return
    const pending = inflight.get(businessId)
    if (pending) return pending
    if (!force && statusFor(businessId) === 'ready') return
    const run = load(businessId).finally(() => { inflight.delete(businessId) })
    inflight.set(businessId, run)
    return run
  }

  /**
   * بستهٔ نوشتن: pending و خطای per-کلید + هم‌راستاسازی کش + بی‌اعتبارکردن
   * شمارندهٔ داشبورد همان کسب‌وکار (که «۳ پرسنل فعال» کهنه نماند).
   */
  async function run(
    businessId: EntityId,
    key: string,
    action: EmployeeAction,
    fn: () => Promise<ManagedEmployee | undefined>
  ): Promise<EmployeeActionOutcome> {
    busy.value = { ...busy.value, [key]: action }
    actionErrors.value = { ...actionErrors.value, [key]: null }
    try {
      const result = await fn()
      if (result) upsertCached(businessId, result)
      dashboardCache.invalidate(businessId)
      return { ok: true, employee: result ?? null, message: null }
    }
    catch (e) {
      if (await authRecovery.recover(e)) return failedOutcome
      const message = authRecovery.message(e)
      actionErrors.value = { ...actionErrors.value, [key]: message }
      return { ok: false, employee: null, message }
    }
    finally {
      busy.value = { ...busy.value, [key]: null }
    }
  }

  /** خواندن یک پرسنل برای deep link/refresh (به کش فهرست وابسته نیست). */
  async function loadOne(businessId: EntityId, employeeId: EntityId): Promise<{
    employee: ManagedEmployee | null
    message: string | null
    /** `true` = پرسنل نیست یا به این کسب‌وکار تعلق ندارد → حالت Not Found */
    missing: boolean
  }> {
    try {
      const employee = await services.employeeManagement.get(businessId, employeeId)
      upsertCached(businessId, employee)
      return { employee, message: null, missing: false }
    }
    catch (e) {
      if (await authRecovery.recover(e)) return { employee: null, message: null, missing: false }
      const error = toServiceError(e)
      return { employee: null, message: error.message, missing: error.code === 'NOT_FOUND' }
    }
  }

  const create = (businessId: EntityId, input: EmployeeInput) =>
    run(businessId, 'new', 'creating', () => services.employeeManagement.create(businessId, input))

  const update = (businessId: EntityId, employeeId: EntityId, input: EmployeeInput) =>
    run(businessId, employeeId, 'saving', () => services.employeeManagement.update(businessId, employeeId, input))

  const setStatus = (businessId: EntityId, employeeId: EntityId, next: EmployeeStatus) =>
    run(businessId, employeeId, 'status', () => services.employeeManagement.setStatus(businessId, employeeId, next))

  const assign = (businessId: EntityId, employeeId: EntityId, serviceIds: EntityId[]) =>
    run(businessId, employeeId, 'assigning', () => services.employeeManagement.assignServices(businessId, employeeId, serviceIds))

  const remove = (businessId: EntityId, employeeId: EntityId) =>
    run(businessId, employeeId, 'deleting', async () => {
      await services.employeeManagement.remove(businessId, employeeId)
      dropCached(businessId, employeeId)
      return undefined
    })

  function reset(): void {
    lists.value = {}
    statuses.value = {}
    errors.value = {}
    busy.value = {}
    actionErrors.value = {}
    inflight.clear()
  }

  return {
    statusFor,
    listFor,
    errors,
    busy,
    actionErrors,
    ensure,
    load,
    loadOne,
    create,
    update,
    setStatus,
    assign,
    remove,
    reset
  }
}

/**
 * نمای بسته‌شده به یک کسب‌وکار. همه‌چیز از `businessId` جاری می‌آید؛ اگر زمینه
 * عوض شود، تا رسیدن پاسخ تازه هیچ داده‌ای از زمینهٔ قبل نشان داده نمی‌شود.
 */
export function useBusinessEmployees(businessId: MaybeRef<EntityId | null>) {
  const store = useBusinessEmployeesStore()
  const id = computed(() => toValue(businessId))

  const items = computed(() => store.listFor(id.value))
  const status = computed<LoadStatus>(() => (id.value ? store.statusFor(id.value) : 'idle'))
  const error = computed(() => (id.value ? store.errors.value[id.value] ?? null : null))

  const counts = computed(() => {
    const active = items.value.filter(e => e.status === 'active').length
    return { all: items.value.length, active, inactive: items.value.length - active }
  })

  const busyFor = (key: string): EmployeeAction | null => store.busy.value[key] ?? null

  return {
    businessId: id,
    items,
    status: readonly(status),
    error,
    counts,

    loading: computed(() => status.value === 'loading'),
    /** هنوز هیچ پاسخی برای این کسب‌وکار نداشتیم → اسکلت، نه «خالی» */
    initializing: computed(() => status.value === 'idle' || (status.value === 'loading' && items.value.length === 0)),
    refreshing: computed(() => status.value === 'loading' && items.value.length > 0),
    isReady: computed(() => status.value === 'ready'),

    ensure: (force = false) => store.ensure(id.value, force),
    refresh: () => (id.value ? store.load(id.value) : Promise.resolve()),

    create: (input: EmployeeInput) =>
      id.value ? store.create(id.value, input) : Promise.resolve(failedOutcome),
    update: (employeeId: EntityId, input: EmployeeInput) =>
      id.value ? store.update(id.value, employeeId, input) : Promise.resolve(failedOutcome),
    setStatus: (employeeId: EntityId, next: EmployeeStatus) =>
      id.value ? store.setStatus(id.value, employeeId, next) : Promise.resolve(failedOutcome),
    assign: (employeeId: EntityId, serviceIds: EntityId[]) =>
      id.value ? store.assign(id.value, employeeId, serviceIds) : Promise.resolve(failedOutcome),
    remove: (employeeId: EntityId) =>
      id.value ? store.remove(id.value, employeeId) : Promise.resolve(failedOutcome),

    busyFor,
    isBusy: (key: string) => busyFor(key) !== null,
    anyBusy: computed(() => Object.values(store.busy.value).some(Boolean)),
    actionErrorFor: (key: string) => store.actionErrors.value[key] ?? null,
    clearActionError: (key: string) => {
      store.actionErrors.value = { ...store.actionErrors.value, [key]: null }
    },

    loadOne: (employeeId: EntityId) =>
      id.value
        ? store.loadOne(id.value, employeeId)
        : Promise.resolve({ employee: null, message: null, missing: true }),
    find: (employeeId: EntityId | null) =>
      employeeId ? items.value.find(e => e.id === employeeId) ?? null : null
  }
}

/** پاک‌سازی کش پرسنل — فقط از پلاگین دامنهٔ کاربر (خروج/تغییر حساب). */
export function useBusinessEmployeesCache() {
  return { reset: useBusinessEmployeesStore().reset }
}
