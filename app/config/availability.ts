import type { AvailabilityDay, Weekday } from '~/types/availability'

/**
 * پیکربندی دسترس‌پذیری (فاز ۱۱) — ترتیب هفته، برچسب‌ها، و قواعد ویرایشگر.
 *
 * «سیاست» هم اینجا است تا صفحه و سرویس عدد جادویی تازه نسازند: سقف تعداد بازه
 * در روز، گام انتخاب دقیقه، و نقطهٔ شروعی که ویرایشگر از آن شروع می‌کند.
 */

/** ترتیب هفته: شنبه اول (تقویم رسمی ایران) — جمعه آخر. */
export const WEEKDAY_ORDER: readonly Weekday[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday'
] as const

const WEEKDAY_LABELS: Record<Weekday, string> = {
  saturday: 'شنبه',
  sunday: 'یک‌شنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه'
}

const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  saturday: 'ش',
  sunday: 'ی',
  monday: 'د',
  tuesday: 'س',
  wednesday: 'چ',
  thursday: 'پ',
  friday: 'ج'
}

/** برچسب کامل — فقط برای نمایش؛ دامنه هیچ‌وقت این رشته‌ها را نمی‌بیند. */
export function weekdayLabel(weekday: Weekday): string {
  return WEEKDAY_LABELS[weekday] ?? weekday
}

/** تک‌حرفیِ نوار هفتگی (کارت موبایل) — با aria-label کامل همراه می‌شود. */
export function weekdayShortLabel(weekday: Weekday): string {
  return WEEKDAY_SHORT_LABELS[weekday] ?? weekday
}

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'string' && (WEEKDAY_ORDER as readonly string[]).includes(value)
}

/* ─────────────────────────── قواعد ویرایشگر ─────────────────────────── */

/** سقف بازه در هر روز — «ناهار و شیفت عصر» را پوشش می‌دهد، ولی ویرایشگر را بی‌قاعده نمی‌کند. */
export const MAX_INTERVALS_PER_DAY = 4

/** گام دقیقه در انتخاب‌گر ساعت (۱۵ = ربع‌ساعت؛ هم سریع، هم برای رزرو معنادار). */
export const MINUTE_STEP = 15

/** حداقل طول هر بازه — «۰۹:۰۰ تا ۰۹:۰۰» یعنی هنوز چیزی تعریف نشده. */
export const MIN_INTERVAL_MINUTES = 15

export interface AvailabilityPolicy {
  maxIntervalsPerDay: number
  minuteStep: number
  minIntervalMinutes: number
  /** آخرین بازهٔ روز برداشته شود، روز تعطیل می‌شود (به‌جای خطا) — سیاست متمرکز فاز ۱۱. */
  disableDayWhenLastIntervalRemoved: true
}

export const AVAILABILITY_POLICY: AvailabilityPolicy = {
  maxIntervalsPerDay: MAX_INTERVALS_PER_DAY,
  minuteStep: MINUTE_STEP,
  minIntervalMinutes: MIN_INTERVAL_MINUTES,
  disableDayWhenLastIntervalRemoved: true
}

/* ─────────────────────────── نقطهٔ شروع ─────────────────────────── */

/**
 * «نقطهٔ شروع» ویرایشگر برای کسب‌وکاری که هنوز ساعتش را تنظیم نکرده.
 *
 * عمداً *ذخیره نمی‌شود*: فقط پیش‌فرم است و تا owner دکمهٔ «ذخیره» را نزند، هیچ
 * داده‌ای ساخته نشده — پس ساعتی از خودمان نساخته‌ایم، ولی کاربر هم با هفت سطر
 * خالی تنها نمی‌ماند. متن بالای ویرایشگر همین را صریح می‌گوید.
 */
export function starterScheduleDays(): AvailabilityDay[] {
  return WEEKDAY_ORDER.map(weekday => ({
    weekday,
    enabled: weekday !== 'friday',
    intervals: weekday === 'friday' ? [] : [{ start: '09:00', end: '18:00' }]
  }))
}
