/**
 * بازیابی نشست کاربر در شروع برنامه (SSR/CSR هر دو) و مقداردهی
 * اولیهٔ حالت کاربری بر اساس قابلیت‌های واقعی کاربر.
 */
export default defineNuxtPlugin(async () => {
  const { restore } = useAuth()
  await restore()

  const { initMode, primeModeContext } = useUserMode()
  initMode()
  await primeModeContext()
})
