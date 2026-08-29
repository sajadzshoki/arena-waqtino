import type { EntityId } from '~/types/common'
import type {
  AvailabilityDay,
  AvailabilityInterval,
  AvailabilityQuery,
  DayAvailability,
  DayAvailabilityStatus,
  TimeSlot
} from '~/types/availability'
import { MOCK_BUSINESSES } from '~/services/mocks/businesses'
import { resolveBusinessSchedule, resolveEmployeeSchedule } from '~/services/mocks/availability-state'
import { resolveBusinessEmployees } from '~/services/mocks/employee-state'
import { resolveBusinessServices } from '~/services/mocks/service-state'
import { allMockBookings } from '~/services/mocks/bookings'
import { activeIntervals, intersectDays } from '~/utils/schedule'
import {
  dateKeyOf,
  instantOf,
  localTimeOf,
  minutesToTime,
  nowMinutes,
  timeToMinutes,
  todayKey,
  weekdayOf
} from '~/utils/schedule-time'
import { toFaDigits } from '~/utils/digits'
import { APP_TIMEZONE, DEFAULT_SLOT_STEP_MINUTES } from '~/config/timezone'

/**
 * موتور دسترس‌پذیری در حالت mock — «این روز، با این سرویس/پرسنل، چه پنجره‌ها و
 * چه اسلات‌هایی دارد؟» (فاز ۱۱)
 *
 * چرا یک فایل جدا و نه داخل `MockAvailabilityService`؟ دو مصرف‌کننده دارد:
 *   • سرویس خواندن مشتری: اسلات‌های پیشنهادی گام «ساعت» و نوار تاریخ؛
 *   • `MockBookingService.validateDraft`: دفاع دوم — یک پیش‌نویس کهنه یا یک
 *     درخواست مستقیم نباید نوبتی *بیرون از پنجرهٔ کاری* یا *روی نوبتِ دیگری*
 *     بسازد.
 * اگر این منطق دو بار نوشته شود، روزی یکی‌شان «تعطیل» را فرق تعبیر می‌کند.
 *
 * در حالت api این فایل کنار می‌رود: همان پرس‌وجو را سرور انجام می‌دهد.
 */

/**
 * پرس‌وجوی روز + یک افزوده برای جابه‌جایی نوبت: `excludeBookingId` باعث می‌شود
 * نوبتِ در حال حرکت، خودش را با خودش درگیر نبیند.
 */
export interface DayQuery extends AvailabilityQuery {
  excludeBookingId?: EntityId | null
}

export interface LiveBooking {
  start: number
  end: number
}

export interface DayContext {
  status: DayAvailabilityStatus
  message: string | null
  /** پنجرهٔ کاری *عملاً* معتبر همان روز (برنامهٔ نفر ∩ کسب‌وکار) */
  intervals: AvailabilityInterval[]
  durationMinutes: number
  bookings: LiveBooking[]
  isToday: boolean
  timezone: string
}

function minutesOf(iso: string, timezone: string): number {
  return timeToMinutes(localTimeOf(iso, timezone)) ?? 0
}

/** نوبت‌های زندهٔ همان روزِ همان منبع (کسب‌وکار، یا نفر انتخاب‌شده). */
export function bookingsOfDay(
  businessId: EntityId,
  dateKey: string,
  employeeId: EntityId | null,
  timezone = APP_TIMEZONE,
  excludeBookingId?: EntityId | null
): LiveBooking[] {
  return allMockBookings()
    .filter(b => b.businessId === businessId)
    // جابه‌جایی یک نوبت نباید خودش را با خودش درگیر ببیند
    .filter(b => !excludeBookingId || b.id !== excludeBookingId)
    .filter(b => b.status === 'pending' || b.status === 'confirmed')
    // هر نفر یک منبع مستقل است (مدل فاز ۱۰)؛ نوبت بدون پرسنل، نوبتِ خودِ
    // کسب‌وکار است و برای همه بسته محسوب می‌شود
    .filter(b => (employeeId ? (b.employeeId ?? null) === employeeId : !b.employeeId))
    .filter(b => dateKeyOf(b.start, timezone) === dateKey)
    .map(b => ({ start: minutesOf(b.start, timezone), end: minutesOf(b.end, timezone) }))
    .filter(b => b.end > b.start)
}

