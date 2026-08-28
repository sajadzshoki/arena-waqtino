import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId } from '~/types/common'
import type { BookableEmployee } from '~/types/employee'
import type { BookableService } from '~/types/service'

/**
 * مدیریت داده‌های صفحهٔ جزئیات کسب‌وکار.
 */
export function useBusinessDetails(businessId: Ref<EntityId> | EntityId) {
  const services = useServices()

  const id = computed(() => typeof businessId === 'string' ? businessId : businessId.value)

  const business = ref<Business | null>(null)
  const category = ref<BusinessCategory | null>(null)
  const businessServices = ref<BookableService[]>([])
  const employees = ref<BookableEmployee[]>([])
  const distance = ref<number | null>(null)

  const loading = ref(false)
  const error = ref(false)

  async function load() {
    if (!id.value) return

    loading.value = true
    error.value = false

    try {
      // بارگذاری موازی
      const [biz, categories, svcs, emps, nearbyList] = await Promise.all([
        services.businesses.getById(id.value),
        services.businesses.listCategories(),
        services.businesses.listServices(id.value),
        services.businesses.listEmployees(id.value),
        services.businesses.listNearby()
      ])

      business.value = biz
      if (biz) {
        category.value = categories.find(c => c.id === biz.categoryId) ?? null
        const nearbyItem = nearbyList.find(n => n.id === biz.id)
        distance.value = nearbyItem?.distanceKm ?? null
      }

      businessServices.value = svcs
      employees.value = emps
    }
    catch {
      error.value = true
    }
    finally {
      loading.value = false
    }
  }

  const hasServices = computed(() => businessServices.value.length > 0)
  const hasEmployees = computed(() => employees.value.length > 0)
  const hasGallery = computed(() => {
    if (!business.value) return false
    const imgs = business.value.gallery ?? []
    return imgs.length > 0 || !!business.value.coverImageUrl
  })

  return {
    business,
    category,
    services: businessServices,
    employees,
    distance,
    loading,
    error,
    hasServices,
    hasEmployees,
    hasGallery,
    load
  }
}
