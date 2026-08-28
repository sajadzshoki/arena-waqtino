import { ServiceError } from '~/utils/errors'
import type { AuthService } from '~/services/auth/auth-service'
import type { AuthSession } from '~/types/user'

/**
 * نگهبان مشترک سرویس‌های mock کاربر-محور.
 *
 * دو کار انجام می‌دهد:
 *   ۱) نشست جاری را از سرویس احراز هویت می‌خواند (دسترسی مستقیم به کوکی
 *      در هر سرویس تکرار نشود).
 *   ۲) کلید شبیه‌سازی `forceUnauthorized` را رعایت می‌کند تا جریان
 *      «پاسخ ۴۰۱ → مدیریت مرکزی نشست» در حالت mock قابل آزمایش باشد
 *      (بخش «شبیه‌سازی پاسخ mock» در /dev/design).
 *
 * خطای بازگشتی حتماً `ServiceError.unauthorized()` است؛ همان شکلی که
 * Api*Serviceها از پاسخ HTTP ۴۰۱ می‌سازند.
 */
export async function requireMockSession(auth: AuthService): Promise<AuthSession> {
  const flags = useMockFlags()
  if (flags.enabled.value && flags.forceUnauthorized.value) {
    throw ServiceError.unauthorized('نشست شما نامعتبر شده است. دوباره وارد شوید.')
  }

  const session = await auth.getCurrentSession()
  if (!session) {
    throw ServiceError.unauthorized('برای انجام این کار ابتدا وارد شوید.')
  }
  return session
}
