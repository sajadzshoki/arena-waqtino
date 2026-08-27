<script setup lang="ts">
/**
 * WqButton — دکمهٔ استاندارد وقتی‌نو.
 *
 * چهار variant معنایی (primary/secondary/tertiary/destructive) روی سه‌چرخهٔ
 * color/variant ِ Nuxt UI سوار می‌شوند؛ سبک جدید به جای این کامپوننت نسازید.
 * اندازهٔ پیش‌فرض lg (لمس راحت موبایل) است؛ sm/md فقط برای فضای فشرده.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    icon?: string
    trailingIcon?: string
    type?: 'button' | 'submit' | 'reset'
    label?: string
  }>(),
  {
    variant: 'primary',
    size: 'lg',
    block: false,
    loading: false,
    disabled: false,
    icon: undefined,
    trailingIcon: undefined,
    type: 'button',
    label: undefined
  }
)

const VARIANT_MAP = {
  primary: { color: 'primary', variant: 'solid' },
  secondary: { color: 'primary', variant: 'soft' },
  tertiary: { color: 'neutral', variant: 'ghost' },
  destructive: { color: 'error', variant: 'soft' }
} as const

const mapped = computed(() => VARIANT_MAP[props.variant])
</script>

<template>
  <UButton
    :color="mapped.color"
    :variant="mapped.variant"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled"
    :icon="icon"
    :trailing-icon="trailingIcon"
    :type="type"
    :label="label"
  >
    <slot />
  </UButton>
</template>
