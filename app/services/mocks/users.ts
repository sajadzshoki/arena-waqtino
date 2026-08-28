import type { AppUser } from '~/types/user'

/**
 * سناریوهای کاربر توسعه — نگاشت «شمارهٔ موبایل توسعه → پروفایل قابلیت‌ها».
 * فقط در حالت mock استفاده می‌شود؛ در UI جز در محیط توسعه نمایش داده نمی‌شود.
 *
 *   09111111111 → فقط مشتری
 *   09222222222 → مشتری + صاحب کسب‌وکار (باشگاه انرژی)
 *   09333333333 → مشتری + کارمند (کلینیک پارس)
 *   09123456789 → هر سه قابلیت (پیش‌فرض)
 *   هر شمارهٔ دیگر → کاربر جدید با قابلیت مشتری (شبیه‌سازی ثبت‌نام تازه)
 */

export const DEV_PHONE_CUSTOMER = '09111111111'
export const DEV_PHONE_OWNER = '09222222222'
export const DEV_PHONE_EMPLOYEE = '09333333333'
export const DEV_PHONE_ALL = '09123456789'

/** پیش‌فرض نمایش در صفحهٔ ورود توسعه */
export const DEFAULT_DEV_PHONE = DEV_PHONE_ALL

const BASE = { avatarUrl: null as string | null }

export const DEV_USERS: Record<string, AppUser> = {
  [DEV_PHONE_CUSTOMER]: {
    ...BASE,
    id: 'usr_dev_negar',
    phone: DEV_PHONE_CUSTOMER,
    firstName: 'نگار',
    lastName: 'رضایی',
    capabilities: [{ kind: 'customer' }],
    createdAt: '2026-01-12T10:00:00.000Z'
  },
  [DEV_PHONE_OWNER]: {
    ...BASE,
    id: 'usr_dev_bahram',
    phone: DEV_PHONE_OWNER,
    firstName: 'بهرام',
    lastName: 'صادقی',
    capabilities: [
      { kind: 'customer' },
      { kind: 'owner', businessId: 'biz_energy' }
    ],
    createdAt: '2025-12-01T09:00:00.000Z'
  },
  [DEV_PHONE_EMPLOYEE]: {
    ...BASE,
    id: 'usr_dev_elham',
    phone: DEV_PHONE_EMPLOYEE,
    firstName: 'الهه',
    lastName: 'احمدی',
    capabilities: [
      { kind: 'customer' },
      { kind: 'employee', businessId: 'biz_pars', employeeId: 'emp_elham_pars' }
    ],
    createdAt: '2025-10-18T12:00:00.000Z'
  },
  [DEV_PHONE_ALL]: {
    ...BASE,
    id: 'usr_dev_sara',
    phone: DEV_PHONE_ALL,
    firstName: 'سارا',
    lastName: 'محمدی',
    capabilities: [
      { kind: 'customer' },
      { kind: 'owner', businessId: 'biz_narenj' },
      { kind: 'employee', businessId: 'biz_pars', employeeId: 'emp_sara_pars' }
    ],
    createdAt: '2025-11-02T08:30:00.000Z'
  }
}

/** کاربر شمارهٔ ناشناخته = ثبت‌نامی تازه با قابلیت مشتری. */
export function devUserForPhone(phone: string): AppUser {
  const known = DEV_USERS[phone]
  if (known) return { ...known }
  return {
    id: `usr_dev_${phone}`,
    phone,
    firstName: 'کاربر',
    lastName: 'وقتینو',
    avatarUrl: null,
    capabilities: [{ kind: 'customer' }],
    createdAt: new Date().toISOString()
  }
}
