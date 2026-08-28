/**
 * تنظیمات سطح صفحه (route meta) — منبع مرکزی محافظت مسیرهاست
 * (middleware/guard.global.ts از همین فیلدها تغذیه می‌کند).
 *
 * - tabbar:     نوار ناوبری پایین مخفی شود (صفحات جزئیات/فرم/احراز هویت)
 * - access:     'public' (پیش‌فرض) | 'guest' (فقط مهمان: ورود/OTP) | 'auth' (فقط واردشده)
 * - capability: مسیر به قابلیت خاص نیاز دارد ('business' | 'employee')
 */
export {}

declare module 'vue-router' {
  interface RouteMeta {
    tabbar?: boolean
    access?: 'public' | 'guest' | 'auth'
    capability?: 'business' | 'employee'
  }
}
