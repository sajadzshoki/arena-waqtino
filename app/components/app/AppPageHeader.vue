<script setup lang="ts">
/**
 * AppPageHeader — سربرگ استاندارد صفحات اصلی (خانه/داشبورد).
 * الگو: عنوان بزرگ + زیرعنوان اختیاری + اکشن‌های سمت چپ.
 */
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
  }>(),
  { subtitle: undefined }
)

defineSlots<{ actions?: () => unknown }>()
</script>

<template>
  <div class="mb-5 flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h1 class="t-h1 text-foreground-strong">{{ title }}</h1>
      <p v-if="subtitle" class="t-body-sm text-foreground-secondary mt-1">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
      <slot name="actions" />
    </div>
  </div>
</template>
