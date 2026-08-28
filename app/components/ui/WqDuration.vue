<script setup lang="ts">
/** WqDuration — نمایش مدت خدمت: «۱۲۰ دقیقه» → «۲ ساعت». */
withDefaults(
  defineProps<{
    minutes: number
    icon?: boolean
  }>(),
  { icon: true }
)
</script>

<template>
  <span class="inline-flex items-center gap-1 text-foreground-secondary">
    <UIcon v-if="icon" name="i-lucide-timer" class="size-3.5" />
    <span class="t-body-sm t-num">{{ formatDurationFa(minutes) }}</span>
  </span>
</template>
