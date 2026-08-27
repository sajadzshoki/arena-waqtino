import type { EntityId } from '~/types/common'
import type { Review } from '~/types/review'

/** قرارداد سرویس نظرها و امتیازها. */
export interface ReviewService {
  /** نظرهای یک کسب‌وکار — جدیدترین اول */
  listForBusiness(businessId: EntityId): Promise<Review[]>
}
