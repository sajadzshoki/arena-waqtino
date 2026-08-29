import type { EntityId } from './common'
import type { DayAvailabilityStatus, TimeSlot } from './availability'

/**
 * مراحل فرآیند رزرو.
 */
export type BookingStep = 'service' | 'employee' | 'date' | 'time' | 'review'

/**
 * Booking Flow Draft — state مرکزی فرآیند رزرو.
 * این state در طول فرآیند رزرو حفظ می‌شود و برای validation استفاده می‌شود.
 */
export interface BookingFlowDraft {
  businessId: EntityId | null
  serviceId: EntityId | null
  employeeId: EntityId | null | undefined // undefined = not selected yet, null = explicitly "no preference"
  date: string | null // ISO date string (YYYY-MM-DD)
  timeSlot: TimeSlot | null
}

/**
 * وضعیت در دسترس‌بودن یک تاریخ (فاز ۱۱).
 *
 * «تعطیل» و «پر» دو چیزند: `status` از پاسخ سرویس می‌آید، نه از حدس UI — پس نه
 * روزی به‌صورت ثابت تعطیل فرض می‌شود، نه «بدون وقت آزاد» بی‌دلیل نمایش داده
 * می‌شود. روز تعطیلِ واقعی از *برنامهٔ هفته* می‌آید.
 */
export interface DateAvailability {
  /** YYYY-MM-DD — روزِ تقویمی کسب‌وکار */
  dateStr: string
  hasAvailableSlots: boolean
  isToday: boolean
  isTomorrow: boolean
  status: DayAvailabilityStatus
}

/**
 * نتیجهٔ validation رزرو — قبل از تأیید نهایی.
 */
export interface BookingValidationResult {
  valid: boolean
  errors: BookingValidationError[]
  warnings: BookingValidationWarning[]
}

export interface BookingValidationError {
  code: string
  message: string
  field?: 'business' | 'service' | 'employee' | 'date' | 'timeSlot'
}

export interface BookingValidationWarning {
  code: string
  message: string
  type: 'price_change' | 'slot_unavailable' | 'employee_changed'
}

/**
 * درخواست ساخت رزرو — ارسال به backend.
 */
export interface CreateBookingRequest {
  businessId: EntityId
  serviceId: EntityId
  employeeId?: EntityId | null
  start: ISODateTime
  end: ISODateTime
  price: Toman
  notes?: string
}

/**
 * پاسخ موفق ساخت رزرو.
 */
export interface CreateBookingResponse {
  success: true
  bookingId: EntityId
}

/**
 * پاسخ خطا در ساخت رزرو.
 */
export interface CreateBookingErrorResponse {
  success: false
  error: {
    code: 'SLOT_UNAVAILABLE' | 'PRICE_CHANGED' | 'VALIDATION_ERROR' | 'SERVER_ERROR'
    message: string
    suggestedPrice?: Toman
  }
}
