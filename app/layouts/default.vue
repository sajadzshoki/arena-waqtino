<script setup lang="ts">
/**
 * پوستهٔ اصلی موبایل‌محور: هدر + ستون محتوا + ناوبری پایین + سوییچر حالت.
 *
 * صفحه‌ها می‌توانند با meta تنظیم کنند:
 *   tabbar: false → نوار پایین مخفی شود
 *   header: false → هدر سراسری مخفی شود (صفحهٔ هدر سفارشی دارد)
 */
const route = useRoute()

const showTabBar = computed(() => route.meta.tabbar !== false)
const showHeader = computed(() => route.meta.header !== false)
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <AppHeader v-if="showHeader" />

    <main
      class="mx-auto w-full max-w-(--wq-content-max) px-4 pt-4 sm:border-x sm:border-line"
      :style="{
        paddingTop: showHeader ? '1rem' : 'calc(env(safe-area-inset-top) + 1rem)',
        paddingBottom: showTabBar
          ? 'calc(var(--wq-tabbar-h) + env(safe-area-inset-bottom) + 1.5rem)'
          : 'calc(env(safe-area-inset-bottom) + 1.5rem)'
      }"
    >
      <slot />
    </main>

    <AppBottomNavigation v-show="showTabBar" />
    <AppModeSwitcher />
  </div>
</template>
