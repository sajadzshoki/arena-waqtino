import type { EntityId } from '~/types/common'
import type { Business } from '~/types/business'

/** قرارداد سرویس کسب‌وکارهای نشان‌شده. */
export interface FavoriteService {
  /** کسب‌وکارهای نشان‌شدهٔ کاربر جاری */
  listMine(): Promise<Business[]>
  /** برگردانندهٔ وضعیت جدید نشان (true = نشان شد) */
  toggle(businessId: EntityId): Promise<boolean>
  isSaved(businessId: EntityId): Promise<boolean>
}
