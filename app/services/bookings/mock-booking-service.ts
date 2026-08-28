import { ServiceError } from '~/utils/errors'
import type { AuthSession } from '~/types/user'
import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { CreateBookingRequest, CreateBookingResponse, CreateBookingErrorResponse, BookingValidationResult } from '~/types/booking-flow'
import { allMockBookings, MOCK_BOOKINGS } from '~/services/mocks/bookings'
import { MOCK_BOOKED_SLOTS } from '~/services/mocks/extras'
import { resolveBusinessEmployees } from '~/services/mocks/employee-state'
import { resolveBusinessServices } from '~/services/mocks/service-state'
import { employeeDisplayName } from '~/types/employee'
import { dateKeyOf, localTimeOf, timeToMinutes } from '~/utils/schedule-time'
import { APP_TIMEZONE } from '~/config/timezone'
import { dayContext, withinWindows } from '~/services/availability/availability-core'
import type { BookingScope, BookingService, CancelBookingRequest, CancelBookingResponse, CancelBookingErrorResponse, RescheduleBookingRequest, RescheduleBookingResponse, RescheduleBookingErrorResponse } from './booking-service'

export class MockBookingService implements BookingService {
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  /** نام پرسنل از همان منبع رابطه/وضعیت فاز ۱۰ — برای اسنپ‌شات لحظهٔ ثبت. */
  private employeeNameOf(businessId: EntityId, employeeId: EntityId): string | null {
    const employee = resolveBusinessEmployees(businessId).find(e => e.id === employeeId)
    return employee ? employeeDisplayName(employee) : null
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

    // Validation 2b: Employee (فاز ۱۰) — رابطه و وضعیت دوباره همین‌جا بررسی
    // می‌شود، نه فقط در فیلتر UI: یک پیش‌نویس کهنه یا یک درخواست مستقیم نباید
    // نوبت را به نفر غیرفعال یا به نفرِ «این سرویس را انجام نمی‌دهد» بچسباند.
    if (request.employeeId) {
      const employee = resolveBusinessEmployees(request.businessId).find(e => e.id === request.employeeId)
      if (!employee) {
        errors.push({
          code: 'EMPLOYEE_UNAVAILABLE',
          message: 'چنین پرسنلی در این کسب‌وکار ثبت نشده است. پرسنل دیگری را انتخاب کنید.',
          field: 'employee'
        })
        return { valid: false, errors, warnings }
      }
      if (employee.status !== 'active') {
        errors.push({
          code: 'EMPLOYEE_UNAVAILABLE',
          message: `«${employeeDisplayName(employee)}» دیگر برای رزرو تازه فعال نیست. پرسنل دیگری را انتخاب کنید.`,
          field: 'employee'
        })
        return { valid: false, errors, warnings }
      }
      if (!employee.serviceIds.includes(request.serviceId)) {
        errors.push({
          code: 'EMPLOYEE_UNAVAILABLE',
          message:
            `«${employeeDisplayName(employee)}» این سرویس را انجام نمی‌دهد؛ ` +
            'یا پرسنل دیگری را انتخاب کنید یا بدون انتخاب پرسنل ادامه دهید.',
          field: 'employee'
        })
        return { valid: false, errors, warnings }
      }
    }

    // Validation 3: Service price matches
    if (service.price !== request.price) {
      warnings.push({
        code: 'PRICE_CHANGED',
        message: `قیمت این خدمت تغییر کرده است. قیمت جدید: ${formatToman(service.price)}`,
        type: 'price_change'
      })
    }

    // Validation 3b: پنجرهٔ کاری (فاز ۱۱) — دفاع دوم.
    // پیش‌نویسِ کهنه (ساعتی که بعد از آن owner ساعت کاری را عوض کرده) یا یک
    // درخواست مستقیم نباید نوبتی بیرون از بازهٔ کاری آن روز بسازد. نکتهٔ مهم:
    // اگر کسب‌وکار *اصلاً* ساعت کاری تنظیم نکرده باشد، محدودیتی وضع نمی‌شود —
    // «نبودِ داده» یعنی «محدودیتی اعلام نشده»، نه «همه‌جا باز» و نه «همه‌جا بسته».
    const windowError = this.availabilityConflict(
      request.businessId,
      request.employeeId ?? null,
      request.start,
      request.end
    )
    if (windowError) {
      errors.push({
        code: windowError.code,
        message: windowError.message,
        field: 'timeSlot'
      })
      return { valid: false, errors, warnings }
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
    const bookedEmployee = request.employeeId
      ? this.employeeNameOf(request.businessId, request.employeeId)
      : null
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
      // نام پرسنل هم در همان لحظهٔ ثبت قفل می‌شود (فاز ۱۰): تغییر نام،
      // غیرفعال‌کردن یا حذف او از کسب‌وکار، متن این نوبت را عوض نمی‌کند.
      employeeSnapshot: bookedEmployee ? { name: bookedEmployee } : undefined,
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
    const slotKey = this.slotKeyOf(booking.businessId, booking.start)
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

    // پنجرهٔ کاری روز تازه (فاز ۱۱) — با حذف خودِ نوبت از اشغال، تا جابه‌جایی به
    // همان ساعت یا ساعتِ هم‌پوشان با *خودش* خطا نگیرد
    const moved = this.availabilityConflict(
      booking.businessId,
      booking.employeeId ?? null,
      request.newStart,
      request.newEnd,
      booking.id
    )
    if (moved) {
      return {
        success: false,
        error: {
          code: 'SLOT_UNAVAILABLE',
          message: moved.message
        }
      }
    }

    const newSlotKey = this.slotKeyOf(booking.businessId, request.newStart)
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
    const oldSlotKey = this.slotKeyOf(booking.businessId, booking.start)
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

  /**
   * کلید «این ساعت گرفته شده» — از فاز ۱۱ با *وقت کسب‌وکار* ساخته می‌شود، نه
   * منطقهٔ زمانی مرورگر/سرور: وگرنه همان نوبت در تهران و در UTC دو کلید متفاوت
   * می‌گرفت و قفل اسلات بی‌صدا شل می‌شد.
   */
  private slotKeyOf(businessId: EntityId, start: string): string {
    return `${businessId}:${dateKeyOf(start, APP_TIMEZONE)}:${(localTimeOf(start, APP_TIMEZONE) ?? '').replace(':', '')}`
  }

  private slotKey(request: CreateBookingRequest): string {
    return this.slotKeyOf(request.businessId, request.start)
  }

  /**
   * کنترل پنجرهٔ کاری: «آیا این بازه داخل ساعت کاری آن روز است و با نوبتِ
   * دیگری نمی‌جنگد؟» پاسخ `null` یعنی اشکالی نیست.
   */
  private availabilityConflict(
    businessId: EntityId,
    employeeId: EntityId | null,
    startIso: string,
    endIso: string,
    excludeBookingId?: EntityId
  ): { code: string, message: string } | null {
    const context = dayContext({
      businessId,
      date: dateKeyOf(startIso, APP_TIMEZONE),
      employeeId,
      excludeBookingId: excludeBookingId ?? null
    })

    // فقط «تعطیل بودنِ اعلام‌شده» جلوی نوبت را می‌گیرد؛ «ساعت کاری تنظیم نشده»
    // محدودیت نمی‌سازد (فازهای قبل هم چنین قیدی نداشتند) و «سرویس/پرسنل
    // غیرفعال» را همان validateDraft قبل‌تر و با پیام درست رد کرده است.
    if (context.status === 'closed') {
      return { code: 'DAY_CLOSED', message: context.message ?? 'در آن روز پذیرشی تعریف نشده است.' }
    }
    if (context.intervals.length === 0) return null

    const start = timeToMinutes(localTimeOf(startIso, APP_TIMEZONE)) ?? 0
    const end = timeToMinutes(localTimeOf(endIso, APP_TIMEZONE)) ?? start
    const { fits, overlapsBooking } = withinWindows(context.intervals, start, end, context.bookings)
    if (!fits) {
      return {
        code: 'OUT_OF_HOURS',
        message: 'ساعت انتخابی بیرون از بازهٔ کاری آن روز است؛ زمان دیگری انتخاب کنید.'
      }
    }
    if (overlapsBooking) {
      return {
        code: 'SLOT_UNAVAILABLE',
        message: 'این زمان با نوبت دیگری تداخل دارد. لطفاً زمان دیگری انتخاب کنید.'
      }
    }
    return null
  }

  private mapErrorCode(code: string): CreateBookingErrorResponse['error']['code'] {
    switch (code) {
      case 'SLOT_UNAVAILABLE': return 'SLOT_UNAVAILABLE'
      case 'SERVICE_UNAVAILABLE': return 'VALIDATION_ERROR'
      case 'EMPLOYEE_UNAVAILABLE': return 'VALIDATION_ERROR'
      case 'DATE_IN_PAST': return 'VALIDATION_ERROR'
      case 'DURATION_MISMATCH': return 'VALIDATION_ERROR'
      default: return 'SERVER_ERROR'
    }
  }
}
