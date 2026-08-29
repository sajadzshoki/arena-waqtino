import type { AppUser, AuthSession } from '~/types/user'

/**
 * قرارداد سرویس احراز هویت.
 *
 * جریان مفهومی ورود در وقتی‌نو:
 *   شماره موبایل → درخواست OTP → صفحهٔ کد تأیید → نشست معتبر
 *
 * فاز ۰: پیاده‌سازی mock (بدون پیامک واقعی).
 * فاز ۷: دو متد مدیریت «خودیِ نشست» اضافه شد تا مسیرهای پروفایل/خروج و
 *   مدیریت مرکزی ۴۰۱ از یک نقطه انجام شوند:
 *     - replaceSessionUser → پس از ویرایش پروفایل، snapshot کاربر در نشست
 *     - clearLocalSession  → وقتی بک‌اند می‌گوید نشست نامعتبر است
 *
 * فازهای بعد: پیاده‌سازی ApiAuthService روی AdonisJS با امضای همین interface.
 */
export interface OtpRequestResult {
  requestId: string
  /** مدت اعتبار کد به ثانیه — برای تایمر صفحهٔ OTP */
  expiresIn: number
  /** فقط در حالت توسعهٔ mock پر می‌شود تا تست بدون پیامک ممکن شود. */
  devCode?: string
}

export interface VerifyOtpInput {
  phone: string
  code: string
  requestId: string
}

export interface AuthService {
  requestOtp(phone: string): Promise<OtpRequestResult>
  verifyOtp(input: VerifyOtpInput): Promise<AuthSession>
  getCurrentSession(): Promise<AuthSession | null>
  logout(): Promise<void>

  /**
   * پاک‌کردن نشست از سمت کارخواه بدون تماس با بک‌اند — دقیقاً کاری که باید
   * بعد از شنیدن ۴۰۱ انجام شود (state + حافظهٔ محلی نشست).
   */
  clearLocalSession(): Promise<void>

  /**
   * جای‌گذاری snapshot کاربر در نشست (پس از ویرایش پروفایل).
   * در حالت api این کار سمت بک‌اند انجام می‌شود و پیاده‌سازی فقط `GET /auth/me`
   * را به‌روز می‌کند؛ امضا یکسان می‌ماند.
   */
  replaceSessionUser(user: AppUser): Promise<void>
}
