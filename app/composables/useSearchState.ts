import type { SearchFilters, SearchSort, SearchState } from '~/types/search'
import { DEFAULT_FILTERS } from '~/types/search'

/**
 * مدیریت وضعیت جستجو — هماهنگ با query آدرس.
 *
 * در URL (پس share/back-safe است): `q`، `category`، `sort`.
 * فقط در حافظه (transient): `filters` — چون فیلترهای محلی نشانی‌ساز نیستند.
 *
 * singleton است: همهٔ صفحه‌های جستجو یک وضعیت را می‌خواند؛ state دومی برای
 * «چیب‌ها و شیت» نساخته‌ایم (§۴۳). تأخیر ۳۰۰ms روی ورودی، درخواست‌های تکراری
 * را حذف می‌کند (§۲۸).
 */
export function useSearchState() {
  const route = useRoute()
  const router = useRouter()

  // وضعیت اصلی
  const query = ref<string>('')
  const categoryId = ref<string | null>(null)
  const sort = ref<SearchSort>('relevance')
  const filters = ref<SearchFilters>({ ...DEFAULT_FILTERS })

  // تأخیر روی ورودی جستجو (روی هر کلید درخواست نمی‌فرستیم، §۳۰)
  const debouncedQuery = ref<string>('')
  let debounceTimer: NodeJS.Timeout | null = null

  function setQuery(newQuery: string) {
    query.value = newQuery
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = newQuery
      syncToUrl()
    }, 300)
  }

  function setCategory(newCategoryId: string | null) {
    categoryId.value = newCategoryId
    syncToUrl()
  }

  function setSort(newSort: SearchSort) {
    sort.value = newSort
    syncToUrl()
  }

  function setFilters(newFilters: Partial<SearchFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
  }

  function clearAll() {
    query.value = ''
    debouncedQuery.value = ''
    categoryId.value = null
    sort.value = 'relevance'
    filters.value = { ...DEFAULT_FILTERS }
    syncToUrl()
  }

  // خواندن وضعیت از URL (load و back/forward)
  function syncFromUrl() {
    const q = route.query.q as string | undefined
    const cat = route.query.category as string | undefined
    const s = route.query.sort as SearchSort | undefined

    query.value = q ?? ''
    debouncedQuery.value = q ?? ''
    categoryId.value = cat ?? null
    sort.value = s && ['relevance', 'rating', 'popular', 'nearest'].includes(s) ? s : 'relevance'
  }

  // نوشتن وضعیت به URL
  function syncToUrl() {
    const newQuery: Record<string, string> = {}

    if (query.value.trim()) newQuery.q = query.value.trim()
    if (categoryId.value) newQuery.category = categoryId.value
    if (sort.value !== 'relevance') newQuery.sort = sort.value

    router.replace({
      path: '/search',
      query: Object.keys(newQuery).length > 0 ? newQuery : undefined
    })
  }

  // وضعیت کامل جستجو
  const searchState = computed<SearchState>(() => ({
    query: query.value,
    categoryId: categoryId.value,
    sort: sort.value,
    filters: { ...filters.value }
  }))

  // آیا فیلتری فعال است؟
  const hasActiveFilters = computed(() => {
    const f = filters.value
    return f.minRating !== null || f.nearbyOnly
  })

  const hasAnySearchContext = computed(() => {
    return query.value.trim() !== '' || categoryId.value !== null || hasActiveFilters.value
  })

  return {
    query: readonly(query),
    debouncedQuery: readonly(debouncedQuery),
    categoryId: readonly(categoryId),
    sort: readonly(sort),
    filters: readonly(filters),
    searchState: readonly(searchState),

    hasActiveFilters,
    hasAnySearchContext,

    setQuery,
    setCategory,
    setSort,
    setFilters,
    resetFilters,
    clearAll,
    syncFromUrl,
    syncToUrl
  }
}
