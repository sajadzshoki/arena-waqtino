/**
 * زبان بصری و معنایی «وضعیت پرسنل» — همان الگوی `booking-status.ts`،
 * `business-status.ts` و `service-status.ts`.
 *
 * هیچ کامپوننتی برچسب/رنگ/آیکون/پیامد وضعیت پرسنل را hardcode نمی‌کند و
 * هیچ‌کس «غیرفعال» را با «حذف‌شده» یکی نمی‌گیرد. اکشن مجاز هر وضعیت هم همین‌جا
 * تعریف می‌شود، پس افزودن وضعیت تازه (مثلاً «مرخصی») فقط همین فایل و
 * `EmployeeStatus` را جابه‌جا می‌کند.
 */
export interface EmployeeStatusMeta {
  /** برچسب فارسی — وضعیت هرگز فقط با رنگ اعلام نمی‌شود */
  label: string
  /** رنگ معنایی Nuxt UI (Badge با variant soft) */
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  icon: string
  /** توضیح یک‌خطی برای مدیر: این وضعیت عملاً چه معنی‌ای دارد */
  hint: string
  /** آیا در جریان رزرو تازه به مشتری نشان داده می‌شود؟ (منطق فیلتر در سرویس است) */
  bookable: boolean
  /** وضعیت مقصدِ اکشن سوییچ + برچسب و پیامد آن (null = سوییچی نیست) */
  toggle: { to: EmployeeStatus; label: string; consequence: string } | null
}

export const EMPLOYEE_STATUS_META: Record<EmployeeStatus, EmployeeStatusMeta> = {
  active: {
    label: 'فعال',
    color: 'success',
    icon: 'i-lucide-circle-check',
    hint: 'در انتخاب پرسنلِ رزرو به مشتری نشان داده می‌شود — برای سرویس‌هایی که به او اختصاص یافته.',
    bookable: true,
    toggle: {
      to: 'inactive',
      label: 'غیرفعال‌کردن',
      consequence: 'این نفر برای رزرو تازه قابل انتخاب نمی‌ماند؛ نوبت‌های ثبت‌شده‌اش دست‌نخورده می‌مانند.'
    }
  },
  inactive: {
    label: 'غیرفعال',
    color: 'neutral',
    icon: 'i-lucide-circle-dashed',
    hint: 'در رزرو تازه به مشتری نشان داده نمی‌شود، اما در مدیریت و در تاریخچهٔ نوبت‌ها می‌ماند.',
    bookable: false,
    toggle: {
      to: 'active',
      label: 'فعال‌کردن',
      consequence: 'دوباره در انتخاب پرسنلِ رزرو قرار می‌گیرد (به‌شرط آن‌که سرویسش هم فعال باشد).'
    }
  }
}

/**
 * وضعیت ناشناخته از بک‌اند UI را نمی‌شکند: حالت خنثی با برچسب خوانا و بدون اکشن
 * سوییچ — تا کاربر چیزی را «فعال/غیرفعال» نکند که نمی‌شناسد.
 */
export const UNKNOWN_EMPLOYEE_STATUS: EmployeeStatusMeta = {
  label: 'نامشخص',
  color: 'neutral',
  icon: 'i-lucide-circle-help',
  hint: 'وضعیت این پرسنل مشخص نیست تا همگام‌سازی با کسب‌وکار انجام شود.',
  bookable: false,
  toggle: null
}

/** نگاشت امن وضعیت → برچسب/رنگ/آیکون/پیامد. ورودی آزاد است (رشتهٔ بک‌اند). */
export function employeeStatusMeta(status: string): EmployeeStatusMeta {
  return EMPLOYEE_STATUS_META[status as EmployeeStatus] ?? UNKNOWN_EMPLOYEE_STATUS
}

/** فقط برچسب فارسی — جایی که رنگ و آیکون معنا ندارند. */
export function employeeStatusLabel(status: string): string {
  return employeeStatusMeta(status).label
}
