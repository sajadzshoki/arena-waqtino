import type { MaybeRef } from 'vue'
import type { EntityId, LoadStatus } from '~/types/common'
import type { ManagedService, ServiceInput, ServiceStatus } from '~/types/service'
import { toServiceError } from '~/utils/errors'

/**
 * سرویس‌های یک کسب‌وکار — نمای مدیر (همهٔ وضعیت‌ها) + اکشن‌های چرخهٔ حیات.
 *
 *   Page → useBusinessServices → services.serviceManagement (mock | api)
 *
 * دو قاعده‌ای که این فایل را از «CRUD معمولی» جدا می‌کند:
 *   ۱) انزوا به‌ازای businessId: کش `Record<businessId, ManagedService[]>`
 *      است، پس سرویس‌های کسب‌وکار الف *ساختاراً* نمی‌توانند داخل کسب‌وکار ب
 *      دیده/ویرایش شوند. هنگام سوییچ هم اسکلت می‌آید، نه دادهٔ قبلی.
 *   ۲) هر نوشتن، کش همان کسب‌وکار را بازنویسی می‌کند (upsert/remove) — نه
 *      mutate کردن آرایهٔ بیرونی، نه refetch هر صفحه. فهرست، جزئیات و شمارش
 *      داشبورد از همین کش می‌خورند، برای همین «ذخیره کن و برگرد» بی‌reload
 *      درست کار می‌کند.
 *
 * خطاها از لایهٔ سرویس به شکل `ServiceError` با پیام فارسی می‌آیند و ۴۰۱ از
 * همان مسیر مرکزی احراز هویت رد می‌شود (پاک‌سازی نشست + هدایت به /login).
 */

export type ServiceAction = 'creating' | 'saving' | 'status' | 'deleting'

/** نتیجهٔ یکنواخت اکشن‌های نوشتن — صفحه try/catch نمی‌نویسد. */
export interface ServiceActionOutcome {
  ok: boolean
  service: ManagedService | null
  /** پیام فارسی خطا؛ `null` وقتی موفق بود یا خطای نشست (خودش مدیریت شد) */
  message: string | null
}

const failedOutcome: ServiceActionOutcome = { ok: false, service: null, message: null }

/** همان ترتیب فهرست مدیر (الفبای فارسی) — کش و صفحه یکی بمانند. */
function sortServices(items: ManagedService[]): ManagedService[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'fa'))
}

