import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId, Paginated } from '~/types/common'

/**
 * قرارداد سرویس کسب‌وکارها.
 * فاز ۰: فقط قرارداد + پیاده‌سازی mock — کشف/جستجو در فازهای بعد ساخته می‌شود.
 */
export interface BusinessListQuery {
  search?: string
  categoryId?: EntityId
  page?: number
  perPage?: number
}

export interface BusinessService {
  list(query?: BusinessListQuery): Promise<Paginated<Business>>
  getById(id: EntityId): Promise<Business | null>
  listCategories(): Promise<BusinessCategory[]>
}
