<script setup lang="ts">
/**
 * WqIconButton — دکمهٔ آیکونی با هدف لمسی راحت (پیش‌فرض ۴۰px).
 * برچسب (label) برای دسترس‌پذیری اجباری است.
 */
withDefaults(
  defineProps<{
    icon: string
    /** aria-label + tooltip */
    label: string
    variant?: 'ghost' | 'outline' | 'soft'
    color?: 'neutral' | 'primary' | 'error'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'ghost',
    color: 'neutral',
    size: 'md',
    loading: false,
    disabled: false
  }
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <UButton
    :icon="icon"
    :color="color"
    :variant="variant"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    square
    :aria-label="label"
    :title="label"
    @click="emit('click', $event)"
  />
</template>
