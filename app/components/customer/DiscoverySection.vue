<script setup lang="ts">
/**
 * DiscoverySection — wrapper معنایی برای هر بخش کشف در صفحهٔ خانه.
 * عنوان + لینک «مشاهده همه» + slot محتوا + مدیریت خطا/خالی.
 */
withDefaults(
  defineProps<{
    title: string
    loading?: boolean
    error?: boolean
    empty?: boolean
    actionLabel?: string
    actionTo?: string
  }>(),
  {
    loading: false,
    error: false,
    empty: false,
    actionLabel: undefined,
    actionTo: undefined
  }
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="mt-8">
    <!-- سربرگ بخش -->
    <WqSectionHeader
      :title="title"
      :action-label="actionLabel"
      :action-to="actionTo"
    />

    <!-- حالت خطا -->
    <div v-if="error && !loading" class="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-4 py-8 text-center">
      <UIcon name="i-lucide-cloud-alert" class="size-8 text-error" />
      <p class="t-body-sm text-foreground-secondary">خطا در دریافت اطلاعات</p>
      <WqButton variant="tertiary" size="sm" icon="i-lucide-rotate-ccw" @click="emit('retry')">
        تلاش مجدد
      </WqButton>
    </div>

    <!-- حالت خالی — بخش مخفی می‌شود (بدون محتوای اضافی) -->
    <div
      v-else-if="empty && !loading"
      class="flex items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted px-4 py-6"
    >
      <p class="t-body-sm text-foreground-muted">در حال حاضر موردی برای نمایش وجود ندارد.</p>
    </div>

    <!-- محتوا -->
    <slot v-else />
  </section>
</template>
