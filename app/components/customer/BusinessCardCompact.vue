<script setup lang="ts">
/**
 * کارت کسب‌وکار فشرده — افقی با تصویر کوچک.
 * برای بخش‌های «محبوب»، «نزدیک شما»، «اخیراً دیده‌اید» و صفحهٔ «نشان‌شده‌ها».
 *
 * فاز ۷: دو قابلیت معماری‌محور اضافه شد تا کارتِ دومی ساخته نشود —
 *   - `showSaveAction` : همان BusinessSaveToggle مشترک (به‌جای chevron)
 *   - slot `meta`     : یک خط اطلاعات بصری زیر امتیاز (مثل «۳ روز پیش نشان شد»)
 *
 * ساختار: ریشه یک `<article>` است و لینک + دکمهٔ نشان‌کردن خواهرهای هم‌سطح‌اند
 * (دکمه داخل لینک HTML نامعتبر است و هدف لمسی ۴۰px را می‌بلعد).
 */
import type { Business, BusinessCategory } from '~/types/business'

const props = withDefaults(
  defineProps<{
    business: Business
    category?: BusinessCategory | null
    showDistance?: boolean
    distanceKm?: number
    /** دکمهٔ نشان‌کردن/حذف به‌جای فلش (صفحهٔ نشان‌شده‌ها) */
    showSaveAction?: boolean
    /** حالت «حذف» برای دکمهٔ نشان (صفحهٔ نشان‌شده‌ها) */
    saveMode?: 'toggle' | 'remove'
  }>(),
  {
    category: null,
    showDistance: false,
    distanceKm: undefined,
    showSaveAction: false,
    saveMode: 'toggle'
  }
)

defineSlots<{
  /** خط متادیتای اختصاصی صفحه (مثلاً «۳ روز پیش نشان‌شده») */
  meta?: () => unknown
}>()

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

// با عوض‌شدن کسب‌وکار، خطای نمایش قبلی پاک می‌شود
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
  <article
    class="pressable group flex w-full items-stretch gap-1 overflow-hidden rounded-xl border border-line bg-surface p-1.5"
  >
    <NuxtLink
      :to="`/business/${business.id}`"
      class="flex min-w-0 flex-1 items-stretch gap-3 p-1"
      :aria-label="`${business.name} — ${categoryName}`"
      @click="onTap"
    >
      <!-- تصویر کوچک -->
      <div class="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        <!-- جایگزین -->
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
        <slot name="meta" />
      </div>
    </NuxtLink>

    <!-- اکشن: یا نشان‌کردن (مشترک با بقیهٔ اپ) یا فلش ناوبری -->
    <div class="flex shrink-0 items-center pe-0.5">
      <BusinessSaveToggle
        v-if="showSaveAction"
        :business-id="business.id"
        :business="business"
        :mode="saveMode"
      />
      <UIcon v-else name="i-lucide-chevron-left" class="size-4 text-foreground-muted" />
    </div>
  </article>
</template>
