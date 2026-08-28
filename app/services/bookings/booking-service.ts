import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { CreateBookingRequest, CreateBookingResponse, CreateBookingErrorResponse, BookingValidationResult } from '~/types/booking-flow'

/**
 * قرارداد سرویس رزرو.
 * فاز ۵: ساخت/ویرایش/اعتبارسنجی رزرو اضافه شد.
 */
export type BookingScope = 'upcoming' | 'past'

export interface BookingService {
  /** نوبت‌های کاربر جاری؛ upcoming → نزدیک‌ترین اول، past → جدیدترین اول */
  listMine(scope?: BookingScope): Promise<Booking[]>
  getById(id: EntityId): Promise<Booking | null>

  /** ساخت رزرو جدید */
  create(request: CreateBookingRequest): Promise<CreateBookingResponse | CreateBookingErrorResponse>

  /** اعتبارسنجی draft قبل از تأیید نهایی */
  validateDraft(request: CreateBookingRequest): Promise<BookingValidationResult>
}
