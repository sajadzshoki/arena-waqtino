import type { EntityId } from '~/types/common'
import type { SavedBusiness } from '~/types/saved'

/**
 * قرارداد سرویس «کسب‌وکارهای نشان‌شده» (Favorites/Saved — یک مفهوم، یک منبع).
 *
 * فاز ۴ این قرارداد را برای دکمهٔ قلب ساخت؛ فاز ۷ همان را گسترش داد تا
 * صفحهٔ «نشان‌شده‌ها» هم از همین منبع تغذیه کند (سیستم نشان‌کردن دومی
 * اختراع نشده است). ترتیب پاسخ: جدیدترین نشان‌شده اول.
 *
 * خطاها: ServiceError با کد مشخص — سرویس‌های Api* پاسخ ۴۰۱ را به
 * `ServiceError.unauthorized()` تبدیل می‌کنند تا مدیریت مرکزی نشست کار کند.
 */
export interface FavoriteService {
  /** کسب‌وکارهای نشان‌شدهٔ کاربر جاری + متادادای نشان‌شدن */
  listMine(): Promise<SavedBusiness[]>
  /** تغییر وضعیت نشان؛ مقدار برگشتی = وضعیت جدید (true = نشان شد) */
  toggle(businessId: EntityId): Promise<boolean>
  /** وضعیت فعلی — برای پر کردن سریع state بدون واکشی کل فهرست */
  isSaved(businessId: EntityId): Promise<boolean>
}
