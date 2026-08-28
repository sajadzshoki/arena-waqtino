<script setup lang="ts">
/**
 * کارت کسب‌وکار فشرده — افقی با تصویر کوچک.
 * برای بخش‌های «محبوب»، «نزدیک شما» و «اخیراً دیده‌اید».
 */
import type { Business, BusinessCategory } from '~/types/business'

const props = withDefaults(
  defineProps<{
    business: Business
    category?: BusinessCategory | null
    showDistance?: boolean
    distanceKm?: number
  }>(),
  {
    category: null,
    showDistance: false,
    distanceKm: undefined
  }
)

const { trackView } = useRecentlyViewed()

const categoryName = computed(() => props.category?.name ?? '')
const categoryIcon = computed(() => props.category?.icon ?? 'i-lucide-store')

const imgError = ref(false)

function onImgError() {
  imgError.value = true
}

function onTap() {
  trackView(props.business.id)
}

// Reset error state when business changes
watch(() => props.business.id, () => {
  imgError.value = false
})

const formattedDistance = computed(() => {
  if (props.distanceKm === undefined) return ''
  if (props.distanceKm < 1) {
    return `${toFaDigits(Math.round(props.distanceKm * 1000))} متر`
  }
  return `${toFaDigits(props.distanceKm.toFixed(1))} کیلومتر`
})
</script>

<template>
  <NuxtLink
    :to="`/business/${business.id}`"
    class="pressable group flex w-full items-stretch gap-3 overflow-hidden rounded-xl border border-line bg-surface p-2.5"
    :aria-label="`${business.name} — ${categoryName}`"
    @click="onTap"
  >
    <!-- تصویر کوچک -->
    <div class="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
      <!-- Fallback -->
      <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-soft to-surface-muted">
        <UIcon :name="categoryIcon" class="size-7 text-primary/40" />
      </div>
      <!-- تصویر واقعی -->
      <img
        v-if="business.coverImageUrl && !imgError"
        :src="business.coverImageUrl"
        :alt="`تصویر ${business.name}`"
        class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="onImgError"
      >
    </div>

    <!-- اطلاعات -->
    <div class="flex min-w-0 flex-1 flex-col justify-center gap-1">
      <h3 class="t-h3 truncate text-foreground">
        {{ business.name }}
      </h3>
      <span class="t-caption truncate text-foreground-secondary">
        {{ categoryName }}
      </span>
      <div class="mt-0.5 flex items-center gap-2">
        <WqRating
          v-if="business.rating.count > 0"
          :value="business.rating.average"
          :count="business.rating.count"
          size="sm"
          :show-count="false"
        />
        <span v-if="showDistance && distanceKm !== undefined" class="t-caption flex items-center gap-1 text-foreground-muted">
          <UIcon name="i-lucide-navigation" class="size-3" />
          {{ formattedDistance }}
        </span>
      </div>
    </div>

    <!-- فلش -->
    <div class="flex shrink-0 items-center self-center">
      <UIcon name="i-lucide-chevron-left" class="size-4 text-foreground-muted" />
    </div>
  </NuxtLink>
</template>
