/**
 * اعتبارسنجی متمرکز فرم‌ها — تنها نقطهٔ تعریف قواعد.
 *
 * قانون: هیچ قاعده‌ای داخل template یا داخل یک صفحه تکرار نمی‌شود؛
 * صفحه‌ها فقط نتیجه را نمایش می‌دهند و لایهٔ سرویس (mock/آیندهٔ api) هم
 * همین توابع را برای «دفاع دوم» صدا می‌زند — پس قواعد front/back یکسان‌اند.
 * پیام‌ها فارسی، انسانی و عمل‌گرا هستند ( کاربر بداند دقیقاً چه درست کند ).
 */

import { AVAILABILITY_POLICY, WEEKDAY_ORDER, weekdayLabel } from '~/config/availability'
import { activeIntervals, containsInterval, intervalsOverlap } from '~/utils/schedule'
import { formatIntervalFa, minutesToTime, timeToMinutes } from '~/utils/schedule-time'
import type { AvailabilityDay, AvailabilityInterval, Weekday } from '~/types/availability'

export const PROFILE_NAME_MIN = 2
export const PROFILE_NAME_MAX = 24

/** حروف فارسی/عربی/لاتین، فاصله و نیم‌فاصله — عدد و نماد در نام مجاز نیست. */
const NAME_ALLOWED_RE = /^[\p{L}\p{M}\s\u200c]+$/u
const CONTAINS_DIGIT_RE = /\p{N}/u

/** نرمال‌سازی ورودی نام: یکدست‌سازی فاصله‌ها + حذف فاصله‌های اضافه. */
export function normalizeName(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '')
}

/**
 * بررسی یک «جزء نام» (نام / نام خانوادگی).
 * پیام خطا را برمی‌گرداند یا `null` وقتی مقدار معتبر است.
 */
export function validateNamePart(value: string, label: string): string | null {
  const trimmed = value.trim()
  // ورودی فقط-فاصله عملاً «خالی» است؛ پیام یکی‌شده تا قاعدهٔ مرده نماند
  if (trimmed.length === 0) return `${label} را وارد کنید.`
  if (CONTAINS_DIGIT_RE.test(trimmed)) return `${label} نمی‌تواند عدد داشته باشد.`
  if (!NAME_ALLOWED_RE.test(trimmed)) {
    return `${label} فقط می‌تواند حرف باشد؛ از نماد استفاده نکنید.`
  }
  if ([...normalizeName(trimmed)].length < PROFILE_NAME_MIN) {
    return `${label} باید دست‌کم ${toFaDigits(PROFILE_NAME_MIN)} حرف باشد.`
  }
  if ([...normalizeName(trimmed)].length > PROFILE_NAME_MAX) {
    return `${label} نباید بیشتر از ${toFaDigits(PROFILE_NAME_MAX)} حرف باشد.`
  }
  return null
}

export interface ProfileFormInput {
  firstName: string
  lastName: string
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormInput, string>>

/** اعتبارسنجی کامل فرم پروفایل — هم برای UI (هر قلم) هم برای سرویس. */
export function validateProfileForm(input: ProfileFormInput): {
  valid: boolean
  errors: ProfileFormErrors
} {
  const errors: ProfileFormErrors = {}
  const firstName = validateNamePart(input.firstName, 'نام')
  if (firstName) errors.firstName = firstName
  const lastName = validateNamePart(input.lastName, 'نام خانوادگی')
  if (lastName) errors.lastName = lastName
  return { valid: Object.keys(errors).length === 0, errors }
}

/** نام کامل نمایشی — بدون «undefined» و با مدیریت جای خالی. */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const parts = [firstName, lastName].map(p => normalizeName(p ?? '')).filter(Boolean)
  return parts.join(' ')
}

/** آیا کاربر هنوز هویتش را کامل نکرده؟ (برای راهنمایی «تکمیل پروفایل») */
export function isProfileIncomplete(user?: { firstName?: string | null, lastName?: string | null } | null): boolean {
  if (!user) return true
  return validateProfileForm({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? ''
  }).valid === false
}

// ─────────────────────────── سرویس کسب‌وکار (فاز ۹) ───────────────────────────

