/**
 * دامنهٔ «دادهٔ کاربر جاری» — تنها نقطه‌ای که stateهای کاربر-محور را با نشست
 * هم‌راستا می‌کند (به‌جای پخش‌کردن منطق login/logout در هر صفحه):
 *
 *   ورود / بازگشایی برنامه  → گرم‌کردن state نشان‌شده‌ها و کسب‌وکارهای مدیر
 *   خروج / تغییر حساب      → پاک‌شدن state گذرای کاربر (نشان‌شده‌ها،
 *                             پروفایل، تاریخچهٔ مشاهده، پیش‌نویس رزرو،
 *                             زمینهٔ کسب‌وکار، کش داشبوردها و کش سرویس‌ها)
 *
 * چرا این‌جا؟ چون «فراموش‌کردن» دادهٔ حساب قبلی یک قاعدهٔ معماری است، نه
 * سلیقهٔ یک صفحه؛ با یک نقطه، هر ورود/خروج/سوییچ حسابی پوشش داده می‌شود.
 *
 * فقط سمت client: این stateها هرگز روی سرور معنایی ندارند و نباید در
 * پیکربندی نشست سراسری جاری شوند.
 */
export default defineNuxtPlugin(() => {
  const { user, capabilities } = useAuth()
  const saved = useSavedBusinesses()
  const profile = useUserProfile()
  const owned = useOwnerBusinesses()
  const context = useBusinessContext()
  const { reset: resetDashboards } = useOwnerDashboardCache()
  const { reset: resetServices } = useBusinessServicesCache()
  const { clearHistory } = useRecentlyViewed()
  const { clearDraft } = useBookingFlow()

  const isOwner = computed(() => capabilities.value.some(c => c.kind === 'owner'))

  function clearUserState(): void {
    saved.reset()
    profile.reset()
    owned.reset()
    context.reset()
    resetDashboards()
    resetServices()
    clearHistory()
    clearDraft()
  }

  async function prime(): Promise<void> {
    await saved.ensureLoaded()
    if (isOwner.value) await owned.ensureLoaded()
  }

  let boundUserId = user.value?.id ?? null

  if (boundUserId) void prime()

  watch(user, async (next) => {
    const nextId = next?.id ?? null
    // فقط «تغییر حساب/خروج» state را می‌شوید؛ ویرایش پروفایل (همان userId،
    // شیء تازه) نباید دادهٔ کاربر را بی‌دلیل پاک کند.
    if (nextId === boundUserId) return
    boundUserId = nextId

    clearUserState()
    if (nextId) await prime()
  })
})
