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
    <span class="flex size-16 items-center justify-center rounded-full bg-error/10">
      <UIcon name="i-lucide-cloud-alert" class="size-7 text-error" />
    </span>
    <h3 class="t-heading">{{ title }}</h3>
    <p class="t-secondary max-w-72">{{ description }}</p>
    <UButton
      v-if="retryable"
      variant="outline"
      color="neutral"
      icon="i-lucide-rotate-ccw"
      @click="emit('retry')"
    >
      تلاش مجدد
    </UButton>
  </div>
</template>
