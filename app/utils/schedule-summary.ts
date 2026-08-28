import { APP_TIMEZONE } from '~/config/timezone'
import { WEEKDAY_ORDER, weekdayLabel } from '~/config/availability'
import { daySignature, isOpenOn, sortIntervals } from '~/utils/schedule'
import { formatIntervalFa } from '~/utils/schedule-time'
import { toFaDigits } from '~/utils/digits'
import type { AvailabilityDay, ScheduleSummary, ScheduleSummaryLine } from '~/types/availability'

/**
 * خلاصهٔ هفته — پاسخ یک سوال: «این کسب‌وکار (یا این نفر) چه روزها و ساعت‌هایی
 * فعالیت می‌کند؟» (فاز ۱۱)
 *
 * چرا در util و نه در کامپوننت؟ چون فهرست پرسنل، کارت ساعات کاری و صفحهٔ ویرایش
 * همگی باید *یک* جمله ببینند؛ اگر هر سه رشته‌سازی کنند، فردا یکی‌شان «۵ روز»
 * می‌نویسد و دیگری «۴ روز» — بدون اینکه داده فرق کرده باشد.
 *
 * الگوریتم: روزهای متوالیِ هم‌شکل در یک خط ادغام می‌شوند («شنبه تا چهارشنبه»)؛
 * روز تعطیل هم خط دارد، ولی با متن «تعطیل» — نه فقط کم‌رنگ.
 */

function rangeLabel(first: number, last: number): string {
  if (first === last) return weekdayLabel(WEEKDAY_ORDER[first]!)
  if (last - first === 1) {
    return `${weekdayLabel(WEEKDAY_ORDER[first]!)} و ${weekdayLabel(WEEKDAY_ORDER[last]!)}`
  }
  return `${weekdayLabel(WEEKDAY_ORDER[first]!)} تا ${weekdayLabel(WEEKDAY_ORDER[last]!)}`
}

export function buildScheduleSummary(
  days: AvailabilityDay[],
  timezone = APP_TIMEZONE
): ScheduleSummary {
  const shape = WEEKDAY_ORDER.map(weekday => ({
    weekday,
    open: isOpenOn(days, weekday),
    intervals: sortIntervals(days.find(d => d.weekday === weekday)?.intervals ?? [])
  }))

  const lines: ScheduleSummaryLine[] = []
  let index = 0
  while (index < WEEKDAY_ORDER.length) {
    const current = shape[index]!
    let end = index
    while (
      end + 1 < shape.length
      && shape[end + 1]!.open === current.open
      && daySignature(shape[end + 1]!.intervals) === daySignature(current.intervals)
    ) {
      end += 1
    }
    const label = rangeLabel(index, end)
    if (!current.open) {
      lines.push({ label, value: 'تعطیل', muted: true })
    }
    else {
      lines.push({
        label,
        value: current.intervals.map(i => formatIntervalFa(i)).join('، ') || '—'
      })
    }
    index = end + 1
  }

  const openDays = shape.filter(d => d.open).length
  const intervalCount = shape.reduce((sum, d) => sum + (d.open ? d.intervals.length : 0), 0)
  const uniqueSignatures = new Set(shape.filter(d => d.open).map(d => daySignature(d.intervals)))
  const single = uniqueSignatures.size === 1 ? shape.find(d => d.open) : undefined
  const headline = openDays === 0
    ? 'در هیچ روزی باز نیست'
    : single?.intervals.length === 1
      ? `${toFaDigits(openDays)} روز · ${formatIntervalFa(single.intervals[0]!, '–')}`
      : `${toFaDigits(openDays)} روز · ${toFaDigits(intervalCount)} بازه زمانی`

  return { lines, openDays, intervalCount, headline, timezone }
}

/**
 * خلاصهٔ یک روز برای سطر فهرست (مثلاً «۰۹:۰۰–۱۲:۰۰ و ۱۴:۰۰–۱۸:۰۰»)؛
 * روز تعطیل → «تعطیل».
 */
export function formatDayTimes(day: AvailabilityDay): string {
  if (!day.enabled) return 'تعطیل'
  const intervals = sortIntervals(day.intervals)
  if (intervals.length === 0) return 'بدون بازه'
  return intervals.map(i => formatIntervalFa(i, '–')).join(' و ')
}
