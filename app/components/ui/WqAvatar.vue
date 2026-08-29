<script setup lang="ts">
/**
 * WqAvatar — آواتار استاندارد (تصویر، حروف اول نام، یا آیکون خنثی).
 *
 * قانون: هیچ‌وقت تصویر شکسته نمایش داده نمی‌شود. اگر `src` بار نشود (مسیر
 * منقضی‌شده، پیش‌نمایش محلی از دست رفته، خطای شبکه) به حروف اول برمی‌گردد و
 * اگر نامی هم نباشد آیکون خنثی — صفحه هرگز «خراب» به نظر نمی‌رسد.
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
    .filter(Boolean)
    .join(' ')
)

const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})

const showImage = computed(() => !!props.src && !failed.value)

const iconClass = computed(() => {
  switch (props.size) {
    case 'xs':
    case 'sm':
      return 'size-3.5'
    case 'lg':
    case 'xl':
      return 'size-7'
    default:
      return 'size-5'
  }
})

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
    <img
      v-if="showImage"
      :src="src!"
      :alt="`تصویر ${name || 'کاربر'}`"
      class="size-full object-cover"
      @error="failed = true"
    >
    <span v-else-if="initials" aria-hidden="true">{{ initials }}</span>
    <UIcon v-else name="i-lucide-user-round" :class="iconClass" aria-hidden="true" />
  </span>
</template>
