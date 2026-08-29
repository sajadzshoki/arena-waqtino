import { ServiceError } from '~/utils/errors'
import type { AuthSession } from '~/types/user'
import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type {
  BookingValidationResult,
  BookingValidationError,
  BookingValidationWarning,
  CreateBookingRequest,
  CreateBookingResponse,
  CreateBookingErrorResponse
} from '~/types/booking-flow'
import type {
  BookingScope,
  BookingService,
  CancelBookingRequest,
  CancelBookingResponse,
  CancelBookingErrorResponse,
  RescheduleBookingRequest,
  RescheduleBookingResponse,
  RescheduleBookingErrorResponse
} from './booking-service'
import { bookingCancelBlock, bookingCancelBlockLabel, bookingRescheduleBlock } from '~/config/booking-policy'
import { allMockBookings, findMockBooking } from '~/services/mocks/bookings'
import { clearMockBookingState, persistBookingPatch, persistCreatedBooking } from '~/services/mocks/booking-state'
import { resolveBusinessEmployees } from '~/services/mocks/employee-state'
import { resolveBusinessServices } from '~/services/mocks/service-state'
import { employeeDisplayName } from '~/types/employee'
import { dateKeyOf, localTimeOf, timeToMinutes } from '~/utils/schedule-time'
import { dayContext, resolveDayAvailability, withinWindows } from '~/services/availability/availability-core'

/**
 * Mock نوبت‌ها — پیاده‌سازی `BookingService`.
 *
 * دو قانونی که این فایل در فاز ۱۲ دقیق‌تر از قبل رعایت می‌کند:
 *  ۱) **یک منبع اشغال**: «این ساعت پر است؟» تنها از موتور دسترس‌پذیری فاز ۱۱
 *     (`resolveDayAvailability` ← `bookingsOfDay`) پرسیده می‌شود. پیش از این،
 *     یک `Set` جدا (`MOCK_BOOKED_SLOTS`) هم‌زمان اشغال را نگه می‌داشت؛ دو
 *     حقیقت موازی که بعد از هر رفرش با هم می‌جنگیدند (و آن `Set` هیچ‌وقت
 *     seed هم نشده بود، پس «شبیه‌سازی تداخل» عملاً کار نمی‌کرد).
 *  ۲) **نوشتن فقط در `booking-state.ts`**: هیچ `push`/انتساب روی رکورد seed
 *     انجام نمی‌شود، پس نوبت‌ها با refresh از بین نمی‌روند و نمای مدیر/تقویم/
 *     پیشنهادِ ساعت، همه همان یک واقعیت را می‌بینند.
 *
 * مالکیت هم همین‌جا بررسی می‌شود (قاعدهٔ معماری: «مالکیت در سرویس است، نه در
 * صفحه»): نوبتِ کاربر دیگر برای این نشست «یافت نشد» است، نه قابل‌خواندن.
 *
 * اعتبارسنجی *داخل سرویس* دوباره تکرار می‌شود؛ هر چه UI بگوید، بک‌اند هم همین
 * کار را می‌کند (بند ۳۳: به state سمت کاربر اعتماد نمی‌کنیم).
 */
export class MockBookingService implements BookingService {
  /** نشست جاری (synchronous — همان الگوی فاز ۵). نبودِ نشست یعنی «لاگین نکرده». */
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  /** نام پرسنل از همان منبع رابطه/وضعیت فاز ۱۰ — برای اسنپ‌شات لحظهٔ ثبت. */
  private employeeNameOf(businessId: EntityId, employeeId: EntityId): string | null {
    const employee = resolveBusinessEmployees(businessId).find(e => e.id === employeeId)
    return employee ? employeeDisplayName(employee) : null
  }

