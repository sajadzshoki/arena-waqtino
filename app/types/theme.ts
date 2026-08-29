/**
 * مدل «ترجیح نمایش» — سه حالت، یک زبان مشترک در کل اپ.
 * واژه‌ها همان @nuxtjs/color-mode است (`system | light | dark`) تا مدیر تم
 * (`useThemePreference`) و تنظیمات/هدر یک منبع نام داشته باشند.
 */
export type ThemePreference = 'system' | 'light' | 'dark'

export interface ThemeOption {
  value: ThemePreference
  /** برچسب فارسی کوتاه */
  label: string
  /** توضیح یک‌خطی برای ردیف تنظیمات */
  description: string
  /** آیکون lucide */
  icon: string
}
