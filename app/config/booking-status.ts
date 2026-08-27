/**
 * زبان بصری واحد برای وضعیت‌های رزرو.
 * هر جای اپ که وضعیت رزرو نمایش داده می‌شود باید از همین نگاشت استفاده کند.
 */
export interface BookingStatusMeta {
  label: string
  /** رنگ معنایی Nuxt UI */
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  icon: string
}

export const BOOKING_STATUS_META: Record<BookingStatus, BookingStatusMeta> = {
  pending: {
    label: 'در انتظار تأیید',
    color: 'warning',
    icon: 'i-lucide-hourglass'
  },
  confirmed: {
    label: 'تأیید شده',
    color: 'primary',
    icon: 'i-lucide-calendar-check'
  },
  completed: {
    label: 'انجام شده',
    color: 'success',
    icon: 'i-lucide-circle-check-big'
  },
  cancelled: {
    label: 'لغو شده',
    color: 'neutral',
    icon: 'i-lucide-circle-x'
  },
  no_show: {
    label: 'عدم حضور',
    color: 'error',
    icon: 'i-lucide-user-round-x'
  }
}
