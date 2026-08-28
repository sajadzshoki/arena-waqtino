/**
 * گارد مرکزی مسیرها — meta-driven (app/types/page-meta.ts):
 *
 *   access: 'guest'      فقط مهمان‌ها (ورود/OTP)؛ کاربر واردشده → فرود حالت فعلی
 *   access: 'auth'       فقط واردشده‌ها؛ مهمان → /login?redirect=…
 *   capability           نیازمند قابلیت business/employee؛
 *                        مهمان → /login، فاقد قابلیت → فرود حالت معتبر
 *
 * قابلیت‌های کاربر فقط از session ما‌له گرفته می‌شود — نه مسیر مخفی‌شده در UI.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  const { availableModes, currentMode } = useUserMode()

  const access = to.meta.access ?? 'public'
  const capability = to.meta.capability

  // ── مهمان در مسیر احرازشده/قابلیتی ──
  if ((access === 'auth' || capability) && !isAuthenticated.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // ── کاربر واردشده روی مسیر مهمان ──
  if (access === 'guest' && isAuthenticated.value) {
    const target = (to.query.redirect as string) || MODE_LANDING[currentMode.value]
    return navigateTo(target)
  }

  // ── دسترسی قابلیتی ──
  if (capability && !availableModes.value.includes(capability)) {
    if (import.meta.client) {
      useAppToast().error('این بخش برای حساب شما فعال نیست.')
    }
    return navigateTo(MODE_LANDING[currentMode.value])
  }
})