export const SERVICE_NAME_MIN = 3
export const SERVICE_NAME_MAX = 60
export const SERVICE_DESCRIPTION_MAX = 200
export const SERVICE_DURATION_MIN = 5
export const SERVICE_DURATION_MAX = 480
export const SERVICE_PRICE_MIN = 1_000
export const SERVICE_PRICE_MAX = 50_000_000

/**
 * نام سرویس بر خلاف نام شخص: عدد و پرانتز هم دارد («رنگ ۳ مرحله‌ای»،
 * «نظافت اساسی (Deep Clean)») — ولی نمادهای بی‌ربط و رشتهٔ فقط-فاصله نه.
 */
const SERVICE_NAME_ALLOWED_RE = /^[\p{L}\p{M}\p{N}\s\u200c().,/+-]+$/u

export interface ServiceFormInput {
  name: string
  description: string
  /** رشتهٔ خام ورودی — تا «خالی» و «عدد نیست» پیام جدا داشته باشند */
  duration: string
  price: string
  status: ServiceStatus
}

export type ServiceFormErrors = Partial<
  Record<'name' | 'description' | 'duration' | 'price' | 'status', string>
>

export function validateServiceName(value: string): string | null {
  const trimmed = normalizeName(value)
  if (trimmed.length === 0) return 'نام سرویس را وارد کنید.'
  const length = [...trimmed].length
  if (length < SERVICE_NAME_MIN) {
    return `نام سرویس باید دست‌کم ${toFaDigits(SERVICE_NAME_MIN)} حرف باشد.`
  }
  if (length > SERVICE_NAME_MAX) {
    return `نام سرویس نباید بیشتر از ${toFaDigits(SERVICE_NAME_MAX)} حرف باشد.`
  }
  if (!SERVICE_NAME_ALLOWED_RE.test(trimmed)) {
    return 'نام سرویس فقط می‌تواند حرف، عدد یا نشانه‌های ( ) / - باشد.'
  }
  return null
}

export function validateServiceDescription(value: string): string | null {
  const trimmed = normalizeName(value)
  if (trimmed.length === 0) return null
  if ([...trimmed].length > SERVICE_DESCRIPTION_MAX) {
    return `توضیح نباید بیشتر از ${toFaDigits(SERVICE_DESCRIPTION_MAX)} حرف باشد.`
  }
  return null
}

/** بازهٔ دقیقه‌ای مدت سرویس (ورودی خام کاربر؛ جداکننده/ارقام فارسی قبول می‌شود). */
export function validateServiceDuration(raw: string): string | null {
  const value = parseFaNumber(raw)
  if (value === null) {
    return raw.trim().length === 0
      ? 'مدت سرویس را وارد کنید؛ مثلاً ۴۵ دقیقه.'
      : 'مدت سرویس فقط عدد است؛ واحد («دقیقه») را لازم نیست بنویسید.'
  }
  if (value < SERVICE_DURATION_MIN) {
    return `کوتاه‌ترین سرویس ${toFaDigits(SERVICE_DURATION_MIN)} دقیقه است.`
  }
  if (value > SERVICE_DURATION_MAX) {
    return `مدت سرویس نباید بیشتر از ${toFaDigits(SERVICE_DURATION_MAX)} دقیقه (یک شیفت کامل) باشد.`
  }
  return null
}

/**
 * قیمت به تومان. صفر و مبالغ کوچک‌تر از ۱٬۰۰۰ عمداً رد می‌شوند: «سرویس رایگان»
 * هنوز در مدل کسب‌وکار وقتینو تعریف نشده و قیمتِ تقریباً صفر بیشتر تایپو است.
 */
export function validateServicePrice(raw: string): string | null {
  const value = parseFaNumber(raw)
  if (value === null) {
    return raw.trim().length === 0
      ? 'قیمت سرویس را وارد کنید.'
      : 'قیمت فقط عدد است؛ «تومان» و جداکننده‌ها را لازم نیست بنویسید.'
  }
  if (value < SERVICE_PRICE_MIN) {
    return `قیمت باید دست‌کم ${toFaDigits(SERVICE_PRICE_MIN.toLocaleString('en-US'))} تومان باشد.`
  }
  if (value > SERVICE_PRICE_MAX) {
    return `قیمت نباید بیشتر از ${toFaDigits(SERVICE_PRICE_MAX.toLocaleString('en-US'))} تومان باشد.`
  }
  return null
}

