<script setup lang="ts">
/**
 * شبکهٔ دسته‌بندی‌ها — الگوی افقی اسکرول برای موبایل.
 * هر دسته شامل آیکون + نام فارسی است و تپ آن به صفحهٔ جستجو
 * با فیلتر دسته هدایت می‌کند.
 */
import type { BusinessCategory } from '~/types/business'

withDefaults(
  defineProps<{
    categories: BusinessCategory[]
    loading?: boolean
  }>(),
  { loading: false }
)
</script>

<template>
  <!-- Skeleton حالت بارگذاری -->
  <div v-if="loading" class="flex gap-3 overflow-hidden" aria-hidden="true">
    <div
      v-for="n in 6"
      :key="n"
      class="flex w-20 shrink-0 flex-col items-center gap-2"
    >
      <USkeleton class="size-14 rounded-2xl" />
      <USkeleton class="h-3 w-16 rounded" />
    </div>
  </div>

  <!-- فهرست دسته‌بندی‌ها — اسکرول افقی -->
  <div v-else class="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
    <NuxtLink
      v-for="cat in categories"
      :key="cat.id"
      :to="{ path: '/search', query: { category: cat.id } }"
      class="pressable group flex w-20 shrink-0 flex-col items-center gap-2"
      :aria-label="`دسته‌بندی: ${cat.name}`"
    >
      <span
        class="flex size-14 items-center justify-center rounded-2xl border border-line-subtle bg-surface transition-colors group-hover:border-primary-border group-hover:bg-primary-soft"
      >
        <UIcon
          :name="cat.icon"
          class="size-6 text-foreground-secondary transition-colors group-hover:text-primary"
        />
      </span>
      <span class="t-caption text-center leading-tight text-foreground-secondary">
        {{ cat.name }}
      </span>
    </NuxtLink>
  </div>
</template>
