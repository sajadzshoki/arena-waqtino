import { ServiceError } from '~/utils/errors'
import type { AuthSession } from '~/types/user'
import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { CreateBookingRequest, CreateBookingResponse, CreateBookingErrorResponse, BookingValidationResult } from '~/types/booking-flow'
import { allMockBookings, MOCK_BOOKINGS } from '~/services/mocks/bookings'
import { MOCK_BOOKED_SLOTS } from '~/services/mocks/extras'
import { resolveBusinessServices } from '~/services/mocks/service-state'
import type { BookingScope, BookingService, CancelBookingRequest, CancelBookingResponse, CancelBookingErrorResponse, RescheduleBookingRequest, RescheduleBookingResponse, RescheduleBookingErrorResponse } from './booking-service'

export class MockBookingService implements BookingService {
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  async listMine(scope: BookingScope = 'upcoming'): Promise<Booking[]> {
    await delay()
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    if (flags.forceEmpty.value) return []

    const userId = this.userId
    if (!userId) return []

    const now = Date.now()
    const isUpcoming = (b: Booking) =>
      new Date(b.start).getTime() >= now && (b.status === 'pending' || b.status === 'confirmed')

    const items = allMockBookings().filter(
      b => b.customerId === userId && (scope === 'upcoming' ? isUpcoming(b) : !isUpcoming(b))
    )

    return items.sort((a, b) =>
      scope === 'upcoming'
        ? new Date(a.start).getTime() - new Date(b.start).getTime()
        : new Date(b.start).getTime() - new Date(a.start).getTime()
    )
  }

  async getById(id: EntityId): Promise<Booking | null> {
    await delay(200)
    return allMockBookings().find(b => b.id === id) ?? null
  }

