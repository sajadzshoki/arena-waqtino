import type { SearchFilters, SearchSort, SearchState } from '~/types/search'
import { DEFAULT_FILTERS } from '~/types/search'

/**
 * مدیریت state جستجو — هماهنگ با URL query.
 *
 * URL-synced:
 *   - q (query)
 *   - category (categoryId)
 *   - sort
 *
 * Transient (در URL نیست):
 *   - filters (فقط در state محلی)
 *
 * این composable singleton است — همهٔ صفحات جستجو از یک state استفاده می‌کنند.
 */
export function useSearchState() {
  const route = useRoute()
  const router = useRouter()

  // State اصلی
  const query = ref<string>('')
  const categoryId = ref<string | null>(null)
  const sort = ref<SearchSort>('relevance')
  const filters = ref<SearchFilters>({ ...DEFAULT_FILTERS })

  // Debounce برای query (جلوگیری از سرچ روی هر کاراکتر)
  const debouncedQuery = ref<string>('')
  let debounceTimer: NodeJS.Timeout | null = null

  function setQuery(newQuery: string) {
    query.value = newQuery
    // Debounce 300ms
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

  // Sync از URL به state (هنگام load یا back/forward)
  function syncFromUrl() {
    const q = route.query.q as string | undefined
    const cat = route.query.category as string | undefined
    const s = route.query.sort as SearchSort | undefined

    query.value = q ?? ''
    debouncedQuery.value = q ?? ''
    categoryId.value = cat ?? null
    sort.value = s && ['relevance', 'rating', 'popular', 'nearest'].includes(s) ? s : 'relevance'
  }

  // Sync از state به URL
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

  // Computed برای state کامل
  const searchState = computed<SearchState>(() => ({
    query: query.value,
    categoryId: categoryId.value,
    sort: sort.value,
    filters: { ...filters.value }
  }))

  // Computed برای بررسی فعال بودن فیلترها
  const hasActiveFilters = computed(() => {
    const f = filters.value
    return f.minRating !== null || f.nearbyOnly || f.availableDay !== null || f.maxPrice !== null
  })

  const hasAnySearchContext = computed(() => {
    return query.value.trim() !== '' || categoryId.value !== null || hasActiveFilters.value
  })

  return {
    // State
    query: readonly(query),
    debouncedQuery: readonly(debouncedQuery),
    categoryId: readonly(categoryId),
    sort: readonly(sort),
    filters: readonly(filters),
    searchState: readonly(searchState),

    // Computed
    hasActiveFilters,
    hasAnySearchContext,

    // Actions
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
