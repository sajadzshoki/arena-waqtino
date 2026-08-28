<script setup lang="ts">
/**
 * چیدمان مهمان — ورود/OTP. بدون هدر و تب‌بار اپ؛ ستون باریک متمرکز.
 */
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background text-foreground">
    <main
      class="mx-auto flex w-full max-w-sm flex-1 flex-col px-6 pt-safe pb-safe"
      style="padding-top: calc(env(safe-area-inset-top) + 3rem)"
    >
      <slot />
    </main>
    <footer class="py-4 text-center">
      <p class="t-caption">وقتینو — رزرو آنلاین نوبت</p>
    </footer>
  </div>
</template>
