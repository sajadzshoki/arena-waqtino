import type { EntityId } from '~/types/common'
import type { UserCapability, UserMode } from '~/types/user'

/**
 * حالت کاربری (Mode) — قلب «کاربر واحد با چند قابلیت».
 *
 * حالت‌های موجود فقط از capabilities واقعی کاربر ساخته می‌شوند و
 * انتخاب فعلی در کوکی ماندگار می‌شود. ناوبری و تجربهٔ UI بر اساس
 * currentMode تغییر می‌کند.
 */
const MODE_COOKIE = 'wq_mode'

export function useUserMode() {
  const { capabilities } = useAuth()
  const services = useServices()

  const availableModes = computed<UserMode[]>(() => {
    const modes = new Set<UserMode>()
    for (const cap of capabilities.value) {
      modes.add(cap.kind === 'owner' ? 'business' : cap.kind)
    }
    return [...modes]
  })

  const storedMode = useCookie<UserMode | null>(MODE_COOKIE, {
    default: () => null,
    sameSite: 'lax'
  })

  const selectedMode = useState<UserMode>('app:mode', () => 'customer')

  /** نام کسب‌وکار مرتبط با هر capability — از لایهٔ سرویس پر می‌شود. */
  const contextLabels = useState<Record<string, string>>(
    'app:context-labels',
    () => ({})
  )

  /** به‌ترتیب اولویت: انتخاب کاربر → مهمان/پیش‌فرض مشتری */
  const currentMode = computed<UserMode>(() => {
    const modes = availableModes.value
    if (modes.length === 0) return 'customer'
    if (modes.includes(selectedMode.value)) return selectedMode.value
    return modes[0] ?? 'customer'
  })

  const currentModeMeta = computed<ModeMeta>(() => MODE_META[currentMode.value])

  /** یک‌بار هنگام شروع برنامه (پلاگین session) صدا زده می‌شود. */
  function initMode(): void {
    if (storedMode.value && availableModes.value.includes(storedMode.value)) {
      selectedMode.value = storedMode.value
    }
    else if (availableModes.value.length > 0) {
      selectedMode.value = availableModes.value[0] ?? 'customer'
    }
  }

  /** نام کسب‌وکارهای قابلیت‌های کاربر را از سرویس برای سوییچر واکشی می‌کند. */
  async function primeModeContext(): Promise<void> {
    const businessIds = capabilities.value
      .filter((c): c is Extract<UserCapability, { businessId: EntityId }> => 'businessId' in c)
      .map(c => c.businessId)

    await Promise.all(
      businessIds.map(async (id) => {
        if (contextLabels.value[id]) return
        const business = await services.businesses.getById(id)
        if (business) contextLabels.value = { ...contextLabels.value, [id]: business.name }
      })
    )
  }

  function setMode(mode: UserMode): boolean {
    if (!availableModes.value.includes(mode)) return false
    selectedMode.value = mode
    storedMode.value = mode
    return true
  }

  /** آیا سوییچر حالت باید نمایش داده شود؟ */
  const canSwitchMode = computed(() => availableModes.value.length > 1)

  /** نام کسب‌وکار مرتبط با یک حالت (اگر داشته باشد) */
  function modeContextLabel(mode: UserMode): string | null {
    const cap = capabilities.value.find(
      c =>
        (mode === 'customer' && c.kind === 'customer') ||
        (mode === 'business' && c.kind === 'owner') ||
        (mode === 'employee' && c.kind === 'employee')
    )
    if (!cap || !('businessId' in cap)) return null
    return contextLabels.value[cap.businessId] ?? null
  }

  return {
    currentMode,
    currentModeMeta,
    availableModes,
    canSwitchMode,
    initMode,
    primeModeContext,
    setMode,
    modeContextLabel
  }
}
