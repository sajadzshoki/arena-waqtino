<script setup lang="ts">
/**
 * WqSelect — انتخاب از فهرست (dropdown استاندارد وقتی‌نو).
 * items: فهرست { label, value }
 */
export interface WqSelectItem {
  label: string
  value: string
  icon?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    items: WqSelectItem[]
    label?: string
    hint?: string
    error?: string | boolean
    required?: boolean
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    required: false,
    placeholder: 'انتخاب کنید…',
    disabled: false
  }
)

const model = defineModel<string | undefined>()

const normalizedError = computed(() =>
  props.error === false || props.error === undefined ? undefined : props.error === true ? ' ' : props.error
)
</script>

<template>
  <UFormField :label="label" :hint="hint" :error="normalizedError" :required="required" size="lg">
    <USelect
      v-model="model"
      :items="items"
      :placeholder="placeholder"
      :disabled="disabled"
      value-key="value"
      class="w-full"
    />
  </UFormField>
</template>
