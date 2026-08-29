import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { CreateBookingRequest, CreateBookingResponse, CreateBookingErrorResponse, BookingValidationResult } from '~/types/booking-flow'

/**
 * قرارداد سرویس رزرو.
 * فاز ۵: ساخت/ویرایش/اعتبارسنجی رزرو اضافه شد.
 * فاز ۶: لغو و تغییر زمان رزرو اضافه شد.
 */
export type BookingScope = 'upcoming' | 'past'

export interface CancelBookingRequest {
  bookingId: EntityId
  reason?: string
}

export interface CancelBookingResponse {
  success: true
  message: string
}

export interface CancelBookingErrorResponse {
  success: false
  error: {
    code: 'BOOKING_NOT_FOUND' | 'ALREADY_CANCELLED' | 'PAST_BOOKING' | 'POLICY_VIOLATION' | 'SERVER_ERROR'
    message: string
  }
}

export interface RescheduleBookingRequest {
  bookingId: EntityId
  newStart: string
  newEnd: string
}

export interface RescheduleBookingResponse {
  success: true
  booking: Booking
}

/** نتیجهٔ نهایی هر اکشن — اتحادیهٔ «موفق/ناموفق» که UI یک‌شکل مصرفش می‌کند. */
export type CancelBookingResult = CancelBookingResponse | CancelBookingErrorResponse
export type RescheduleBookingResult = RescheduleBookingResponse | RescheduleBookingErrorResponse

export interface RescheduleBookingErrorResponse {
  success: false
  error: {
    code: 'BOOKING_NOT_FOUND' | 'NOT_RESCHEDULABLE' | 'SLOT_UNAVAILABLE' | 'TIME_IN_PAST' | 'SERVER_ERROR'
    message: string
  }
}

export interface BookingService {
  /** نوبت‌های کاربر جاری؛ upcoming → نزدیک‌ترین اول، past → جدیدترین اول */
  listMine(scope?: BookingScope): Promise<Booking[]>
  getById(id: EntityId): Promise<Booking | null>

  /** ساخت رزرو جدید */
  create(request: CreateBookingRequest): Promise<CreateBookingResponse | CreateBookingErrorResponse>

  /** اعتبارسنجی draft قبل از تأیید نهایی */
  validateDraft(request: CreateBookingRequest): Promise<BookingValidationResult>

  /** لغو رزرو */
  cancel(request: CancelBookingRequest): Promise<CancelBookingResponse | CancelBookingErrorResponse>

  /** تغییر زمان رزرو */
  reschedule(request: RescheduleBookingRequest): Promise<RescheduleBookingResponse | RescheduleBookingErrorResponse>

  /**
   * فقط ابزار توسعه: پاک‌کردن دلتای محلی نوبت‌ها (کوکی `wq_business_bookings`)
   * تا دادهٔ پایه برگردد. در حالت API معنایش «هیچ» است (کش محلی نداریم) و
   * مصرف‌کننده‌اش جز صفحهٔ dev چیزی نیست.
   */
  resetLocalChanges(): Promise<void>
}
