import type { OwnedBusiness } from '~/types/owner'
import type { EntityId, LoadStatus } from '~/types/common'

/**
 * فهرست «کسب‌وکارهایی که کاربر جاری مدیر آن‌هاست» — state مشترک همهٔ صفحه‌های
 * فضای کاری مدیر.
 *
 *   /owner (ورودی) · /owner/businesses · BusinessSwitcher · داشبورد
 *                     ↓
 *            useOwnerBusinesses()   (singleton با useState)
 *                     ↓
 *            services.owner.listOwnedBusinesses()
 *
 * قاعده: هیچ صفحه‌ای فهرست کسب‌وکارهای مدیر را برای خودش نگه نمی‌دارد؛ با
 * سوییچ کردن فقط `useBusinessContext()` جابه‌جا می‌شود و همین فهرست مرجع می‌ماند.
 * مالکیت هم همین‌جا حل می‌شود (سرویس می‌فهمد، نه UI).
 */

/** ادغام درخواست‌های هم‌زمان (کارت‌ها + صفحهٔ فهرست هم‌زمان درخواست می‌زنند). */
let inflight: Promise<void> | null = null

export function useOwnerBusinesses() {
  const services = useServices()
  const { isAuthenticated } = useAuth()
  const authRecovery = useAuthRecovery()

  const items = useState<OwnedBusiness[]>('owner:businesses:list', () => [])
  const status = useState<LoadStatus>('owner:businesses:status', () => 'idle')
  const loadError = useState<string | null>('owner:businesses:error', () => null)

  const byId = computed(() => new Map(items.value.map(o => [o.business.id, o])))
  const count = computed(() => items.value.length)
  /** سوییچر فقط وقتی معنا دارد که بیش از یک کسب‌وکار باشد. */
  const hasMultiple = computed(() => items.value.length > 1)
  const loading = computed(() => status.value === 'loading')
  /** هنوز اولین پاسخ نیامده — صفحه اسکلت نشان می‌دهد، نه «خالی». */
  const initializing = computed(() => status.value === 'idle' || status.value === 'loading')
  const error = readonly(loadError)

  function summaryOf(businessId: EntityId | null | undefined): OwnedBusiness | null {
    if (!businessId) return null
    return byId.value.get(businessId) ?? null
  }

  function owns(businessId: EntityId): boolean {
    return byId.value.has(businessId)
  }

  async function refresh(): Promise<void> {
    if (!isAuthenticated.value) {
      items.value = []
      status.value = 'idle'
      return
    }
    status.value = 'loading'
    loadError.value = null
    try {
      items.value = await services.owner.listOwnedBusinesses()
      status.value = 'ready'
    }
    catch (e) {
      status.value = 'error'
      // نشست نامعتبر → مدیریت مرکزی (پیام inline لازم نیست)؛ بقیهٔ خطاها پیام فارسی
      loadError.value = (await authRecovery.recover(e)) ? null : authRecovery.message(e)
    }
  }

  /** یک‌بار بارگذاری؛ فراخوانی‌های هم‌زمان روی یک درخواست ادغام می‌شوند. */
  async function ensureLoaded(force = false): Promise<void> {
    if (!isAuthenticated.value) return
    if (!force && (status.value === 'ready' || status.value === 'loading')) return
    if (inflight) return inflight
    inflight = refresh().finally(() => { inflight = null })
    return inflight
  }

  /**
   * هم‌راستاسازی کش با پاسخ تازهٔ یک کسب‌وکار (سرویس زمینه بعد از enter
   * خلاصهٔ تازه می‌دهد؛ شماره‌ها در فهرست و داشبورد یکی بمانند).
   */
  function syncOne(summary: OwnedBusiness): void {
    const index = items.value.findIndex(o => o.business.id === summary.business.id)
    if (index === -1) {
      items.value = [...items.value, summary]
      return
    }
    const next = [...items.value]
    next[index] = summary
    items.value = next
  }

  /** پاک‌سازی state کاربر-محور (خروج / تغییر حساب — پلاگین ۰۳). */
  function reset(): void {
    items.value = []
    status.value = 'idle'
    loadError.value = null
    inflight = null
  }

  return {
    // بدون readonly() — کارت‌ها همان تایپ دامنه را می‌خواهند (readonly() نگاشت
    // عمیق می‌سازد و `gallery: string[]` ناسازگار می‌شود). نوشتن فقط از
    // تابع‌های همین store انجام می‌شود.
    items,
    count,
    hasMultiple,
    status: readonly(status),
    loading,
    initializing,
    error,
    refresh,
    ensureLoaded,
    summaryOf,
    owns,
    syncOne,
    reset
  }
}
