const faDate = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'full'
})

const faDateMedium = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium'
})

const faTime = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit'
})

const faWeekday = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'long'
})

const faShortDate = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long'
})

/** مثال: «پنجشنبه ۵ شهریور ۱۴۰۵» */
export function formatFaDateFull(date: Date | string | number): string {
  return faDate.format(new Date(date))
}

/** مثال: «۵ شهریور ۱۴۰۵» */
export function formatFaDate(date: Date | string | number): string {
  return faDateMedium.format(new Date(date))
}

/** مثال: «۱۴:۳۰» */
export function formatFaTime(date: Date | string | number): string {
  return faTime.format(new Date(date))
}

/** مثال: «پنجشنبه» */
export function formatFaWeekday(date: Date | string | number): string {
  return faWeekday.format(new Date(date))
}

/** مثال: «۵ شهریور» (کوتاه) */
export function formatFaShortDate(date: Date | string | number): string {
  return faShortDate.format(new Date(date))
}

/** تبدیل Date به ISO date string (YYYY-MM-DD) */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** آیا دو تاریخ یک روز هستند؟ */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/** آیا تاریخ امروز است؟ */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/** آیا تاریخ فردا است؟ */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameDay(date, tomorrow)
}

/** تولید لیست تاریخ‌های آینده (شامل امروز) */
export function generateUpcomingDates(count: number, startDate = new Date()): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < count; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }
  return dates
}

/** برچسب تاریخ — «امروز»، «فردا»، یا نام روز + تاریخ */
export function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'امروز'
  if (isTomorrow(date)) return 'فردا'
  return `${formatFaWeekday(date)}، ${formatFaShortDate(date)}`
}
