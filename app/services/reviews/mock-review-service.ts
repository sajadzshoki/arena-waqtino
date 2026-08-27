import type { EntityId } from '~/types/common'
import type { Review } from '~/types/review'
import { MOCK_REVIEWS } from '~/services/mocks/extras'
import type { ReviewService } from './review-service'

export class MockReviewService implements ReviewService {
  async listForBusiness(businessId: EntityId): Promise<Review[]> {
    await delay()
    return MOCK_REVIEWS.filter(r => r.businessId === businessId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
}
