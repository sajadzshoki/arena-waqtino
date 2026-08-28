<script setup lang="ts">
/**
 * نشانگر پیشرفت فرآیند رزرو — نمایش مختصر مرحلهٔ فعلی.
 */
import type { BookingStep } from '~/types/booking-flow'

defineProps<{
  currentStep: BookingStep
}>()

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'service', label: 'خدمت' },
  { key: 'employee', label: 'متخصص' },
  { key: 'date', label: 'تاریخ' },
  { key: 'time', label: 'زمان' },
  { key: 'review', label: 'بازبینی' }
]

function stepIndex(step: BookingStep): number {
  return STEPS.findIndex(s => s.key === step)
}

function isStepAccessible(step: BookingStep, current: BookingStep): boolean {
  return stepIndex(step) <= stepIndex(current)
}

function isStepActive(step: BookingStep, current: BookingStep): boolean {
  return step === current
}
</script>

<template>
  <div class="flex items-center gap-1" role="navigation" aria-label="مراحل رزرو">
    <template v-for="(step, idx) in STEPS" :key="step.key">
      <div
        class="flex items-center gap-1"
        :class="[
          isStepActive(step.key, currentStep) ? 'text-primary' : '',
          !isStepAccessible(step.key, currentStep) ? 'text-foreground-disabled' : 'text-foreground-muted'
        ]"
      >
        <span
          class="flex size-6 items-center justify-center rounded-full text-[0.625rem] font-bold"
          :class="[
            isStepActive(step.key, currentStep)
              ? 'bg-primary text-primary-foreground'
              : stepIndex(step.key) < stepIndex(currentStep)
                ? 'bg-primary-soft text-primary'
                : 'bg-surface-muted text-foreground-muted'
          ]"
        >
          {{ toFaDigits(idx + 1) }}
        </span>
        <span
          v-if="isStepActive(step.key, currentStep)"
          class="t-caption font-medium"
        >
          {{ step.label }}
        </span>
      </div>
      <span
        v-if="idx < STEPS.length - 1"
        class="h-px w-3 bg-line"
        :class="stepIndex(step.key) < stepIndex(currentStep) ? 'bg-primary/40' : ''"
      />
    </template>
  </div>
</template>
