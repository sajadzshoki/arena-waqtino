import type { BookingStatus } from '~/types/booking'
import type { Business, BusinessCategory } from '~/types/business'

/**
 * مدل «فضای کاری صاحب کسب‌وکار» (فاز ۸).
 *
 * این تایپ‌ها شکل *ارائه‌محور* داده‌اند، نه DTO خام: یعنی نام سرویس، نام مشتری،
 * برچسب وضعیت و شمارش‌ها در لایهٔ سرویس حل می‌شوند (قاعدهٔ فاز ۸: صفحه هیچ
 * فیلتر/محاسبه/ترجمه‌ای انجام نمی‌دهد). در حالت api همین شکل از بک‌اند خوانده
 * می‌شود و نگاشت DTO → دامنه در سرویس انجام می‌شود.
 */

/** شمارش‌های کلیدی داشبورد — همه از همان منبع رزروها مشتق می‌شوند. */
export interface OwnerBusinessMetrics {
  /** نوبت‌های امروز (لغو‌شده حساب نمی‌شود) */
  todayCount: number
  /** نوبت‌های تأییدشده/در انتظار از این لحظه به بعد */
  upcomingCount: number
  /** نوبت‌هایی که هنوز تأیید نشده‌اند — «اقدام لازم» مدیر */
  pendingCount: number
  /** خدمات فعال کسب‌وکار */
  serviceCount: number
  /** کارمندان فعال کسب‌وکار */
  employeeCount: number
}

/** یک کسب‌وکار از نگاه مدیر: هویت + دسته + چند عدد معنادار. */
export interface OwnedBusiness {
  business: Business
  category: BusinessCategory | null
  metrics: OwnerBusinessMetrics
}

/** نوبت آن‌طور که مدیر به آن نگاه می‌کند (نام‌ها حل‌شده، قابل‌مصرف در UI). */
export interface OwnerBookingItem {
  id: EntityId
  start: ISODateTime
  end: ISODateTime
  status: BookingStatus
  customerName: string
  serviceName: string
  /** null = هنوز به کارمندی تخصیص نیافته — خودش یک پیام مفید برای مدیر است */
  employeeName: string | null
  price: Toman
  notes?: string
}

/** دادهٔ آمادهٔ رندر داشبورد — یکی‌شده تا صفحه فقط «نمایش» دهد. */
export interface OwnerDashboard {
  businessId: EntityId
  business: Business
  category: BusinessCategory | null
  metrics: OwnerBusinessMetrics
  /** نوبت‌های امروز، از نزدیک‌ترین به بعد (گذشته‌ها حذف شده‌اند) */
  today: OwnerBookingItem[]
  /** نزدیک‌ترین نوبت در کل آینده (ممکن است امروز نباشد) */
  next: OwnerBookingItem | null
  /** زمان ساخته‌شدن خلاصه — برای «به‌روزرسانی: ۱۴:۰۵» صادق */
  generatedAt: ISODateTime
}

/**
 * نتیجهٔ ارزیابی دسترسی به یک کسب‌وکار.
 *
 * چرا در UI هست؟ چون URL می‌تواند هر `businessId` بی‌اعتباری بیاورد
 * (`/owner/business/<هرچیز>`) و «ناوبری پنهان» امنیت نیست: لایهٔ سرویس
 * مالکیت را بررسی می‌کند و این وضعیت‌ها فقط شکل همان نتیجه برای UI است.
 * در حالت api همین کدها از HTTP 403/404/401 می‌آیند.
 */
export type BusinessAccess = 'ok' | 'forbidden' | 'not_found' | 'error'
