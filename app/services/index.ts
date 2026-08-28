import type { AuthService } from './auth/auth-service'
import { MockAuthService } from './auth/mock-auth-service'
import type { UserService } from './users/user-service'
import { MockUserService } from './users/mock-user-service'
import type { BusinessService } from './businesses/business-service'
import { MockBusinessService } from './businesses/mock-business-service'
import type { BookingService } from './bookings/booking-service'
import { MockBookingService } from './bookings/mock-booking-service'
import type { NotificationService } from './notifications/notification-service'
import { MockNotificationService } from './notifications/mock-notification-service'
import type { FavoriteService } from './favorites/favorite-service'
import { MockFavoriteService } from './favorites/mock-favorite-service'
import type { ReviewService } from './reviews/review-service'
import { MockReviewService } from './reviews/mock-review-service'
import type { ChatService } from './chat/chat-service'
import { MockChatService } from './chat/mock-chat-service'
import type { AvailabilityService } from './availability/availability-service'
import { MockAvailabilityService } from './availability/mock-availability-service'

/**
 * کارخانهٔ سرویس‌ها — تنها نقطهٔ تصمیم «mock یا API واقعی».
 *
 *   Page → Composable → AppServices → (Mock | Api)
 *
 * وقتی بک‌اند AdonisJS آماده شد، همین‌جا پیاده‌سازی‌های ApiXService
 * ساخته می‌شوند (روی config.public.apiBaseUrl)؛ هیچ صفحه یا کامپوننتی
 * تغییر نمی‌کند. نقاط اتصال قراردادی بک‌اند (بعداً):
 *   POST /auth/request-otp · POST /auth/verify-otp · POST /auth/logout · GET /auth/me
 */
export interface AppServices {
  auth: AuthService
  users: UserService
  businesses: BusinessService
  bookings: BookingService
  notifications: NotificationService
  favorites: FavoriteService
  reviews: ReviewService
  chat: ChatService
  availability: AvailabilityService
}

export function createServices(): AppServices {
  const config = useRuntimeConfig()

  if (config.public.apiMode === 'api') {
    // TODO(phase: backend-integration): پیاده‌سازی Api*Serviceها با $fetch
    // روی config.public.apiBaseUrl — بدون تغییر در مصرف‌کنندگان.
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
    businesses: new MockBusinessService(),
    bookings: new MockBookingService(),
    notifications: new MockNotificationService(),
    favorites: new MockFavoriteService(),
    reviews: new MockReviewService(),
    chat: new MockChatService(),
    availability: new MockAvailabilityService()
  }
}
