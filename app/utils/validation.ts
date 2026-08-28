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

// ─────────────────────────── سرویس کسب‌وکار (فاز ۹) ───────────────────────────

export const SERVICE_NAME_MIN = 3
export const SERVICE_NAME_MAX = 60
export const SERVICE_DESCRIPTION_MAX = 200
export const SERVICE_DURATION_MIN = 5
export const SERVICE_DURATION_MAX = 480
export const SERVICE_PRICE_MIN = 1_000
export const SERVICE_PRICE_MAX = 50_000_000

/**
 * نام سرویس بر خلاف نام شخص: عدد و پرانتز هم دارد («رنگ ۳ مرحله‌ای»،
 * «نظافت اساسی (Deep Clean)») — ولی نمادهای بی‌ربط و رشتهٔ فقط-فاصله نه.
 */
const SERVICE_NAME_ALLOWED_RE = /^[\p{L}\p{M}\p{N}\s\u200c().,/+-]+$/u

export interface ServiceFormInput {
  name: string
  description: string
  /** رشتهٔ خام ورودی — تا «خالی» و «عدد نیست» پیام جدا داشته باشند */
  duration: string
  price: string
  status: ServiceStatus
}

export type ServiceFormErrors = Partial<
  Record<'name' | 'description' | 'duration' | 'price' | 'status', string>
>

export function validateServiceName(value: string): string | null {
  const trimmed = normalizeName(value)
  if (trimmed.length === 0) return 'نام سرویس را وارد کنید.'
  const length = [...trimmed].length
  if (length < SERVICE_NAME_MIN) {
    return `نام سرویس باید دست‌کم ${toFaDigits(SERVICE_NAME_MIN)} حرف باشد.`
  }
  if (length > SERVICE_NAME_MAX) {
    return `نام سرویس نباید بیشتر از ${toFaDigits(SERVICE_NAME_MAX)} حرف باشد.`
  }
  if (!SERVICE_NAME_ALLOWED_RE.test(trimmed)) {
    return 'نام سرویس فقط می‌تواند حرف، عدد یا نشانه‌های ( ) / - باشد.'
  }
  return null
}

export function validateServiceDescription(value: string): string | null {
  const trimmed = normalizeName(value)
  if (trimmed.length === 0) return null
  if ([...trimmed].length > SERVICE_DESCRIPTION_MAX) {
    return `توضیح نباید بیشتر از ${toFaDigits(SERVICE_DESCRIPTION_MAX)} حرف باشد.`
  }
  return null
}

/** بازهٔ دقیقه‌ای مدت سرویس (ورودی خام کاربر؛ جداکننده/ارقام فارسی قبول می‌شود). */
export function validateServiceDuration(raw: string): string | null {
  const value = parseFaNumber(raw)
  if (value === null) {
    return raw.trim().length === 0
      ? 'مدت سرویس را وارد کنید؛ مثلاً ۴۵ دقیقه.'
      : 'مدت سرویس فقط عدد است؛ واحد («دقیقه») را لازم نیست بنویسید.'
  }
  if (value < SERVICE_DURATION_MIN) {
    return `کوتاه‌ترین سرویس ${toFaDigits(SERVICE_DURATION_MIN)} دقیقه است.`
  }
  if (value > SERVICE_DURATION_MAX) {
    return `مدت سرویس نباید بیشتر از ${toFaDigits(SERVICE_DURATION_MAX)} دقیقه (یک شیفت کامل) باشد.`
  }
  return null
}

/**
 * قیمت به تومان. صفر و مبالغ کوچک‌تر از ۱٬۰۰۰ عمداً رد می‌شوند: «سرویس رایگان»
 * هنوز در مدل کسب‌وکار وقتینو تعریف نشده و قیمتِ تقریباً صفر بیشتر تایپو است.
 */
export function validateServicePrice(raw: string): string | null {
  const value = parseFaNumber(raw)
  if (value === null) {
    return raw.trim().length === 0
      ? 'قیمت سرویس را وارد کنید.'
      : 'قیمت فقط عدد است؛ «تومان» و جداکننده‌ها را لازم نیست بنویسید.'
  }
  if (value < SERVICE_PRICE_MIN) {
    return `قیمت باید دست‌کم ${toFaDigits(SERVICE_PRICE_MIN.toLocaleString('en-US'))} تومان باشد.`
  }
  if (value > SERVICE_PRICE_MAX) {
    return `قیمت نباید بیشتر از ${toFaDigits(SERVICE_PRICE_MAX.toLocaleString('en-US'))} تومان باشد.`
  }
  return null
}

/** اعتبارسنجی کامل فرم سرویس + ساخت ورودی نرمال‌شدهٔ ذخیره‌سازی. */
export function validateServiceForm(input: ServiceFormInput): {
  valid: boolean
  errors: ServiceFormErrors
  /** وقتی `valid` است، مقدار آمادهٔ ذخیره (عددهای نرمال‌شده، متن‌ها trim‌شده) */
  value: ServiceInput | null
} {
  const errors: ServiceFormErrors = {}
  const name = validateServiceName(input.name)
  if (name) errors.name = name
  const description = validateServiceDescription(input.description)
  if (description) errors.description = description
  const duration = validateServiceDuration(input.duration)
  if (duration) errors.duration = duration
  const price = validateServicePrice(input.price)
  if (price) errors.price = price
  const valid = Object.keys(errors).length === 0
  if (!valid) return { valid: false, errors, value: null }
  return {
    valid: true,
    errors: {},
    value: {
      name: normalizeName(input.name),
      description: normalizeName(input.description),
      durationMinutes: parseFaNumber(input.duration) as number,
      price: parseFaNumber(input.price) as number,
      status: input.status
    }
  }
}

/**
 * دفاع دوم: همان قاعده‌ها روی مقدار نرمال‌شده — لایهٔ سرویس (آینهٔ اعتبارسنجی
 * سرور) قبل از نوشتن صدا می‌زند تا یک کلاینت بد، دادهٔ نامعتبر نسازد.
 * پیام فارسی برمی‌گرداند یا `null`.
 */
export function serviceInputError(input: ServiceInput): string | null {
  const name = validateServiceName(input.name)
  if (name) return name
  const description = validateServiceDescription(input.description)
  if (description) return description
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < SERVICE_DURATION_MIN || input.durationMinutes > SERVICE_DURATION_MAX) {
    return `مدت سرویس باید عددی بین ${toFaDigits(SERVICE_DURATION_MIN)} تا ${toFaDigits(SERVICE_DURATION_MAX)} دقیقه باشد.`
  }
  if (!Number.isInteger(input.price) || input.price < SERVICE_PRICE_MIN || input.price > SERVICE_PRICE_MAX) {
    return `قیمت باید عددی بین ${toFaDigits(SERVICE_PRICE_MIN.toLocaleString('en-US'))} تا ${toFaDigits(SERVICE_PRICE_MAX.toLocaleString('en-US'))} تومان باشد.`
  }
  if (input.status !== 'active' && input.status !== 'inactive') {
    return 'وضعیت سرویس نامعتبر است.'
  }
  return null
}
