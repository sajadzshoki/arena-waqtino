import type { EntityId } from '~/types/common'
import type { ManagedService, ServiceInput, ServiceStatus } from '~/types/service'

/**
 * قرارداد «مدیریت سرویس‌های یک کسب‌وکار» — نقش صاحب کسب‌وکار.
 *
 * چرا جدا از `BusinessService` (خواندن مشتری)؟ چون سؤال‌شان فرق دارد:
 *   • مشتری: «الان چه چیزی قابل رزرو است؟» → فقط active، بدون شمارش نوبت‌ها
 *   • مدیر: «کل آنچه دارم، با هر وضعیتی + پیامد هر اکشن» → همه‌چیز
 * یکی‌کردنشان یعنی یا دادهٔ مدیری به مشتری نشت می‌کند یا فیلتر active در UI
 * دستکاری می‌شود. هر دو متد `businessId` را می‌گیرند تا رابطهٔ
 * سرویس↔کسب‌وکار و مالکیت در همین لایه بررسی شود، نه در صفحه.
 *
 * معادل REST بعدی:
 *   GET    /owner/businesses/:businessId/services
 *   GET    /owner/businesses/:businessId/services/:serviceId
 *   POST   /owner/businesses/:businessId/services
 *   PATCH  /owner/businesses/:businessId/services/:serviceId
 *   PATCH  /owner/businesses/:businessId/services/:serviceId/status
 *   DELETE /owner/businesses/:businessId/services/:serviceId
 */
export interface ServiceManagementService {
  /** همهٔ سرویس‌های این کسب‌وکار، فعال و غیرفعال (نمای مدیر) */
  list: (businessId: EntityId) => Promise<ManagedService[]>
  get: (businessId: EntityId, serviceId: EntityId) => Promise<ManagedService>
  create: (businessId: EntityId, input: ServiceInput) => Promise<ManagedService>
  update: (businessId: EntityId, serviceId: EntityId, input: ServiceInput) => Promise<ManagedService>
  /** فعال/غیرفعال — تنها راه تغییر وضعیت؛ بدون تأیید مزاحم */
  setStatus: (businessId: EntityId, serviceId: EntityId, status: ServiceStatus) => Promise<ManagedService>
  /** حذف واقعی؛ اگر سیاست اجازه ندهد `ServiceError('CONFLICT')` با فارسی خوانا */
  remove: (businessId: EntityId, serviceId: EntityId) => Promise<void>
  /**
   * بازنشانی تغییرات محلی به دادهٔ پایه — مخصوص ابزار توسعه (دکمهٔ /dev/design)
   * تا دمو از اول قابل تکرار باشد. در حالت api چنین چیزی وجود ندارد (سرور
   * «بازگشت به seed» ندارد) و مصرف‌کنندهٔ UI آن را فقط با پرچم mock نشان می‌دهد.
   */
  resetLocalChanges: () => Promise<void>
}
