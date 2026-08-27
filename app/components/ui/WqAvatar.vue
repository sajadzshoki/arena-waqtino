<script setup lang="ts">
/**
 * WqAvatar — آواتار استاندارد (تصویر یا حروف اول نام).
 */
const props = withDefaults(
  defineProps<{
    name: string
    src?: string | null
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { src: null, size: 'md' }
)

const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join(' ')
)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'size-6 text-[0.625rem]'
    case 'sm':
      return 'size-8 text-[0.6875rem]'
    case 'lg':
      return 'size-14 text-lg'
    case 'xl':
      return 'size-20 text-2xl'
    default:
      return 'size-10 text-sm'
  }
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary"
    :class="sizeClass"
  >
    <img v-if="src" :src="src" :alt="`تصویر ${name}`" class="size-full object-cover">
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
