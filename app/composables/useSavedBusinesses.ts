import type { Business } from '~/types/business'
import type { EntityId, LoadStatus } from '~/types/common'
import type { SavedBusiness } from '~/types/saved'

/**
 * منبع‌واحد‌حقیقت «کسب‌وکارهای نشان‌شده» — حالت مشترک همهٔ صفحات مشتری.
 *
 *   Home / Search / Category results / Business Details / Saved
 *                     ↓
 *            useSavedBusinesses()   ← همین composable (singleton با useState)
 *                     ↓
 *            services.favorites     ← تنها دروازهٔ داده
 *
 * قواعد:
 *   - هیچ صفحه‌ای آرایهٔ «نشان‌شده» محلی ندارد؛ فقط همین state.
 *   - `savedIds` برای «آیا نشان شده؟» (سریع، بدون واکشی) و `entries` برای
 *     صفحهٔ نشان‌شده‌ها (کسب‌وکار کامل + تاریخ نشان‌شدن) است.
 *   - toggle به‌صورت optimistic انجام می‌شود و در خطا rollback می‌گردد؛
 *     نتیجهٔ سرویس همیشه مرجع نهایی است (هماهنگی خودکار بین صفحه‌ها).
 *   - با تغییر کاربر/خروج، state پاک می‌شود (دادهٔ کاربر-محور، نه global).
 *
 * جای نام قدیمی: `useFavorites` (فاز ۴) — با فاز ۷ ادغام شد و حذف شد.
 */

/** وضعیت‌های in-flight فقط سمت client معنا دارند (پلاگین ۰۳ آن‌ها را صدا می‌زند). */
let inflight: Promise<void> | null = null

