import type { Booking, BookingStatus } from '~/types/booking'

/**
 * سیاست نوبت‌ها — عدد و قواعد، نه متن UI (فاز ۱۲).
 *
 * چرا در config؟ چون همین ارقام هم در لایهٔ سرویس (رد کردن درخواست) و هم در UI
 * (توضیح «چرا نمی‌شود») خوانده می‌شوند. اگر یکی‌شان hardcode بماند، صفحه
 * «قابل لغو» می‌گوید و سرویس رد می‌کند — همان چیزی که در فاز ۱۱ برای
 * اعتبارسنجی ساعت کاری درست کردیم: یک قاعده، دو مصرف‌کننده.
 *
 * این سیاست *پیکربندی جلوی-اپ* است، نه واقعیت امنیتی: سرویس هم همان را چک
 * می‌کند («دفاع دوم» در `docs/ARCHITECTURE.md` §۱) و تصمیم نهایی با بک‌اند است.
 */
export const BOOKING_POLICY = {
  /** کمترین فاصله (دقیقه) تا شروع نوبت برای اینکه مشتری بتواند لغو کند. */
  cancelMinMinutesBeforeStart: 120,
  /** وضعیت‌هایی که لغوپذیرند (نوبت انجام‌شده یا لغوشده نه). */
  cancellableStatuses: ['pending', 'confirmed'] as readonly BookingStatus[],
  /** وضعیت‌هایی که جابه‌جاپذیرند. */
  reschedulableStatuses: ['pending', 'confirmed'] as readonly BookingStatus[],
  /** سقف یادداشت مشتری روی نوبت (کاراکتر). */
  notesMaxLength: 300,
  /** پنجرهٔ انتخاب تاریخِ تازه، بر حسب روز (از امروز). */
  rescheduleHorizonDays: 14
} as const

/** دلایل آمادهٔ لغو — «متن آزاد» هم مجاز است، پس این‌ها فقط میان‌بُرند. */
export const BOOKING_CANCEL_REASONS: ReadonlyArray<{ value: string, label: string }> = [
  { value: 'change-of-plan', label: 'برنامه‌ام عوض شد' },
  { value: 'found-elsewhere', label: 'جای دیگری وقت گرفتم' },
  { value: 'wrong-time', label: 'ساعت اشتباه انتخاب کردم' },
  { value: 'emergency', label: 'مسئلهٔ اضطراری پیش آمد' },
  { value: 'other', label: 'دلیل دیگر' }
]

/** «۲ ساعت» را خودمان حساب نمی‌کنیم؛ از دقیقه‌های سیاست درمی‌آید تا متن و قاعده یکی بمانند. */
export function bookingPolicyWindowLabel(minutes: number = BOOKING_POLICY.cancelMinMinutesBeforeStart): string {
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه`
  const hours = Math.round(minutes / 60)
  return hours === 1 ? 'یک ساعت' : `${toFaDigits(hours)} ساعت`
}

/**
 * «چرا لغو نمی‌شود؟» — یک تابع، دو مصرف‌کننده:
 *   • UI: دکمه را بدون دلیل غیرفعال نمی‌کند
 *   • سرویس: همان دلیل را به کد خطای قرارداد ترجمه می‌کند
 * پس «دکمه روشن بود ولی سرویس رد کرد» (یا برعکس) ساختاراً ممکن نیست.
 */
export type BookingCancelBlock = 'cancelled' | 'status' | 'window' | null

export function bookingCancelBlock(
  booking: Pick<Booking, 'status' | 'start'>,
  now: number = Date.now()
): BookingCancelBlock {
  if (booking.status === 'cancelled') return 'cancelled'
  if (!BOOKING_POLICY.cancellableStatuses.includes(booking.status)) return 'status'
  const minutesUntilStart = (new Date(booking.start).getTime() - now) / 60_000
  if (minutesUntilStart < BOOKING_POLICY.cancelMinMinutesBeforeStart) return 'window'
  return null
}

export type BookingRescheduleBlock = 'status' | 'past' | null

export function bookingRescheduleBlock(
  booking: Pick<Booking, 'status' | 'start'>,
  now: number = Date.now()
): BookingRescheduleBlock {
  if (!BOOKING_POLICY.reschedulableStatuses.includes(booking.status)) return 'status'
  if (new Date(booking.start).getTime() < now) return 'past'
  return null
}

/**
 * نوبت «زنده» است؟ (هنوز در جریان است، نه انجام‌شده/لغوشده/عدم حضور)
 * همان مجموعه‌ای که لغو و جابه‌جایی روی آن مجاز است — پس UI هم همین را می‌سنجد
 * و «کد وضعیت» در صفحه تکرار نمی‌شود (§۲۱: یک واژگان، یک منبع).
 */
export function isLiveBooking(status: BookingStatus): boolean {
  return BOOKING_POLICY.reschedulableStatuses.includes(status)
}

/** پیام فارسیِ همان دلیل — همان متنی که در شیت لغو و در خطای سرویس خوانده می‌شود. */
export function bookingCancelBlockLabel(block: Exclude<BookingCancelBlock, null>): string {
  switch (block) {
    case 'cancelled':
      return 'این نوبت قبلاً لغو شده است.'
    case 'status':
      return 'این نوبت دیگر قابل لغو نیست.'
    case 'window':
      return `لغو نوبت فقط تا ${bookingPolicyWindowLabel()} پیش از شروع آن ممکن است.`
  }
}
