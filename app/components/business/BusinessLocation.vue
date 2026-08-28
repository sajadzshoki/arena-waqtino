<script setup lang="ts">
/**
 * بخش موقعیت کسب‌وکار — آدرس + دکمه مسیریابی (placeholder).
 */
import type { BusinessAddress } from '~/types/business'

const props = defineProps<{
  address: BusinessAddress
  distanceKm?: number | null
}>()

const toast = useAppToast()

function openMap() {
  toast.neutral('مسیریابی در نسخهٔ آینده فعال می‌شود.', 'i-lucide-map')
}

const fullAddress = computed(() => {
  const parts = [
    props.address.street,
    props.address.district,
    props.address.city
  ].filter(Boolean)
  return parts.join('، ')
})

const formattedDistance = computed(() => {
  if (props.distanceKm === null || props.distanceKm === undefined) return null
  if (props.distanceKm < 1) {
    return `${toFaDigits(Math.round(props.distanceKm * 1000))} متر`
  }
  return `${toFaDigits(props.distanceKm.toFixed(1))} کیلومتر`
})
</script>

<template>
  <div>
    <!-- placeholder نقشه -->
    <div class="mb-3 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-muted">
      <div class="flex flex-col items-center gap-2 text-center">
        <UIcon name="i-lucide-map" class="size-8 text-foreground-muted" />
        <span class="t-caption text-foreground-muted">نقشه (در نسخهٔ آینده)</span>
      </div>
    </div>

    <!-- آدرس -->
    <WqMetaRow icon="i-lucide-map-pin" label="آدرس" :value="fullAddress" />

    <!-- فاصله -->
    <WqMetaRow
      v-if="formattedDistance"
      icon="i-lucide-navigation"
      label="فاصله تا شما"
      :value="formattedDistance"
    />

    <!-- دکمه مسیریابی -->
    <WqButton
      variant="secondary"
      size="md"
      icon="i-lucide-route"
      block
      class="mt-3"
      @click="openMap"
    >
      مسیریابی
    </WqButton>
  </div>
</template>
