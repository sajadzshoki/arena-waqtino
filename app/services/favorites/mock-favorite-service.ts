import type { AuthService } from '~/services/auth/auth-service'
import type { Business } from '~/types/business'
import type { EntityId } from '~/types/common'
import type { Favorite } from '~/types/review'
import type { SavedBusiness } from '~/types/saved'
import { MOCK_FAVORITES } from '~/services/mocks/extras'
import { MOCK_BUSINESSES } from '~/services/mocks/businesses'
import { patchMockUserState, readMockUserState } from '~/services/mocks/user-state'
import { requireMockSession } from '~/services/mocks/session'
import { ServiceError } from '~/utils/errors'
import type { FavoriteService } from './favorite-service'

/**
 * پیاده‌سازی mock کسب‌وکارهای نشان‌شده.
 *
 * منبع‌حقیقت = وضعیت کاربر در `wq_user_data` (کوکی، کاربر-محور) که در نخستین
 * خواندن از seed فاز ۴ (`MOCK_FAVORITES`) مقداردهی می‌شود. هیچ فهرست
 * تکراری‌ای در UI نگه داشته نمی‌شود؛ کامپوننت‌ها فقط `useSavedBusinesses()`
 * را مصرف می‌کنند.
 */
export class MockFavoriteService implements FavoriteService {
  constructor(private readonly auth: AuthService) {}

  /** seed فاز ۴ + آنچه کاربر در همین محیط development نشان کرده است. */
  private favoritesOf(userId: string): Favorite[] {
    const stored = readMockUserState(userId)?.favorites
    if (stored) return stored
    return MOCK_FAVORITES.filter(f => f.userId === userId)
  }

  private async requireUserId(): Promise<string> {
    const session = await requireMockSession(this.auth)
    return session.user.id
  }

  async listMine(): Promise<SavedBusiness[]> {
    // flags پیش از await خوانده می‌شود: بعد از await، context ناکس در SSR تضمینی نیست
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const userId = await this.requireUserId()
    const entries = this.favoritesOf(userId)
    if (flags.enabled.value && flags.forceEmpty.value) return []

    const byId = new Map<string, Business>(MOCK_BUSINESSES.map(b => [b.id, b]))
    return entries
      .map((entry) => {
        const business = byId.get(entry.businessId)
        return business ? { business, savedAt: entry.createdAt } satisfies SavedBusiness : null
      })
      .filter((item): item is SavedBusiness => item !== null)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  }

  async toggle(businessId: EntityId): Promise<boolean> {
    const flags = useMockFlags()
    await delay(180)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const userId = await this.requireUserId()
    const current = this.favoritesOf(userId)
    const exists = current.some(f => f.businessId === businessId)

    const next = exists
      ? current.filter(f => f.businessId !== businessId)
      : [...current, { userId, businessId, createdAt: new Date().toISOString() }]

    patchMockUserState(userId, { favorites: next })
    return !exists
  }

  async isSaved(businessId: EntityId): Promise<boolean> {
    await delay(80)
    const userId = await this.requireUserId()
    return this.favoritesOf(userId).some(f => f.businessId === businessId)
  }
}
