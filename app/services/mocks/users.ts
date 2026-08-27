import type { AppUser } from '~/types/user'

/**
 * کاربر توسعه — یک «کاربر واحد» با هر سه قابلیت (مشتری/مالک/کارمند)
 * تا سوییچ حالت در فازهای توسعه همیشه قابل آزمایش باشد.
 */
export const DEV_USER: AppUser = {
  id: 'usr_dev_sara',
  phone: '09123456789',
  firstName: 'سارا',
  lastName: 'محمدی',
  avatarUrl: null,
  capabilities: [
    { kind: 'customer' },
    { kind: 'owner', businessId: 'biz_narenj' },
    { kind: 'employee', businessId: 'biz_pars', employeeId: 'emp_sara_pars' }
  ],
  createdAt: '2025-11-02T08:30:00.000Z'
}
