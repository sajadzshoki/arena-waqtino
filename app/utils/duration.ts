/** مدت زمان به دقیقه → متن فارسی کوتاه: «۴۵ دقیقه»، «۱ ساعت»، «۲ ساعت و ۱۵ دقیقه» */
export function formatDurationFa(minutes: number): string {
  if (minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${toFaDigits(m)} دقیقه`
  if (m === 0) return h === 1 ? '۱ ساعت' : `${toFaDigits(h)} ساعت`
  return `${toFaDigits(h)} ساعت و ${toFaDigits(m)} دقیقه`
}
