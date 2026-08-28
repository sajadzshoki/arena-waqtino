<script setup lang="ts">
/** WqTextarea — ورودی چندخطی استاندارد (یادداشت رزرو، توضیحات و…). */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | boolean
    required?: boolean
    placeholder?: string
    rows?: number
    maxlength?: number
    disabled?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    required: false,
    placeholder: undefined,
    rows: 3,
    maxlength: 500,
    disabled: false
  }
)

const model = defineModel<string>({ default: '' })

const normalizedError = computed(() =>
  props.error === false || props.error === undefined ? undefined : props.error === true ? ' ' : props.error
)

const remaining = computed(() => (props.maxlength ?? 500) - model.value.length)
</script>

<template>
  <UFormField :label="label" :error="normalizedError" :required="required" size="lg">
    <UTextarea
      v-model="model"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      class="w-full"
    />
    <template #hint>
      <span v-if="hint">{{ hint }}</span>
      <span v-else class="t-num" dir="ltr">{{ toFaDigits(Math.max(remaining, 0)) }}</span>
    </template>
  </UFormField>
</template>
