<script setup lang="ts">
/**
 * خلاصهٔ امتیاز و نظرات — آماری + دکمه مشاهدهٔ همه (placeholder).
 */
import type { BusinessRating } from '~/types/business'

defineProps<{
  rating: BusinessRating
}>()

const toast = useAppToast()

function viewAllReviews() {
  toast.neutral('صفحهٔ نظرات در نسخهٔ آینده فعال می‌شود.', 'i-lucide-message-square')
}
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <!-- امتیاز بزرگ -->
      <div class="flex flex-col items-center">
        <span class="t-display text-primary">{{ toFaDigits(rating.average.toFixed(1)) }}</span>
        <WqRating :value="rating.average" :show-count="false" size="sm" />
      </div>
      <!-- تعداد نظر -->
      <div>
        <span class="t-body-sm text-foreground">
          {{ toFaDigits(rating.count) }} نظر
        </span>
      </div>
    </div>
    <WqButton
      variant="tertiary"
      size="sm"
      icon="i-lucide-message-square"
      @click="viewAllReviews"
    >
      مشاهدهٔ نظرات
    </WqButton>
  </div>
</template>
