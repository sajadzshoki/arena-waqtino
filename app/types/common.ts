/**
 * انواع مشترک دامنه.
 * قراردادهای نهایی بک‌اند هنوز معلوم نیستند؛ این تایپ‌ها مدل دامنهٔ
 * فرانت‌اند هستند و بعداً به DTOهای AdonisJS نگاشت می‌شوند.
 */

export type EntityId = string

/** مبالغ در کل سامانه به «تومان» و به‌صورت عدد صحیح نگهداری می‌شوند. */
export type Toman = number

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}

export interface GeoPoint {
  lat: number
  lng: number
}

/** رشتهٔ زمانی ISO-8601 — ساعت محلی کسب‌وکار در لایهٔ سرویس اعمال می‌شود. */
export type ISODateTime = string

/**
 * ماشین‌حالت کوچک بارگذاری (فهرست‌ها، پروفایل، …) — در کل اپ یکسان تا
 * صفحه‌ها به‌جای اختراع refهای محلی، یک زبان مشترک داشته باشند.
 */
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
