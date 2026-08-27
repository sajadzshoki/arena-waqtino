import type { AuthService } from './auth/auth-service'
import { MockAuthService } from './auth/mock-auth-service'
import type { UserService } from './users/user-service'
import { MockUserService } from './users/mock-user-service'
import type { BusinessService } from './businesses/business-service'
import { MockBusinessService } from './businesses/mock-business-service'

/**
 * کارخانهٔ سرویس‌ها — تنها نقطهٔ تصمیم «mock یا API واقعی».
 *
 *   Page → Composable → AppServices → (Mock | Api)
 *
 * وقتی بک‌اند AdonisJS آماده شد، همین‌جا پیاده‌سازی‌های ApiXService
 * ساخته می‌شوند؛ هیچ صفحه یا کامپوننتی تغییر نمی‌کند.
 */
export interface AppServices {
  auth: AuthService
  users: UserService
  businesses: BusinessService
}

export function createServices(): AppServices {
  const config = useRuntimeConfig()

  if (config.public.apiMode === 'api') {
    // TODO(phase: backend-integration): ساخت ApiAuthService / ApiUserService / ApiBusinessService
    // با $fetch روی config.public.apiBaseUrl — بدون تغییر در مصرف‌کنندگان.
    throw createError({
      statusCode: 500,
      statusMessage:
        'API mode هنوز پیاده‌سازی نشده است. NUXT_PUBLIC_API_MODE=mock را استفاده کنید.'
    })
  }

  const auth = new MockAuthService(config.public.mockOtpCode)
  return {
    auth,
    users: new MockUserService(auth),
    businesses: new MockBusinessService()
  }
}
