import { ServiceError } from '~/utils/errors'
import { devUserForPhone } from '~/services/mocks/users'
import type { AppUser, AuthSession } from '~/types/user'
import type { AuthService, OtpRequestResult, VerifyOtpInput } from './auth-service'

/**
 * پیاده‌سازی توسعهٔ سرویس احراز هویت — بدون پیامک واقعی.
 *
 * کد OTP از پیکربندی (NUXT_PUBLIC_MOCK_OTP_CODE) خوانده می‌شود؛
 * هیچ رفتار ساختگی‌ای داخل منطق UI هاردکد نشده و با API_MODE=api
 * همین composableها به سرویس واقعی وصل می‌شوند.
 */

const SESSION_COOKIE = 'wq_session'

export class MockAuthService implements AuthService {
  constructor(private readonly mockOtpCode: string) {}

  private get cookie() {
    return useCookie<AuthSession | null>(SESSION_COOKIE, {
      default: () => null,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // ۳۰ روز — نشست توسعه ماندگار
    })
  }

  private pendingOtp: { phone: string; code: string; expiresAt: number } | null = null

  async requestOtp(phone: string): Promise<OtpRequestResult> {
    await delay()

    const normalized = normalizeDigits(phone).replace(/\s/g, '')
    if (!isValidIranianMobile(normalized)) {
      throw new ServiceError(
        'AUTH.INVALID_PHONE',
        'شمارهٔ موبایل معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹'
      )
    }

    const expiresIn = 120
    this.pendingOtp = {
      phone: normalized,
      code: this.mockOtpCode,
      expiresAt: Date.now() + expiresIn * 1000
    }

    return { requestId: `dev_${normalized}`, expiresIn, devCode: this.mockOtpCode }
  }

  async verifyOtp(input: VerifyOtpInput): Promise<AuthSession> {
    await delay()

    if (import.meta.server) {
      throw new ServiceError('AUTH.SERVER_CALL', 'تأیید کد فقط در سمت کاربر انجام می‌شود.')
    }

    const phone = normalizeDigits(input.phone).replace(/\s/g, '')
    const code = normalizeDigits(input.code).trim()

    const pending = this.pendingOtp
    if (!pending || pending.phone !== phone) {
      throw new ServiceError('AUTH.NO_PENDING', 'ابتدا درخواست کد تأیید را ارسال کنید.')
    }
    if (Date.now() > pending.expiresAt) {
      throw new ServiceError('AUTH.EXPIRED', 'کد تأیید منقضی شده است. دوباره دریافت کنید.')
    }
    if (code !== pending.code) {
      throw new ServiceError('AUTH.INVALID_OTP', 'کد واردشده صحیح نیست.')
    }

    this.pendingOtp = null

    const session: AuthSession = {
      user: devUserForPhone(phone),
      accessToken: `dev-token-${Date.now()}`,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    this.cookie.value = session
    return session
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const session = this.cookie.value
    if (!session) return null
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.cookie.value = null
      return null
    }
    return session
  }

  async logout(): Promise<void> {
    await delay(150)
    this.clear()
  }

  async clearLocalSession(): Promise<void> {
    this.clear()
  }

  async replaceSessionUser(user: AppUser): Promise<void> {
    const session = this.cookie.value
    if (!session) return
    this.cookie.value = { ...session, user }
  }

  /** تنها نقطهٔ پاک‌سازی نشست (logout واقعی و انقضای نشست هر دو به اینجا می‌رسند). */
  private clear(): void {
    this.cookie.value = null
    this.pendingOtp = null
  }
}
