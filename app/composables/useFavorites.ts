import type { EntityId } from '~/types/common'

/**
 * مدیریت state علاقه‌مندی‌ها — singleton و sync شده با service.
 *
 * این composable:
 *   - لیست علاقه‌مندی‌ها را از service می‌گیرد
 *   - toggle را به service ارسال می‌کند
 *   - state را بین همهٔ کامپوننت‌ها sync می‌کند
 */
export function useFavorites() {
  const services = useServices()
  const { isAuthenticated } = useAuth()

  // State
  const favoriteIds = useState<Set<EntityId>>('app:favorites', () => new Set())
  const loading = ref(false)
  const initialized = ref(false)

  // Initialize از service
  async function init() {
    if (initialized.value || !isAuthenticated.value) return

    loading.value = true
    try {
      const favorites = await services.favorites.listMine()
      favoriteIds.value = new Set(favorites.map(f => f.id))
      initialized.value = true
    }
    catch (error) {
      console.error('Failed to load favorites:', error)
    }
    finally {
      loading.value = false
    }
  }

  // Toggle favorite
  async function toggle(businessId: EntityId): Promise<boolean> {
    if (!isAuthenticated.value) return false

    // Optimistic update
    const wasFavorite = favoriteIds.value.has(businessId)
    const newSet = new Set(favoriteIds.value)

    if (wasFavorite) {
      newSet.delete(businessId)
    }
    else {
      newSet.add(businessId)
    }

    favoriteIds.value = newSet

    try {
      const isNowFavorite = await services.favorites.toggle(businessId)
      // اگر نتیجه متفاوت بود، اصلاح کن
      if (isNowFavorite !== !wasFavorite) {
        const correctedSet = new Set(favoriteIds.value)
        if (isNowFavorite) {
          correctedSet.add(businessId)
        }
        else {
          correctedSet.delete(businessId)
        }
        favoriteIds.value = correctedSet
      }
      return isNowFavorite
    }
    catch (error) {
      // Rollback
      favoriteIds.value = new Set(wasFavorite ? [businessId] : [])
      if (wasFavorite) favoriteIds.value.add(businessId)
      else favoriteIds.value.delete(businessId)
      console.error('Failed to toggle favorite:', error)
      return wasFavorite
    }
  }

  // Check if favorite
  function isFavorite(businessId: EntityId): boolean {
    return favoriteIds.value.has(businessId)
  }

  return {
    favoriteIds,
    loading,
    initialized,
    isFavorite,
    toggle,
    init
  }
}
