import type { EntityId } from '~/types/common'
import type {
  AvailabilityQuery,
  DateAvailabilityEntry,
  DayAvailability,
  TimeSlot
} from '~/types/availability'

/**
 * قرارداد «کی کی آزاد است؟» — خواندنِ دسترس‌پذیری برای مشتری و جریان رزرو
 * (فاز ۱۱).
 *
 * نکتهٔ اصلی این است که این سرویس *تولید* می‌کند و *ذخیره* نمی‌کند:
 *   پنجره‌های کاری (`AvailabilitySchedule`، فاز ۱۱ مدیریت) + مدت سرویس +
 *   نوبت‌های موجود → اسلات‌های قابل‌رزرو. هیچ اسلاتی در داده نمی‌ماند، پس
 *   «ساعت کاری را عوض کن» فوری روی رزرو اثر می‌کند و دادهٔ موازی هم نداریم.
 *
 * سه مصرف‌کننده دارد و همه از یک مسیر:
 *   • نوار تاریخ رزرو → `getDateAvailability` (یک درخواست دسته‌ای، نه ۱۴ تا)
 *   • گام ساعت رزرو → `getDayAvailability` (اسلات + دلیلِ نبودِ اسلات)
 *   • `getSlots` = همان روز، وقتی فقط فهرست اسلات لازم است
 *
 * معادل REST بعدی:
 *   GET /businesses/:businessId/availability?date=YYYY-MM-DD&serviceId=&employeeId=
 *   GET /businesses/:businessId/availability/range?from=&to=&serviceId=&employeeId=
 */
export interface AvailabilityService {
  /** یک روز: اسلات‌ها + وضعیت («تعطیل» در برابر «پر» در برابر «تنظیم‌نشده»). */
  getDayAvailability: (query: AvailabilityQuery) => Promise<DayAvailability>
  /**
   * چند روز با هم — برای نوار تاریخ. پاسخ به ترتیب همان `dates` است و هر روز
   * وضعیتش را دارد، حتی وقتی اسلاتی ندارد.
   */
  getDateAvailability: (
    businessId: EntityId,
    dates: string[],
    options?: { serviceId?: EntityId | null, employeeId?: EntityId | null }
  ) => Promise<DateAvailabilityEntry[]>
  /** سازگار با مصرف قبلی جریان رزرو: فقط اسلات‌های همان روز. */
  getSlots: (
    businessId: EntityId,
    date: string,
    employeeId?: EntityId,
    serviceId?: EntityId
  ) => Promise<TimeSlot[]>
}
