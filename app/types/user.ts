/**
 * «فقط یک موجودیت User وجود دارد.»
 * همهٔ کاربران یک حساب واحد دارند؛ قابلیت‌ها (capabilities) تعیین می‌کنند
 * کدام تجربه‌ها (مشتری / کسب‌وکار / کارمند) برایشان فعال است.
 */

/** حالت‌های تجربهٔ کاربری — معادل سوییچ بین «نقش‌ها». */
export type UserMode = 'customer' | 'business' | 'employee'

export type UserCapability =
  | { kind: 'customer' }
  | { kind: 'owner'; businessId: EntityId }
  | { kind: 'employee'; businessId: EntityId; employeeId: EntityId }

export interface AppUser {
  id: EntityId
  phone: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  capabilities: UserCapability[]
  createdAt: ISODateTime
}

export interface AuthSession {
  user: AppUser
  accessToken: string
  issuedAt: ISODateTime
  expiresAt: ISODateTime
}
