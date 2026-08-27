<script setup lang="ts">
/**
 * پوستهٔ اصلی موبایل‌محور: هدر + ستون محتوا + ناوبری پایین + سوییچر حالت.
 * صفحات جزئیات/فرم می‌توانند با `definePageMeta({ tabbar: false })`
 * نوار پایین را مخفی کنند (و از AppStickyAction استفاده کنند).
 */
const route = useRoute()

const showTabBar = computed(() => route.meta.tabbar !== false)
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <AppHeader />

    <main
      class="mx-auto w-full max-w-(--wq-content-max) px-4 pt-4 sm:border-x sm:border-line"
      :style="{
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
