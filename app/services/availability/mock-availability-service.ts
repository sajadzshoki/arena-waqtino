import type { EntityId } from '~/types/common'
import type {
  AvailabilityQuery,
  DateAvailabilityEntry,
  DayAvailability,
  TimeSlot
} from '~/types/availability'
import { ServiceError } from '~/utils/errors'
import { resolveDayAvailability } from './availability-core'
import type { AvailabilityService } from './availability-service'

/**
 * خواندن دسترس‌پذیری در حالت mock (فاز ۱۱) — پوستهٔ نازک روی موتور مشترک.
 *
 * سه چیز را نسبت به نسخهٔ قبل از دست نمی‌دهیم و یکی را عوض می‌کنیم:
 *   • اسلات‌ها دیگر از fixture جدا (`MOCK_WORKING_HOURS`) نمی‌آیند؛ از *همان*
 *     برنامهٔ هفته‌ای owner در صفحهٔ «ساعات کاری» می‌خوانده می‌شود (منبع‌واحد).
 *   • «شلوغی» دیگر الگوی فرضی («هر سومین اسلات») نیست؛ از نوبت‌های واقعی
 *     (`allMockBookings`) می‌آید، پس رزروِ همین‌جا و پیشنهادِ همین‌جا یکی‌اند.
 *   • «هر روز یک درخواست» جایش را به پرس‌وجوی دسته‌ای داد.
 *
 * روز/ساعت در وقت کسب‌وکار محاسبه می‌شود (`utils/schedule-time`)، نه منطقهٔ زمانی
 * مرورگر — برای همین ساعت ۲۴ در تهران و تورنتو یک «امروز» دارد.
 */
export class MockAvailabilityService implements AvailabilityService {
  async getDayAvailability(query: AvailabilityQuery): Promise<DayAvailability> {
    await delay(220)
    return resolveDayAvailability(query)
  }

  /**
   * یک‌بار محاسبه برای همهٔ روزها (بدون `delay` به‌ازای هر روز) — نوار تاریخ رزرو
   * با یک درخواست پر می‌شود.
   */
  async getDateAvailability(
    businessId: EntityId,
    dates: string[],
    options: { serviceId?: EntityId | null, employeeId?: EntityId | null } = {}
  ): Promise<DateAvailabilityEntry[]> {
    if (!businessId) throw ServiceError.validation('کسب‌وکار مشخص نشده است.')
    await delay(260)
    return dates.map((date) => {
      const query: AvailabilityQuery = {
        businessId,
        date,
        serviceId: options.serviceId ?? null,
        employeeId: options.employeeId ?? null
      }
      const day = resolveDayAvailability(query)
      return {
        date,
        status: day.status,
        hasAvailableSlots: day.slots.some(slot => slot.isAvailable)
      }
    })
  }

  /** سازگار با مصرف قبلی جریان رزرو: فقط اسلات‌های همان روز. */
  async getSlots(
    businessId: EntityId,
    date: string,
    employeeId?: EntityId,
    serviceId?: EntityId
  ): Promise<TimeSlot[]> {
    const day = await this.getDayAvailability({ businessId, date, employeeId, serviceId })
    return day.slots
  }
}