export function useSavedBusinesses() {
  const services = useServices()
  const { isAuthenticated, user } = useAuth()
  const authRecovery = useAuthRecovery()

  const savedIds = useState<Set<EntityId>>('saved:ids', () => new Set())
  const entries = useState<SavedBusiness[]>('saved:entries', () => [])
  const status = useState<LoadStatus>('saved:status', () => 'idle')
  const listError = useState<string | null>('saved:list-error', () => null)
  /** شناسه‌هایی که عملیات نشان‌کردن/حذف آن‌ها در جریان است (فیدبک محلی UI) */
  const busyIds = useState<Set<EntityId>>('saved:busy', () => new Set())
  /** آخرین مورد حذف‌شده — برای «بازگردانی» در اعلان */
  const lastRemoved = useState<SavedBusiness | null>('saved:last-removed', () => null)

  const count = computed(() => savedIds.value.size)
  /**
   * هنوز چیزی از سرویس نخوانده‌ایم — صفحه در این بازه اسکلت نشان می‌دهد،
   * نه «حالت خالی» (حالت خالی فقط وقتی که واقعاً خالی است).
   */
  const initializing = computed(() => status.value === 'idle' || status.value === 'loading')
  /** فهرست صفحهٔ نشان‌شده‌ها — فقط آیتم‌هایی که واقعاً نشان‌شده‌اند. */
  const items = computed(() => entries.value.filter(e => savedIds.value.has(e.business.id)))

  function isSaved(businessId: EntityId): boolean {
    return savedIds.value.has(businessId)
  }

  function setIds(next: Iterable<EntityId>): void {
    savedIds.value = new Set(next)
  }

  function setEntries(next: SavedBusiness[]): void {
    entries.value = next
    setIds(next.map(e => e.business.id))
  }

  /** واکشی کامل فهرست (loading / ready / error) — صفحهٔ نشان‌شده‌ها همین را صدا می‌زند. */
  async function refresh(): Promise<void> {
    if (!isAuthenticated.value) {
      setEntries([])
      status.value = 'idle'
      return
    }
    status.value = 'loading'
    listError.value = null
    try {
      setEntries(await services.favorites.listMine())
      status.value = 'ready'
    }
    catch (e) {
      status.value = 'error'
      // نشست نامعتبر → مدیریت مرکزی (پاک‌سازی + هدایت به ورود)؛ وگرنه پیام inline
      if (await authRecovery.recover(e)) listError.value = null
      else listError.value = authRecovery.message(e)
    }
  }

  /** یک‌بار بارگذاری برای هر کاربر — فراخوانی‌های همزمان ادغام می‌شوند. */
  async function ensureLoaded(): Promise<void> {
    if (!isAuthenticated.value) return
    if (status.value === 'ready' || status.value === 'loading') return
    if (inflight) return inflight
    inflight = refresh().finally(() => {
      inflight = null
    })
    return inflight
  }

  function markBusy(businessId: EntityId, busy: boolean): void {
    const next = new Set(busyIds.value)
    if (busy) next.add(businessId)
    else next.delete(businessId)
    busyIds.value = next
  }

  /**
   * تغییر وضعیت نشان‌کردن.
   * `business` اختیاری است: اگر صفحه کارت را در دست دارد، همان لحظه به
   * فهرست نشان‌شده‌ها اضافه می‌شود تا آن صفحه بدون واکشی مجدد به‌روز بماند.
   */
  async function toggle(
    businessId: EntityId,
    business?: Business
  ): Promise<{ ok: boolean; saved: boolean; message?: string }> {
    if (!isAuthenticated.value) {
      return { ok: false, saved: isSaved(businessId), message: 'برای نشان‌کردن ابتدا وارد حساب شوید.' }
    }

    const wasSaved = isSaved(businessId)
    const previousEntries = entries.value

    // ── optimistic ──
    if (wasSaved) {
      const removed = previousEntries.find(e => e.business.id === businessId) ?? null
      lastRemoved.value = removed
      setIds([...savedIds.value].filter(id => id !== businessId))
      setEntries(previousEntries.filter(e => e.business.id !== businessId))
    }
    else {
      const existing = previousEntries.find(e => e.business.id === businessId)
      setIds([...savedIds.value, businessId])
      if (existing) {
        setEntries([existing, ...previousEntries.filter(e => e.business.id !== businessId)])
      }
      else if (business) {
        // کارت در دست صفحه بود → فهرست همان لحظه کامل می‌شود (بدون واکشی دوباره)
        setEntries([{ business, savedAt: new Date().toISOString() }, ...previousEntries])
      }
      // اگر خودِ کسب‌وکار در دسترس نبود، عضویت ثبت شده و فهرست در واکشی
      // بعدی (نمایش صفحهٔ نشان‌شده‌ها) کامل می‌شود.
    }

    markBusy(businessId, true)
    try {
      const saved = await services.favorites.toggle(businessId)
      if (saved !== wasSaved) {
        // سرویس چیزی غیر از انتظار ما گفت → state را با واقعیت می‌سازیم
        await refresh()
      }
      // اگر دوباره نشان شد، «بازگردانی» معنا ندارد
      if (saved) lastRemoved.value = null
      return { ok: true, saved }
    }
    catch (e) {
      // ── rollback ──
      setEntries(previousEntries)
      setIds(previousEntries.map(entry => entry.business.id))
      const recovered = await authRecovery.recover(e)
      return {
        ok: false,
        saved: wasSaved,
        message: recovered ? undefined : authRecovery.message(e)
      }
    }
    finally {
      markBusy(businessId, false)
    }
  }

  /** حذف از نشان‌شده‌ها (بدون دیالوگ تأیید — اعلان «بازگردانی» کافی است). */
  async function remove(businessId: EntityId): Promise<{ ok: boolean; message?: string }> {
    if (!isSaved(businessId)) return { ok: false, message: 'این کسب‌وکار نشان‌شده نیست.' }
    const { ok, message } = await toggle(businessId)
    return { ok, message }
  }

  /** بازگردانی آخرین حذف — همان toggle از نو. */
  async function undoRemove(): Promise<boolean> {
    const removed = lastRemoved.value
    if (!removed) return false
    lastRemoved.value = null
    const { ok, saved } = await toggle(removed.business.id, removed.business)
    return ok && saved
  }

  /** پاک‌سازی state (پس از logout یا تغییر کاربر). */
  function reset(): void {
    setEntries([])
    status.value = 'idle'
    listError.value = null
    busyIds.value = new Set()
    lastRemoved.value = null
  }

  return {
    // NOTE: بدون readonly() — مصرف‌کننده (کارت کسب‌وکار) همان تایپ دامنه را
    // می‌خواهد؛ write از طریق تابع‌های همین store انجام می‌شود.
    items,
    savedIds,
    count,
    status: readonly(status),
    loading: computed(() => status.value === 'loading'),
    initializing,
    error: readonly(listError),
    busyIds: readonly(busyIds),
    lastRemoved: readonly(lastRemoved),
    isSaved,
    isBusy: (businessId: EntityId) => busyIds.value.has(businessId),
    refresh,
    ensureLoaded,
    toggle,
    remove,
    undoRemove,
    reset,
    /** کاربری که state به او تعلق دارد — برای reset خودکار در تغییر حساب */
    owner: computed(() => user.value?.id ?? null)
  }
}
