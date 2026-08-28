import type { ProfileUpdateResult, UpdateProfileInput } from '~/services/users/user-service'
import type { LoadStatus } from '~/types/common'
import type { AppUser } from '~/types/user'

/**
 * state مرکزی پروفایل کاربر (Customer Profile).
 *
 *   Profile / Edit Profile → useUserProfile() → services.users (Mock | Api)
 *
 * دو قاعدهٔ مهم:
 *   ۱) snapshot کاربر در `useAuth()` تنها مرجع نمایش هویت در کل اپ است (هدر،
 *      پروفایل، …). اینجا بعد از ویرایش همان state به‌روز می‌شود؛ هیچ نسخهٔ
 *      دومی از «کاربر» در کامپوننت‌ها نگه داشته نمی‌شود.
 *   ۲) هر نوشتنی از لایهٔ سرویس می‌گذرد؛ صفحه هیچ‌گاه شیء mock را مستقیم
 *      تغییر نمی‌دهد.
 */
export function useUserProfile() {
  const services = useServices()
  const { user, isAuthenticated, applyUserUpdate } = useAuth()
  const authRecovery = useAuthRecovery()

  const loaded = useState<AppUser | null>('profile:loaded', () => null)
  const status = useState<LoadStatus>('profile:status', () => 'idle')
  const loadError = useState<string | null>('profile:load-error', () => null)
  const saving = useState<boolean>('profile:saving', () => false)
  const saveError = useState<string | null>('profile:save-error', () => null)

  /** هویت مؤثر: آنچه از سرویس خوانده شده، وگرنه snapshot نشست. */
  const profile = computed<AppUser | null>(() => loaded.value ?? user.value)
  /** هنوز واکشی نخستی تمام نشده — صفحه‌ها در این بازه اسکلت نشان می‌دهند. */
  const initializing = computed(() => status.value === 'idle' || status.value === 'loading')

  async function load(): Promise<void> {
    if (!isAuthenticated.value) {
      reset()
      return
    }
    status.value = 'loading'
    loadError.value = null
    try {
      const fresh = await services.users.getProfile()
      loaded.value = fresh
      applyUserUpdate(fresh)
      status.value = 'ready'
    }
    catch (e) {
      status.value = 'error'
      // نشست نامعتبر → مدیریت مرکزی؛ خطای معمولی → پیام فارسی inline
      loadError.value = await authRecovery.recover(e) ? null : authRecovery.message(e)
    }
  }

  /** ذخیرهٔ عمدی (نه autosave) — نتیجهٔ سرویس به state مرکزی نشست داده می‌شود. */
  async function save(input: UpdateProfileInput): Promise<ProfileUpdateResult | null> {
    saving.value = true
    saveError.value = null
    try {
      const result = await services.users.updateProfile(input)
      loaded.value = result.user
      applyUserUpdate(result.user)
      return result
    }
    catch (e) {
      saveError.value = await authRecovery.recover(e) ? null : authRecovery.message(e)
      return null
    }
    finally {
      saving.value = false
    }
  }

  /** پاک‌سازی state کاربر-محور (logout / تغییر حساب). */
  function reset(): void {
    loaded.value = null
    status.value = 'idle'
    loadError.value = null
    saveError.value = null
    saving.value = false
  }

  return {
    profile,
    status: readonly(status),
    loading: computed(() => status.value === 'loading'),
    initializing,
    error: readonly(loadError),
    saving: readonly(saving),
    saveError: readonly(saveError),
    load,
    save,
    reset
  }
}
