import { ServiceError } from '~/utils/errors'
import type { OtpRequestResult } from '~/services/auth/auth-service'
import type { AppUser, AuthSession, UserCapability } from '~/types/user'

/**
 * احراز هویت — وضعیت مرکزی نشست کاربر.
 * UI هرگز مستقیماً با سرویس/کوکی صحبت نمی‌کند؛ فقط از همین composable.
 */
export function useAuth() {
  const services = useServices()

  const session = useState<AuthSession | null>('auth:session', () => null)
  const restored = useState<boolean>('auth:restored', () => false)
  const pending = useState<boolean>('auth:pending', () => false)
  /** نتیجهٔ آخرین درخواست OTP — برای صفحهٔ کد تأیید (فازهای بعد) */
  const otpRequest = useState<OtpRequestResult | null>('auth:otp', () => null)

  const user = computed<AppUser | null>(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => !!session.value)
  const capabilities = computed<UserCapability[]>(
    () => user.value?.capabilities ?? []
  )

  /** یک‌بار در شروع برنامه (پلاگین session) صدا زده می‌شود. */
  async function restore(): Promise<void> {
    if (restored.value) return
    restored.value = true
    session.value = await services.auth.getCurrentSession()
  }

  async function requestOtp(phone: string): Promise<OtpRequestResult> {
    pending.value = true
    try {
      otpRequest.value = await services.auth.requestOtp(phone)
      return otpRequest.value
    }
    finally {
      pending.value = false
    }
  }

  async function verifyOtp(phone: string, code: string): Promise<AuthSession> {
    if (!otpRequest.value) {
      throw new ServiceError('AUTH.NO_PENDING', 'ابتدا درخواست کد تأیید را ارسال کنید.')
    }
    pending.value = true
    try {
      session.value = await services.auth.verifyOtp({
        phone,
        code,
        requestId: otpRequest.value.requestId
      })
      return session.value
    }
    finally {
      pending.value = false
    }
  }

  /**
   * ورود سریع توسعه‌دهنده — فقط وقتی API_MODE=mock است.
   * جریان واقعی OTP را طی می‌کند (درخواست + تأیید) اما بدون SMS.
   */
  async function devSignIn(phone = '09123456789'): Promise<void> {
    const config = useRuntimeConfig()
    if (config.public.apiMode !== 'mock') {
      throw new ServiceError('AUTH.DEV_ONLY', 'ورود آزمایشی فقط در حالت توسعه در دسترس است.')
    }
    const request = await requestOtp(phone)
    await verifyOtp(phone, request.devCode ?? config.public.mockOtpCode)
  }

  async function logout(): Promise<void> {
    pending.value = true
    try {
      await services.auth.logout()
      session.value = null
      otpRequest.value = null
    }
    finally {
      pending.value = false
    }
  }

  return {
    session: readonly(session),
    user,
    isAuthenticated,
    capabilities,
    pending: readonly(pending),
    otpRequest: readonly(otpRequest),
    restore,
    requestOtp,
    verifyOtp,
    devSignIn,
    logout
  }
}
