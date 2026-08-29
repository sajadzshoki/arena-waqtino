import type { AuthSession } from '~/types/user'
import type { Business } from '~/types/business'
import type { EntityId } from '~/types/common'
import type { AuthService } from '~/services/auth/auth-service'
import { MOCK_BUSINESSES } from '~/services/mocks/businesses'
import { requireMockSession } from '~/services/mocks/session'
import { ServiceError } from '~/utils/errors'

/**
 * مالکیت کسب‌وکار — تنها جایی که «آیا این کسب‌وکار مال این کاربر است» در حالت
 * mock پاسخ داده می‌شود (فاز ۸ برای داشبورد، فاز ۹ برای سرویس‌ها و فازهای
 * بعدی برای کارمند/دسترس‌پذیری).
 *
 * قاعدهٔ ترتیب: اول «وجود»، بعد «مالکیت» — تا پیام «چنین کسب‌وکاری نیست» از
 * «مال تو نیست» جدا بماند و از لو رفتن وجود یک رکورد دیگری جلوگیری شود.
 * در حالت api همان بررسی سمت سرور است و ۴۰۳/۴۰۴ را همین‌جا به همین
 * `ServiceError`ها تبدیل می‌کنیم.
 */

export async function requireOwnerUserId(auth: AuthService): Promise<EntityId> {
  const session: AuthSession = await requireMockSession(auth)
  return session.user.id
}

export async function resolveOwnedBusiness(auth: AuthService, businessId: EntityId): Promise<Business> {
  const userId = await requireOwnerUserId(auth)
  const business = MOCK_BUSINESSES.find(b => b.id === businessId)
  if (!business) {
    throw ServiceError.notFound('چنین کسب‌وکاری در وقتینو ثبت نشده است.')
  }
  if (business.ownerUserId !== userId) {
    throw ServiceError.forbidden('شما مدیر این کسب‌وکار نیستید؛ فقط کسب‌وکارهای خودتان قابل مدیریت‌اند.')
  }
  return business
}
