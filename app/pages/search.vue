<script setup lang="ts">
/**
 * صفحهٔ جستجو — تجربهٔ کامل جستجو و کشف.
 */
import type { SearchFilters, SearchSort } from '~/types/search'

definePageMeta({ access: 'public' })
useHead({ title: 'جستجو' })

// State
const {
  query,
  debouncedQuery,
  categoryId,
  sort,
  filters,
  hasActiveFilters,
  hasAnySearchContext,
  setQuery,
  setCategory,
  setSort,
  setFilters,
  resetFilters,
  clearAll,
  syncFromUrl
} = useSearchState()

const {
  results,
  loading: searchLoading,
  error: searchError,
  total,
  searched,
  categories,
  loadCategories,
  executeSearch
} = useSearch()

const { data: popularBusinesses } = await useAsyncData(
  'search:popular',
  () => useServices().businesses.listPopular()
)

// Initialize
await loadCategories()
syncFromUrl()

// Execute search when context changes
watch(
  [debouncedQuery, categoryId, sort, filters],
  () => {
    if (hasAnySearchContext.value) {
      executeSearch()
    }
  },
  { immediate: true, deep: true }
)

// Filter/Sort sheet state
const filterSheetOpen = ref(false)
const sortSheetOpen = ref(false)

// Handlers
function handleApplyFilters(newFilters: SearchFilters, newCategoryId: string | null) {
  setFilters(newFilters)
  setCategory(newCategoryId)
}

function handleClearFilters() {
  resetFilters()
  setCategory(null)
}

function handleSelectSort(newSort: SearchSort) {
  setSort(newSort)
}

function handleClearSearch() {
  setQuery('')
  clearAll()
}

// Category map for display
const categoryMap = computed(() => {
  const map = new Map(categories.value.map(c => [c.id, c]))
  return map
})

function getCategoryForBiz(categoryId: string) {
  return categoryMap.value.get(categoryId) ?? null
}

const selectedCategoryName = computed(() => {
  if (!categoryId.value) return null
  return categoryMap.value.get(categoryId.value)?.name ?? null
})

// Computed for active filter chips
const activeFilterChips = computed(() => {
  const chips: { label: string; icon: string; remove: () => void }[] = []

  if (categoryId.value && selectedCategoryName.value) {
    chips.push({
      label: selectedCategoryName.value,
      icon: 'i-lucide-tag',
      remove: () => setCategory(null)
    })
  }

  if (filters.value.minRating !== null) {
    chips.push({
      label: `امتیاز ${toFaDigits(filters.value.minRating)}+`,
      icon: 'i-lucide-star',
      remove: () => setFilters({ minRating: null })
    })
  }

  if (filters.value.nearbyOnly) {
    chips.push({
      label: 'نزدیک من',
      icon: 'i-lucide-navigation',
      remove: () => setFilters({ nearbyOnly: false })
    })
  }

  if (filters.value.availableDay) {
    const label = filters.value.availableDay === 'today' ? 'امروز' : 'فردا'
    chips.push({
      label,
      icon: 'i-lucide-calendar',
      remove: () => setFilters({ availableDay: null })
    })
  }

  return chips
})
</script>

