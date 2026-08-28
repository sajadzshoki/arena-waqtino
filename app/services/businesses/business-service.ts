import type { Business, BusinessCategory, BusinessWithDistance } from '~/types/business'
import type { EntityId, Paginated } from '~/types/common'
import type { BookableEmployee } from '~/types/employee'
import type { BookableService } from '~/types/service'
import type { BookingEmployeeSnapshot, BookingServiceSnapshot } from '~/types/booking'

/**
 * قرارداد سرویس کسب‌وکارها.
 * فاز ۲: خواندن فهرست/جستجو/دسته‌ها + خدمات و کارمندان — کشف و جزئیات در فازهای بعد.
 * فاز ۳: متدهای کشف (پیشنهاد، محبوب، نزدیک).
 */
export interface BusinessListQuery {
  search?: string
  categoryId?: EntityId
  page?: number
  perPage?: number
}

export interface BusinessService {
  list(query?: BusinessListQuery): Promise<Paginated<Business>>
  getById(id: EntityId): Promise<Business | null>
  listCategories(): Promise<BusinessCategory[]>

  /** کسب‌وکارهای پیشنهادی/ویژه برای صفحهٔ خانه */
  listFeatured(): Promise<Business[]>
  /** کسب‌وکارهای محبوب (بر اساس امتیاز/تعداد نظر) */
  listPopular(): Promise<Business[]>
  /** کسب‌وکارهای نزدیک (mock فاصله تا بک‌اند لوکیشن آماده شود) */
  listNearby(): Promise<BusinessWithDistance[]>

  /** خدمات فعال یک کسب‌وکار — همان فهرستی که رزرو و صفحهٔ کسب‌وکار می‌بینند */
  listServices(businessId: EntityId): Promise<BookableService[]>
  /**
   * نام/مدت سرویس برای نمایشِ تاریخچه (رزرو ثبت‌شده). برخلاف `listServices`
   * فیلتر «فعال» ندارد و برای سرویس حذف‌شده هم پاسخ می‌دهد، تا یک رزرو
   * قدیمی بعد از غیرفعال/حذف‌شدن سرویس بی‌نام نماند. `null` = چیزی نمی‌دانیم.
   */
  getServiceForHistory(serviceId: EntityId): Promise<BookingServiceSnapshot | null>
  /**
   * پرسنل *فعال* یک کسب‌وکار — همان فهرستی که کارت سرویس و گام «انتخاب پرسنل»
   * می‌بیند. فیلتر وضعیت همین‌جا است (نه در UI)؛ غیرفعال‌کردن از فاز ۱۰ یعنی
   * حذف از این فهرست، بدون حذف از مدیریت و تاریخچه.
   *
   * خروجی نمای `BookableEmployee` است، نه رکورد دامنه: شمارهٔ تماس و شناسهٔ
   * حساب کاربری پرسنل هیچ‌وقت به مشتری داده نمی‌شوند.
   */
  listEmployees(businessId: EntityId): Promise<BookableEmployee[]>
  /**
   * نام پرسنل برای نمایشِ تاریخچه (رزرو ثبت‌شده). برخلاف `listEmployees` فیلتر
   * «فعال» ندارد و برای پرسنل حذف‌شده هم پاسخ می‌دهد، تا یک نوبت قدیمی بعد از
   * غیرفعال/حذف‌شدن پرسنل بی‌نام نماند. `null` = چیزی نمی‌دانیم.
   */
  getEmployeeForHistory(employeeId: EntityId): Promise<BookingEmployeeSnapshot | null>
}
