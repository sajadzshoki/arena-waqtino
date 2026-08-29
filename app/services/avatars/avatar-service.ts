import type { EntityId } from '~/types/common'

/**
 * قرارداد سرویس آواتار — «استراتژی» پشت دکمهٔ انتخاب تصویر.
 *
 * چرا لایهٔ سرویس؟ صفحهٔ ویرایش پروفایل نباید بداند آواتار از کجا می‌آید:
 *   Avatar UI → useUserProfile → UserService → AvatarService (mock | upload api)
 *
 * فاز ۷ (mock):
 *   - `listPresets()`  آواتارهای آماده و پایدار (قابل ذخیره در state کاربر)
 *   - `previewFile()`  پیش‌نمایش محلی از فایل انتخابی — بدون آپلود واقعی
 *   - `persist()`      تصمیم می‌گیرد کدام مقدار ماندگار می‌شود
 * فاز بک‌اند: همین امضا با `POST /users/me/avatar` (multipart) پر می‌شود؛ UI تغییری
 * نمی‌کند و هیچ endpoint ساختگی‌ای در این فاز ساخته نمی‌شود.
 */

export interface AvatarPreset {
  id: EntityId
  label: string
  /** آدرس قابل‌نمایش و قابل‌ذخیره */
  url: string
}

export interface AvatarPreview {
  /** آدرس پیش‌نمایش (data/object URL محلی) */
  url: string
  fileName: string
  /** آیا این آدرس در mock قابل ماندگاری است؟ */
  persistable: boolean
}

export interface AvatarPersistResult {
  /** مقداری که باید در پروفایل ذخیره شود */
  url: string | null
  /** آیا واقعاً ماندگار شد؟ (false = فقط پیش‌نمایش همین نشست) */
  persisted: boolean
}

export interface AvatarService {
  listPresets(): Promise<AvatarPreset[]>
  previewFile(file: File): Promise<AvatarPreview>
  persist(userId: EntityId, url: string | null): Promise<AvatarPersistResult>
  /** آدرس مؤثر برای نمایش: پیش‌نمایش نشست جاری بر مقدار ذخیره‌شده اولویت دارد. */
  displayUrl(userId: EntityId, storedUrl: string | null): string | null
}
