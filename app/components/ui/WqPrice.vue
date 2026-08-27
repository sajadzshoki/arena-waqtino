<script setup lang="ts">
/**
 * WqPrice — نمایش استاندارد قیمت (تومان، ارقام فارسی).
 * amount=0 → «رایگان». حذف‌شده‌ها با strike.
 */
const props = withDefaults(
  defineProps<{
    amount: Toman
    size?: 'sm' | 'md' | 'lg'
    muted?: boolean
    strike?: boolean
  }>(),
  { size: 'md', muted: false, strike: false }
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-lg'
    default:
      return 'text-sm'
  }
})

const formatted = computed(() => formatToman(props.amount).replace(' تومان', ''))
</script>

<template>
  <span
    class="t-num inline-flex items-baseline gap-1 font-semibold"
    :class="[
      sizeClass,
      muted ? 'text-foreground-secondary' : 'text-foreground',
      strike && 'text-foreground-muted line-through'
    ]"
  >
    <template v-if="amount > 0">
      <span>{{ formatted }}</span>
      <span class="text-[0.75em] font-normal text-foreground-muted">تومان</span>
    </template>
    <span v-else class="text-success">رایگان</span>
  </span>
</template>
