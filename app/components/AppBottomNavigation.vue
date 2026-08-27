<script setup lang="ts">
/**
 * ناوبری پایین — متکی به حالت کاربر:
 * تب‌ها از app/config/navigation.ts خوانده می‌شوند و فقط تب‌های حالت فعلی
 * نمایش داده می‌شوند. تب‌های ساخته‌نشده (enabled=false) خاکستری‌اند و
 * با لمس، اطلاع‌رسانی «در فازهای بعدی» می‌دهند.
 */
const route = useRoute()
const toast = useToast()
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
  toast.add({
    title: `بخش «${item.label}» در فازهای بعدی فعال می‌شود.`,
    icon: 'i-lucide-construction',
    color: 'neutral',
    duration: 2400
  })
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default"
    aria-label="ناوبری اصلی"
  >
    <div
      class="mx-auto grid h-(--wq-tabbar-h) max-w-(--wq-content-max) grid-cols-[repeat(auto-fit,minmax(0,1fr))] grid-flow-col px-1 pb-[env(safe-area-inset-bottom)]"
    >
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="relative flex min-w-14 flex-col items-center justify-center gap-1 transition-colors"
        :class="[
          isActive(item) ? 'text-primary' : 'text-dimmed hover:text-muted',
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