/** اعتبارسنجی کامل فرم سرویس + ساخت ورودی نرمال‌شدهٔ ذخیره‌سازی. */
export function validateServiceForm(input: ServiceFormInput): {
  valid: boolean
  errors: ServiceFormErrors
  /** وقتی `valid` است، مقدار آمادهٔ ذخیره (عددهای نرمال‌شده، متن‌ها trim‌شده) */
  value: ServiceInput | null
} {
  const errors: ServiceFormErrors = {}
  const name = validateServiceName(input.name)
  if (name) errors.name = name
  const description = validateServiceDescription(input.description)
  if (description) errors.description = description
  const duration = validateServiceDuration(input.duration)
  if (duration) errors.duration = duration
  const price = validateServicePrice(input.price)
  if (price) errors.price = price
  const valid = Object.keys(errors).length === 0
  if (!valid) return { valid: false, errors, value: null }
  return {
    valid: true,
    errors: {},
    value: {
      name: normalizeName(input.name),
      description: normalizeName(input.description),
      durationMinutes: parseFaNumber(input.duration) as number,
      price: parseFaNumber(input.price) as number,
      status: input.status
    }
  }
}

/**
 * دفاع دوم: همان قاعده‌ها روی مقدار نرمال‌شده — لایهٔ سرویس (آینهٔ اعتبارسنجی
 * سرور) قبل از نوشتن صدا می‌زند تا یک کلاینت بد، دادهٔ نامعتبر نسازد.
 * پیام فارسی برمی‌گرداند یا `null`.
 */
export function serviceInputError(input: ServiceInput): string | null {
  const name = validateServiceName(input.name)
  if (name) return name
  const description = validateServiceDescription(input.description)
  if (description) return description
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < SERVICE_DURATION_MIN || input.durationMinutes > SERVICE_DURATION_MAX) {
    return `مدت سرویس باید عددی بین ${toFaDigits(SERVICE_DURATION_MIN)} تا ${toFaDigits(SERVICE_DURATION_MAX)} دقیقه باشد.`
  }
  if (!Number.isInteger(input.price) || input.price < SERVICE_PRICE_MIN || input.price > SERVICE_PRICE_MAX) {
    return `قیمت باید عددی بین ${toFaDigits(SERVICE_PRICE_MIN.toLocaleString('en-US'))} تا ${toFaDigits(SERVICE_PRICE_MAX.toLocaleString('en-US'))} تومان باشد.`
  }
  if (input.status !== 'active' && input.status !== 'inactive') {
    return 'وضعیت سرویس نامعتبر است.'
  }
  return null
}

// ─────────────────────────── پرسنل کسب‌وکار (فاز ۱۰) ───────────────────────────

export const EMPLOYEE_TITLE_MAX = 40
/** عنوان شغلی هم مثل نام سرویس: رقم و پرانتز دارد («متخصص ۲ (عمومی)»). */
const EMPLOYEE_TITLE_ALLOWED_RE = /^[\p{L}\p{M}\p{N}\s\u200c().,/+-]+$/u

export interface EmployeeFormInput {
  firstName: string
  lastName: string
  title: string
  /** رشتهٔ خام ورودی (ارقام فارسی هم می‌آید) — نرمال‌سازی با normalizeDigits */
  phone: string
  avatarUrl: string | null
  status: EmployeeStatus
  serviceIds: EntityId[]
}

export type EmployeeFormErrors = Partial<
  Record<'firstName' | 'lastName' | 'title' | 'phone' | 'status', string>
>

export function validateEmployeeTitle(value: string): string | null {
  const trimmed = normalizeName(value)
  if (trimmed.length === 0) return null
  if ([...trimmed].length > EMPLOYEE_TITLE_MAX) {
    return `عنوان شغلی نباید بیشتر از ${toFaDigits(EMPLOYEE_TITLE_MAX)} حرف باشد.`
  }
  if (!EMPLOYEE_TITLE_ALLOWED_RE.test(trimmed)) {
    return 'عنوان شغلی فقط می‌تواند حرف، عدد یا نشانه‌های ( ) / - باشد.'
  }
  return null
}

