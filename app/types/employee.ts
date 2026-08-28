export interface Employee {
  id: EntityId
  businessId: EntityId
  /** اگر کارمند خودش حساب کاربری دارد به User متصل می‌شود */
  userId?: EntityId
  name: string
  /** عنوان شغلی فارسی، مثل «آرایشگر زنانه» یا «دندانپزشک» */
  title?: string
  avatarUrl?: string | null
  /** آیا در حاضر برای رزرو فعال است؟ */
  isActive: boolean
}
