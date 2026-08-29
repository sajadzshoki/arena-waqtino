/**
 * خروج از حساب — یک جریان، دو ورودی (پروفایل و تنظیمات).
 *
 * ترتیب عمدی:
 *   ۱) دیالوگ تأیید محصولی (نه confirm مرورگر)
 *   ۲) logout در لایهٔ سرویس → نشست (کوکی/mock) پاک می‌شود
 *   ۳) state کاربر-محور با پلاگین ۰۳ reset می‌شود (نشان‌شده‌ها، پیش‌نویس رزرو، …)
 *   ۴) هدایت به صفحهٔ ورود — مسیرهای محافظت‌شده دیگر باز نمی‌شوند
 */
export function useLogout() {
  const { logout, pending } = useAuth()
  const toast = useAppToast()

  const confirmOpen = ref(false)

  function request(): void {
    confirmOpen.value = true
  }

  async function confirmLogout(): Promise<void> {
    confirmOpen.value = false
    try {
      await logout()
    }
    catch {
      toast.error('خروج انجام نشد. دوباره تلاش کنید.')
      return
    }
    toast.neutral('از حساب خود خارج شدید.', 'i-lucide-log-out')
    await navigateTo('/login', { replace: true })
  }

  function cancel(): void {
    confirmOpen.value = false
  }

  return { confirmOpen, pending, request, confirmLogout, cancel }
}
