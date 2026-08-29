/**
 * انواع جستجو و فیلتر — فاز ۴.
 */

/** گزینه‌های مرتب‌سازی نتایج */
export type SearchSort = 'relevance' | 'rating' | 'popular' | 'nearest'

/**
 * فیلترهای جستجوی کسب‌وکار — فقط چیزهایی که **همین حالا واقعاً کار می‌کنند**.
 *
 * «روز آزاد» (availableDay) و «سقف قیمت» (maxPrice) اینجا نیستند، هرچند یک دوره
 * در UI بودند: هیچ‌کدام روی نتایج اعمال نمی‌شد و کنترلِ بی‌اثر بدتر از نبودنِ
 * کنترل است. هر دو باید **سمت سرویس** پیاده شوند (فیلتر روی دسترس‌پذیری و قیمت
 * حداقلِ خدمات، نه روی دادهٔ صفحه‌بندی‌شدهٔ کلاینت) — انتظار در
 * `docs/API-CONTRACT.md` ثبت شده؛ وقتی بک‌اند آماده شد، همین‌جا یک فیلد و یک
 * چیپ اضافه می‌شود، نه بیشتر.
 */
export interface SearchFilters {
  /** حداقل امتیاز (مثلاً ۴ یا ۴٫۵) */
  minRating: number | null
  /** نزدیک من — بر پایهٔ فاصلهٔ محاسبه‌شده در سرویس */
  nearbyOnly: boolean
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
  nearbyOnly: false
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
