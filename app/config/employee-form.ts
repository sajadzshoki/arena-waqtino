/**
 * گزینه‌های فرم پرسنل.
 *
 * چرا تابع و نه ثابتِ آمادهٔ سطح ماژول؟ (همین دلیلی که در `service-form.ts`
 * آمده): گزینه‌ها از نگاشت متمرکزٔ وضعیت ساخته می‌شوند و ثابت‌ها در Nuxt و در
 * باندل node به ترتیب import مقدار می‌گیرند — ساخت در زمان ارزیابی،
 * «ناشناخته بودن EMPLOYEE_STATUS_META» تولید می‌کند. پس ساخت موکول به زمان
 * فراخوانی است: همان نتیجه، بدون وابستگی به ترتیب فایل‌ها.
 */
import { employeeStatusMeta } from './employee-status'

export interface EmployeeStatusOption {
  value: EmployeeStatus
  label: string
  icon: string
  hint: string
}

/** ترتیب = ترتیب نمایش در فرم (فعال اول، چون پیش‌فرض ساخت پرسنل است). */
export function employeeStatusOptions(): EmployeeStatusOption[] {
  return (['active', 'inactive'] as EmployeeStatus[]).map(value => {
    const meta = employeeStatusMeta(value)
    return { value, label: meta.label, icon: meta.icon, hint: meta.hint }
  })
}
