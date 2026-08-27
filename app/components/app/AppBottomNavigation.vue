<script setup lang="ts">
/**
 * ناوبری پایین — متکی به حالت کاربر.
 * پیکربندی از app/config/navigation.ts؛ فعال‌سازی بخش‌های جدید فقط از آنجا.
 */
const route = useRoute()
const { currentMode } = useUserMode()

const items = computed<AppNavItem[]>(() => NAVIGATION[currentMode.value])

function isActive(item: AppNavItem): boolean {
  if (!item.enabled || !item.to) return false
  // مسیر فرود حالت فقط با مسیر دقیق فعال می‌شود؛ بقیهٔ تب‌ها prefix-match.
  const isModeRoot = MODE_LANDING[currentMode.value] === item.to
  return isModeRoot ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface"
    aria-label="ناوبری اصلی"
  >
    <div
      class="mx-auto grid h-[calc(var(--wq-tabbar-h)+env(safe-area-inset-bottom))] max-w-(--wq-content-max) grid-flow-col px-1 pb-safe"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.key"
        :to="item.enabled && item.to ? item.to : route.path"
        :custom="false"
        class="pressable relative flex min-w-14 flex-col items-center justify-center gap-1"
        :class="[
          isActive(item)
            ? 'text-primary'
            : 'text-foreground-muted hover:text-foreground-secondary',
          !item.enabled && 'pointer-events-none opacity-45'
        ]"
        :aria-current="isActive(item) ? 'page' : undefined"
        :aria-label="item.label"
        :aria-disabled="!item.enabled"
        :tabindex="item.enabled ? 0 : -1"
      >
        <span
          class="absolute top-0 h-0.5 w-9 rounded-full bg-primary transition-opacity"
          :class="isActive(item) ? 'opacity-100' : 'opacity-0'"
        />
        <UIcon :name="item.icon" class="size-6" />
        <span class="text-[0.6875rem] leading-4 font-medium">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
