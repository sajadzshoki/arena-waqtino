import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId, Paginated } from '~/types/common'
import type { Employee } from '~/types/employee'
import type { BookableService } from '~/types/service'

/**
 * قرارداد سرویس کسب‌وکارها.
 * فاز ۲: خواندن فهرست/جستجو/دسته‌ها + خدمات و کارمندان— کشف و جزئیات در فازهای بعد.
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
  /** خدمات فعال یک کسب‌وکار */
  listServices(businessId: EntityId): Promise<BookableService[]>
  /** کارمندان فعال یک کسب‌وکار */
  listEmployees(businessId: EntityId): Promise<Employee[]>
}