<template>
  <div class="pb-4">
    <!-- هدر -->
    <div class="mb-4">
      <h1 class="t-h1 mb-4 text-foreground-strong">جستجو</h1>

      <!-- Input جستجو -->
      <div class="relative">
        <input
          type="text"
          :value="query"
          placeholder="دنبال چه خدماتی هستید؟"
          class="w-full rounded-xl border border-line bg-surface px-4 py-3 pe-10 t-body-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
          @input="setQuery(($event.target as HTMLInputElement).value)"
        >
        <UIcon
          name="i-lucide-search"
          class="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-foreground-muted"
        />
        <button
          v-if="query"
          type="button"
          class="pressable absolute end-10 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-surface-muted"
          aria-label="پاک کردن جستجو"
          @click="setQuery('')"
        >
          <UIcon name="i-lucide-x" class="size-4 text-foreground-muted" />
        </button>
      </div>
    </div>

    <!-- حالت اولیه (بدون جستجو) -->
    <SearchInitialState
      v-if="!hasAnySearchContext"
      :categories="categories"
      :popular-businesses="popularBusinesses ?? []"
    />

    <!-- حالت جستجو فعال -->
    <div v-else class="flex flex-col gap-4">
      <!-- نوار فیلتر و مرتب‌سازی -->
      <div class="flex items-center gap-2">
        <!-- دکمه فیلتر -->
        <button
          type="button"
          class="pressable flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2"
          :class="hasActiveFilters ? 'border-primary-border bg-primary-soft' : ''"
          @click="filterSheetOpen = true"
        >
          <UIcon
            name="i-lucide-sliders-horizontal"
            class="size-4"
            :class="hasActiveFilters ? 'text-primary' : 'text-foreground-secondary'"
          />
          <span class="t-body-sm" :class="hasActiveFilters ? 'font-medium text-primary' : 'text-foreground-secondary'">
            فیلتر
          </span>
        </button>

        <!-- دکمه مرتب‌سازی -->
        <button
          type="button"
          class="pressable flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2"
          @click="sortSheetOpen = true"
        >
          <UIcon name="i-lucide-arrow-up-down" class="size-4 text-foreground-secondary" />
          <span class="t-body-sm text-foreground-secondary">
            {{ SORT_OPTIONS.find(s => s.value === sort)?.label }}
          </span>
        </button>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- نتیجه -->
        <span v-if="searched && !searchLoading" class="t-caption text-foreground-muted">
          {{ toFaDigits(total) }} نتیجه
        </span>
      </div>

      <!-- Active filters -->
      <div v-if="activeFilterChips.length > 0" class="flex flex-wrap gap-2">
        <button
          v-for="(chip, idx) in activeFilterChips"
          :key="idx"
          type="button"
          class="pressable inline-flex items-center gap-1.5 rounded-full border border-primary-border bg-primary-soft px-3 py-1.5"
          @click="chip.remove"
        >
          <UIcon :name="chip.icon" class="size-3.5 text-primary" />
          <span class="t-body-sm text-primary">{{ chip.label }}</span>
          <UIcon name="i-lucide-x" class="size-3 text-primary" />
        </button>
        <button
          v-if="activeFilterChips.length > 1"
          type="button"
          class="pressable t-body-sm text-primary"
          @click="handleClearFilters"
        >
          حذف همه
        </button>
      </div>

      <!-- Loading -->
      <div v-if="searchLoading" class="flex flex-col gap-3">
        <USkeleton v-for="n in 5" :key="n" class="h-28 rounded-xl" />
      </div>

      <!-- Error -->
      <div v-else-if="searchError" class="flex flex-col items-center gap-3 rounded-xl border border-error-border bg-error-soft px-6 py-8 text-center">
        <UIcon name="i-lucide-alert-circle" class="size-8 text-error" />
        <p class="t-body-sm text-error">خطا در دریافت نتایج</p>
        <WqButton variant="secondary" size="sm" icon="i-lucide-rotate-ccw" @click="executeSearch">
          تلاش مجدد
        </WqButton>
      </div>

      <!-- No results -->
      <SearchNoResults
        v-else-if="searched && results.length === 0"
        :query="debouncedQuery"
        @clear-search="handleClearSearch"
        @clear-filters="handleClearFilters"
      />

      <!-- Results -->
      <div v-else-if="searched && results.length > 0" class="flex flex-col gap-3">
        <SearchResultCard
          v-for="biz in results"
          :key="biz.id"
          :business="biz"
          :category="getCategoryForBiz(biz.categoryId)"
        />
      </div>
    </div>

    <!-- Filter Sheet -->
    <SearchFilterSheet
      v-model:open="filterSheetOpen"
      :categories="categories"
      :initial-filters="filters"
      :initial-category-id="categoryId"
      @apply="handleApplyFilters"
      @clear="handleClearFilters"
    />

    <!-- Sort Sheet -->
    <SearchSortSheet
      v-model:open="sortSheetOpen"
      :current-sort="sort"
      @select="handleSelectSort"
    />
  </div>
</template>