/**
 * شمارهٔ موبایل *اختیاری* است و هیچوقت معنی «حساب کاربری» نمی‌دهد: پرسنل می‌تواند
 * شماره داشته باشد و حساب وقتینو نداشته باشد (و برعکس). ورودی آزاد است تا پیام
 * «نقص عدد» و «شمارهٔ ایران نیست» جدا بمانند.
 */
export function validateEmployeePhone(value: string): string | null {
  const digits = normalizeDigits(value ?? '').replace(/\D/g, '')
  if (digits.length === 0) return null
  if (isValidIranianMobile(digits)) return null
  return 'شمارهٔ موبایل باید ۱۱ رقم و با ۰۹ شروع شود؛ مثل ۰۹۱۲۳۴۵۶۷۸۹.'
}

/** اعتبارسنجی کامل فرم پرسنل + ساخت ورودی نرمال‌شدهٔ ذخیره‌سازی. */
export function validateEmployeeForm(input: EmployeeFormInput): {
  valid: boolean
  errors: EmployeeFormErrors
  /** وقتی `valid` است، مقدار آمادهٔ ذخیره (متن‌ها trim، شمارهٔ ASCII، سرویس‌ها یکتا) */
  value: EmployeeInput | null
} {
  const errors: EmployeeFormErrors = {}
  const firstName = validateNamePart(input.firstName, 'نام')
  if (firstName) errors.firstName = firstName
  const lastName = validateNamePart(input.lastName, 'نام خانوادگی')
  if (lastName) errors.lastName = lastName
  const title = validateEmployeeTitle(input.title)
  if (title) errors.title = title
  const phone = validateEmployeePhone(input.phone)
  if (phone) errors.phone = phone
  if (input.status !== 'active' && input.status !== 'inactive') {
    errors.status = 'وضعیت پرسنل را انتخاب کنید.'
  }
  const valid = Object.keys(errors).length === 0
  if (!valid) return { valid: false, errors, value: null }

  const digits = normalizeDigits(input.phone ?? '').replace(/\D/g, '')
  const serviceIds = [...new Set(input.serviceIds)]
  return {
    valid: true,
    errors: {},
    value: {
      firstName: normalizeName(input.firstName),
      lastName: normalizeName(input.lastName),
      title: normalizeName(input.title),
      phone: digits || '',
      avatarUrl: input.avatarUrl?.trim() ? input.avatarUrl.trim() : null,
      status: input.status,
      serviceIds
    }
  }
}

/**
 * دفاع دوم: همان قاعده‌ها روی مقدار نرمال‌شده — لایهٔ سرویس (آینهٔ اعتبارسنجی
 * سرور) قبل از نوشتن صدا می‌زند تا یک کلاینت بد، دادهٔ نامعتبر نسازد.
 * «سرویس‌ها باید مال همین کسب‌وکار باشند» اینجا بررسی نمی‌شود؛ آن رابطه را فقط
 * مخزن می‌داند و در `MockEmployeeManagementService` بررسی می‌شود.
 */
export function employeeInputError(input: EmployeeInput): string | null {
  const firstName = validateNamePart(input.firstName, 'نام')
  if (firstName) return firstName
  const lastName = validateNamePart(input.lastName, 'نام خانوادگی')
  if (lastName) return lastName
  const title = validateEmployeeTitle(input.title ?? '')
  if (title) return title
  const phone = validateEmployeePhone(input.phone ?? '')
  if (phone) return phone
  if (input.status !== 'active' && input.status !== 'inactive') {
    return 'وضعیت پرسنل نامعتبر است.'
  }
  if (!Array.isArray(input.serviceIds) || input.serviceIds.some(id => typeof id !== 'string' || id.length === 0)) {
    return 'فهرست سرویس‌های اختصاص‌یافته نامعتبر است.'
  }
  return null
}


/* ─────────────────────────── ساعات کاری (فاز ۱۱) ─────────────────────────── */

