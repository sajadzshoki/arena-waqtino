<script setup lang="ts">
/**
 * WqPhoneInput — ورودی شمارهٔ موبایل ایران.
 * ارقام فارسی/عربی خودکار به ASCII نرمال می‌شوند (v-model همیشه ASCII).
 */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | boolean
    required?: boolean
    disabled?: boolean
  }>(),
  {
    label: 'شمارهٔ موبایل',
    hint: undefined,
    error: undefined,
    required: false,
    disabled: false
  }
)

const model = defineModel<string>({ default: '' })

const display = computed({
  get: () => model.value,
  set: (value: string) => {
    model.value = normalizeDigits(value).replace(/[^\d]/g, '').slice(0, 11)
  }
})

const normalizedError = computed(() =>
  props.error === false || props.error === undefined ? undefined : props.error === true ? ' ' : props.error
)
</script>

<template>
  <UFormField :label="label" :hint="hint" :error="normalizedError" :required="required" size="lg">
    <UInput
      v-model="display"
      type="tel"
      inputmode="tel"
      dir="ltr"
      placeholder="0912 345 6789"
      icon="i-lucide-smartphone"
      :disabled="disabled"
      class="t-num w-full text-left"
      maxlength="13"
    />
  </UFormField>
</template>
