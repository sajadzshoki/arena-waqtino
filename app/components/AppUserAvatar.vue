<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string
    src?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { src: null, size: 'md' }
)

const initials = computed(() => {
  return props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join(' ')
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-8 text-[0.6875rem]'
    case 'lg':
      return 'size-14 text-lg'
    default:
      return 'size-10 text-sm'
  }
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary"
    :class="sizeClass"
    aria-hidden="true"
  >
    <img
      v-if="src"
      :src="src"
      :alt="`تصویر ${name}`"
      class="size-full object-cover"
    >
    <template v-else>{{ initials }}</template>
  </span>
</template>
