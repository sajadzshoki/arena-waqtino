import type { EntityId } from '~/types/common'
import { DEV_USERS } from './users'

/**
 * نام مشتری برای نمای «صاحب کسب‌وکار».
 *
 * چرا این‌جا؟ رزرو فقط `customerId` حمل می‌کند (مدل دامنه) و مدیر باید بداند
 * این نوبت مال کیست. در حالت api بک‌اند این نام‌ها را داخل همان پاسخ رزرو
 * می‌فرستد؛ پس این فایل فقط «پر کردن شکاف mock» است و هیچ‌جا بیرون از
 * `services/mocks` وارد نمی‌شود.
 */
export interface MockCustomerProfile {
  firstName: string
  lastName: string
}

export const MOCK_CUSTOMERS: Record<EntityId, MockCustomerProfile> = {
  usr_cust_mahsa: { firstName: 'مهسا', lastName: 'کریمی' },
  usr_cust_sahar: { firstName: 'سحر', lastName: 'احمدلو' },
  usr_cust_kian: { firstName: 'کیان', lastName: 'فرهادی' },
  usr_cust_rooya: { firstName: 'رویا', lastName: 'مطهری' },
  usr_cust_nazanin: { firstName: 'نازنین', lastName: 'دوست‌محمد' },
  usr_cust_alireza: { firstName: 'علیرضا', lastName: 'نوری' }
}

const DEV_USERS_BY_ID = new Map<string, MockCustomerProfile>(
  Object.values(DEV_USERS).map(u => [u.id, { firstName: u.firstName, lastName: u.lastName }])
)

/** نام کامل مشتری — با fallback خوانا، نه «undefined». */
export function mockCustomerName(customerId: EntityId): string {
  const profile = MOCK_CUSTOMERS[customerId] ?? DEV_USERS_BY_ID.get(customerId)
  if (!profile) return 'مشتری وقتینو'
  return `${profile.firstName} ${profile.lastName}`
}
