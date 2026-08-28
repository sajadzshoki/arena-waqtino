<script setup lang="ts">
/**
 * حالت بدون نتیجه در جستجو.
 */
defineProps<{
  query?: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearFilters: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-6 py-12 text-center">
    <span class="flex size-16 items-center justify-center rounded-2xl bg-surface-muted">
      <UIcon name="i-lucide-search-x" class="size-7 text-foreground-muted" />
    </span>
    <div>
      <h3 class="t-h2 text-foreground">
        {{ query ? `نتیجه‌ای برای «${query}» یافت نشد` : 'نتیجه‌ای یافت نشد' }}
      </h3>
      <p class="t-body-sm mt-2 text-foreground-secondary">
        لطفاً عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید.
      </p>
    </div>
    <div class="flex flex-col gap-2">
      <WqButton
        v-if="query"
        variant="secondary"
        size="md"
        icon="i-lucide-x"
        @click="emit('clearSearch')"
      >
        پاک‌کردن جستجو
      </WqButton>
      <WqButton
        variant="tertiary"
        size="md"
        icon="i-lucide-filter-x"
        @click="emit('clearFilters')"
      >
        حذف فیلترها
      </WqButton>
    </div>
  </div>
</template>
