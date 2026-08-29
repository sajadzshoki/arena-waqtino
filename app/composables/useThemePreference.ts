import type { ThemeOption, ThemePreference } from '~/types/theme'

/**
 * مدیر متمرکز ظاهر/تم — تنها نقطه‌ای که «ترجیح تم» خوانده/نوشته می‌شود.
 *
 *   Settings (ظاهر) ─┐
 *   AppThemeToggle  ─┤→ useThemePreference() → useColorMode() (@nuxtjs/color-mode)
 *   (هر کامپوننتی)  ─┘
 *
 * ماندگاری: `localStorage` با کلید `wq-color-mode` + اسکریپت تزریق‌شدهٔ ماژول که
 * کلاس `.dark` را *قبل از paint* می‌زند؛ پس:
 *   - فلاش حالت روشن هنگام باز شدن اپ با تم تیره رخ نمی‌دهد
 *   - حالت اولیه غلط نمایش داده نمی‌شود (unknown → پس از mount تصحیح می‌شود)
 *   - «هماهنگ با سیستم» با matchMedia زنده دنبال می‌شود
 *
 * هیچ کامپوننتی تم را با `classList` دستی تغییر نمی‌دهد و هیچ
 * رنگی در کامپوننت hardcode نمی‌شود — همه از توکن‌های معنایی (tokens.css).
 */
/** ترتیب چرخش در دکمهٔ هدر = ترتیب نمایش در تنظیمات. */
export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'system',
    label: 'هماهنگ با سیستم',
    description: 'همان تنظیمات گوشی/مرورگر شما',
    icon: 'i-lucide-monitor-smartphone'
  },
  {
    value: 'light',
    label: 'روشن',
    description: 'پس‌زمینهٔ روشن، همیشه',
    icon: 'i-lucide-sun'
  },
  {
    value: 'dark',
    label: 'تیره',
    description: 'پس‌زمینهٔ تیره، برای چشم در شب',
    icon: 'i-lucide-moon'
  }
]

const STORAGE_KEY = 'wq-color-mode'

export function useThemePreference() {
  const colorMode = useColorMode()

  const preference = computed<ThemePreference>(
    () => (colorMode.preference as ThemePreference) || 'system'
  )
  /** تم مؤثر — وقتی «سیستم» انتخاب شده، همان چیزی که محیط می‌گوید. */
  const resolved = computed<'light' | 'dark'>(() =>
    colorMode.value === 'dark' ? 'dark' : 'light'
  )
  const isDark = computed(() => resolved.value === 'dark')
  const currentOption = computed<ThemeOption>(
    () => THEME_OPTIONS.find(o => o.value === preference.value) ?? THEME_OPTIONS[0]!
  )
  /** `true` وقتی انتخاب کاربر «سیستم» است و تم از محیط می‌آید. */
  const followsSystem = computed(() => preference.value === 'system')

  /**
   * ماندگاری در دسترس است؟ (localStorage در private mode / غیرفعال‌شده ممکن است
   * بنویسد ولی نماند — پس قبل از قول‌دادنِ «ذخیره شد» واقعیت را می‌سنجیم.)
   */
  function storageAvailable(): boolean {
    if (!import.meta.client) return true
    try {
      const probe = `${STORAGE_KEY}:probe`
      window.localStorage.setItem(probe, '1')
      window.localStorage.removeItem(probe)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * اعمال ترجیح. بازگشتی `false` فقط وقتی مرورگر اجازهٔ ذخیره نداد —
   * UI باید صادقانه بگوید ترجیح فقط برای همین صفحه نگه داشته می‌شود.
   */
  function setPreference(next: ThemePreference): boolean {
    colorMode.preference = next
    return storageAvailable()
  }

  const resolvedLabel = computed(() => (resolved.value === 'dark' ? 'تیره' : 'روشن'))

  /** چرخش سیستم → روشن → تیره (دکمهٔ هدر). */
  function cycle(): void {
    const index = THEME_OPTIONS.findIndex(o => o.value === preference.value)
    const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length]?.value ?? 'system'
    setPreference(next)
  }

  const label = computed(() => currentOption.value.label)

  return {
    options: THEME_OPTIONS,
    preference,
    resolved,
    isDark,
    resolvedLabel,
    followsSystem,
    currentOption,
    label,
    setPreference,
    cycle
  }
}
