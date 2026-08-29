import type { Business, BusinessCategory } from '~/types/business'
import type { LoadStatus } from '~/types/common'

/**
 * کش مشترک دسته‌بندی‌ها — «نام/آیکون دسته» یک داده مرجع است، نه دادهٔ هر صفحه.
 *
 * خانهٔ مشتری، نتایج جستجو و صفحهٔ نشان‌شده‌ها همه به یک نسخه نیاز دارند؛
 * بدون این کش هر صفحه یک واکشی تکراری می‌زد. خطای اینجا هرگز صفحه را
 * نمی‌شکند (کارت‌ها بدون نام دسته هم خوانا هستند).
 */
export function useBusinessCategories() {
  const services = useServices()

  const categories = useState<BusinessCategory[]>('categories:list', () => [])
  const status = useState<LoadStatus>('categories:status', () => 'idle')

  const byId = computed(() => new Map(categories.value.map(c => [c.id, c])))

  async function load(): Promise<void> {
    if (status.value === 'ready' || status.value === 'loading') return
    status.value = 'loading'
    try {
      categories.value = await services.businesses.listCategories()
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  function categoryOf(business: Business | null | undefined): BusinessCategory | null {
    if (!business) return null
    return byId.value.get(business.categoryId) ?? null
  }

  return {
    categories: readonly(categories),
    loading: computed(() => status.value === 'loading'),
    load,
    categoryOf
  }
}
