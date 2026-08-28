import type { Business } from '~/types/business'
import type { EntityId } from '~/types/common'

/**
 * تاریخچهٔ مشاهدهٔ کسب‌وکارها — در localStorage ذخیره می‌شود.
 * بعداً می‌توان با API بک‌اند جایگزین یا ترکیب کرد.
 *
 * رابط:
 *   recentlyViewed   → فهرست آخرین کسب‌وکارهای دیده‌شده (جدید به کهنه)
 *   trackView(id)    → ثبت مشاهده (تکراری به بالا منتقل می‌شود)
 *   clearHistory()   → پاک‌کردن تاریخچه
 */
const STORAGE_KEY = 'wq:recently-viewed'
const MAX_ITEMS = 6

export function useRecentlyViewed() {
  const services = useServices()

  const ids = useState<EntityId[]>(STORAGE_KEY, () => [])
  const items = ref<Business[]>([])
  const loading = ref(false)

  /** بارگذاری کسب‌وکارها بر اساس شناسه‌های ذخیره‌شده */
  async function refresh() {
    if (ids.value.length === 0) {
      items.value = []
      return
    }
    loading.value = true
    try {
      const results = await Promise.all(ids.value.map(id => services.businesses.getById(id)))
      items.value = results.filter((b): b is Business => b !== null)
    }
    finally {
      loading.value = false
    }
  }

  /** ثبت مشاهدهٔ یک کسب‌وکار — تکراری حذف و به ابتدا منتقل می‌شود. */
  function trackView(businessId: EntityId) {
    const current = ids.value.filter(id => id !== businessId)
    ids.value = [businessId, ...current].slice(0, MAX_ITEMS)
    // بدون انتظار — در پس‌زمینه به‌روزرسانی شود
    refresh()
  }

  function clearHistory() {
    ids.value = []
    items.value = []
  }

  return {
    items,
    loading: readonly(loading),
    hasHistory: computed(() => ids.value.length > 0),
    trackView,
    clearHistory,
    refresh
  }
}
