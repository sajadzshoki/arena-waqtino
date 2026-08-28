import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'

/**
 * قرارداد سرویس رزرو.
 * فاز ۲: خواندن رزروهای کاربر جاری — ساخت/ویرایش رزرو در فاز رزرو می‌آید.
 */
export type BookingScope = 'upcoming' | 'past'

export interface BookingService {
  /** نوبت‌های کاربر جاری؛ upcoming → نزدیک‌ترین اول، past → جدیدترین اول */
  listMine(scope?: BookingScope): Promise<Booking[]>
  getById(id: EntityId): Promise<Booking | null>
}
