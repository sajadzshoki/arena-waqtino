<script setup lang="ts">
/**
 * WqSearchInput — ورودی جستجوی استاندارد با آیکون و دکمهٔ پاک‌کردن.
 */
withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
    autofocus?: boolean
  }>(),
  {
    placeholder: 'جستجو…',
    disabled: false,
    autofocus: false
  }
)

const emit = defineEmits<{ submit: [] }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <UInput
    v-model="model"
    type="search"
    icon="i-lucide-search"
    :placeholder="placeholder"
    :disabled="disabled"
    :autofocus="autofocus"
    class="w-full"
    role="searchbox"
    @keydown.enter="emit('submit')"
  >
    <template v-if="model" #trailing>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-x"
        square
        aria-label="پاک کردن جستجو"
        @click="model = ''"
      />
    </template>
  </UInput>
</template>
