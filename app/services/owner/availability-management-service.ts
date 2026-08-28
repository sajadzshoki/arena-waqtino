import type { EntityId } from '~/types/common'
import type {
  AvailabilityDay,
  BusinessScheduleView,
  EmployeeScheduleView,
  EmployeeScheduleSummary,
  ScheduleInput
} from '~/types/availability'

/**
 * قرارداد «مدیریت ساعات کاری» — نقش صاحب کسب‌وکار (فاز ۱۱).
 *
 * سه نکته که شکل این اینترفیس را تعیین کرده:
 *   ۱) ورودی/خروجی **برنامه** است، نه اسلات. «۰۹:۰۰ تا ۱۸:۰۰» ذخیره می‌شود؛
 *      تبدیلش به اسلات‌های قابل‌رزرو کار `AvailabilityService` (خواندن مشتری)
 *      است. پس این سرویس هیچ‌وقت ساعت خالی تولید نمی‌کند.
 *   ۲) `employeeId` همیشه کنار `businessId` می‌آید — هیچ متدی «فقط با شناسهٔ
 *      پرسنل» کار نمی‌کند، تا انزوای چندکسب‌وکاری ساختاری بماند.
 *   ۳) اعتبارسنجی و «پرسنل ⊆ کسب‌وکار» همین‌جا اجرا می‌شود (دفاع دوم، آینهٔ
 *      اعتبارسنجی سرور). UI هم همان تابع مرکزی را صدا می‌زند؛ پس قاعده یکی است.
 *
 * معادل REST بعدی (AdonisJS):
 *   GET    /owner/businesses/:businessId/availability
 *   PUT    /owner/businesses/:businessId/availability
 *   GET    /owner/businesses/:businessId/availability/employees
 *   GET    /owner/businesses/:businessId/availability/employees/:employeeId
 *   PUT    /owner/businesses/:businessId/availability/employees/:employeeId
 *   DELETE /owner/businesses/:businessId/availability/employees/:employeeId
 *          (آخری = بازگشت به پیش‌فرض کسب‌وکار)
 */
export interface AvailabilityManagementService {
  /** ساعت پیش‌فرض کسب‌وکار؛ `schedule: null` یعنی هنوز تنظیم نشده. */
  getBusiness: (businessId: EntityId) => Promise<BusinessScheduleView>
  /** جایگزینی کامل برنامهٔ هفته (ذخیرهٔ صریح، نه patch خودکار). */
  saveBusiness: (businessId: EntityId, days: AvailabilityDay[]) => Promise<BusinessScheduleView>

  /** فهرست پرسنل + منبع برنامهٔ هرکدام (برای صفحهٔ ساعات کاری). */
  listEmployees: (businessId: EntityId) => Promise<EmployeeScheduleSummary[]>
  getEmployee: (businessId: EntityId, employeeId: EntityId) => Promise<EmployeeScheduleView>
  /**
   * ثبت برنامهٔ یک نفر: `source: 'custom'` با `days`، یا `source:
   * 'business-default'` یعنی «انصراف از برنامهٔ اختصاصی».
   */
  saveEmployee: (
    businessId: EntityId,
    employeeId: EntityId,
    input: ScheduleInput
  ) => Promise<EmployeeScheduleView>
  /** همان `business-default` — ولی اکشن صریح «بازگشت به ساعات کسب‌وکار». */
  resetEmployeeToBusinessDefault: (businessId: EntityId, employeeId: EntityId) => Promise<EmployeeScheduleView>

  /** فقط ابزار توسعه (دکمهٔ «بازگشت دادهٔ موک» در /dev/design). */
  resetLocalChanges: () => Promise<void>
}
