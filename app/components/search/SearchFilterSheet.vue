<script setup lang="ts">
/**
 * شیت فیلترهای جستجو — موبایل‌محور.
 */
import type { BusinessCategory } from '~/types/business'
import type { SearchFilters } from '~/types/search'
import { DEFAULT_FILTERS } from '~/types/search'

const props = defineProps<{
  categories: BusinessCategory[]
  initialFilters: SearchFilters
  initialCategoryId: string | null
}>()

const emit = defineEmits<{
  apply: [filters: SearchFilters, categoryId: string | null]
  clear: []
}>()

const open = defineModel<boolean>('open', { default: false })

// State موقت (تا وقتی apply نشده)
const draftFilters = ref<SearchFilters>({ ...DEFAULT_FILTERS })
const draftCategoryId = ref<string | null>(null)

// مقداردهی اولیه هنگام باز شدن
watch(open, (isOpen) => {
  if (isOpen) {
    draftFilters.value = { ...props.initialFilters }
    draftCategoryId.value = props.initialCategoryId
  }
})

function applyFilters() {
  emit('apply', { ...draftFilters.value }, draftCategoryId.value)
  open.value = false
}

function clearAll() {
  draftFilters.value = { ...DEFAULT_FILTERS }
  draftCategoryId.value = null
  emit('clear')
  open.value = false
}

function toggleCategory(catId: string) {
  draftCategoryId.value = draftCategoryId.value === catId ? null : catId
}

function setMinRating(rating: number | null) {
  draftFilters.value = { ...draftFilters.value, minRating: rating }
}

function toggleNearby() {
  draftFilters.value = {
    ...draftFilters.value,
    nearbyOnly: !draftFilters.value.nearbyOnly
  }
}

function setAvailableDay(day: 'today' | 'tomorrow' | null) {
  draftFilters.value = {
    ...draftFilters.value,
    availableDay: draftFilters.value.availableDay === day ? null : day
  }
}

const hasDraftFilters = computed(() => {
  const f = draftFilters.value
  return f.minRating !== null || f.nearbyOnly || f.availableDay !== null || f.maxPrice !== null || draftCategoryId.value !== null
})
</script>

<template>
  <WqSheet
    v-model:open="open"
    title="فیلترها و مرتب‌سازی"
    description="نتایج جستجو را دقیق‌تر کنید"
  >
    <div class="flex flex-col gap-5 pb-4">
      <!-- دسته‌بندی -->
      <div>
        <h3 class="t-label mb-2.5 text-foreground-strong">دسته‌بندی</h3>
        <div class="flex flex-wrap gap-2">
          <WqChip
            v-for="cat in categories"
            :key="cat.id"
            :selected="draftCategoryId === cat.id"
            :icon="cat.icon"
            @toggle="toggleCategory(cat.id)"
          >
            {{ cat.name }}
          </WqChip>
        </div>
      </div>

      <!-- امتیاز -->
      <div>
        <h3 class="t-label mb-2.5 text-foreground-strong">حداقل امتیاز</h3>
        <div class="flex gap-2">
          <WqChip
            :selected="draftFilters.minRating === 4"
            icon="i-lucide-star"
            @toggle="setMinRating(draftFilters.minRating === 4 ? null : 4)"
          >
            ۴+
          </WqChip>
          <WqChip
            :selected="draftFilters.minRating === 4.5"
            icon="i-lucide-star"
            @toggle="setMinRating(draftFilters.minRating === 4.5 ? null : 4.5)"
          >
            ۴٫۵+
          </WqChip>
        </div>
      </div>

      <!-- نزدیک من -->
      <div>
        <h3 class="t-label mb-2.5 text-foreground-strong">موقعیت</h3>
        <WqChip
          :selected="draftFilters.nearbyOnly"
          icon="i-lucide-navigation"
          @toggle="toggleNearby"
        >
          نزدیک من
        </WqChip>
      </div>

      <!-- زمان رزرو -->
      <div>
        <h3 class="t-label mb-2.5 text-foreground-strong">زمان آزاد</h3>
        <div class="flex gap-2">
          <WqChip
            :selected="draftFilters.availableDay === 'today'"
            icon="i-lucide-calendar-check"
            @toggle="setAvailableDay('today')"
          >
            امروز
          </WqChip>
          <WqChip
            :selected="draftFilters.availableDay === 'tomorrow'"
            icon="i-lucide-calendar"
            @toggle="setAvailableDay('tomorrow')"
          >
            فردا
          </WqChip>
        </div>
        <p class="t-caption mt-2">
          (این فیلتر در نسخهٔ آینده فعال خواهد شد)
        </p>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex items-center gap-3">
        <WqButton
          variant="tertiary"
          size="md"
          :disabled="!hasDraftFilters"
          block
          @click="clearAll"
        >
          پاک‌کردن همه
        </WqButton>
        <WqButton
          variant="primary"
          size="md"
          block
          @click="applyFilters"
        >
          اعمال فیلترها
        </WqButton>
      </div>
    </template>
  </WqSheet>
</template>
