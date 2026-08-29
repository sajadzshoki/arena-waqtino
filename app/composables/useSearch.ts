import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId } from '~/types/common'

/**
 * اجرای جستجو: خواندن از سرویس + فیلتر/مرتب‌سازی محلی روی همان صفحه.
 *
 * state در `useSearchState` (URL-synced) و داده فقط از `services.businesses` —
 * صفحه نه `$fetch` می‌زند نه mock (§۱۸). خطا **پیام** است نه بولین: همان
 * `ServiceError` فارسی که بقیهٔ صفحه‌ها نشان می‌دهند (§۲۳).
 */
export function useSearch() {
  const services = useServices()
  const { debouncedQuery, categoryId, sort, filters } = useSearchState()

  const results = ref<Business[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const searched = ref(false) // آیا حداقل یک بار جستجو شده؟

  const categories = ref<BusinessCategory[]>([])
  const categoriesLoading = ref(false)

  // فاصله‌ها، برای فیلتر «نزدیک من»
  const distances = ref<Record<EntityId, number>>({})

  /** بارگذاری دسته‌بندی‌ها (برای نمای اولیه) */
  async function loadCategories() {
    if (categories.value.length > 0) return
    categoriesLoading.value = true
    try {
      categories.value = await services.businesses.listCategories()
    }
    catch {
      // بی‌صدا: حداکثرش این است که چیپ‌های دسته غایب بمانند، نه کل جستجو
    }
    finally {
      categoriesLoading.value = false
    }
  }

  /** اجرای جستجو */
  async function executeSearch() {
    loading.value = true
    error.value = null
    searched.value = true

    try {
      // ۱. نتایج از سرویس
      const query = debouncedQuery.value.trim()
      // صفحهٔ اول با اندازهٔ بزرگ: جستجو هنوز «بی‌نهایت‌اسکرول» ندارد، ولی از
      // همان اول صفحه‌بندی‌محور می‌خواند تا اتصال بک‌اند تغییر معماری نخواهد
      // (`page`/`perPage` در قرارداد §۳۱).
      const paginated = await services.businesses.list({
        search: query || undefined,
        categoryId: categoryId.value || undefined,
        page: 1,
        perPage: 50
      })

      let items: Business[] = [...paginated.items]

      // ۲. اگر «نزدیک من» فعال است، فاصله‌ها خوانده می‌شود
      if (filters.value.nearbyOnly) {
        const nearbyList = await services.businesses.listNearby()
        const distMap: Record<EntityId, number> = {}
        nearbyList.forEach(b => { distMap[b.id] = b.distanceKm })
        distances.value = distMap
        // فقط کسب‌وکارهایی که فاصله دارند
        items = items.filter(b => distMap[b.id] !== undefined)
      }

      // ۳. اعمال فیلترهای محلی
      items = applyFilters(items)

      // ۴. مرتب‌سازی
      items = applySort(items)

      results.value = items
      total.value = items.length
    }
    catch (err) {
      error.value = toServiceError(err).message || 'دریافت نتیجه‌ها ممکن نشد.'
      results.value = []
      total.value = 0
    }
    finally {
      loading.value = false
    }
  }

  /** اعمال فیلترها روی نتایج همین صفحه */
  function applyFilters(items: Business[]): Business[] {
    let filtered = [...items]
    const f = filters.value

    // حداقل امتیاز
    if (f.minRating !== null) {
      filtered = filtered.filter(b => b.rating.average >= f.minRating!)
    }

    // «نزدیک من»: فقط کسب‌وکارهایی که فاصله‌شان خوانده شده
    if (f.nearbyOnly) {
      filtered = filtered.filter(b => distances.value[b.id] !== undefined)
    }

    return filtered
  }

  /** مرتب‌سازی نتایج (سمت کلاینت — بک‌اند `sort` ندارد، §۳۱) */
  function applySort(items: Business[]): Business[] {
    const sorted = [...items]

    switch (sort.value) {
      case 'rating':
        sorted.sort((a, b) => b.rating.average - a.rating.average)
        break
      case 'popular':
        sorted.sort((a, b) => (b.rating.count * b.rating.average) - (a.rating.count * a.rating.average))
        break
      case 'nearest':
        sorted.sort((a, b) => {
          const distA = distances.value[a.id] ?? Infinity
          const distB = distances.value[b.id] ?? Infinity
          return distA - distB
        })
        break
      case 'relevance':
      default:
        // مرتب‌سازی پیش‌فرض — همان ترتیب service
        break
    }

    return sorted
  }

  /** بررسی وجود نتیجه */
  const hasResults = computed(() => results.value.length > 0)
  const isInitial = computed(() => !searched.value && !loading.value)

  return {
    // State
    results,
    loading,
    error,
    total,
    searched,
    categories,
    categoriesLoading,
    distances,

    // Computed
    hasResults,
    isInitial,

    // Actions
    executeSearch,
    loadCategories
  }
}
