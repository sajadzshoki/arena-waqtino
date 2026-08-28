import { APP_TIMEZONE } from '~/config/timezone'
import { WEEKDAY_ORDER } from '~/config/availability'
import { toFaDigits } from '~/utils/digits'
import type { AvailabilityInterval, Weekday } from '~/types/availability'

/**
 * ریاضی زمان دسترس‌پذیری — تنها جایی که «روز», «ساعت» و «وقت کسب‌وکار» به هم
 * وصل می‌شوند (فاز ۱۱).
 *
 * چرا این‌ها در `utils/datetime.ts` نیست؟ چون آن فایل برای *نمایش* عمومی است و
 * با `Date` محلی مرورگر کار می‌کند. دسترس‌پذیری برعکس است: مبنای «امروز» و
 * «گذشته» باید وقت کسب‌وکار باشد، وگرنه یک مشتری در تورنتو دقیقاً جمعه را
 * پنجشنبه می‌بیند. پس هر تبدیلِ روز/ساعت از همین فایل می‌گذرد و هیچ
 * کامپوننتی `getDay()` یا `toISOString()` برای این کار نمی‌نویسد.
 *
 * قراردادها:
 *   • «تاریخ» کلید محلی `YYYY-MM-DD` است (روزِ تقویمی کسب‌وکار، بدون zone).
 *   • «ساعت» رشتهٔ `HH:mm` دوازده‌وعشیرهٔ بی‌قلم است (`14:00`، نه «۲ بعدازظهر»).
 *   • «لحظه» ISO کامل است؛ تبدیل کلید+ساعت به لحظه فقط با `instantOf` انجام می‌شود.
 */

const weekdayByJsDay: readonly Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

