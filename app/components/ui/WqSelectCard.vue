<script setup lang="ts">
/**
 * WqSelectCard — کارت انتخابی (الگوی واحد «گزینهٔ انتخاب‌شونده»).
 * در سوییچر حالت، انتخاب کارمند، انتخاب سرویس و… استفاده می‌شود، و با
 * `role="checkbox"` هم انتخاب چندتایی (اختصاص سرویس به پرسنل) را پوشش می‌دهد.
 */
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    selected?: boolean
    disabled?: boolean
    /**
     * معنای گروه انتخاب: تک‌انتخابی (radio) یا چندانتخابی (checkbox). پیش‌فرض
     * همان radio است که همه‌جا استفاده می‌شود؛ انتخاب چندتایی (مثل اختصاص
     * سرویس‌های یک پرسنل) باید checkbox بگوید، وگرنه صفحه‌خوان اشتباه می‌خواند.
     */
    role?: 'radio' | 'checkbox'
  }>(),
  {
    description: undefined,
    icon: undefined,
    selected: false,
    disabled: false,
    role: 'radio'
  }
)

const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="pressable flex w-full items-center gap-3 rounded-xl border p-3 text-start"
    :class="[
      selected
        ? 'border-primary-border bg-primary-soft'
        : 'border-line bg-surface hover:border-line-strong',
      disabled && 'pointer-events-none opacity-50'
    ]"
    :role="role"
    :aria-checked="selected"
    :disabled="disabled"
    @click="emit('select')"
  >
    <span
      v-if="icon"
      class="flex size-11 shrink-0 items-center justify-center rounded-lg"
      :class="selected ? 'bg-primary-soft text-primary' : 'bg-surface-muted text-foreground-muted'"
    >
      <UIcon :name="icon" class="size-6" />
    </span>

    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm leading-7 font-semibold text-foreground">
        {{ title }}
      </span>
      <span v-if="description" class="t-caption block truncate">{{ description }}</span>
    </span>

    <UIcon
      v-if="selected"
      name="i-lucide-circle-check"
      class="size-5 shrink-0 text-primary"
    />
    <UIcon v-else name="i-lucide-chevron-left" class="size-5 shrink-0 text-foreground-muted" />
  </button>
</template>
