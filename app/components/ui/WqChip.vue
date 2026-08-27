<script setup lang="ts">
/**
 * WqChip — چیپ انتخابی (تنها جایی که شکل قرص/pill استفاده می‌شود).
 * برای فیلترها، تگ‌ها، انتخاب‌های کوتاه. هدف لمسی کامل‌قد (h-9).
 */
withDefaults(
  defineProps<{
    selected?: boolean
    icon?: string
    disabled?: boolean
  }>(),
  { selected: false, icon: undefined, disabled: false }
)

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="pressable inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 t-body-sm select-none"
    :class="[
      selected
        ? 'border-primary-border bg-primary-soft font-semibold text-primary'
        : 'border-line bg-surface text-foreground-secondary hover:border-line-strong',
      disabled && 'pointer-events-none opacity-50'
    ]"
    :aria-pressed="selected"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <UIcon v-if="icon" :name="icon" class="size-4" />
    <slot />
  </button>
</template>
