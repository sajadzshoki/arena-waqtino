import type { AppUser } from '~/types/user'

/**
 * قرارداد «مخزن پروفایل کاربر».
 *
 * صفحات هرگز شیء کاربر mock را جای‌پراکنده ویرایش نمی‌کنند؛ تنها مسیر نوشتن
 * همین interface است:
 *
 *   Profile Page → useUserProfile() → UserService → (Mock | Api)
 *
 * معادل بک‌اند (فاز اتصال AdonisJS):
 *   getProfile     → GET   /auth/me
 *   updateProfile  → PATCH /auth/me
 * و آواتار هم از طریق همان `updateProfile` (فیلد `avatarUrl`) یا در صورت نیاز
 * endpoint اختصاصی آپلود — بدون تغییر در مصرف‌کنندگان.
 */
export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  /**
   * `null` = حذف آواتار و بازگشت به حروف اول نام.
   * `undefined` = آواتار دست‌نخورده بماند.
   */
  avatarUrl?: string | null
}

export interface ProfileUpdateResult {
  /** کاربر مؤثر پس از ذخیره (همان چیزی که UI باید نمایش دهد). */
  user: AppUser
  /**
   * `false` یعنی آواتار فقط پیش‌نمایش همین نشست است و ماندگار نشده —
   * UI باید این را صادقانه به کاربر بگوید، نه وانمود به آپلود موفق.
   */
  avatarPersisted: boolean
}

export interface UserService {
  getProfile(): Promise<AppUser>
  updateProfile(input: UpdateProfileInput): Promise<ProfileUpdateResult>
}
