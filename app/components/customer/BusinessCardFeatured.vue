<script setup lang="ts">
/**
 * کارت کسب‌وکار ویژه — کارت بزرگ با تصویر cover.
 * برای بخش «پیشنهاد برای شما»، «اخیراً دیده‌اید» و هر جای دیگری که کارت
 * قهرمان نیاز است.
 *
 * فاز ۷: ریشه به `<article>` تغییر کرد تا دکمهٔ نشان‌کردن (همان
 * `BusinessSaveToggle` مشترک) بیرون از لینک بنشیند — روی تصویر، هم‌تراز با
 * نشان «تأییدشده» و با هدف لمسی ۴۰px. پس کاربر می‌تواند از همین‌جا نشان کند
 * و بدون ورود به جزئیات، در صفحهٔ «نشان‌شده‌ها» پیدایش کند.
 */
import type { Business, BusinessCategory } from '~/types/business'

const props = withDefaults(
  defineProps<{
    business: Business
    category?: BusinessCategory | null
    /** اکشن نشان‌کردن روی کاور (خانهٔ مشتری — ذخیره سریع بدون ورود به جزئیات) */
    showSaveAction?: boolean
  }>(),
  { category: null, showSaveAction: false }
)

const { trackView } = useRecentlyViewed()

const categoryName = computed(() => props.category?.name ?? '')
const categoryIcon = computed(() => props.category?.icon ?? 'i-lucide-store')

const imgLoaded = ref(false)
const imgError = ref(false)

function onImgLoad() {
  imgLoaded.value = true
}

function onImgError() {
  imgError.value = true
}

function onTap() {
  trackView(props.business.id)
}

// با عوض‌شدن کسب‌وکار، state نمایش تازه می‌شود
watch(() => props.business.id, () => {
  imgLoaded.value = false
  imgError.value = false
})
</script>

<template>
  <article class="group relative w-72 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
    <NuxtLink
      :to="`/business/${business.id}`"
      class="pressable block"
      :aria-label="`${business.name} — ${categoryName}`"
      @click="onTap"
    >
      <!-- تصویر cover -->
      <div class="relative aspect-[3/2] w-full overflow-hidden bg-surface-muted">
        <!-- Fallback (همیشه در پس‌زمینه) -->
        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-soft to-surface-muted">
          <UIcon :name="categoryIcon" class="size-10 text-primary/40" />
        </div>

        <!-- تصویر واقعی (فوق fallback) -->
        <img
          v-if="business.coverImageUrl && !imgError"
          :src="business.coverImageUrl"
          :alt="`تصویر ${business.name}`"
          class="absolute inset-0 size-full object-cover transition-opacity duration-300"
          :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
          loading="lazy"
          @load="onImgLoad"
          @error="onImgError"
        >
      </div>

      <!-- اطلاعات -->
      <div class="flex flex-col gap-1.5 p-3">
        <h3 class="t-h3 truncate text-foreground">
          {{ business.name }}
        </h3>
        <span class="t-caption truncate text-foreground-secondary">
          {{ categoryName }}
        </span>
        <div class="mt-1 flex items-center gap-2">
          <WqRating
            v-if="business.rating.count > 0"
            :value="business.rating.average"
            :count="business.rating.count"
            size="sm"
          />
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-foreground-muted">
          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="t-caption truncate">
            {{ business.address.district }}، {{ business.address.city }}
          </span>
        </div>
      </div>
    </NuxtLink>

    <!-- لایهٔ روی کاور: تأیید و اکشن نشان‌کردن (بیرون از لینک) -->
    <div class="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
      <BusinessSaveToggle
        v-if="showSaveAction"
        :business-id="business.id"
        :business="business"
        class="pointer-events-auto border-transparent bg-surface/90 shadow-none backdrop-blur-sm"
      />
      <span v-else />
      <span
        v-if="business.isVerified"
        class="pointer-events-none flex shrink-0 items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[0.625rem] font-medium text-primary backdrop-blur-sm"
      >
        <UIcon name="i-lucide-circle-check" class="size-3" aria-hidden="true" />
        تأییدشده
      </span>
    </div>
  </article>
</template>
