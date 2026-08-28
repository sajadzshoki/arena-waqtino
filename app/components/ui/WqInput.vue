<script setup lang="ts">
/**
 * WqInput — ورودی متنی استاندارد وقتی‌نو (label / hint / error / required).
 * هر جای اپ «فیلد متنی» لازم بود همین استفاده شود تا زبان فرم‌ها یکی بماند.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | boolean
    required?: boolean
    placeholder?: string
    icon?: string
    trailingIcon?: string
    disabled?: boolean
    type?: string
    inputmode?: 'text' | 'tel' | 'numeric' | 'email' | 'url' | 'search'
    dir?: 'rtl' | 'ltr'
    maxlength?: number
    autofocus?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    required: false,
    placeholder: undefined,
    icon: undefined,
    trailingIcon: undefined,
    disabled: false,
    type: 'text',
    inputmode: 'text',
    dir: 'rtl',
    maxlength: undefined,
    autofocus: false
  }
)

const model = defineModel<string>({ default: '' })

const normalizedError = computed(() =>
  props.error === false || props.error === undefined ? undefined : props.error === true ? ' ' : props.error
)
</script>

<template>
  <UFormField
    :label="label"
    :hint="hint"
    :error="normalizedError"
    :required="required"
    size="lg"
  >
    <UInput
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :icon="icon"
      :trailing-icon="trailingIcon"
      :disabled="disabled"
      :inputmode="inputmode"
      :maxlength="maxlength"
      :autofocus="autofocus"
      :dir="dir"
      class="w-full"
      :class="{ 'text-left': dir === 'ltr' }"
    />
  </UFormField>
</template>
