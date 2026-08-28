/**
 * دامنهٔ «سرویس کسب‌وکار» — یکی از موجودیت‌های مرکزی وقتینو.
 *
 * یک موجودیت، دو نمای مصرفی:
 *   • `BookableService` — همان رکورد دامنه؛ چیزی که مشتری و جریان رزرو مصرف
 *     می‌کنند (فیلتر «قابل رزرو بودن» در لایهٔ سرویس رخ می‌دهد، نه در UI).
 *   • `ManagedService` — همان رکورد + آنچه مدیر برای تصمیم‌گیری لازم دارد
 *     (شمارش نوبت‌های زنده و نتیجهٔ سیاست حذف).
 *
 * قواعد مهم فاز ۹:
 *   - `durationMinutes` و `price` مقدار نرمال‌شدهٔ عددی‌اند؛ رشتهٔ محلی‌سازی‌شده
 *     («۱ ساعت»، «۱٬۲۰۰٬۰۰۰ تومان») فقط در نمایش ساخته می‌شود.
 *   - `status` به‌جای بولین است: «غیرفعال» یک وضعیت چرخهٔ حیات است، نه حذف.
 *     برچسب/رنگ/آیکون/پیامد از `app/config/service-status.ts` می‌آید.
 *   - `employeeIds` پل فاز بعدی (کارمندان و تخصیس سرویس) است و `duration`/
 *     `price` پل‌های دسترس‌پذیری و قیمت‌گذاری‌اند؛ پس این مدل را دست‌کاری
 *     نکنید تا همان رابطه‌ها در فازهای بعد جا بیفتند.
 */

/** وضعیت چرخهٔ حیات سرویس — «غیرفعال» یعنی پنهان از رزرو تازه، نه حذف‌شده. */
export type ServiceStatus = 'active' | 'inactive'

/** سرویس قابل‌رزروی که یک کسب‌وکار ارائه می‌دهد. */
export interface BookableService {
  id: EntityId
  businessId: EntityId
  name: string
  /** اختیاری — نبودش نباید نمایش را بشکند */
  description?: string
  /** به تومان (عدد نرمال‌شده، نه رشتهٔ محلی‌سازی‌شده) */
  price: Toman
  /** مدت انجام خدمت به دقیقه */
  durationMinutes: number
  /** اگر فقط برخی کارمندان این سرویس را انجام می‌دهند */
  employeeIds?: EntityId[]
  status: ServiceStatus
  /** فقط وقتی واقعاً ثبت شده است — برای «زمان افزودن» در صفحهٔ مدیر */
  createdAt?: ISODateTime
  updatedAt?: ISODateTime
}

/** ورودی مشترک فرم «افزودن» و «ویرایش» سرویس. */
export interface ServiceInput {
  name: string
  description: string
  durationMinutes: number
  price: Toman
  status: ServiceStatus
}

/** نتیجهٔ سیاست حذف (mock: قانون ساده، api: پاسخ سرور) — UI تصمیم نمی‌سازد. */
export type ServiceDeleteBlocker = 'has_live_bookings' | null

export interface ServiceDeletePolicy {
  canDelete: boolean
  blocker: ServiceDeleteBlocker
  /** دلیل فارسی/راهنمای جایگزین، از همان لایهٔ سرویس */
  hint: string | null
}

/** نمای مدیر: رکورد دامنه + چند عدد که تصمیم مدیر را می‌سازد. */
export interface ManagedService extends BookableService {
  /** نوبت‌های زنده (در انتظار/تأییدشدهٔ پیش‌رو) — توضیح «چرا حذف نشد» */
  liveBookingCount: number
  /** همهٔ نوبت‌هایی که این سرویس را دارند (تاریخچه هم حساب می‌شود) */
  bookingCount: number
  deletePolicy: ServiceDeletePolicy
}
