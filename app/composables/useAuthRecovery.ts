import { toServiceError } from '~/utils/errors'

/**
 * مدیریت مرکزی «نشست نامعتبر» — پل بین پاسخ ۴۰۱ لایهٔ داده و UX احراز هویت.
 *
 *   درخواست کاربر-محور → ServiceError(UNAUTHORIZED / 401)
 *        ↓
 *   recover()  ──► پاک‌سازی نشست (useAuth.expireSession)
 *             ──► اعلان فارسی
 *             ──► هدایت به /login?redirect=…
 *
 * چرا یک نقطه؟ هر صفحه/فیلد/اکشن نباید تصمیم بگیرد «با ۴۰۱ چه کنم».
 * در حالت api هم همین مسیر کار می‌کند، چون Api*Serviceها پاسخ HTTP ۴۰۱ را
 * به `ServiceError.unauthorized()` نگاشت می‌کنند (قرارداد لایهٔ سرویس).
 */
export function useAuthRecovery() {
  const { expireSession } = useAuth()
  const route = useRoute()
  /** نگهبان دوباره‌اجرا: ده‌ها درخواست هم‌زمان با یک ۴۰۱ فقط یک redirect می‌سازند. */
  const recovering = useState<boolean>('auth:recovering', () => false)

  function isUnauthorized(error: unknown): boolean {
    const serviceError = toServiceError(error)
    return serviceError.code === 'UNAUTHORIZED' || serviceError.status === 401
  }

  /**
   * اگر خطا مربوط به نشست باشد `true` برمی‌گردد؛ فراخواننده در این حالت
   * پیام inline نشان نمی‌دهد (کاربر در حال رفتن به صفحهٔ ورود است).
   */
  async function recover(error: unknown): Promise<boolean> {
    if (!isUnauthorized(error)) return false
    if (recovering.value) return true

    recovering.value = true
    try {
      await expireSession()
      useAppToast().warning(
        'نشست شما به پایان رسیده است.',
        'برای ادامهٔ کار دوباره وارد حساب شوید.'
      )
      if (import.meta.client && route.path !== '/login') {
        await navigateTo(
          { path: '/login', query: { redirect: route.fullPath } },
          { replace: true }
        )
      }
    }
    finally {
      recovering.value = false
    }
    return true
  }

  /** پیام فارسی قابل‌نمایش از هر خطا (بدون افشای جزئیات فنی). */
  function message(error: unknown): string {
    return toServiceError(error).message
  }

  return { isUnauthorized, recover, message }
}