function useBusinessServicesStore() {
  const services = useServices()
  const authRecovery = useAuthRecovery()
  const dashboardCache = useOwnerDashboardCache()

  const lists = useState<Record<EntityId, ManagedService[]>>('owner:services:data', () => ({}))
  const statuses = useState<Record<EntityId, LoadStatus>>('owner:services:status', () => ({}))
  const errors = useState<Record<EntityId, string | null>>('owner:services:error', () => ({}))
  /** شلوغی به‌ازای کلید (serviceId یا `new`) — یک سطر در حال ذخیره، بقیه را قفل نمی‌کند */
  const busy = useState<Record<string, ServiceAction | null>>('owner:services:busy', () => ({}))
  const actionErrors = useState<Record<string, string | null>>('owner:services:action-error', () => ({}))

  const inflight = new Map<EntityId, Promise<void>>()

  const patch = <T,>(map: Record<EntityId, T>, id: EntityId, value: T): Record<EntityId, T> =>
    ({ ...map, [id]: value })

  const statusFor = (businessId: EntityId): LoadStatus => statuses.value[businessId] ?? 'idle'

  const listFor = (businessId: EntityId | null): ManagedService[] =>
    businessId ? lists.value[businessId] ?? [] : []

  /** upsert نتیجهٔ اکشن در کش همان کسب‌وکار (ساخت = append، ویرایش = جایگزینی). */
  function upsertCached(businessId: EntityId, service: ManagedService): void {
    const current = listFor(businessId)
    const next = current.some(s => s.id === service.id)
      ? current.map(s => (s.id === service.id ? service : s))
      : [...current, service]
    lists.value = patch(lists.value, businessId, sortServices(next))
  }

  function dropCached(businessId: EntityId, serviceId: EntityId): void {
    lists.value = patch(lists.value, businessId, listFor(businessId).filter(s => s.id !== serviceId))
  }

  async function load(businessId: EntityId): Promise<void> {
    statuses.value = patch(statuses.value, businessId, 'loading')
    errors.value = patch(errors.value, businessId, null)
    try {
      const items = await services.serviceManagement.list(businessId)
      lists.value = patch(lists.value, businessId, sortServices(items))
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
   * شمارندهٔ داشبورد همان کسب‌وکار (که «۵ سرویس فعال» کهنه نماند).
   */
  async function run(
    businessId: EntityId,
    key: string,
    action: ServiceAction,
    fn: () => Promise<ManagedService | undefined>
  ): Promise<ServiceActionOutcome> {
    busy.value = { ...busy.value, [key]: action }
    actionErrors.value = { ...actionErrors.value, [key]: null }
    try {
      const result = await fn()
      if (result) upsertCached(businessId, result)
      dashboardCache.invalidate(businessId)
      return { ok: true, service: result ?? null, message: null }
    }
    catch (e) {
      if (await authRecovery.recover(e)) return failedOutcome
      const message = authRecovery.message(e)
      actionErrors.value = { ...actionErrors.value, [key]: message }
      return { ok: false, service: null, message }
    }
    finally {
      busy.value = { ...busy.value, [key]: null }
    }
  }

  /** خواندن یک سرویس برای deep link/refresh (به کش فهرست وابسته نیست). */
  async function loadOne(businessId: EntityId, serviceId: EntityId): Promise<{
    service: ManagedService | null
    message: string | null
    /** `true` = سرویس نیست یا به این کسب‌وکار تعلق ندارد → حالت Not Found */
    missing: boolean
  }> {
    try {
      const service = await services.serviceManagement.get(businessId, serviceId)
      upsertCached(businessId, service)
      return { service, message: null, missing: false }
    }
    catch (e) {
      if (await authRecovery.recover(e)) return { service: null, message: null, missing: false }
      const error = toServiceError(e)
      return { service: null, message: error.message, missing: error.code === 'NOT_FOUND' }
    }
  }

  const create = (businessId: EntityId, input: ServiceInput) =>
    run(businessId, 'new', 'creating', () => services.serviceManagement.create(businessId, input))

  const update = (businessId: EntityId, serviceId: EntityId, input: ServiceInput) =>
    run(businessId, serviceId, 'saving', () => services.serviceManagement.update(businessId, serviceId, input))

  const setStatus = (businessId: EntityId, serviceId: EntityId, next: ServiceStatus) =>
    run(businessId, serviceId, 'status', () => services.serviceManagement.setStatus(businessId, serviceId, next))

  const remove = (businessId: EntityId, serviceId: EntityId) =>
    run(businessId, serviceId, 'deleting', async () => {
      await services.serviceManagement.remove(businessId, serviceId)
      dropCached(businessId, serviceId)
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
    remove,
    reset
  }
}

/**
 * نمای بسته‌شده به یک کسب‌وکار. همه‌چیز از `businessId` جاری می‌آید؛ اگر زمینه
 * عوض شود، تا رسیدن پاسخ تازه هیچ داده‌ای از زمینهٔ قبل نشان داده نمی‌شود.
 */
export function useBusinessServices(businessId: MaybeRef<EntityId | null>) {
  const store = useBusinessServicesStore()
  const id = computed(() => toValue(businessId))

  const items = computed(() => store.listFor(id.value))
  const status = computed<LoadStatus>(() => (id.value ? store.statusFor(id.value) : 'idle'))
  const error = computed(() => (id.value ? store.errors.value[id.value] ?? null : null))

  const counts = computed(() => {
    const active = items.value.filter(s => s.status === 'active').length
    return { all: items.value.length, active, inactive: items.value.length - active }
  })

  const busyFor = (key: string): ServiceAction | null => store.busy.value[key] ?? null

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
    /** پاسخ تازه‌تر گرفتیم؟ (برای «ذخیره شد و برگشتیم» بدون refetch لازم نیست) */
    isReady: computed(() => status.value === 'ready'),

    ensure: (force = false) => store.ensure(id.value, force),
    refresh: () => (id.value ? store.load(id.value) : Promise.resolve()),

    create: (input: ServiceInput) =>
      id.value ? store.create(id.value, input) : Promise.resolve(failedOutcome),
    update: (serviceId: EntityId, input: ServiceInput) =>
      id.value ? store.update(id.value, serviceId, input) : Promise.resolve(failedOutcome),
    setStatus: (serviceId: EntityId, next: ServiceStatus) =>
      id.value ? store.setStatus(id.value, serviceId, next) : Promise.resolve(failedOutcome),
    remove: (serviceId: EntityId) =>
      id.value ? store.remove(id.value, serviceId) : Promise.resolve(failedOutcome),

    busyFor,
    isBusy: (key: string) => busyFor(key) !== null,
    anyBusy: computed(() => Object.values(store.busy.value).some(Boolean)),
    actionErrorFor: (key: string) => store.actionErrors.value[key] ?? null,
    clearActionError: (key: string) => {
      store.actionErrors.value = { ...store.actionErrors.value, [key]: null }
    },

    loadOne: (serviceId: EntityId) =>
      id.value
        ? store.loadOne(id.value, serviceId)
        : Promise.resolve({ service: null, message: null, missing: true }),
    find: (serviceId: EntityId | null) =>
      serviceId ? items.value.find(s => s.id === serviceId) ?? null : null
  }
}

/** پاک‌سازی کش سرویس‌ها — فقط از پلاگین دامنهٔ کاربر (خروج/تغییر حساب). */
export function useBusinessServicesCache() {
  return { reset: useBusinessServicesStore().reset }
}
