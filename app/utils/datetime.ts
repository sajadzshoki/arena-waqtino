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
