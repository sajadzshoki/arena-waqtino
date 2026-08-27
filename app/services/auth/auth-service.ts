import type { AuthSession } from '~/types/user'

/**
 * قرارداد سرویس احراز هویت.
 *
 * جریان مفهومی ورود در وقتی‌نو:
 *   شماره موبایل → درخواست OTP → صفحهٔ کد تأیید → نشست معتبر
 *
 * فاز ۰: پیاده‌سازی mock (بدون پیامک واقعی).
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
}
