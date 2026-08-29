<script setup lang="ts">
/**
 * WqConfirm — دیالوگ تأیید استاندارد (به‌ویژه عملیات مخرب).
 * برای لغو رزرو، حذف آیتم، خروج از حساب و… — هرگز confirm() مرورگر نه.
 */
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    /** destructive → دکمهٔ اصلی قرمز */
    tone?: 'default' | 'destructive'
    loading?: boolean
    icon?: string
  }>(),
  {
    description: undefined,
    confirmLabel: 'تأیید',
    cancelLabel: 'انصراف',
    tone: 'default',
    loading: false,
    icon: undefined
  }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const open = defineModel<boolean>('open', { default: false })

// همان قاعدهٔ WqSheet: بازگشت = بستن دیالوگ (نه خروج از صفحه/اپ)
useSystemBackHandler(open, () => onCancel())

const resolvedIcon = computed(
  () =>
    props.icon ??
    (props.tone === 'destructive' ? 'i-lucide-triangle-alert' : 'i-lucide-circle-help')
)

function onCancel() {
  open.value = false
  emit('cancel')
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{
      content: 'max-w-sm rounded-2xl bg-surface-overlay shadow-pop',
      footer: 'justify-end gap-2'
    }"
  >
    <template #body>
      <div class="flex items-start gap-3">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-xl"
          :class="tone === 'destructive' ? 'bg-error-soft text-error' : 'bg-primary-soft text-primary'"
        >
          <UIcon :name="resolvedIcon" class="size-5" />
        </span>
        <p class="t-body-sm pt-1.5 text-foreground-secondary">
          <slot>{{ description }}</slot>
        </p>
      </div>
    </template>

    <template #footer>
      <WqButton variant="tertiary" size="md" :disabled="loading" @click="onCancel">
        {{ cancelLabel }}
      </WqButton>
      <WqButton
        :variant="tone === 'destructive' ? 'destructive' : 'primary'"
        size="md"
        :loading="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </WqButton>
    </template>
  </UModal>
</template>
