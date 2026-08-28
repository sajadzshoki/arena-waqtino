import type { Business, BusinessCategory, BusinessWithDistance } from '~/types/business'

/**
 * composable اصلی صفحهٔ خانهٔ مشتری — تمام بخش‌های کشف را یک‌جا مدیریت می‌کند.
 *
 * هر بخش state مستقل دارد (loading/error/data) تا خرابی یک بخش بقیه را
 * مختل نکند. بارگذاری‌ها موازی انجام می‌شوند.
 */
interface SectionState<T> {
  data: Ref<T>
  loading: Ref<boolean>
  error: Ref<boolean>
}

function useSectionState<T>(initial: T): SectionState<T> {
  return {
    data: ref(initial) as Ref<T>,
    loading: ref(false),
    error: ref(false)
  }
}

export function useCustomerDiscovery() {
  const services = useServices()

  const categories = useSectionState<BusinessCategory[]>([])
  const featured = useSectionState<Business[]>([])
  const popular = useSectionState<Business[]>([])
  const nearby = useSectionState<BusinessWithDistance[]>([])

  /** آیا هیچ‌کدام از بخش‌ها در حال بارگذاری است؟ */
  const isInitialLoading = computed(
    () => categories.loading.value || (featured.loading.value && popular.loading.value && nearby.loading.value)
  )

  async function loadCategories() {
    categories.loading.value = true
    categories.error.value = false
    try {
      categories.data.value = await services.businesses.listCategories()
    }
    catch {
      categories.error.value = true
    }
    finally {
      categories.loading.value = false
    }
  }

  async function loadFeatured() {
    featured.loading.value = true
    featured.error.value = false
    try {
      featured.data.value = await services.businesses.listFeatured()
    }
    catch {
      featured.error.value = true
    }
    finally {
      featured.loading.value = false
    }
  }

  async function loadPopular() {
    popular.loading.value = true
    popular.error.value = false
    try {
      popular.data.value = await services.businesses.listPopular()
    }
    catch {
      popular.error.value = true
    }
    finally {
      popular.loading.value = false
    }
  }

  async function loadNearby() {
    nearby.loading.value = true
    nearby.error.value = false
    try {
      nearby.data.value = await services.businesses.listNearby()
    }
    catch {
      nearby.error.value = true
    }
    finally {
      nearby.loading.value = false
    }
  }

  /** بارگذاری اولیه — همهٔ بخش‌ها موازی */
  async function loadAll() {
    await Promise.all([
      loadCategories(),
      loadFeatured(),
      loadPopular(),
      loadNearby()
    ])
  }

  /** تلاش مجدد یک بخش خاص */
  async function retrySection(key: 'categories' | 'featured' | 'popular' | 'nearby') {
    switch (key) {
      case 'categories':
        await loadCategories()
        break
      case 'featured':
        await loadFeatured()
        break
      case 'popular':
        await loadPopular()
        break
      case 'nearby':
        await loadNearby()
        break
    }
  }

  return {
    categories,
    featured,
    popular,
    nearby,
    isInitialLoading,
    loadAll,
    retrySection
  }
}
