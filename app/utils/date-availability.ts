import type { DateAvailabilityEntry } from '~/types/availability'
import type { DateAvailability } from '~/types/booking-flow'
import { isTomorrowKey, todayKey } from '~/utils/schedule-time'

/**
 * `DateAvailabilityEntry` (قرارداد سرویس) → ردیف نوار تاریخِ UI.
 *
 * چرا یک تابع و نه دو نسخه؟ جریان رزرو و صفحهٔ «جابه‌جایی نوبت» هر دو همین
 * نوار ۱۴ روزه را نشان می‌دهند. «امروز/فردا» و «وقت آزاد دارد» اگر دو جا
 * محاسبه شوند، یک روز یکی‌شان از واقعیت می‌افتد — پس برچسب‌ها همین‌جا
 * ساخته می‌شوند و صفحه‌ها فقط رندر می‌کنند.
 *
 * `now` تزریق‌پذیر است تا تست بتواند ساعت ثابت بدهد؛ مبنای تقویم *وقت اپ* است
 * (`todayKey(APP_TIMEZONE, …)`)، نه منطقهٔ زمانی مرورگر (قاعدهٔ فاز ۱۱).
 */
export function toDateAvailabilityList(
  entries: readonly DateAvailabilityEntry[],
  now: Date = new Date()
): DateAvailability[] {
  const today = todayKey(APP_TIMEZONE, now)
  return entries.map(entry => ({
    dateStr: entry.date,
    hasAvailableSlots: entry.hasAvailableSlots,
    isToday: entry.date === today,
    isTomorrow: isTomorrowKey(entry.date, APP_TIMEZONE, now),
    status: entry.status
  }))
}
