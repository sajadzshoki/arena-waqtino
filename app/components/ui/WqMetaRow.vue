<script setup lang="ts">
/**
 * WqMetaRow — ردیف «آیکون + برچسب/مقدار» برای نمایش ابرداده در جزئیات.
 * مثال: آدرس، تلفن، مدت زمان، ظرفیت…
 */
withDefaults(
  defineProps<{
    icon: string
    label?: string
    value?: string
  }>(),
  { label: undefined, value: undefined }
)

defineSlots<{
  default?: () => unknown
  trailing?: () => unknown
}>()
</script>

<template>
  <div class="flex items-center gap-2.5 py-1.5">
    <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-secondary">
      <UIcon :name="icon" class="size-4" />
    </span>
    <div class="min-w-0 flex-1">
      <span v-if="label" class="t-caption block">{{ label }}</span>
      <span v-if="value" class="t-body-sm block truncate text-foreground">{{ value }}</span>
      <slot />
    </div>
    <slot name="trailing" />
  </div>
</template>
