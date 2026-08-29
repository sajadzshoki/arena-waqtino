/**
 * زبان بصری و معنایی «وضعیت سرویس» — همان الگوی `booking-status.ts` و
 * `business-status.ts`.
 *
 * هیچ کامپوننتی برچسب/رنگ/آیکون وضعیت سرویس را hardcode نمی‌کند و هیچ‌کس
 * «غیرفعال» را با «حذف‌شده» یکی نمی‌گیرد. اکشن مجازِ هر وضعیت (فعال‌سازی یا
 * غیرفعال‌کردن) هم همین‌جا تعریف می‌شود، پس افزودن وضعیت تازه (مثلاً
 * «در انتظار تأیید») فقط همین فایل و `ServiceStatus` را جابه‌جا می‌کند.
 */
export interface ServiceStatusMeta {
  /** برچسب فارسی — وضعیت هرگز فقط با رنگ اعلام نمی‌شود */
  label: string
  /** رنگ معنایی Nuxt UI (Badge با variant soft) */
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  icon: string
  /** توضیح یک‌خطی برای مدیر: این وضعیت عملاً چه معنی‌ای دارد */
  hint: string
  /** آیا در جریان رزرو تازه به مشتری نشان داده می‌شود؟ (منطق در سرویس است) */
  bookable: boolean
  /** وضعیت مقصدٔ اکشن سوییچ + برچسب و پیامد آن (null = سوییچی نیست) */
  toggle: { to: ServiceStatus; label: string; consequence: string } | null
}

export const SERVICE_STATUS_META: Record<ServiceStatus, ServiceStatusMeta> = {
  active: {
    label: 'فعال',
    color: 'success',
    icon: 'i-lucide-circle-check',
    hint: 'در فهرست سرویس‌های کسب‌وکار به مشتری نشان داده می‌شود.',
    bookable: true,
    toggle: {
      to: 'inactive',
      label: 'غیرفعال‌کردن',
      consequence: 'این سرویس برای رزرو تازه باز نمی‌ماند؛ نوبت‌های ثبت‌شده‌اش دست‌نخورده می‌مانند.'
    }
  },
  inactive: {
    label: 'غیرفعال',
    color: 'neutral',
    icon: 'i-lucide-circle-dashed',
    hint: 'در رزرو تازه به مشتری نشان داده نمی‌شود، اما در مدیریت همین‌جا می‌ماند.',
    bookable: false,
    toggle: {
      to: 'active',
      label: 'فعال‌کردن',
      consequence: 'دوباره در فهرست رزرو مشتری قرار می‌گیرد.'
    }
  }
}

/**
 * وضعیت ناشناخته از بک‌اند UI را نمی‌شکند: حالت خنثی با برچسب خوانا و بدون
 * اکشن سوییچ (تا کاربر چیزی را «فعال/غیرفعال» نکند که نمی‌شناسد).
 */
export const UNKNOWN_SERVICE_STATUS: ServiceStatusMeta = {
  label: 'نامشخص',
  color: 'neutral',
  icon: 'i-lucide-circle-help',
  hint: 'وضعیت این سرویس مشخص نیست تا همگام‌سازی با کسب‌وکار انجام شود.',
  bookable: false,
  toggle: null
}

/** نگاشت امن وضعیت → برچسب/رنگ/آیکون/پیامد. ورودی آزاد است (رشتهٔ بک‌اند). */
export function serviceStatusMeta(status: string): ServiceStatusMeta {
  return SERVICE_STATUS_META[status as ServiceStatus] ?? UNKNOWN_SERVICE_STATUS
}

/** فقط برچسب فارسی — جایی که رنگ و آیکون معنا ندارند. */
export function serviceStatusLabel(status: string): string {
  return serviceStatusMeta(status).label
}
