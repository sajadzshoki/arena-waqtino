<script setup lang="ts">
/**
 * WqRating — نمایش امتیاز: ستاره + مقدار عددی فارسی + تعداد نظر.
 * مثال: ★ ۴٫۶ (۲۱۸ نظر)
 */
const props = withDefaults(
  defineProps<{
    value: number
    count?: number
    size?: 'sm' | 'md'
    showCount?: boolean
  }>(),
  { count: undefined, size: 'md', showCount: true }
)

const stars = computed(() => {
  const full = Math.floor(props.value)
  const half = props.value - full >= 0.4
  return { full, half }
})

const formatted = computed(() =>
  new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(props.value)
)

const sizeClass = computed(() => (props.size === 'sm' ? 'size-3.5' : 'size-4'))
</script>

<template>
  <span class="inline-flex items-center gap-1" role="img" :aria-label="`امتیاز ${formatted} از ۵`">
    <span class="inline-flex" dir="ltr">
      <template v-for="i in 5" :key="i">
        <UIcon
          v-if="i <= stars.full"
          name="i-lucide-star"
          :class="[sizeClass, 'fill-warning text-warning']"
        />
        <UIcon
          v-else-if="i === stars.full + 1 && stars.half"
          name="i-lucide-star-half"
          :class="[sizeClass, 'fill-warning text-warning']"
        />
        <UIcon
          v-else
          name="i-lucide-star"
          :class="[sizeClass, 'text-line-strong']"
        />
      </template>
    </span>
    <span class="t-num font-semibold" :class="size === 'sm' ? 'text-xs' : 'text-sm'">
      {{ formatted }}
    </span>
    <span v-if="showCount && count !== undefined" class="t-caption t-num">
      ({{ toFaDigits(count) }} نظر)
    </span>
  </span>
</template>
