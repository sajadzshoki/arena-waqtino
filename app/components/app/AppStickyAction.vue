<script setup lang="ts">
/**
 * AppStickyAction — ناحیهٔ اکشن چسبیده به پایین صفحه (CTA اصلی فرم/جزئیات).
 * بالای نوار ناوبری قرار می‌گیرد (وقتی فعال است) و safe-area را رعایت می‌کند.
 */
const route = useRoute()

const hasTabBar = computed(() => route.meta.tabbar !== false)
</script>

<template>
  <div
    class="fixed inset-x-0 z-30 border-t border-line bg-surface-raised shadow-raised"
    :style="{ bottom: hasTabBar ? 'calc(var(--wq-tabbar-h) + env(safe-area-inset-bottom))' : '0px' }"
  >
    <div
      class="mx-auto max-w-(--wq-content-max) px-4 py-3"
      :class="{ 'pb-[max(env(safe-area-inset-bottom),0.75rem)]': !hasTabBar }"
    >
      <slot />
    </div>
  </div>
</template>
