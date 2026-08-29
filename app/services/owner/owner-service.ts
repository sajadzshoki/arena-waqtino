import type { OwnedBusiness, OwnerDashboard } from '~/types/owner'
import type { EntityId } from '~/types/common'

/**
 * قرارداد فضای کاری «صاحب کسب‌وکار» (فاز ۸).
 *
 * سه چیز عمداً در همین لایه حل می‌شوند، نه در صفحه:
 *   ۱) مالکیت — کدام کسب‌وکار را این کاربر مدیریت می‌کند؟
 *   ۲) زمینه‌سازی نمایش — نام دسته/سرویس/مشتری/کارمند + وضعیت‌ها
 *   ۳) شمارش‌های داشبورد (امروز / پیش‌رو / در انتظار تأیید)
 *
 * نقاط اتصال بک‌اند AdonisJS (بعداً، بدون تغییر مصرف‌کننده‌ها):
 *   GET /owner/businesses                 → listOwnedBusinesses()
 *   GET /owner/businesses/:id             → getOwnedBusiness(id)   (403 / 404)
 *   GET /owner/businesses/:id/dashboard   → getDashboard(id)
 * مالکیت در سرور مرجع است؛ اگر UI چیزی را اشتباه درخواست کرد پاسخ ۴۰۳
 * می‌آید و همان مسیر «دسترسی ندارید» در UI کار می‌کند.
 */
export interface OwnerService {
  /** کسب‌وکارهایی که کاربر جاری مدیر آن‌هاست (با شمارش‌های خلاصه). */
  listOwnedBusinesses(): Promise<OwnedBusiness[]>
  /**
   * یک کسب‌وکارِ متعلق به کاربر جاری.
   * `NOT_FOUND` اگر شناسه وجود ندارد، `FORBIDDEN` اگر وجود دارد ولی مدیرش
   * کاربر جاری نیست — تفکیک همین دو حالت باعث می‌شود UI حالت درست
   * («پیدا نشد» در برابر «دسترسی ندارید») را نشان دهد.
   */
  getOwnedBusiness(businessId: EntityId): Promise<OwnedBusiness>
  /** دادهٔ آمادهٔ رندر داشبورد برای یک کسب‌وکار. */
  getDashboard(businessId: EntityId): Promise<OwnerDashboard>
}
