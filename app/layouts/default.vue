<script setup lang="ts">
/** پوستهٔ اصلی موبایل‌محور: هدر + محتوای ستونی + ناوبری پایین + سوییچر حالت */
</script>

<template>
  <div class="min-h-dvh bg-default text-default">
    <AppHeader />

    <main
      class="mx-auto w-full max-w-(--wq-content-max) px-4 pt-4 sm:border-x sm:border-default"
      style="padding-bottom: calc(var(--wq-tabbar-h) + env(safe-area-inset-bottom) + 1.5rem)"
    >
      <slot />
    </main>

    <AppBottomNavigation />
    <AppModeSwitcher />
  </div>
</template>
