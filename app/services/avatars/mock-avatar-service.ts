import { ServiceError } from '~/utils/errors'
import {
  isPersistableAvatarUrl,
  MOCK_AVATAR_ASSETS,
  type MockAvatarAsset
} from '~/services/mocks/avatar-assets'
import type {
  AvatarPersistResult,
  AvatarPreset,
  AvatarPreview,
  AvatarService
} from './avatar-service'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // ۲ مگابایت — سقف منطقی برای تصویر پروفایل
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']

/**
 * استراتژی آواتار در حالت mock.
 *
 * - آواتارهای آماده: asset محلی (data-URL کوتاه) → ماندگار در state کاربر.
 * - فایل انتخابی کاربر: فقط پیش‌نمایش زنده (نگه‌داشتن در همین instance سرویس).
 *   هیچ «endpoint آپلود» جعلی‌ای ساخته نمی‌شود و هیچ فایل واقعی جایی فرستاده
 *   نمی‌شود؛ دقیقاً همان نقطه‌ای که بک‌اند AdonisJS بعداً پر می‌کند.
 */
export class MockAvatarService implements AvatarService {
  /** پیش‌نمایش‌های غیرقابل‌ماندگاری که تا پایان همین نشست نگه داشته می‌شوند. */
  private previews = new Map<string, string>()

  async listPresets(): Promise<AvatarPreset[]> {
    await delay(120)
    return MOCK_AVATAR_ASSETS.map((asset: MockAvatarAsset) => ({
      id: asset.id,
      label: asset.label,
      url: asset.url
    }))
  }

  async previewFile(file: File): Promise<AvatarPreview> {
    if (import.meta.server) {
      throw new ServiceError('AVATAR.CLIENT_ONLY', 'انتخاب تصویر فقط در سمت کاربر ممکن است.')
    }
    await delay(200)

    if (!file.type.startsWith('image/') || !ACCEPTED_TYPES.includes(file.type)) {
      throw new ServiceError(
        'AVATAR.TYPE_UNSUPPORTED',
        'فقط تصویر مجاز است (JPG، PNG، WEBP یا GIF).',
        415
      )
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new ServiceError(
        'AVATAR.TOO_LARGE',
        'حجم تصویر زیاد است؛ تصویری کمتر از ۲ مگابایت انتخاب کنید.',
        413
      )
    }

    const url = await readAsDataUrl(file)
    return {
      url,
      fileName: file.name,
      // تصویر محلی کاربر در mock جایی بارگذاری نمی‌شود؛ فقط پیش‌نمایش است.
      persistable: isPersistableAvatarUrl(url)
    }
  }

  async persist(userId: string, url: string | null): Promise<AvatarPersistResult> {
    await delay(120)
    if (!url) {
      this.previews.delete(userId)
      return { url: null, persisted: true }
    }
    if (isPersistableAvatarUrl(url)) {
      this.previews.delete(userId)
      return { url, persisted: true }
    }
    // بزرگ‌تر از آن است که در state کاربر جا شود → فقط برای همین نشست نگه می‌داریم.
    this.previews.set(userId, url)
    return { url: null, persisted: false }
  }

  displayUrl(userId: string, storedUrl: string | null): string | null {
    return this.previews.get(userId) ?? storedUrl ?? null
  }
}

/** خواندن فایل به data-URL — بدون وابستگی به کتابخانهٔ سوم. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(
      new ServiceError('AVATAR.READ_FAILED', 'خواندن تصویر ممکن نشد. دوباره تلاش کنید.')
    )
    reader.readAsDataURL(file)
  })
}