  async listMine(scope: BookingScope = 'upcoming'): Promise<Booking[]> {
    // خواندن context پیش از اولین `await` — وگرنه در SSR بعد از delay، نوبت
    // instance را ندارد و `useMockFlags()`/`useCookie()` بی‌صدا به پیش‌فرض می‌افتد
    // (کلیدهای شبیه‌سازیِ /dev/design روی خواندن‌های SSR بی‌اثر می‌شدند).
    const userId = this.userId
    const flags = useMockFlags()
    await delay()
    if (flags.forceError.value) throw ServiceError.network()
    if (flags.forceEmpty.value) return []
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
    const userId = this.userId
    const flags = useMockFlags()
    await delay(200)
    // حالت «شبکه قطع» (ابزار dev) — تا حالت خطای صفحهٔ جزئیات قابل‌تست بماند
    if (flags.forceError.value) throw ServiceError.network()
    const booking = findMockBooking(id)
    if (!booking) return null
    // نوبتِ کسب‌وکار یا کاربر دیگر: برای این نشست وجود ندارد (۴۰۴، نه ۴۰۳) —
    // همان رفتاری که از بک‌اند انتظار داریم.
    return booking.customerId === userId ? booking : null
  }

  /* ─────────────────────── اشغال/پنجره، از موتور دسترس‌پذیری ─────────────────────── */

  /**
   * چرا این ساعت برای این نوبت نمی‌گنجد؟ `null` یعنی ایرادی نیست.
   * پاسخ از وضعیت روز می‌آید: تعطیل، گذشته، خارج از بازه، یا پر.
   */
  private conflictOf(query: {
    businessId: EntityId
    serviceId: EntityId
    employeeId: EntityId | null
    start: string
    excludeBookingId?: EntityId
  }): BookingValidationError | null {
    const params = {
      businessId: query.businessId,
      serviceId: query.serviceId,
      employeeId: query.employeeId,
      date: dateKeyOf(query.start),
      ...(query.excludeBookingId ? { excludeBookingId: query.excludeBookingId } : {})
    }
    const day = resolveDayAvailability(params)

    if (day.status === 'past') {
      return { code: 'DATE_IN_PAST', message: 'زمان انتخابی گذشته است.', field: 'date' }
    }
    if (day.status === 'closed') {
      return { code: 'DAY_CLOSED', message: 'در این روز پذیرش نداریم.', field: 'date' }
    }
    // کسب‌وکاری که هنوز ساعت کاری تنظیم نکرده: سیاست فاز ۱۱ «سخت‌گیرانه نبودن»
    // است، و پیام سرویس اگر بود همان را می‌گوییم (دو نسخهٔ پیام نسازیم).
    if (day.status === 'not-configured') {
      return day.message ? { code: 'SLOT_UNAVAILABLE', message: day.message, field: 'timeSlot' } : null
    }
    // `slots` شبکهٔ کامل همان روز است با پرچم `isAvailable` (پنجره ∩ مدت خدمت ∩
    // نوبت‌های زنده) — پس «آزاد نبودن» همان چیزی است که کاربر باید بفهمد.
    if (day.slots.some(slot => slot.start === query.start && slot.isAvailable)) return null

    // چرا رد شد؟ پنجره/تداخل را از خودِ ctx می‌پرسیم تا پیام با واقعیت یکی باشد
    const ctx = dayContext(params)
    const startMinutes = timeToMinutes(localTimeOf(query.start)) ?? 0
    const check = withinWindows(ctx.intervals, startMinutes, startMinutes + ctx.durationMinutes, ctx.bookings)
    if (check.overlapsBooking || day.status === 'fully-booked') {
      return {
        code: 'SLOT_UNAVAILABLE',
        message: 'این ساعت با نوبت دیگری تداخل دارد. لطفاً زمان دیگری انتخاب کنید.',
        field: 'timeSlot'
      }
    }
    if (!check.fits) {
      return {
        code: 'OUT_OF_HOURS',
        message: ctx.intervals.length
          ? 'این ساعت خارج از بازهٔ کاری این روز است.'
          : 'در این روز بازهٔ کاری باز تعریف نشده است.',
        field: 'timeSlot'
      }
    }
    // داخل پنجره است ولی روی شبکهٔ اسلات نمی‌نشیند (مثلاً ۰۹:۲۰ با خدمت ۳۰ دقیقه)
    return {
      code: 'SLOT_UNAVAILABLE',
      message: 'این ساعت دیگر رزروشدنی نیست. لطفاً زمان دیگری انتخاب کنید.',
      field: 'timeSlot'
    }
  }

