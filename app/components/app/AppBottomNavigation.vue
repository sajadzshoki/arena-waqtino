<script setup lang="ts">
/**
 * ناوبری پایین — متکی به حالت کاربر.
 * کُنفیگ از app/config/navigation.ts؛ تب‌های فازهای بعد enabled=false هستند
 * و با لمس، اطلاع‌رسانی دوستانه نشان می‌دهند تا ناوبری «شکسته» به نظر نرسد.
 */
const route = useRoute()
const toast = useAppToast()
const { currentMode } = useUserMode()

const items = computed<AppNavItem[]>(() => NAVIGATION[currentMode.value])

function isActive(item: AppNavItem): boolean {
  return !!item.enabled && !!item.to && route.path === item.to
}

function onSelect(item: AppNavItem) {
  if (item.enabled && item.to) {
    navigateTo(item.to)
    return
  }
  toast.neutral(`بخش «${item.label}» در فازهای بعدی فعال می‌شود.`, 'i-lucide-construction')
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
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="pressable relative flex min-w-14 flex-col items-center justify-center gap-1"
        :class="[
          isActive(item)
            ? 'text-primary'
            : 'text-foreground-muted hover:text-foreground-secondary',
          !item.enabled && 'opacity-45'
        ]"
        :aria-current="isActive(item) ? 'page' : undefined"
        :aria-label="item.label"
        @click="onSelect(item)"
      >
        <span
          class="absolute top-0 h-0.5 w-9 rounded-full bg-primary transition-opacity"
          :class="isActive(item) ? 'opacity-100' : 'opacity-0'"
        />
        <UIcon :name="item.icon" class="size-6" />
        <span class="text-[0.6875rem] leading-4 font-medium">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
