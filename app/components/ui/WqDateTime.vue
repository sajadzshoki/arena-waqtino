<script setup lang="ts">
/**
 * WqDateTime — نمایش استاندارد تاریخ/ساعت فارسی.
 * mode: date (۵ شهریور), datetime (۵ شهریور، ۱۴:۳۰), time (۱۴:۳۰), full
 */
const props = withDefaults(
  defineProps<{
    value: Date | string | number
    mode?: 'date' | 'datetime' | 'time' | 'full'
    prefix?: string
  }>(),
  { mode: 'date', prefix: undefined }
)

const text = computed(() => {
  switch (props.mode) {
    case 'time':
      return formatFaTime(props.value)
    case 'datetime':
      return `${formatFaDate(props.value)}، ${formatFaTime(props.value)}`
    case 'full':
      return formatFaDateFull(props.value)
    default:
      return formatFaDate(props.value)
  }
})
</script>

<template>
  <span class="t-num">{{ prefix }}{{ text }}</span>
</template>
