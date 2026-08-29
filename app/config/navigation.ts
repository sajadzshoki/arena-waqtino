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
  /**
   * مسیرهایی که این تب را هم «فعال» نگه می‌دارند (تطبیق بخشِ مسیر، نه رشته).
   * لازم است چون صفحهٔ یک تب می‌تواند عمیق‌تر از `to` باشد
   * (مثلاً فضای کاری مالک روی `/owner/business/<id>` باز می‌شود).
   */
  activeWhen?: string[]
}

/** مسیر فرود هر حالت — بعد از ورود یا سوییچ حالت به اینجا هدایت می‌شود. */
export const MODE_LANDING: Record<UserMode, string> = {
  customer: '/',
  business: '/owner',
  employee: '/employee'
}

const CUSTOMER_NAV: AppNavItem[] = [
  { key: 'home', label: 'خانه', icon: 'i-lucide-house', to: '/', enabled: true },
  { key: 'search', label: 'جستجو', icon: 'i-lucide-search', to: '/search', enabled: true },
  { key: 'bookings', label: 'نوبت‌ها', icon: 'i-lucide-calendar-days', to: '/bookings', enabled: true },
  { key: 'saved', label: 'نشان‌شده‌ها', icon: 'i-lucide-bookmark', to: '/saved', enabled: true },
  { key: 'profile', label: 'پروفایل', icon: 'i-lucide-user-round', to: '/profile', enabled: true }
]

/**
 * ناوبری حالت «صاحب کسب‌وکار» — فضای کاری مستقل از حالت مشتری.
 *
 * سه تب، همه واقعی: نمای کلی (داشبورد همان کسب‌وکارِ زمینه)، فهرست
 * کسب‌وکارهای قابل مدیریت، و حساب. تب‌های «نوبت‌ها/تقویم/خدمات/کارمندان»
 * عمداً اینجا نیستند؛ در صفحهٔ «مدیریت کسب‌وکار» با برچسب صادقانهٔ «به‌زودی»
 * معرفی می‌شوند و در فاز خودشان به همین ناوبری اضافه می‌شوند.
 */
const BUSINESS_NAV: AppNavItem[] = [
  {
    key: 'workspace',
    label: 'نمای کلی',
    icon: 'i-lucide-layout-dashboard',
    to: '/owner',
    activeWhen: ['/owner/business'],
    enabled: true
  },
  {
    key: 'businesses',
    label: 'کسب‌وکارها',
    icon: 'i-lucide-store',
    to: '/owner/businesses',
    enabled: true
  },
  { key: 'profile', label: 'حساب', icon: 'i-lucide-user-round', to: '/profile', enabled: true }
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
    description: 'نمای کلی و مدیریت کسب‌وکارهای خودت'
  },
  employee: {
    mode: 'employee',
    label: 'کارمند',
    icon: 'i-lucide-briefcase-business',
    description: 'برنامهٔ کاری و نوبت‌های تخصیص‌داده‌شده'
  }
}
