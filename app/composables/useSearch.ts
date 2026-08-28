import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId } from '~/types/common'

/**
 * اجرای جستجو با فیلترها و مرتب‌سازی.
 *
 * از useSearchState برای state و از service برای data استفاده می‌کند.
 */
export function useSearch() {
  const services = useServices()
  const { debouncedQuery, categoryId, sort, filters } = useSearchState()

  // State
  const results = ref<Business[]>([])
  const loading = ref(false)
  const error = ref(false)
  const total = ref(0)
  const searched = ref(false) // آیا حداقل یک بار سرچ شده؟

  // Categories (برای نمایش در initial state)
  const categories = ref<BusinessCategory[]>([])
  const categoriesLoading = ref(false)

  // Distances (برای nearby filter)
  const distances = ref<Record<EntityId, number>>({})

  /** بارگذاری دسته‌بندی‌ها (برای initial state) */
  async function loadCategories() {
    if (categories.value.length > 0) return
    categoriesLoading.value = true
    try {
      categories.value = await services.businesses.listCategories()
    }
    catch {
      // silent — در initial state اگر نباشد مشکلی نیست
    }
    finally {
      categoriesLoading.value = false
    }
  }

  /** اجرای جستجو */
  async function executeSearch() {
    loading.value = true
    error.value = false
    searched.value = true

    try {
      // ۱. دریافت نتایج از service
      const query = debouncedQuery.value.trim()
      const paginated = await services.businesses.list({
        search: query || undefined,
        categoryId: categoryId.value || undefined,
        perPage: 50 // فعلاً همه را یکجا
      })

      let items: Business[] = [...paginated.items]

      // ۲. دریافت فاصله‌ها اگر nearby فعال است
      if (filters.value.nearbyOnly) {
        const nearbyList = await services.businesses.listNearby()
        const distMap: Record<EntityId, number> = {}
        nearbyList.forEach(b => { distMap[b.id] = b.distanceKm })
        distances.value = distMap
        // فقط کسب‌وکارهایی که فاصله دارند
        items = items.filter(b => distMap[b.id] !== undefined)
      }

      // ۳. اعمال فیلترها
      items = applyFilters(items)

      // ۴. مرتب‌سازی
      items = applySort(items)

      results.value = items
      total.value = items.length
    }
    catch {
      error.value = true
      results.value = []
      total.value = 0
    }
    finally {
      loading.value = false
    }
  }

  /** اعمال فیلترها روی نتایج */
  function applyFilters(items: Business[]): Business[] {
    let filtered = [...items]
    const f = filters.value

    // فیلتر امتیاز
    if (f.minRating !== null) {
      filtered = filtered.filter(b => b.rating.average >= f.minRating!)
    }

    // فیلتر nearby (فقط آن‌هایی که فاصله دارند)
    if (f.nearbyOnly) {
      filtered = filtered.filter(b => distances.value[b.id] !== undefined)
    }

    // فیلتر maxPrice (بر اساس حداقل قیمت سرویس)
    // فعلاً ساده — بعداً از service price استفاده می‌شود
    // if (f.maxPrice !== null) { ... }

    return filtered
  }

  /** مرتب‌سازی نتایج */
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
