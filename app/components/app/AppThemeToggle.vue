<script setup lang="ts">
/**
 * AppThemeToggle — چرخهٔ حالت نمایش: سیستم → روشن → تیره.
 * ترجیح کاربر در کوکی (storageKey: wq-color-mode) نگه داشته می‌شود.
 */
const colorMode = useColorMode()

type Preference = 'system' | 'light' | 'dark'
const ORDER: Preference[] = ['system', 'light', 'dark']

const meta: Record<Preference, { icon: string; label: string }> = {
  system: { icon: 'i-lucide-monitor-smartphone', label: 'هماهنگ با سیستم' },
  light: { icon: 'i-lucide-sun', label: 'روشن' },
  dark: { icon: 'i-lucide-moon', label: 'تیره' }
}

const preference = computed<Preference>({
  get: () => (colorMode.preference as Preference) || 'system',
  set: value => {
    colorMode.preference = value
  }
})

const current = computed(() => meta[preference.value] ?? meta.system)

function cycle() {
  const index = ORDER.indexOf(preference.value)
  preference.value = ORDER[(index + 1) % ORDER.length] ?? 'system'
}
</script>

<template>
  <WqIconButton
    :icon="current.icon"
    :label="`حالت نمایش: ${current.label} — برای تغییر لمس کنید`"
    variant="ghost"
    size="lg"
    @click="cycle"
  />
</template>
