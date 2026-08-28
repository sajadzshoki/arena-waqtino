import type { EntityId } from '~/types/common'
import type { EmployeeInput, EmployeeStatus, ManagedEmployee } from '~/types/employee'

/**
 * قرارداد «مدیریت پرسنل یک کسب‌وکار» — نقش صاحب کسب‌وکار.
 *
 * چرا جدا از `BusinessService` (خواندن مشتری)؟ چون سؤال‌شان فرق دارد:
 *   • مشتری: «الان چه کسی می‌تواند این خدمت را انجام دهد؟» → فقط active و
 *     فقط کسی که به همان سرویس اختصاص یافته.
 *   • مدیر: «کل پرسنلم، با هر وضعیتی + چه سرویس‌هایی دارند + پیامد هر اکشن».
 * یکی‌کردنشان یعنی یا دادهٔ مدیری به مشتری نشت می‌کند یا فیلتر دسترسی در UI
 * دستکاری می‌شود. هر متد `businessId` می‌گیرد تا رابطهٔ پرسنل↔کسب‌وکار و
 * مالکیت در همین لایه بررسی شود، نه در صفحه.
 *
 * معادل REST بعدی (AdonisJS):
 *   GET    /owner/businesses/:businessId/employees
 *   GET    /owner/businesses/:businessId/employees/:employeeId
 *   POST   /owner/businesses/:businessId/employees
 *   PATCH  /owner/businesses/:businessId/employees/:employeeId
 *   PATCH  /owner/businesses/:businessId/employees/:employeeId/status
 *   PUT    /owner/businesses/:businessId/employees/:employeeId/services
 *   DELETE /owner/businesses/:businessId/employees/:employeeId
 */
export interface EmployeeManagementService {
  /** همهٔ پرسنل این کسب‌وکار، فعال و غیرفعال (نمای مدیر) */
  list: (businessId: EntityId) => Promise<ManagedEmployee[]>
  get: (businessId: EntityId, employeeId: EntityId) => Promise<ManagedEmployee>
  create: (businessId: EntityId, input: EmployeeInput) => Promise<ManagedEmployee>
  update: (businessId: EntityId, employeeId: EntityId, input: EmployeeInput) => Promise<ManagedEmployee>
  /** فعال/غیرفعال — تنها راه تغییر وضعیت؛ بدون تأیید مزاحم */
  setStatus: (businessId: EntityId, employeeId: EntityId, status: EmployeeStatus) => Promise<ManagedEmployee>
  /**
   * جای *تنها* برای نوشتن رابطهٔ پرسنل↔سرویس. فهرست سرویس‌ها باید متعلق به همان
   * کسب‌وکار باشد؛ سرویس نامعتبر یعنی `NOT_FOUND`، نه «بی‌صدا حذف‌شدن».
   */
  assignServices: (businessId: EntityId, employeeId: EntityId, serviceIds: EntityId[]) => Promise<ManagedEmployee>
  /** حذف واقعی؛ اگر سیاست اجازه ندهد `ServiceError('CONFLICT')` با فارسی خوانا */
  remove: (businessId: EntityId, employeeId: EntityId) => Promise<void>
  /**
   * بازنشانی تغییرات محلی به دادهٔ پایه — مخصوص ابزار توسعه (دکمهٔ /dev/design).
   * در حالت api چنین چیزی وجود ندارد؛ مصرف‌کنندهٔ UI آن را فقط با پرچم mock
   * نشان می‌دهد.
   */
  resetLocalChanges: () => Promise<void>
}
