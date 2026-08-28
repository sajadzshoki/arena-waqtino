import type { AvatarPreset, AvatarPreview } from '~/services/avatars/avatar-service'
import type { LoadStatus } from '~/types/common'

/**
 * منطق انتخاب آواتار — UI را از «چگونگی» آواتار بی‌نیاز می‌کند:
 *
 *   ProfileAvatarEditor → useProfileAvatar() → services.avatars (استراتژی mock)
 *
 * دو مسیر واقعی در این فاز:
 *   ۱) آواتارهای آماده (mock asset، قابل‌ذخیره، کوتاه)
 *   ۲) فایل محلی کاربر → فقط پیش‌نمایش همین نشست (persistable: false)
 * هیچ endpoint آپلود جعلی‌ای ساخته نشده؛ نقطهٔ اتصال بک‌اند در قرارداد
 * `AvatarService` شرح داده شده است.
 */
export function useProfileAvatar() {
  const services = useServices()
  const { recover, message } = useAuthRecovery()

  const presets = useState<AvatarPreset[]>('avatar:presets', () => [])
  const status = useState<LoadStatus>('avatar:presets-status', () => 'idle')
  const error = useState<string | null>('avatar:presets-error', () => null)
  const working = useState<boolean>('avatar:working', () => false)
  const operationError = useState<string | null>('avatar:operation-error', () => null)
  /**
   * آدرس‌هایی که از فایل محلی کاربر ساخته شده‌اند (پیش‌نمایش همین نشست).
   * UI با همین فهرست صادقانه می‌گوید «تصویر ماندگار نشده است» — بدون اینکه
   * جزئیات استراتژی mock به کامپوننت نشت کند.
   */
  const localPreviews = useState<string[]>('avatar:local-previews', () => [])

  /** یک‌بار در هر نشست اپ — آواتارهای آماده از لایهٔ سرویس. */
  async function loadPresets(): Promise<void> {
    if (status.value === 'ready' || status.value === 'loading') return
    status.value = 'loading'
    error.value = null
    try {
      presets.value = await services.avatars.listPresets()
      status.value = 'ready'
    }
    catch (e) {
      status.value = 'error'
      if (!(await recover(e))) error.value = message(e)
    }
  }

  /**
   * فایل انتخابی کاربر → پیش‌نمایش.
   * خروجی `null` یعنی ناموفق (پیام خطا در `operationError` است).
   */
  async function previewFile(file: File | null | undefined): Promise<AvatarPreview | null> {
    operationError.value = null
    if (!file) return null
    working.value = true
    try {
      const preview = await services.avatars.previewFile(file)
      if (!preview.persistable) {
        localPreviews.value = [...localPreviews.value, preview.url]
      }
      return preview
    }
    catch (e) {
      operationError.value = message(e)
      return null
    }
    finally {
      working.value = false
    }
  }

  function clearError(): void {
    operationError.value = null
  }

  /** آیا این آدرس فقط پیش‌نمایش محلی است؟ (برای توضیح صادقانه در UI) */
  function isLocalPreview(url: string | null | undefined): boolean {
    return !!url && localPreviews.value.includes(url)
  }

  return {
    presets: readonly(presets),
    presetsLoading: computed(() => status.value === 'loading'),
    presetsError: readonly(error),
    working: readonly(working),
    isLocalPreview,
    operationError: readonly(operationError),
    loadPresets,
    previewFile,
    clearError
  }
}