  /* ─────────────────────────── اعتبارسنجی پیش‌نویس ─────────────────────────── */

  async validateDraft(request: CreateBookingRequest): Promise<BookingValidationResult> {
    const flags = useMockFlags()
    await delay(400)

    const errors: BookingValidationError[] = []
    const warnings: BookingValidationWarning[] = []

    // سناریوی «شبکه قطع است» (ابزار dev) — پیش از هر چیز، تا مسیر خطا قابل‌تست بماند
    if (flags.forceError.value) {
      return { valid: false, errors: [{ code: 'NETWORK_ERROR', message: 'اتصال برقرار نشد.' }], warnings }
    }

    // خدمت در همین کسب‌وکار هست و هنوز قابل رزرو است؟
    // (فهرست مدیریتی همان منبع دادهٔ موک است: غیرفعال‌کردن سرویس همین‌جا جلوی
    // رزرو تازه را می‌گیرد؛ نوبت‌های ثبت‌شدهٔ قبلی دست نمی‌خورند.)
    const service = resolveBusinessServices(request.businessId).find(s => s.id === request.serviceId)
    if (!service) {
      return {
        valid: false,
        errors: [{ code: 'SERVICE_NOT_AVAILABLE', message: 'این خدمت در این کسب‌وکار پیدا نشد.', field: 'service' }],
        warnings
      }
    }
    if (service.status !== 'active') {
      return {
        valid: false,
        errors: [{ code: 'SERVICE_NOT_AVAILABLE', message: 'این خدمت فعلاً قابل رزرو نیست.', field: 'service' }],
        warnings
      }
    }

    // پرسنل: وجود + وضعیت + رابطه با خدمت (همان سه پرسش، به همین ترتیب)
    if (request.employeeId) {
      const employee = resolveBusinessEmployees(request.businessId).find(e => e.id === request.employeeId)
      if (!employee) {
        return {
          valid: false,
          errors: [{ code: 'EMPLOYEE_NOT_AVAILABLE', message: 'این پرسنل دیگر در این کسب‌وکار نیست.', field: 'employee' }],
          warnings
        }
      }
      if (employee.status !== 'active') {
        return {
          valid: false,
          errors: [{ code: 'EMPLOYEE_NOT_AVAILABLE', message: 'این پرسنل فعلاً پذیرش ندارد.', field: 'employee' }],
          warnings
        }
      }
      if (!employee.serviceIds.includes(request.serviceId)) {
        return {
          valid: false,
          errors: [{ code: 'EMPLOYEE_SERVICE_MISMATCH', message: 'این پرسنل این خدمت را ارائه نمی‌دهد.', field: 'employee' }],
          warnings
        }
      }
    }

    // قیمت لحظهٔ ثبت با قیمت امروز فرق کرده؟ → هشدار، نه خطا (کاربر تأیید می‌کند)
    if (service.price !== request.price) {
      warnings.push({ type: 'price_change', code: 'PRICE_CHANGED', message: 'قیمت این خدمت تغییر کرده است.' })
    }

    // مدت نوبت از خودِ start/end درمی‌آید؛ درخواست فیلد duration جدا نمی‌فرستد
    const startMs = new Date(request.start).getTime()
    const minutes = (new Date(request.end).getTime() - startMs) / 60_000
    if (!Number.isFinite(minutes) || Math.abs(minutes - service.durationMinutes) > 5) {
      errors.push({
        code: 'DURATION_MISMATCH',
        message: 'مدت زمان نوبت با مدت خدمت همخوانی ندارد.',
        field: 'timeSlot'
      })
      return { valid: false, errors, warnings }
    }

    // اشغال/پنجره/تعطیلی — تک‌منبع: موتور دسترس‌پذیری
    const conflict = this.conflictOf({
      businessId: request.businessId,
      serviceId: request.serviceId,
      employeeId: request.employeeId ?? null,
      start: request.start
    })
    if (conflict) {
      errors.push(conflict)
      return { valid: false, errors, warnings }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  /* ─────────────────────────── ساخت نوبت ─────────────────────────── */

  async create(request: CreateBookingRequest): Promise<CreateBookingResponse | CreateBookingErrorResponse> {
    const userId = this.userId
    await delay(600)

    if (!userId) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'ابتدا وارد حساب خود شوید.' }
      }
    }

