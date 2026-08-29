import { WEEKDAY_ORDER } from '~/config/availability'
import { minutesToTime, timeToMinutes } from '~/utils/schedule-time'
import type { AvailabilityDay, AvailabilityInterval, Weekday } from '~/types/availability'

/**
 * جبرِ برنامهٔ هفتگی — عملیات بی‌خطر روی بازه‌ها (فاز ۱۱).
 *
 * چرا جدا از `validation.ts`؟ چون سه جا لازم است: اعتبارسنجی ذخیره، ساخت
 * خلاصهٔ هفته، و موتور تولید اسلات رزرو. اگر این‌ها در هر سه بازنوشته شوند،
 * روزی یکی‌شان «تعطیلی» را فرق از دیگری حساب می‌کند. پس یک پیاده‌سازی، سه
 * مصرف‌کننده.
 *
 * قرارداد: توابع *بدون طرف اثرند* (copy می‌کنند) — تا state فرم با یک sort
 * ساده دفرمه نشود.
 */

export function emptyDay(weekday: Weekday): AvailabilityDay {
  return { weekday, enabled: false, intervals: [] }
}

export function daySignature(intervals: AvailabilityInterval[]): string {
  return intervals.map(i => `${i.start}-${i.end}`).join('|')
}

/** ترتیب استاندارد روزها (شنبه→جمعه) + ترتیب زمانی بازه‌ها. خروجی همیشه مرتب است. */
export function sortScheduleDays(days: AvailabilityDay[]): AvailabilityDay[] {
  const byWeekday = new Map<Weekday, AvailabilityDay>()
  for (const day of days) {
    if (!byWeekday.has(day.weekday)) byWeekday.set(day.weekday, day)
  }
  return WEEKDAY_ORDER.filter(w => byWeekday.has(w)).map((weekday) => {
    const day = byWeekday.get(weekday)!
    return { ...day, intervals: sortIntervals(day.intervals) }
  })
}

export function sortIntervals(intervals: AvailabilityInterval[]): AvailabilityInterval[] {
  return [...intervals].sort((a, b) => (timeToMinutes(a.start) ?? 0) - (timeToMinutes(b.start) ?? 0))
}

/** همهٔ ۷ روز، حتی آن‌هایی که فرم نفرستاده — تا «حذف تصادفی یک روز» ممکن نباشد. */
export function fullWeek(days: AvailabilityDay[]): AvailabilityDay[] {
  const byWeekday = new Map(days.map(d => [d.weekday, d]))
  return WEEKDAY_ORDER.map(weekday => ({
    weekday,
    enabled: byWeekday.get(weekday)?.enabled === true,
    intervals: byWeekday.get(weekday)?.intervals ?? []
  }))
}

export function activeIntervals(days: AvailabilityDay[], weekday: Weekday): AvailabilityInterval[] {
  const day = days.find(d => d.weekday === weekday)
  if (!day || !day.enabled) return []
  return sortIntervals(day.intervals)
}

export function isOpenOn(days: AvailabilityDay[], weekday: Weekday): boolean {
  return activeIntervals(days, weekday).length > 0
}

export function openDayCount(days: AvailabilityDay[]): number {
  return WEEKDAY_ORDER.filter(w => isOpenOn(days, w)).length
}

export function countIntervals(days: AvailabilityDay[]): number {
  return days.reduce((sum, d) => sum + (d.enabled ? d.intervals.length : 0), 0)
}

/** دو بازه هم‌پوشانی دارند؟ مرزِ چسبیده (۱۳:۰۰ پایان = ۱۳:۰۰ شروع) مجاز است. */
export function intervalsOverlap(a: AvailabilityInterval, b: AvailabilityInterval): boolean {
  const as = timeToMinutes(a.start)
  const ae = timeToMinutes(a.end)
  const bs = timeToMinutes(b.start)
  const be = timeToMinutes(b.end)
  if (as === null || ae === null || bs === null || be === null) return false
  return as < be && bs < ae
}

/** آیا `inner` کامل داخل `outer` است؟ (برای قاعدهٔ «پرسنل ⊆ کسب‌وکار») */
export function containsInterval(outer: AvailabilityInterval, inner: AvailabilityInterval): boolean {
  const os = timeToMinutes(outer.start)
  const oe = timeToMinutes(outer.end)
  const is = timeToMinutes(inner.start)
  const ie = timeToMinutes(inner.end)
  if (os === null || oe === null || is === null || ie === null) return false
  return os <= is && ie <= oe
}

/** آیا `inner` داخل *مجموع* بازه‌های یک روز جا می‌شود؟ (تکه‌تکه شدن مجاز نیست) */
export function withinAny(intervals: AvailabilityInterval[], inner: AvailabilityInterval): boolean {
  return intervals.some(outer => containsInterval(outer, inner))
}

/**
 * اشتراک دو برنامه (معمولاً «برنامهٔ نفر» ∩ «ساعت کسب‌وکار»).
 *
 * این *تضمین خواندن* است: ساعت کسب‌وکار بعداً عوض شود، برنامهٔ اختصاصیِ نفر
 * پاک نمی‌شود (ویرایشگر همان را نشان می‌دهد و به تناقض هشدار می‌دهد)، ولی چیزی
 * که عملاً قابل رزرو است هرگز از پنجرهٔ کسب‌وکار بیرون نمی‌زند.
 */
export function intersectDays(employee: AvailabilityDay[], business: AvailabilityDay[]): AvailabilityDay[] {
  return WEEKDAY_ORDER.map((weekday) => {
    const emp = activeIntervals(employee, weekday)
    const biz = activeIntervals(business, weekday)
    const intervals: AvailabilityInterval[] = []
    for (const e of emp) {
      for (const b of biz) {
        const start = Math.max(timeToMinutes(e.start) ?? 0, timeToMinutes(b.start) ?? 0)
        const end = Math.min(timeToMinutes(e.end) ?? 0, timeToMinutes(b.end) ?? 0)
        if (end > start) intervals.push({ start: minutesToTime(start), end: minutesToTime(end) })
      }
    }
    const unique = [...new Map(intervals.map(i => [`${i.start}-${i.end}`, i])).values()]
    return { weekday, enabled: unique.length > 0, intervals: sortIntervals(unique) }
  })
}
