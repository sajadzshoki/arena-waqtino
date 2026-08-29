/**
 * زبان بصری واحد برای «وضعیت چرخهٔ حیات کسب‌وکار».
 *
 * همان الگوی `booking-status.ts`: هیچ کامپوننتی برچسب/رنگ/آیکون وضعیت را
 * hardcode نمی‌کند و فرضیات enum بک‌اند را داخل UI نمی‌نویسد. اگر AdonisJS
 * وضعیت‌های بیشتری داد، فقط همین‌جا و `BusinessStatus` در
 * `app/types/business.ts` گسترش می‌یابد.
 */
export interface BusinessStatusMeta {
  /** برچسب فارسی — وضعیت هرگز فقط با رنگ اعلام نمی‌شود */
  label: string
  /** رنگ معنایی Nuxt UI — همان Badge با variant soft */
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  icon: string
  /** توضیح یک‌خطی؛ جایی که مدیر باید بداند دقیقاً چه وضعیتی حاکم است */
  hint: string
  /**
   * آیا این وضعیت برای مدیر «خبر» دارد؟ (چیزی را نمی‌تواند انجام دهد تا
   * وضعیت عوض شود). UI هرگز `if (status === '...')` نمی‌نویسد؛ معنا همین‌جا
   * تعریف می‌شود، پس افزودن وضعیت تازه فقط همین فایل را جابه‌جا می‌کند.
   */
  attentionNeeded: boolean
}

export const BUSINESS_STATUS_META: Record<BusinessStatus, BusinessStatusMeta> = {
  active: {
    label: 'فعال',
    color: 'success',
    icon: 'i-lucide-circle-check',
    hint: 'کسب‌وکار فعال است و نوبت جدید می‌گیرد.',
    attentionNeeded: false
  },
  pending_review: {
    label: 'در انتظار بررسی',
    color: 'warning',
    icon: 'i-lucide-hourglass',
    hint: 'تا تأیید نهایی، کسب‌وکار در فهرست کشف نمایش داده نمی‌شود.',
    attentionNeeded: true
  },
  suspended: {
    label: 'متوقف',
    color: 'error',
    icon: 'i-lucide-octagon-x',
    hint: 'نوبت‌دهی موقتاً بسته است؛ نوبت‌های ثبت‌شده جایشان را حفظ می‌کنند.',
    attentionNeeded: true
  }
}

/**
 * اگر بک‌اند وضعیتی خارج از این سه مقدار داد، UI نمی‌شکند: حالت خنثی با
 * برچسب خوانا. کامپوننت‌ها هیچ‌وقت `status === '...'` نمی‌نویسند.
 */
export const UNKNOWN_BUSINESS_STATUS: BusinessStatusMeta = {
  label: 'نامشخص',
  color: 'neutral',
  icon: 'i-lucide-circle-help',
  hint: 'وضعیت این کسب‌وکار هنوز مشخص نشده است.',
  attentionNeeded: true
}

/** نگاشت امن وضعیت → برچسب/رنگ/آیکون/توضیح. ورودی آزاد است (رشتهٔ بک‌اند). */
export function businessStatusMeta(status: string): BusinessStatusMeta {
  return BUSINESS_STATUS_META[status as BusinessStatus] ?? UNKNOWN_BUSINESS_STATUS
}

/** فقط برچسب فارسی — برای جایی که رنگ و آیکون معنا ندارند. */
export function businessStatusLabel(status: string): string {
  return businessStatusMeta(status).label
}