    // اعتبارسنجی *همین لحظه*: «دکمه روشن بود» هیچ اعتباری ندارد — بک‌اند هم
    // دقیقاً همین را دوباره چک می‌کند (بند ۳۳).
    const validation = await this.validateDraft(request)
    if (!validation.valid) {
      const first = validation.errors[0]
      return {
        success: false,
        error: {
          code: this.mapErrorCode(first?.code),
          message: first?.message ?? 'ثبت نوبت ممکن نشد.'
        }
      }
    }

    // هشدار قیمت: تا کاربر قیمت تازه را تأیید نکرده، نوبتی ساخته نمی‌شود
    const priceWarning = validation.warnings.find(w => w.type === 'price_change')
    if (priceWarning) {
      const priced = resolveBusinessServices(request.businessId).find(s => s.id === request.serviceId)
      return {
        success: false,
        error: {
          code: 'PRICE_CHANGED',
          message: priceWarning.message,
          ...(priced ? { suggestedPrice: priced.price } : {})
        }
      }
    }

    const bookedService = resolveBusinessServices(request.businessId).find(s => s.id === request.serviceId)
    const bookedEmployee = request.employeeId
      ? this.employeeNameOf(request.businessId, request.employeeId)
      : null

    const booking: Booking = {
      id: `bok_${Date.now()}`,
      customerId: userId,
      businessId: request.businessId,
      serviceId: request.serviceId,
      ...(request.employeeId ? { employeeId: request.employeeId } : {}),
      start: request.start,
      end: request.end,
      status: 'pending',
      price: request.price,
      // اسنپ‌شات لحظهٔ ثبت: تغییر نام، تغییر مدت یا حذف سرویس در آینده این
      // رکورد را نمی‌شکند (قیمت از قبل در `price` اسنپ‌شات می‌شد).
      ...(bookedService
        ? { serviceSnapshot: { name: bookedService.name, durationMinutes: bookedService.durationMinutes } }
        : {}),
      // نام پرسنل هم در همان لحظهٔ ثبت قفل می‌شود (فاز ۱۰): تغییر نام،
      // غیرفعال‌کردن یا حذف او، متن این نوبت را عوض نمی‌کند.
      ...(bookedEmployee ? { employeeSnapshot: { name: bookedEmployee } } : {}),
      ...(request.notes ? { notes: request.notes } : {}),
      createdAt: new Date().toISOString()
    }

    // «ساعت گرفته شد» پیامدِ همین رکورد است (اشغال از نوبت‌ها خوانده می‌شود)،
    // پس فهرست موازی‌ای نگه نمی‌داریم.
    persistCreatedBooking(booking)

