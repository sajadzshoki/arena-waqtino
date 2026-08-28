<script setup lang="ts">
/** AppOfflineState — حالت آفلاین/عدم دسترسی به شبکه. */
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: 'اتصال اینترنت برقرار نیست',
    description: 'لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.'
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center" role="alert">
    <span class="flex size-16 items-center justify-center rounded-full bg-surface-muted">
      <UIcon name="i-lucide-wifi-off" class="size-7 text-foreground-muted" />
    </span>
    <h3 class="t-h3">{{ title }}</h3>
    <p class="t-body-sm text-foreground-secondary max-w-72">{{ description }}</p>
    <WqButton variant="secondary" size="md" icon="i-lucide-rotate-ccw" @click="emit('retry')">
      تلاش مجدد
    </WqButton>
  </div>
</template>
