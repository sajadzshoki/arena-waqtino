/**
 * انواع جستجو و فیلتر — فاز ۴.
 */

/** گزینه‌های مرتب‌سازی نتایج */
export type SearchSort = 'relevance' | 'rating' | 'popular' | 'nearest'

/** فیلترهای جستجوی کسب‌وکار */
export interface SearchFilters {
  /** حداقل امتیاز (مثلاً 4 یا 4.5) */
  minRating: number | null
  /** نزدیک من — mock فاصله */
  nearbyOnly: boolean
  /** فیلتر زمانی ساده — آماده برای بک‌اند */
  availableDay: 'today' | 'tomorrow' | null
  /** بازهٔ قیمت (تومان) */
  maxPrice: number | null
}

/** وضعیت کامل جستجو — بخش‌های URL-synced با transient. */
export interface SearchState {
  /** متن جستجو */
  query: string
  /** شناسهٔ دسته‌بندی فعال */
  categoryId: string | null
  /** مرتب‌سازی */
  sort: SearchSort
  /** فیلترها */
  filters: SearchFilters
}

/** فیلترهای پیش‌فرض (خالی) */
export const DEFAULT_FILTERS: SearchFilters = {
  minRating: null,
  nearbyOnly: false,
  availableDay: null,
  maxPrice: null
}

/** وضعیت اولیهٔ جستجو */
export const DEFAULT_SEARCH_STATE: SearchState = {
  query: '',
  categoryId: null,
  sort: 'relevance',
  filters: { ...DEFAULT_FILTERS }
}

/** برچسب‌های فارسی گزینه‌های مرتب‌سازی */
export const SORT_OPTIONS: { value: SearchSort; label: string; icon: string }[] = [
  { value: 'relevance', label: 'مرتبط‌ترین', icon: 'i-lucide-arrow-up-down' },
  { value: 'rating', label: 'بالاترین امتیاز', icon: 'i-lucide-star' },
  { value: 'popular', label: 'محبوب‌ترین', icon: 'i-lucide-trending-up' },
  { value: 'nearest', label: 'نزدیک‌ترین', icon: 'i-lucide-navigation' }
]
