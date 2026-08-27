/**
 * تنظیمات سطح صفحه (route meta).
 * - tabbar: صفحات جزئیات/فرم/احراز هویت نوار ناوبری پایین را مخفی می‌کنند.
 */
export {}

declare module 'vue-router' {
  interface RouteMeta {
    tabbar?: boolean
  }
}
