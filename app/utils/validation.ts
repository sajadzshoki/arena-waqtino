/**
 * اعتبارسنجی متمرکز فرم‌ها — تنها نقطهٔ تعریف قواعد.
 *
 * قانون: هیچ قاعده‌ای داخل template یا داخل یک صفحه تکرار نمی‌شود؛
 * صفحه‌ها فقط نتیجه را نمایش می‌دهند و لایهٔ سرویس (mock/آیندهٔ api) هم
 * همین توابع را برای «دفاع دوم» صدا می‌زند — پس قواعد front/back یکسان‌اند.
 * پیام‌ها فارسی، انسانی و عمل‌گرا هستند ( کاربر بداند دقیقاً چه درست کند ).
 */

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
