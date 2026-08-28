/**
 * دامنهٔ «دادهٔ کاربر جاری» — تنها نقطه‌ای که stateهای کاربر-محور را با نشست
 * هم‌راستا می‌کند (به‌جای پخش‌کردن منطق login/logout در هر صفحه):
 *
 *   ورود / بازگشایی برنامه  → گرم‌کردن state نشان‌شده‌ها (همهٔ کارت‌ها درست باشند)
 *   خروج / تغییر حساب      → پاک‌شدن state گذرای کاربر (نشان‌شده‌ها، پیش‌نمایش
 *                             پروفایل، تاریخچهٔ مشاهده، پیش‌نویس رزرو)
 *
 * فقط سمت client: این stateها هرگز روی سرور معنایی ندارند و نباید در پیکربندی
 * نشست سراسری جاری شوند.
 */
export default defineNuxtPlugin(() => {
  const { user } = useAuth()
  const saved = useSavedBusinesses()
  const profile = useUserProfile()
  const { clearHistory } = useRecentlyViewed()
  const { clearDraft } = useBookingFlow()

  let boundUserId = user.value?.id ?? null

  if (boundUserId) void saved.ensureLoaded()

  watch(user, async (next) => {
    const nextId = next?.id ?? null
    if (nextId === boundUserId) return
    boundUserId = nextId

    if (!nextId) {
      saved.reset()
      profile.reset()
      clearHistory()
      clearDraft()
      return
    }

    // حساب دیگر/وروی تازه → هیچ دادهٔ گذرای حساب قبلی نباید بماند
    saved.reset()
    profile.reset()
    await saved.ensureLoaded()
  })
})