/**
 * قاعدهٔ واحد «برنامهٔ هفتگی معتبر است؟» — همان چیزی که فرم برای نمایش خطا و
 * لایهٔ سرویس برای «دفاع دوم» صدا می‌زنند. دو پیامدش عمداً یکی است:
 *   • هیچ روزی با `enabled: true` و بدون بازهٔ معتبر ذخیره نمی‌شود؛
 *   • هیچ بازه‌ای با `start >= end` یا هم‌پوشانی ذخیره نمی‌شود.
 *
 * دو تصمیم سیاستی که در همین‌جا متمرکزاند (نه در کامپوننت):
 *   ۱) بازهٔ شبانه («۱۸:۰۰ تا ۰۹:۰۰») *رد* می‌شود، نه بی‌صدا وارونه‌سازی؛
 *      اگر واقعاً شیفت شب لازم شد، فاز خودش باید تصمیم بگیرد.
 *   ۲) روز تعطیل، بازه‌هایش را نگه می‌دارد؛ پس اعتبارسنجی فقط روزهای
 *      *روشن* را باز می‌کند و بقیه را دست نمی‌زند.
 */
export interface ScheduleValidation {
  ok: boolean
  /** پیام کلی برای بالای فرم (نخستین خطای دیدنی) */
  message: string | null
  dayErrors: Partial<Record<Weekday, string>>
  intervalErrors: Partial<Record<`${Weekday}:${number}`, string>>
  /** برنامهٔ نرمال‌شده: ۷ روز، مرتب، ساعت‌های `HH:mm` — همان چیزی که ذخیره می‌شود */
  days: AvailabilityDay[]
}

const NO_ERRORS: ScheduleValidation['intervalErrors'] = {}

export function validateSchedule(
  days: AvailabilityDay[],
  policy: { maxIntervalsPerDay?: number, minIntervalMinutes?: number } = {}
): ScheduleValidation {
  const maxIntervals = policy.maxIntervalsPerDay ?? AVAILABILITY_POLICY.maxIntervalsPerDay
  const minMinutes = policy.minIntervalMinutes ?? AVAILABILITY_POLICY.minIntervalMinutes
  const dayErrors: Record<string, string> = {}
  const intervalErrors: Record<string, string> = {}

  const byWeekday = new Map<Weekday, AvailabilityDay>()
  const unknown: string[] = []
  for (const day of days) {
    if (!WEEKDAY_ORDER.includes(day.weekday)) {
      unknown.push(String(day.weekday))
      continue
    }
    if (byWeekday.has(day.weekday)) {
      dayErrors[day.weekday] = `«${weekdayLabel(day.weekday)}» دوباره آمده؛ هر روز یک بار کافی است.`
      continue
    }
    byWeekday.set(day.weekday, day)
  }

  const normalized: AvailabilityDay[] = WEEKDAY_ORDER.map((weekday) => {
    const day = byWeekday.get(weekday)
    if (!day) return { weekday, enabled: false, intervals: [] }
    if (!day.enabled) return { weekday, enabled: false, intervals: [...day.intervals] }

    const intervals: AvailabilityInterval[] = []
    for (const interval of day.intervals) {
      const start = timeToMinutes(interval?.start)
      const end = timeToMinutes(interval?.end)
      const key = `${weekday}:${intervals.length}`
      if (start === null || end === null) {
        intervalErrors[key] = `ساعت «${weekdayLabel(weekday)}» قابل خواندن نیست؛ نمونهٔ درست: ۰۹:۳۰`
        intervals.push({ start: String(interval?.start ?? ''), end: String(interval?.end ?? '') })
        continue
      }
      if (start >= end) {
        intervalErrors[key] = `${weekdayLabel(weekday)}: ساعت پایان باید بعد از ساعت شروع باشد.`
        dayErrors[weekday] ??= `بازهٔ «${formatIntervalFa(interval)}» نامعتبر است.`
        intervals.push({ start: minutesToTime(start), end: minutesToTime(end) })
        continue
      }
      if (end - start < minMinutes) {
        intervalErrors[key] = `هر بازه باید دست‌کم ${toFaDigits(minMinutes)} دقیقه باشد.`
        dayErrors[weekday] ??= `بازهٔ «${weekdayLabel(weekday)}» خیلی کوتاه است.`
        intervals.push({ start: minutesToTime(start), end: minutesToTime(end) })
        continue
      }
      const overlaps = intervals.some(other => intervalsOverlap(other, { start: minutesToTime(start), end: minutesToTime(end) }))
      if (overlaps) {
        intervalErrors[key] = `این بازه با بازهٔ دیگرِ ${weekdayLabel(weekday)} هم‌پوشانی دارد.`
        dayErrors[weekday] ??= `ساعت‌های ${weekdayLabel(weekday)} هم‌پوشانی دارند.`
      }
      intervals.push({ start: minutesToTime(start), end: minutesToTime(end) })
    }

    if (intervals.length === 0) {
      dayErrors[weekday] = `${weekdayLabel(weekday)} روشن است ولی ساعتی ندارد؛ یک بازه اضافه کنید یا روز را تعطیل کنید.`
    }
    else if (intervals.length > maxIntervals) {
      dayErrors[weekday] = `در ${weekdayLabel(weekday)} بیشتر از ${toFaDigits(maxIntervals)} بازه نمی‌توان داشت.`
    }
    return {
      weekday,
      enabled: true,
      intervals: [...intervals].sort((a, b) => (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0))
    }
  })

  if (unknown.length > 0) {
    return {
      ok: false,
      message: `روزهای ناشناخته: ${unknown.join('، ')}`,
      dayErrors,
      intervalErrors,
      days: normalized
    }
  }

  const firstDay = WEEKDAY_ORDER.find(w => dayErrors[w])
  const message = firstDay
    ? dayErrors[firstDay]!
    : Object.values(intervalErrors)[0] ?? null

  return {
    ok: message === null,
    message,
    dayErrors,
    intervalErrors: message === null ? NO_ERRORS : intervalErrors,
    days: normalized
  }
}

