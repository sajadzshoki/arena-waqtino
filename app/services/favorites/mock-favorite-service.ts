import type { EntityId } from '~/types/common'
import type { Business } from '~/types/business'
import type { AuthSession } from '~/types/user'
import { MOCK_FAVORITES } from '~/services/mocks/extras'
import { MOCK_BUSINESSES } from '~/services/mocks/businesses'
import type { FavoriteService } from './favorite-service'

export class MockFavoriteService implements FavoriteService {
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  async listMine(): Promise<Business[]> {
    await delay()
    const userId = this.userId
    if (!userId) return []
    const ids = MOCK_FAVORITES.filter(f => f.userId === userId).map(f => f.businessId)
    return MOCK_BUSINESSES.filter(b => ids.includes(b.id))
  }

  async toggle(businessId: EntityId): Promise<boolean> {
    await delay(150)
    const userId = this.userId
    if (!userId) return false
    const index = MOCK_FAVORITES.findIndex(f => f.userId === userId && f.businessId === businessId)
    if (index >= 0) {
      MOCK_FAVORITES.splice(index, 1)
      return false
    }
    MOCK_FAVORITES.push({ userId, businessId, createdAt: new Date().toISOString() })
    return true
  }

  async isSaved(businessId: EntityId): Promise<boolean> {
    await delay(80)
    const userId = this.userId
    if (!userId) return false
    return MOCK_FAVORITES.some(f => f.userId === userId && f.businessId === businessId)
  }
}
