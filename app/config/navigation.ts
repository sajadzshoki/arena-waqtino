/**
 * مدل ناوبری وقتی‌نو — منبع مرکزی ناوبری پایین (bottom tab bar).
 *
 * ناوبری «متکی به حالت کاربر» است: هر حالت (مشتری/کسب‌وکار/کارمند)
 * مجموعهٔ تب‌های خودش را دارد و همهٔ حالت‌ها همزمان نمایش داده نمی‌شوند.
 * تب‌هایی که هنوز در فازهای بعدی ساخته می‌شوند enabled=false هستند.
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

const CUSTOMER_NAV: AppNavItem[] = [
  { key: 'home', label: 'خانه', icon: 'i-lucide-house', to: '/', enabled: true },
  { key: 'search', label: 'جستجو', icon: 'i-lucide-search', enabled: false },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-calendar-days', enabled: false },
  { key: 'saved', label: 'نشان‌شده‌ها', icon: 'i-lucide-bookmark', enabled: false },
  { key: 'profile', label: 'پروفایل', icon: 'i-lucide-user-round', enabled: false }
]

const BUSINESS_NAV: AppNavItem[] = [
  { key: 'dashboard', label: 'داشبورد', icon: 'i-lucide-layout-dashboard', enabled: false },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-clipboard-list', enabled: false },
  { key: 'calendar', label: 'تقویم', icon: 'i-lucide-calendar', enabled: false },
  { key: 'business', label: 'کسب‌وکار', icon: 'i-lucide-store', enabled: false },
  { key: 'more', label: 'بیشتر', icon: 'i-lucide-ellipsis', enabled: false }
]

const EMPLOYEE_NAV: AppNavItem[] = [
  { key: 'dashboard', label: 'داشبورد', icon: 'i-lucide-layout-dashboard', enabled: false },
  { key: 'schedule', label: 'برنامه', icon: 'i-lucide-calendar-clock', enabled: false },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-clipboard-list', enabled: false },
  { key: 'more', label: 'بیشتر', icon: 'i-lucide-ellipsis', enabled: false }
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