    return { success: true, bookingId: booking.id }
  }

  /* ─────────────────────────── لغو نوبت ─────────────────────────── */

  async cancel(request: CancelBookingRequest): Promise<CancelBookingResponse | CancelBookingErrorResponse> {
    const userId = this.userId
    await delay(500)

    if (!userId) {
      return { success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'ابتدا وارد حساب خود شوید.' } }
    }

    const booking = findMockBooking(request.bookingId)
    if (!booking || booking.customerId !== userId) {
      return { success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'این نوبت یافت نشد.' } }
    }

    // دلیلِ رد، از همان تابعی که UI به کاربر نشان می‌دهد (config/booking-policy)
    const block = bookingCancelBlock(booking)
    if (block) {
      const code = block === 'cancelled'
        ? 'ALREADY_CANCELLED' as const
        : block === 'status'
          ? 'PAST_BOOKING' as const
          : 'POLICY_VIOLATION' as const
      const message = block === 'cancelled'
        ? bookingCancelBlockLabel(block)
        // در دو حالت دیگر تماس با کسب‌وکار راه‌حل است، نه خطای کاربر
        : `${bookingCancelBlockLabel(block)} برای هماهنگی با کسب‌وکار تماس بگیرید.`
      return { success: false, error: { code, message } }
    }

    persistBookingPatch(booking.id, {
      status: 'cancelled',
      cancelledBy: 'customer',
      ...(request.reason ? { cancelReason: request.reason } : {})
    })

    return { success: true, message: 'نوبت با موفقیت لغو شد.' }
  }

  /* ─────────────────────────── جابه‌جایی نوبت ─────────────────────────── */

  async reschedule(
    request: RescheduleBookingRequest
  ): Promise<RescheduleBookingResponse | RescheduleBookingErrorResponse> {
    const userId = this.userId
    await delay(600)

    const booking = findMockBooking(request.bookingId)
    if (!booking || booking.customerId !== userId) {
      return { success: false, error: { code: 'BOOKING_NOT_FOUND', message: 'این نوبت یافت نشد.' } }
    }

    if (bookingRescheduleBlock(booking) !== null) {
      return { success: false, error: { code: 'NOT_RESCHEDULABLE', message: 'این نوبت قابل جابه‌جایی نیست.' } }
    }

    const newStartMs = new Date(request.newStart).getTime()
    if (!Number.isFinite(newStartMs) || newStartMs < Date.now()) {
      return { success: false, error: { code: 'TIME_IN_PAST', message: 'زمان انتخابی گذشته است.' } }
    }

    // جابه‌جایی نباید با *خودِ نوبت* به نتیجه برسد (excludeBookingId فاز ۱۱):
    // بردنِ نوبت به همان ساعتِ خودش خطا نیست.
    const conflict = this.conflictOf({
      businessId: booking.businessId,
      serviceId: booking.serviceId,
      employeeId: booking.employeeId ?? null,
      start: request.newStart,
      excludeBookingId: booking.id
    })
    if (conflict) {
      return { success: false, error: { code: this.mapRescheduleCode(conflict.code), message: conflict.message } }
    }

    // نوبت *در جای خودش* به‌روز می‌شود؛ هیچ‌گاه «لغو + ساختِ تازه» نیست، پس شناسه،
    // یادداشت‌ها و تاریخچه حفظ می‌شوند (بند ۳۴).
    persistBookingPatch(booking.id, { start: request.newStart, end: request.newEnd })

    const updated = findMockBooking(booking.id) ?? { ...booking, start: request.newStart, end: request.newEnd }
    return { success: true, booking: updated }
  }

  /* ─────────────────────────── ابزار توسعه ─────────────────────────── */

  async resetLocalChanges(): Promise<void> {
    await delay(150)
    clearMockBookingState()
  }

  /* ─────────────────────────── نگاشت کد خطا ─────────────────────────── */

  /** کدهای domain → کدهای قراردادی `create` (بک‌اند هم همین نگاشت را دارد). */
  private mapErrorCode(code?: string): CreateBookingErrorResponse['error']['code'] {
    switch (code) {
      case 'SLOT_UNAVAILABLE':
      case 'DAY_CLOSED':
      case 'OUT_OF_HOURS':
      case 'DATE_IN_PAST':
      case 'DURATION_MISMATCH':
      case 'EMPLOYEE_NOT_AVAILABLE':
      case 'EMPLOYEE_SERVICE_MISMATCH':
      case 'SERVICE_NOT_AVAILABLE':
        return 'SLOT_UNAVAILABLE'
      case 'PRICE_CHANGED':
        return 'PRICE_CHANGED'
      default:
        return 'VALIDATION_ERROR'
    }
  }

  /** نگاشت همان کدها به اتحادیهٔ خطای `reschedule` (قرارداد جدا، همان معنا). */
  private mapRescheduleCode(code?: string): RescheduleBookingErrorResponse['error']['code'] {
    switch (code) {
      case 'DATE_IN_PAST':
        return 'TIME_IN_PAST'
      case 'SLOT_UNAVAILABLE':
      case 'DAY_CLOSED':
      case 'OUT_OF_HOURS':
        return 'SLOT_UNAVAILABLE'
      default:
        return 'SERVER_ERROR'
    }
  }
}
