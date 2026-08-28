<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** آیا دکمهٔ «تلاش مجدد» نمایش داده شود؟ */
    retryable?: boolean
  }>(),
  {
    title: 'مشکلی پیش آمد',
    description: 'دریافت اطلاعات با خطا روبه‌رو شد.',
    retryable: false
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center" role="alert">
    <span class="flex size-16 items-center justify-center rounded-2xl bg-error-soft">
      <UIcon name="i-lucide-cloud-alert" class="size-7 text-error" />
    </span>
    <h3 class="t-h3 text-foreground">{{ title }}</h3>
    <p class="t-body-sm text-foreground-secondary max-w-72">{{ description }}</p>
    <WqButton v-if="retryable" variant="tertiary" size="md" icon="i-lucide-rotate-ccw" @click="emit('retry')">
      تلاش مجدد
    </WqButton>
  </div>
</template>