/** پنجرهٔ کاری معتبر یک روز، با محدودیت پرسنل ⊆ کسب‌وکار اعمال‌شده. */
export function dayContext(query: DayQuery): DayContext {
  const timezone = APP_TIMEZONE
  const base: DayContext = {
    status: 'available',
    message: null,
    intervals: [],
    durationMinutes: DEFAULT_SLOT_STEP_MINUTES,
    bookings: [],
    isToday: query.date === todayKey(timezone),
    timezone
  }

  const business = MOCK_BUSINESSES.find(b => b.id === query.businessId)
  if (!business) {
    return { ...base, status: 'unavailable', message: 'چنین کسب‌وکاری در وقتینو ثبت نشده است.' }
  }

  const businessDays = resolveBusinessSchedule(business.id).days
  if (!businessDays) {
    // «تنظیم‌نشده» محدودیت نیست، فقط پاسخِ نداشتنِ داده است — مصرف‌کننده‌ها
    // (`validateDraft`) همین را با `status` می‌فهمند
    return {
      ...base,
      status: 'not-configured',
      message: 'این کسب‌وکار هنوز ساعات کاری‌اش را تنظیم نکرده، برای همین ساعتی قابل انتخاب نیست.'
    }
  }

  const services = resolveBusinessServices(business.id)
  const service = query.serviceId ? services.find(s => s.id === query.serviceId) : undefined
  if (query.serviceId && !service) {
    return { ...base, status: 'unavailable', message: 'این سرویس در این کسب‌وکار پیدا نشد؛ ممکن است حذف شده باشد.' }
  }
  if (service && service.status !== 'active') {
    return { ...base, status: 'unavailable', message: 'این سرویس فعلاً غیرفعال است و برایش نوبت تازه ساخته نمی‌شود.' }
  }

  const employees = resolveBusinessEmployees(business.id)
  const employee = query.employeeId ? employees.find(e => e.id === query.employeeId) : undefined
  if (query.employeeId && !employee) {
    return { ...base, status: 'unavailable', message: 'این پرسنل دیگر در این کسب‌وکار تعریف نشده است.' }
  }
  if (employee && employee.status !== 'active') {
    return { ...base, status: 'unavailable', message: 'این نفر غیرفعال است؛ برای رزرو تازه قابل انتخاب نیست.' }
  }
  if (employee && service && !employee.serviceIds.includes(service.id)) {
    return { ...base, status: 'unavailable', message: 'این سرویس به این نفر اختصاص نیافته است.' }
  }

  // «مطابق کسب‌وکار» یعنی ردیف اختصاصی نداریم؛ «اختصاصی» یعنی اشتراک با کسب‌وکار
  let days: AvailabilityDay[] = businessDays
  if (employee) {
    const custom = resolveEmployeeSchedule(business.id, employee.id)
    if (custom?.source === 'custom' && custom.days) days = intersectDays(custom.days, businessDays)
  }

  const weekday = weekdayOf(query.date)
  const intervals = weekday ? activeIntervals(days, weekday) : []
  const durationMinutes = service?.durationMinutes ?? DEFAULT_SLOT_STEP_MINUTES

  if (intervals.length === 0) {
    // «تعطیل» را همین‌جا می‌سازیم نه در هر مصرف‌کننده: رزرو و صفحهٔ صاحب
    // کسب‌وکار باید همان چیزی را ببینند که کاربر. «نفر تعطیل کرده» و
    // «کسب‌وکار تعطیل است» دو وضعیت خوانا هستند.
    const businessOpen = weekday ? activeIntervals(businessDays, weekday).length > 0 : false
    return {
      ...base,
      status: 'closed',
      message: employee && businessOpen
        ? 'این نفر در این روز پذیرش ندارد؛ روز دیگری را انتخاب کنید.'
        : 'در این روز پذیرش نداریم؛ روزهای دیگر را ببینید.',
      intervals: [],
      durationMinutes,
      bookings: []
    }
  }

  return {
    ...base,
    intervals,
    durationMinutes,
    bookings: bookingsOfDay(business.id, query.date, employee?.id ?? null, timezone, query.excludeBookingId ?? null)
  }
}

