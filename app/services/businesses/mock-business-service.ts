import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId, Paginated } from '~/types/common'
import { MOCK_BUSINESSES, MOCK_CATEGORIES } from '~/services/mocks/businesses'
import type { BusinessListQuery, BusinessService } from './business-service'

export class MockBusinessService implements BusinessService {
  async list(query: BusinessListQuery = {}): Promise<Paginated<Business>> {
    await delay()

    const page = query.page ?? 1
    const perPage = query.perPage ?? 10
    const search = query.search?.trim()

    let items = MOCK_BUSINESSES.filter(b => b.status === 'active')
    if (query.categoryId) {
      items = items.filter(b => b.categoryId === query.categoryId)
    }
    if (search) {
      items = items.filter(
        b => b.name.includes(search) || b.description.includes(search)
      )
    }

    const start = (page - 1) * perPage
    return {
      items: items.slice(start, start + perPage),
      total: items.length,
      page,
      perPage
    }
  }

  async getById(id: EntityId): Promise<Business | null> {
    await delay(200)
    return MOCK_BUSINESSES.find(b => b.id === id) ?? null
  }

  async listCategories(): Promise<BusinessCategory[]> {
    await delay(150)
    return MOCK_CATEGORIES
  }
}
