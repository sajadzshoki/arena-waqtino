<script setup lang="ts">
/**
 * حالت اولیهٔ جستجو — قبل از سرچ کردن.
 * دسته‌بندی‌های محبوب و پیشنهادها را نمایش می‌دهد.
 */
import type { Business, BusinessCategory } from '~/types/business'

defineProps<{
  categories: BusinessCategory[]
  popularBusinesses: Business[]
  loading?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- دسته‌بندی‌های محبوب -->
    <section v-if="categories.length > 0">
      <h2 class="t-section mb-3 text-foreground-strong">دسته‌بندی‌ها</h2>
      <div class="grid grid-cols-3 gap-3">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          :to="{ path: '/search', query: { category: cat.id } }"
          class="pressable flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-3 text-center"
          :aria-label="`دسته‌بندی: ${cat.name}`"
        >
          <span class="flex size-10 items-center justify-center rounded-xl bg-primary-soft">
            <UIcon :name="cat.icon" class="size-5 text-primary" />
          </span>
          <span class="t-caption text-foreground-secondary">
            {{ cat.name }}
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- کسب‌وکارهای محبوب -->
    <section v-if="popularBusinesses.length > 0">
      <h2 class="t-section mb-3 text-foreground-strong">محبوب‌ترین‌ها</h2>
      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="biz in popularBusinesses"
          :key="biz.id"
          :to="`/business/${biz.id}`"
          class="pressable flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
        >
          <div class="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
            <img
              v-if="biz.coverImageUrl"
              :src="biz.coverImageUrl"
              :alt="`تصویر ${biz.name}`"
              class="size-full object-cover"
              loading="lazy"
            >
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="t-h3 truncate text-foreground">{{ biz.name }}</h3>
            <WqRating
              v-if="biz.rating.count > 0"
              :value="biz.rating.average"
              :count="biz.rating.count"
              size="sm"
              :show-count="false"
            />
          </div>
          <UIcon name="i-lucide-chevron-left" class="size-4 text-foreground-muted" />
        </NuxtLink>
      </div>
    </section>

    <!-- بارگذاری -->
    <div v-if="loading" class="flex flex-col gap-3">
      <USkeleton v-for="n in 3" :key="n" class="h-20 rounded-xl" />
    </div>
  </div>
</template>