  async validateDraft(request: CreateBookingRequest): Promise<BookingValidationResult> {
    await delay(400)

    const errors: BookingValidationResult['errors'] = []
    const warnings: BookingValidationResult['warnings'] = []

    // Validation 1: Business exists
    // (در mock همه‌چیز وجود دارد مگر اینکه forceError فعال باشد)
    const flags = useMockFlags()
    if (flags.forceError.value) {
      errors.push({
        code: 'NETWORK_ERROR',
        message: 'اتصال برقرار نشد.'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 2: Service exists in this business and is still bookable
    // (فهرست مدیریتی همان منبع دادهٔ موک است: غیرفعال‌کردن سرویس همین‌جا جلوی
    // رزرو تازه را می‌گیرد؛ رزروهای ثبت‌شدهٔ قبلی دست نمی‌خورند.)
    const businessServices = resolveBusinessServices(request.businessId)
    const service = businessServices.find(s => s.id === request.serviceId)
    if (!service) {
      errors.push({
        code: 'SERVICE_UNAVAILABLE',
        message: 'چنین سرویسی در این کسب‌وکار ثبت نشده است. یک سرویس دیگر را انتخاب کنید.',
        field: 'service'
      })
      return { valid: false, errors, warnings }
    }
    if (service.status !== 'active') {
      errors.push({
        code: 'SERVICE_UNAVAILABLE',
        message: `«${service.name}» برای رزرو تازه فعال نیست. سرویس دیگری را انتخاب کنید.`,
        field: 'service'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 3: Service price matches
    if (service.price !== request.price) {
      warnings.push({
        code: 'PRICE_CHANGED',
        message: `قیمت این خدمت تغییر کرده است. قیمت جدید: ${formatToman(service.price)}`,
        type: 'price_change'
      })
    }

    // Validation 4: Slot availability
    const slotKey = this.slotKey(request)
    if (MOCK_BOOKED_SLOTS.has(slotKey)) {
      errors.push({
        code: 'SLOT_UNAVAILABLE',
        message: 'این زمان دیگر در دسترس نیست. لطفاً زمان دیگری انتخاب کنید.',
        field: 'timeSlot'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 5: Date not in past
    const startTime = new Date(request.start).getTime()
    if (startTime < Date.now()) {
      errors.push({
        code: 'DATE_IN_PAST',
        message: 'تاریخ انتخاب‌شده در گذشته است.',
        field: 'date'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 6: Duration matches service
    const duration = (new Date(request.end).getTime() - startTime) / 60000
    if (Math.abs(duration - service.durationMinutes) > 5) {
      errors.push({
        code: 'DURATION_MISMATCH',
        message: 'مدت زمان رزرو با مدت خدمت همخوانی ندارد.'
      })
      return { valid: false, errors, warnings }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  async create(request: CreateBookingRequest): Promise<CreateBookingResponse | CreateBookingErrorResponse> {
    await delay(600)

    const userId = this.userId
    if (!userId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ابتدا وارد حساب خود شوید.'
        }
      }
    }

    // Validate
    const validation = await this.validateDraft(request)
    if (!validation.valid) {
      const firstError = validation.errors[0]
      if (!firstError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR' as const,
            message: 'خطا در اعتبارسنجی رزرو.'
          }
        }
      }
      return {
        success: false,
        error: {
          code: this.mapErrorCode(firstError.code),
          message: firstError.message
        }
      }
    }

    // Check for warnings (price change)
    const priceWarning = validation.warnings.find(w => w.type === 'price_change')
    if (priceWarning) {
      const service = resolveBusinessServices(request.businessId).find(s => s.id === request.serviceId)
      return {
        success: false,
        error: {
          code: 'PRICE_CHANGED',
          message: priceWarning.message,
          suggestedPrice: service?.price
        }
      }
    }

    // Create booking
    const bookingId = `bok_${Date.now()}`
    const bookedService = resolveBusinessServices(request.businessId).find(s => s.id === request.serviceId)
    const newBooking: Booking = {
      id: bookingId,
      customerId: userId,
      businessId: request.businessId,
      serviceId: request.serviceId,
      employeeId: request.employeeId ?? undefined,
      start: request.start,
      end: request.end,
      status: 'pending',
      price: request.price,
      // اسنپ‌شات لحظهٔ ثبت: تغییر نام، تغییر مدت یا حذف سرویس در آینده این
      // رکورد را نمی‌شکند (قیمت از قبل در `price` اسنپ‌شات می‌شد).
      serviceSnapshot: bookedService
        ? { name: bookedService.name, durationMinutes: bookedService.durationMinutes }
        : undefined,
      notes: request.notes,
      createdAt: new Date().toISOString()
    }

    MOCK_BOOKINGS.push(newBooking)

    // Mark slot as booked
    const slotKey = this.slotKey(request)
    MOCK_BOOKED_SLOTS.add(slotKey)

    return { success: true, bookingId }
  }

  async cancel(request: CancelBookingRequest): Promise<CancelBookingResponse | CancelBookingErrorResponse> {
    await delay(500)

    const booking = allMockBookings().find(b => b.id === request.bookingId)
    if (!booking) {
      return {
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'این رزرو یافت نشد.'
        }
      }
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return {
        success: false,
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'این رزرو قبلاً لغو شده است.'
        }
      }
    }

    // Check if past booking
    if (new Date(booking.start).getTime() < Date.now()) {
      return {
        success: false,
        error: {
          code: 'PAST_BOOKING',
          message: 'امکان لغو رزروهای گذشته وجود ندارد.'
        }
      }
    }

    // Check cancellation policy (e.g., can't cancel within 2 hours)
    const hoursUntilBooking = (new Date(booking.start).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntilBooking < 2) {
      return {
        success: false,
        error: {
          code: 'POLICY_VIOLATION',
          message: 'امکان لغو رزرو کمتر از ۲ ساعت قبل از زمان appointment وجود ندارد. لطفاً با کسب‌وکار تماس بگیرید.'
        }
      }
    }

    // Cancel the booking
    booking.status = 'cancelled'
    booking.cancelledBy = 'customer'
    booking.cancelReason = request.reason

    // Free up the slot
    const slotKey = this.bookingSlotKey(booking)
    MOCK_BOOKED_SLOTS.delete(slotKey)

    return {
      success: true,
      message: 'رزرو با موفقیت لغو شد.'
    }
  }

  async reschedule(request: RescheduleBookingRequest): Promise<RescheduleBookingResponse | RescheduleBookingErrorResponse> {
    await delay(600)

    const booking = allMockBookings().find(b => b.id === request.bookingId)
    if (!booking) {
      return {
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'این رزرو یافت نشد.'
        }
      }
    }

    // Check if reschedulable
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return {
        success: false,
        error: {
          code: 'NOT_RESCHEDULABLE',
          message: 'امکان تغییر زمان این رزرو وجود ندارد.'
        }
      }
    }

    // Check if new time is in the past
    const newStartTime = new Date(request.newStart).getTime()
    if (newStartTime < Date.now()) {
      return {
        success: false,
        error: {
          code: 'TIME_IN_PAST',
          message: 'زمان انتخاب‌شده در گذشته است.'
        }
      }
    }

    // Check if new slot is available
    const newSlotKey = `${booking.businessId}:${this.dateStrFromDate(new Date(request.newStart))}:${this.timeStrFromDate(new Date(request.newStart))}`
    if (MOCK_BOOKED_SLOTS.has(newSlotKey)) {
      return {
        success: false,
        error: {
          code: 'SLOT_UNAVAILABLE',
          message: 'این زمان دیگر در دسترس نیست. لطفاً زمان دیگری انتخاب کنید.'
        }
      }
    }

    // Free up the old slot
    const oldSlotKey = this.bookingSlotKey(booking)
    MOCK_BOOKED_SLOTS.delete(oldSlotKey)

    // Update the booking
    booking.start = request.newStart
    booking.end = request.newEnd

    // Mark new slot as booked
    MOCK_BOOKED_SLOTS.add(newSlotKey)

    return {
      success: true,
      booking: { ...booking }
    }
  }

  private slotKey(request: CreateBookingRequest): string {
    const start = new Date(request.start)
    const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const timeStr = `${String(start.getHours()).padStart(2, '0')}${String(start.getMinutes()).padStart(2, '0')}`
    return `${request.businessId}:${dateStr}:${timeStr}`
  }

  private bookingSlotKey(booking: Booking): string {
    const start = new Date(booking.start)
    const dateStr = this.dateStrFromDate(start)
    const timeStr = this.timeStrFromDate(start)
    return `${booking.businessId}:${dateStr}:${timeStr}`
  }

  private dateStrFromDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  private timeStrFromDate(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`
  }

  private mapErrorCode(code: string): CreateBookingErrorResponse['error']['code'] {
    switch (code) {
      case 'SLOT_UNAVAILABLE': return 'SLOT_UNAVAILABLE'
      case 'SERVICE_UNAVAILABLE': return 'VALIDATION_ERROR'
      case 'DATE_IN_PAST': return 'VALIDATION_ERROR'
      case 'DURATION_MISMATCH': return 'VALIDATION_ERROR'
      default: return 'SERVER_ERROR'
    }
  }
}
