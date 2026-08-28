/**
 * تنظیمات سطح صفحه (route meta) — منبع مرکزی محافظت مسیرهاست
 * (middleware/guard.global.ts از همین فیلدها تغذیه می‌کند).
 *
 * - tabbar:     نوار ناوبری پایین مخفی شود (صفحات جزئیات/فرم/احراز هویت)
 * - header:     هدر سراسری اپ مخفی شود (صفحاتی با هدر سفارشی مثل خانهٔ مشتری)
 * - access:     'public' (پیش‌فرض) | 'guest' (فقط مهمان: ورود/OTP) | 'auth' (فقط واردشده)
 * - capability: مسیر به قابلیت خاص نیاز دارد ('business' | 'employee')
 */
export {}

declare module 'vue-router' {
  interface RouteMeta {
    tabbar?: boolean
    header?: boolean
    access?: 'public' | 'guest' | 'auth'
    capability?: 'business' | 'employee'
  }
}