export interface BuiltSlots {
  slots: TimeSlot[]
  /** اسلات‌های حذف‌شده چون «امروز، بعد از الان» نبودند */
  droppedPast: number
  /** هیچ اسلاتی به این مدت در بازه‌های آن روز جا نشد */
  noFit: boolean
}

/**
 * شبکهٔ اسلات: از ابتدای هر بازه، به اندازهٔ *مدت سرویس* جلو می‌رویم، تا جایی که
 * اسلات کامل در همان بازه جا شود. پس «سرویس ۶۰ دقیقه‌ای» روی ۰۹:۰۰ و ۱۰:۰۰
 * می‌نشیند و ۱۱:۳۰ هرگز ساخته نمی‌شود؛ و بازهٔ بعدی روز (بعد از ناهار) از نو
 * شروع می‌کند.
 */
export function buildSlots(
  intervals: AvailabilityInterval[],
  dateKey: string,
  durationMinutes: number,
  bookings: LiveBooking[],
  cutoffMinute: number | null,
  timezone = APP_TIMEZONE
): BuiltSlots {
  const slots: TimeSlot[] = []
  let droppedPast = 0
  let noFit = true

  for (const interval of intervals) {
    const from = timeToMinutes(interval.start) ?? 0
    const to = timeToMinutes(interval.end) ?? 0
    if (to - from >= durationMinutes) noFit = false
    for (let start = from; start + durationMinutes <= to; start += durationMinutes) {
      if (cutoffMinute !== null && start <= cutoffMinute) {
        droppedPast += 1
        continue
      }
      const end = start + durationMinutes
      const taken = bookings.some(b => start < b.end && b.start < end)
      slots.push({
        start: instantOf(dateKey, minutesToTime(start), timezone),
        end: instantOf(dateKey, minutesToTime(end), timezone),
        isAvailable: !taken
      })
    }
  }
  return { slots, droppedPast, noFit }
}

/** پاسخ کامل یک روز (اسلات‌ها + دلیل نبودِ اسلات) — مصرف‌کننده‌ها فیلتر نمی‌کنند. */
export function resolveDayAvailability(query: DayQuery): DayAvailability {
  const context = dayContext(query)

  if (context.status !== 'available') {
    return {
      date: query.date,
      status: context.status,
      slots: [],
      window: context.intervals,
      message: context.message
    }
  }
  const { slots, droppedPast, noFit } = buildSlots(
    context.intervals,
    query.date,
    context.durationMinutes,
    context.bookings,
    context.isToday ? nowMinutes(context.timezone) : null,
    context.timezone
  )
  const free = slots.filter(slot => slot.isAvailable)

  if (free.length === 0) {
    if (noFit) {
      return {
        date: query.date,
        status: 'fully-booked',
        slots: [],
        window: context.intervals,
        message: `در این روز بازه‌ای به مدت ${toFaDigits(context.durationMinutes)} دقیقه خالی نیست.`
      }
    }
    if (context.isToday && slots.length === 0 && droppedPast > 0) {
      return {
        date: query.date,
        status: 'past',
        slots: [],
        window: context.intervals,
        message: 'امروز دیگر وقت خالی نیست؛ ساعت‌های کاری گذشته است.'
      }
    }
    return {
      date: query.date,
      status: 'fully-booked',
      slots,
      window: context.intervals,
      message: 'همهٔ ساعت‌های این روز رزرو شده است.'
    }
  }

  return { date: query.date, status: 'available', slots, window: context.intervals, message: null }
}

/** آیا `start`–`end` (دقیقهٔ محلی) کامل داخل یکی از پنجره‌هاست؟ */
export function withinWindows(
  windows: AvailabilityInterval[],
  start: number,
  end: number,
  bookings: LiveBooking[]
): { fits: boolean; overlapsBooking: boolean } {
  const fits = windows.some((window) => {
    const from = timeToMinutes(window.start) ?? 0
    const to = timeToMinutes(window.end) ?? 0
    return from <= start && end <= to
  })
  const overlapsBooking = bookings.some(b => start < b.end && b.start < end)
  return { fits, overlapsBooking }
}
