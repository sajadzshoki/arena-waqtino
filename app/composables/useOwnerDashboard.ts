import type { MaybeRef } from 'vue'
import type { EntityId, LoadStatus } from '~/types/common'
import type { OwnerDashboard } from '~/types/owner'

/**
 * دادهٔ داشبورد مدیر — با «انزوای ساختاری» بین کسب‌وکارها.
 *
 * قاعدهٔ مهم فاز ۸: کش، به‌ازای هر businessId نگه داشته می‌شود
 * (`Record<businessId, OwnerDashboard>`) و صفحه فقط `data[currentId]` را
 * می‌خواند. بنابراین «نوبت‌های کسب‌وکار الف داخل کسب‌وکار ب» نه با نظم و
 * دیسیپلین کدنویسی، بلکه به‌خاطر شکل state ناممکن است: کلید، خودِ زمینه است.
 *
 * هنگام سوییچ: دادهٔ کسب‌وکار تازه هنوز نیامده → `initializing` است و
 * صفحه اسکلت نشان می‌دهد (نه عدد‌های قبلی، نه نام قبلی).
 */
const inflight = new Map<EntityId, Promise<void>>()

function useOwnerDashboardStore() {
  const services = useServices()
  const authRecovery = useAuthRecovery()

  const data = useState<Record<EntityId, OwnerDashboard>>('owner:dashboard:data', () => ({}))
  const statuses = useState<Record<EntityId, LoadStatus>>('owner:dashboard:status', () => ({}))
  const errors = useState<Record<EntityId, string | null>>('owner:dashboard:error', () => ({}))

  function statusFor(businessId: EntityId): LoadStatus {
    return statuses.value[businessId] ?? 'idle'
  }

  function dataFor(businessId: EntityId | null): OwnerDashboard | null {
    if (!businessId) return null
    return data.value[businessId] ?? null
  }

  function errorFor(businessId: EntityId | null): string | null {
    if (!businessId) return null
    return errors.value[businessId] ?? null
  }

  /** بازنویسی شیء (نه mutate) تا reactivity پایدار و type-safe بماند. */
  function patch<T>(map: Record<EntityId, T>, id: EntityId, value: T): Record<EntityId, T> {
    return { ...map, [id]: value }
  }

  async function load(businessId: EntityId): Promise<void> {
    statuses.value = patch(statuses.value, businessId, 'loading')
    errors.value = patch(errors.value, businessId, null)
    try {
      const fresh = await services.owner.getDashboard(businessId)
      data.value = patch(data.value, businessId, fresh)
      statuses.value = patch(statuses.value, businessId, 'ready')
    }
    catch (e) {
      statuses.value = patch(statuses.value, businessId, 'error')
      errors.value = patch(errors.value, businessId, await authRecovery.recover(e) ? null : authRecovery.message(e))
    }
  }

  /** بارگذاری یک‌بار برای هر کسب‌وکار؛ درخواست‌های هم‌زمان ادغام می‌شوند. */
  async function ensure(businessId: EntityId | null, force = false): Promise<void> {
    if (!businessId) return
    // اول در-flight: اگر درخواستی در جریان است همان را انتظار بکش، نه بازگشت
    // زودهنگام (وگرنه صفحه پیش از رسیدن داده «خالی» را یک لحظه نشان می‌دهد).
    const pending = inflight.get(businessId)
    if (pending) return pending
    if (!force && statusFor(businessId) === 'ready') return
    const run = load(businessId).finally(() => { inflight.delete(businessId) })
    inflight.set(businessId, run)
    return run
  }

  /**
   * بی‌اعتبار کردن کش یک کسب‌وکار (مثلاً بعد از نوشتن در فازهای بعد).
   * فیلتر-کپی (نه `delete`) تا شکل بازنویسی immutable در همین فایل یکی بماند.
   */
  function invalidate(businessId: EntityId | null): void {
    if (!businessId) return
    const drop = (map: object): Record<EntityId, unknown> =>
      Object.fromEntries(Object.entries(map).filter(([key]) => key !== businessId))
    data.value = drop(data.value) as Record<EntityId, OwnerDashboard>
    statuses.value = patch(statuses.value, businessId, 'idle')
    errors.value = patch(errors.value, businessId, null)
  }

  /** پاک‌سازی کامل (خروج / تغییر حساب — پلاگین ۰۳). */
  function reset(): void {
    data.value = {}
    statuses.value = {}
    errors.value = {}
    inflight.clear()
  }

  return { statusFor, dataFor, errorFor, ensure, load, invalidate, reset }
}

/**
 * نمای بسته‌شده به یک کسب‌وکار — چیزی که صفحهٔ داشبورد مصرف می‌کند.
 * همه‌چیز از `businessId` جاری می‌آید؛ اگر زمینه عوض شود، پیش از پاسخ تازه
 * هیچ داده‌ای از زمینهٔ قبل نمایش داده نمی‌شود.
 */
export function useOwnerDashboard(businessId: MaybeRef<EntityId | null>) {
  const store = useOwnerDashboardStore()
  const id = computed(() => toValue(businessId))

  const data = computed(() => store.dataFor(id.value))
  const status = computed<LoadStatus>(() => (id.value ? store.statusFor(id.value) : 'idle'))
  const error = computed(() => store.errorFor(id.value))

  return {
    businessId: id,
    data,
    status: readonly(status),
    error,
    loading: computed(() => status.value === 'loading'),
    /** هنوز داده‌ای برای این کسب‌وکار نیامده → اسکلت (نه صفرها، نه دادهٔ قبلی) */
    initializing: computed(() => status.value === 'idle' || (status.value === 'loading' && data.value === null)),
    /** دادهٔ تازه‌تر گرفتیم — برای «در حال تازه‌سازی» بدون پنهان‌کردن محتوا */
    refreshing: computed(() => status.value === 'loading' && data.value !== null),
    ensure: (force = false) => store.ensure(id.value, force),
    refresh: () => (id.value ? store.load(id.value) : Promise.resolve()),
    invalidate: () => store.invalidate(id.value)
  }
}

/** پاک‌سازی کش داشبوردها — فقط از پلاگین دامنهٔ کاربر. */
export function useOwnerDashboardCache() {
  const store = useOwnerDashboardStore()
  return { reset: store.reset, invalidate: store.invalidate }
}
