const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const FA_DIGITS_RE = /[۰-۹]/g
const AR_DIGITS_RE = /[٠-٩]/g

/** تبدیل ارقام فارسی/عربی به ASCII — برای ورودی‌هایی مثل تلفن و کد OTP. */
export function normalizeDigits(input: string): string {
  return input
    .replace(FA_DIGITS_RE, d => String(FA_DIGITS.indexOf(d)))
    .replace(AR_DIGITS_RE, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** نمایش عدد/رشته با ارقام فارسی. */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, d => FA_DIGITS[Number(d)] ?? d)
}

const IR_MOBILE_RE = /^09\d{9}$/

/** اعتبارسنجی شمارهٔ موبایل ایران — ورودی می‌تواند ارقام فارسی هم داشته باشد. */
export function isValidIranianMobile(phone: string): boolean {
  return IR_MOBILE_RE.test(normalizeDigits(phone).replace(/\s/g, ''))
}

/** نمایش خوانای شمارهٔ موبایل: ۰۹۱۲ ۳۴۵ ۶۷۸۹ */
export function formatPhoneFa(phone: string): string {
  const ascii = normalizeDigits(phone).replace(/\D/g, '')
  const chunks = [ascii.slice(0, 4), ascii.slice(4, 7), ascii.slice(7, 11)]
  return toFaDigits(chunks.filter(Boolean).join(' '))
}

/** قیمت به تومان با جداکنندهٔ هزارگان فارسی: «۱۲۵٬۰۰۰ تومان» */
export function formatToman(amount: Toman): string {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`
}