/**
 * قاعدهٔ «برنامهٔ پرسنل داخل ساعات کسب‌وکار است» (فاز ۱۱):
 * مقایسه با *بازه‌های واقعی* همان روز است، نه با «نخستین باز شدن و آخرین
 * بستن» — پس «۱۲ تا ۱۴ تعطیل» وسط روز هم معنا دارد. روزی که کسب‌وکار در آن
 * تعطیل است، هیچ بازه‌ای برای نفر پذیرفته نیست.
 */
export function employeeScheduleConflictDays(
  employeeDays: AvailabilityDay[],
  businessDays: AvailabilityDay[] | null
): Weekday[] {
  if (!businessDays) return []
  return WEEKDAY_ORDER.filter((weekday) => {
    const biz = activeIntervals(businessDays, weekday)
    const emp = activeIntervals(employeeDays, weekday)
    if (emp.length === 0) return false
    if (biz.length === 0) return true
    return emp.some(interval => !biz.some(outer => containsInterval(outer, interval)))
  })
}

export function employeeScheduleConflictMessage(
  employeeDays: AvailabilityDay[],
  businessDays: AvailabilityDay[] | null
): string | null {
  const days = employeeScheduleConflictDays(employeeDays, businessDays)
  if (days.length === 0) return null
  const closed = days.filter(w => activeIntervals(businessDays ?? [], w).length === 0)
  const parts: string[] = []
  if (closed.length > 0) {
    parts.push(`${listFa(closed.map(weekdayLabel))} در ساعات کسب‌وکار تعطیل است`)
  }
  const outside = days.filter(w => !closed.includes(w))
  if (outside.length > 0) {
    parts.push(`ساعت ${listFa(outside.map(weekdayLabel))} بیرون از بازهٔ کاری کسب‌وکار است`)
  }
  return `${parts.join(' و ')}. برنامهٔ پرسنل نمی‌تواند گسترهٔ پذیرش کسب‌وکار را باز کند.`
}

/** «شنبه، یک‌شنبه و جمعه» — فهرست فارسیِ روزها برای پیام‌های خطا */
function listFa(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return `«${items[0]}»`
  return `${items.slice(0, -1).map(i => `«${i}»`).join('، ')} و «${items[items.length - 1]}»`
}

