import type { Business } from '~/types/business'

/**
 * مدل «نشان‌شده‌ها» (Saved) — لایهٔ نمایشیِ همانFavoriteهای فاز ۴.
 *
 * منبع‌واحد‌حقیقت membership = `savedIds` در `useSavedBusinesses()`؛
 * این تایپ فقط «کسب‌وکار + متادادای نشان‌شدن» را برای صفحهٔ نشان‌شده‌ها
 * حمل می‌کند (ترتیب، تاریخ نشان‌شدن). در حالت api همین شکل از بک‌اند
 * خوانده می‌شود (نگاشت DTO → دامنه در لایهٔ سرویس انجام می‌شود).
 */
export interface SavedBusiness {
  business: Business
  /** زمان نشان‌شدن — برای ترتیب «جدیدترین» و متن «۳ روز پیش» */
  savedAt: ISODateTime
}
