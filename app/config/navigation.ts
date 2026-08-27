/**
 * مدل ناوبری وقتینو — منبع مرکزی ناوبری پایین + مسیر فرود هر حالت.
 *
 * ناوبری «متکی به حالت کاربر» است: هر حالت (مشتری/کسب‌وکار/کارمند)
 * مجموعهٔ تب‌های خودش را دارد و همهٔ حالت‌ها همزمان نمایش داده نمی‌شوند.
 * فعال‌سازی یک بخش در فاز جدید = افزودن/ویرایش آیتم همین فایل.
 */

export interface AppNavItem {
  key: string
  /** برچسب فارسی کوتاه */
  label: string
  /** آیکون lucide (i-lucide-*) */
  icon: string
  to?: string
  enabled: boolean
}

/** مسیر فرود هر حالت — بعد از ورود یا سوییچ حالت به اینجا هدایت می‌شود. */
export const MODE_LANDING: Record<UserMode, string> = {
  customer: '/',
  business: '/business',
  employee: '/employee'
}

const CUSTOMER_NAV: AppNavItem[] = [
  { key: 'home', label: 'خانه', icon: 'i-lucide-house', to: '/', enabled: true },
  { key: 'search', label: 'جستجو', icon: 'i-lucide-search', to: '/search', enabled: true },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-calendar-days', to: '/bookings', enabled: true },
  { key: 'saved', label: 'نشان‌شده‌ها', icon: 'i-lucide-bookmark', to: '/saved', enabled: true },
  { key: 'profile', label: 'پروفایل', icon: 'i-lucide-user-round', to: '/profile', enabled: true }
]

const BUSINESS_NAV: AppNavItem[] = [
  { key: 'dashboard', label: 'داشبورد', icon: 'i-lucide-layout-dashboard', to: '/business', enabled: true },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-clipboard-list', to: '/business/bookings', enabled: true },
  { key: 'calendar', label: 'تقویم', icon: 'i-lucide-calendar', to: '/business/calendar', enabled: true },
  { key: 'business', label: 'کسب‌وکار', icon: 'i-lucide-store', to: '/business/manage', enabled: true },
  { key: 'more', label: 'بیشتر', icon: 'i-lucide-ellipsis', to: '/business/more', enabled: true }
]

const EMPLOYEE_NAV: AppNavItem[] = [
  { key: 'dashboard', label: 'داشبورد', icon: 'i-lucide-layout-dashboard', to: '/employee', enabled: true },
  { key: 'schedule', label: 'برنامه', icon: 'i-lucide-calendar-clock', to: '/employee/schedule', enabled: true },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-clipboard-list', to: '/employee/bookings', enabled: true },
  { key: 'more', label: 'بیشتر', icon: 'i-lucide-ellipsis', to: '/employee/more', enabled: true }
]

export const NAVIGATION: Record<UserMode, AppNavItem[]> = {
  customer: CUSTOMER_NAV,
  business: BUSINESS_NAV,
  employee: EMPLOYEE_NAV
}

/** برچسب/آیکون/توضیح هر حالت — برای سوییچر حالت */
export interface ModeMeta {
  mode: UserMode
  label: string
  icon: string
  description: string
}

export const MODE_META: Record<UserMode, ModeMeta> = {
  customer: {
    mode: 'customer',
    label: 'مشتری',
    icon: 'i-lucide-shopping-bag',
    description: 'کشف کسب‌وکارها و رزرو نوبت'
  },
  business: {
    mode: 'business',
    label: 'صاحب کسب‌وکار',
    icon: 'i-lucide-store',
    description: 'مدیریت نوبت‌ها، خدمات و کارمندان'
  },
  employee: {
    mode: 'employee',
    label: 'کارمند',
    icon: 'i-lucide-briefcase-business',
    description: 'برنامهٔ کاری و نوبت‌های تخصیص‌داده‌شده'
  }
}
