/**
 * گزینه‌های فرم سرویس.
 *
 * چرا `serviceStatusOptions()` تابع است و نه یک ثابت آماده‌شده در سطح ماژول؟
 * چون گزینه‌ها از نگاشت متمرکزٔ وضعیت ساخته می‌شوند و ثابتِ ماژول‌ها در Nuxt
 * (و در باندل node) به ترتیب import مقدار می‌گیرند — ساخت در زمان ارزیابی،
 * «ناشناخته بودن SERVICE_STATUS_META» تولید می‌کند. پس ساخت را به زمان
 * فراخوانی موکول کرده‌ایم: همان نتیجه، بدون وابستگی به ترتیب فایل‌ها.
 */
import { serviceStatusMeta } from './service-status'
export const SERVICE_DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180, 240] as const

export interface ServiceStatusOption {
  value: ServiceStatus
  label: string
  icon: string
  hint: string
}

/** ترتیب = ترتیب نمایش در فرم (فعال اول، چون پیش‌فرض ساخت سرویس است). */
export function serviceStatusOptions(): ServiceStatusOption[] {
  return (['active', 'inactive'] as ServiceStatus[]).map(value => {
    const meta = serviceStatusMeta(value)
    return { value, label: meta.label, icon: meta.icon, hint: meta.hint }
  })
}
