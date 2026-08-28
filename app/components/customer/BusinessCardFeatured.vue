<script setup lang="ts">
/**
 * کارت کسب‌وکار ویژه — کارت بزرگ با تصویر cover.
 * برای بخش «پیشنهاد برای شما» و کسب‌وکارهای ویژه.
 */
import type { Business, BusinessCategory } from '~/types/business'

const props = defineProps<{
  business: Business
  category?: BusinessCategory | null
}>()

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

// Reset state when business changes
watch(() => props.business.id, () => {
  imgLoaded.value = false
  imgError.value = false
})
</script>

<template>
  <NuxtLink
    :to="`/business/${business.id}`"
    class="pressable group block w-72 shrink-0 overflow-hidden rounded-xl border border-line bg-surface"
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

      <!-- نشان تایید -->
      <span
        v-if="business.isVerified"
        class="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[0.625rem] font-medium text-primary backdrop-blur-sm"
      >
        <UIcon name="i-lucide-circle-check" class="size-3" />
        تأییدشده
      </span>
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
        <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
        <span class="t-caption truncate">
          {{ business.address.district }}، {{ business.address.city }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
