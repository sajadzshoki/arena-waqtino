<script setup lang="ts">
/**
 * ورودی جستجو — نقطهٔ ورود به صفحهٔ جستجو (فاز بعد).
 * کاملاً تاپ‌بل، موبایل‌محور، و با placeholder فارسی.
 */
defineEmits<{ click: [] }>()
</script>

<template>
  <NuxtLink
    to="/search"
    class="pressable group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
    role="searchbox"
    aria-label="جستجوی کسب‌وکار و خدمات"
    @click="$emit('click')"
  >
    <UIcon
      name="i-lucide-search"
      class="size-5 shrink-0 text-foreground-muted transition-colors group-focus-within:text-primary"
    />
    <span class="t-body-sm flex-1 text-foreground-muted">
      دنبال چه خدماتی هستید؟
    </span>
    <span
      class="flex size-7 items-center justify-center rounded-lg bg-surface-muted transition-colors group-hover:bg-primary-soft"
      aria-hidden="true"
    >
      <UIcon name="i-lucide-sliders-horizontal" class="size-4 text-foreground-muted" />
    </span>
  </NuxtLink>
</template>
