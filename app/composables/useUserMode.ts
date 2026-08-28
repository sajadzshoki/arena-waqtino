import type { EntityId } from '~/types/common'
import type { UserCapability, UserMode } from '~/types/user'

/**
 * حالت کاربری (Mode) — قلب «کاربر واحد با چند قابلیت».
 *
 * قواعد حالت پیش‌فرض (متمرکز، همین‌جا):
 *   ۱) انتخاب معتبر ذخیره‌شدهٔ کاربر
 *   ۲) مشتری (اگر قابلیتش را دارد)
 *   ۳) اولین قابلیت موجود
 *   ۴) مهمان → مشتری (مرور عمومی)
 * حالت در کوکی wq_mode ماندگار است؛ حالت نامعتبر هرگز اعمال نمی‌شود.
 */
const MODE_COOKIE = 'wq_mode'

/** ترتیب ترجیح حالت پیش‌فرض */
const MODE_PREFERENCE: UserMode[] = ['customer', 'business', 'employee']

export function resolveDefaultMode(
  available: UserMode[],
  stored?: UserMode | null
): UserMode {
  if (stored && available.includes(stored)) return stored
  for (const mode of MODE_PREFERENCE) {
    if (available.includes(mode)) return mode
  }
  return available[0] ?? 'customer'
}

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
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60
  })

  const selectedMode = useState<UserMode>('app:mode', () => 'customer')

  /** نام کسب‌وکار مرتبط با هر capability — از لایهٔ سرویس پر می‌شود. */
  const contextLabels = useState<Record<string, string>>(
    'app:context-labels',
    () => ({})
  )

  /** به‌ترتیب اولویت: انتخاب کاربر → پیش‌فرض (متمرکز در resolveDefaultMode) */
  const currentMode = computed<UserMode>(() => {
    const modes = availableModes.value
    if (modes.length === 0) return 'customer'
    if (modes.includes(selectedMode.value)) return selectedMode.value
    return resolveDefaultMode(modes, null)
  })

  const currentModeMeta = computed<ModeMeta>(() => MODE_META[currentMode.value])

  /** یک‌بار هنگام شروع برنامه (پلاگین session) صدا زده می‌شود. */
  function initMode(): void {
    selectedMode.value = resolveDefaultMode(availableModes.value, storedMode.value)
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