/** `en-US` با `timeZone` — برای خواندن اجزای تقویمی یک لحظه در وقت مقصد. */
function partsIn(timezone: string, instant: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const raw: Record<string, string> = {}
  for (const p of fmt.formatToParts(instant)) {
    if (p.type !== 'literal') raw[p.type] = p.value
  }
  return {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    hour: Number(raw.hour) % 24,
    minute: Number(raw.minute),
    second: Number(raw.second)
  }
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** کلید روزِ تقویمی یک لحظه در وقت کسب‌وکار. */
export function dateKeyOf(instant: Date | string = new Date(), timezone = APP_TIMEZONE): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant
  const p = partsIn(timezone, d)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`
}

export function todayKey(timezone = APP_TIMEZONE, now: Date = new Date()): string {
  return dateKeyOf(now, timezone)
}

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = DATE_KEY_RE.exec(value)
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  // «۳۰ بهمن» الگوی regex را رد می‌کند ولی تاریخ نیست — پس برگشت می‌زنیم
  const probe = new Date(Date.UTC(year, month - 1, day))
  return probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
}

function daysFromCivil(dateKey: string): number | null {
  const m = DATE_KEY_RE.exec(dateKey)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  // الگوریتم Howard Hinnant (days_from_civil) — بی‌نیاز از `Date` و zone
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const doy = Math.floor((153 * (mo + (mo > 2 ? -3 : 9)) + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** جمع/تفریق روز روی کلید تقویمی (با Jalaali نیست؛ با خودِ روزهای میلادی). */
export function addDays(dateKey: string, delta: number): string {
  const ms = Date.parse(`${dateKey}T12:00:00Z`)
  if (Number.isNaN(ms)) return dateKey
  return new Date(ms + delta * 86_400_000).toISOString().slice(0, 10)
}

export function isTomorrowKey(dateKey: string, timezone = APP_TIMEZONE, now: Date = new Date()): boolean {
  return dateKey === addDays(todayKey(timezone, now), 1)
}

/** روزِ هفتهٔ یک کلید تقویمی — مستقل از zone، چون خودِ تاریخ کامل است. */
export function weekdayOf(dateKey: string): Weekday | null {
  const days = daysFromCivil(dateKey)
  if (days === null) return null
  // 1970-01-01 (روز صفر) پنجشنبه بود
  const jsDay = ((days + 4) % 7 + 7) % 7
  return weekdayByJsDay[jsDay] ?? null
}

/** چند «شنبه تا جمعه» از ابتدای هفتهٔ فارسی؟ (۰ = شنبه) */
export function weekdayIndex(weekday: Weekday): number {
  return WEEKDAY_ORDER.indexOf(weekday)
}

/** N روز آینده از امروز (شامل خودِ امروز) — برای نوار تاریخ رزرو. */
export function upcomingDateKeys(count: number, timezone = APP_TIMEZONE, now: Date = new Date()): string[] {
  const start = todayKey(timezone, now)
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(start, i))
}

/* ─────────────────────────── ساعت: رشته ↔ دقیقه ─────────────────────────── */

/** ارقام فارسی/عربی → لاتین، و بعد فقط ارقام */
export function digitsOnly(value: string): string {
  return value
    .replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)))
    .replace(/[٠-٩]/g, ch => String('٠١٢٣٤٥٦٧٨٩'.indexOf(ch)))
    .replace(/\D/g, '')
}

/** `14:05` → ۸۴۵. ورودی نامعتبر/null → `null`. «۹:۳۰»، «9.30» و «۹۳۰» هم پذیرفته می‌شوند. */
export function timeToMinutes(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const m = Math.round(value)
    return m >= 0 && m < 1440 ? m : null
  }
  if (typeof value !== 'string') return null
  const raw = digitsOnly(value)
  if (raw.length === 0 || raw.length > 4) return null
  // دو رقم = فقط ساعت؛ سه/چهار رقم = ساعت + دقیقه («۹۳۰» = ۰۹:۳۰، «۱۴۰۵» = ۱۴:۰۵)
  const hh = raw.length <= 2 ? Number(raw) : Number(raw.slice(0, raw.length - 2))
  const mm = raw.length <= 2 ? 0 : Number(raw.slice(-2))
  if (hh > 23 || mm > 59) return null
  return hh * 60 + mm
}

/** ۸۴۵ → `14:05` (ساعت ۲۴، صفرگذاشته). */
export function minutesToTime(minutes: number): string {
  if (!Number.isFinite(minutes)) return ''
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
}

/** نرمال‌سازی ورودی کاربر به `HH:mm`؛ `null` یعنی «این را نفهمیدیم». */
export function normalizeTime(value: unknown): string | null {
  const minutes = timeToMinutes(value)
  return minutes === null ? null : minutesToTime(minutes)
}

export function formatTimeFa(value: unknown, options: { digits?: 'fa' | 'latin' } = {}): string {
  const time = normalizeTime(value)
  if (!time) return ''
  return options.digits === 'latin' ? time : toFaDigits(time)
}

/** «۰۹:۰۰ — ۱۸:۰۰» — رشتهٔ آمادهٔ نمایش از همان مقدار دامنه. */
export function formatIntervalFa(interval: AvailabilityInterval, separator = ' — '): string {
  const start = formatTimeFa(interval.start)
  const end = formatTimeFa(interval.end)
  return start && end ? `${start}${separator}${end}` : ''
}

export function intervalMinutes(interval: AvailabilityInterval): number {
  const start = timeToMinutes(interval.start)
  const end = timeToMinutes(interval.end)
  if (start === null || end === null) return 0
  return Math.max(0, end - start)
}

/* ─────────────────────────── لحظهٔ واقعی (برای اسلات) ─────────────────────────── */

/** فاصلهٔ وقت مقصد از UTC، در همان لحظه (دقیق تا دقیقه). */
function offsetMs(instant: Date, timezone: string): number {
  const p = partsIn(timezone, instant)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60_000) * 60_000
}

/**
 * `YYYY-MM-DD` + `HH:mm` + وقت مقصد → لحظهٔ ISO.
 * یک‌بار تخمین، یک‌بار تصحیح (برای zoneهای با DST هم همگرا می‌شود).
 */
export function instantOf(dateKey: string, time: string, timezone = APP_TIMEZONE): string {
  const minutes = timeToMinutes(time) ?? 0
  const wall = Date.parse(`${dateKey}T${minutesToTime(minutes)}:00Z`)
  if (Number.isNaN(wall)) return ''
  let t = wall - offsetMs(new Date(wall), timezone)
  t = wall - offsetMs(new Date(t), timezone)
  return new Date(t).toISOString()
}

/** ساعت محلی (`HH:mm`) یک لحظه در وقت مقصد. */
export function localTimeOf(instant: Date | string, timezone = APP_TIMEZONE): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant
  const p = partsIn(timezone, d)
  return `${pad2(p.hour)}:${pad2(p.minute)}`
}

/** دقیقهٔ امروز در وقت کسب‌وکار (برای حذف اسلات‌های گذشته). */
export function nowMinutes(timezone = APP_TIMEZONE, now: Date = new Date()): number {
  const p = partsIn(timezone, now)
  return p.hour * 60 + p.minute
}

/* ─────────────────────────── برچسب فارسیِ روز ─────────────────────────── */

function faFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: APP_TIMEZONE, ...options })
}

const faWeekdayFmt = faFormatter({ weekday: 'long' })
const faDayMonthFmt = faFormatter({ day: 'numeric', month: 'long' })
const faDateFmt = faFormatter({ weekday: 'long', day: 'numeric', month: 'long' })

/**
 * کلید روز → «پنجشنبه ۱۵ شهریور».
 * از «نیمروز UTC» استفاده می‌کنیم تا هیچ zone میزبانی روز را یکی جابه‌جا نکند.
 */
export function formatDateKey(dateKey: string, mode: 'weekday' | 'short' | 'full' = 'full'): string {
  if (!isDateKey(dateKey)) return dateKey
  const instant = new Date(Date.parse(`${dateKey}T12:00:00Z`))
  if (mode === 'weekday') return faWeekdayFmt.format(instant)
  if (mode === 'short') return faDayMonthFmt.format(instant)
  return faDateFmt.format(instant)
}

/** «امروز» / «فردا» / نام روز — همان چیزی که نوار تاریخ لازم دارد. */
export function formatDateKeyLabel(dateKey: string, timezone = APP_TIMEZONE, now: Date = new Date()): string {
  if (dateKey === todayKey(timezone, now)) return 'امروز'
  if (dateKey === addDays(todayKey(timezone, now), 1)) return 'فردا'
  return formatDateKey(dateKey, 'weekday')
}
