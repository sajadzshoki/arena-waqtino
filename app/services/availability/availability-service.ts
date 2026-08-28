import type { EntityId } from '~/types/common'
import type { TimeSlot } from '~/types/availability'

/**
 * قرارداد سرویس در دسترس‌بودن (Availability).
 * - سطح کسب‌وکار: ساعت کاری هفتگی
 * - سطح کارمند: در فاز رزرو/مدیریت گسترش می‌یابد
 */
export interface AvailabilityService {
  /**
   * اسلات‌های قابل‌رزرو یک کسب‌وکار برای یک روز مشخص (ISO date).
   * اگر employeeId داده شود، اسلات‌های همان کارمند برمی‌گردد.
   */
  getSlots(businessId: EntityId, date: string, employeeId?: EntityId): Promise<TimeSlot[]>
}
