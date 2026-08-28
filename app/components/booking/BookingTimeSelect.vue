<script setup lang="ts">
/**
 * انتخاب زمان — مرحلهٔ چهارم رزرو.
 * نمایش اسلات‌های قابل‌رزرو برای تاریخ انتخاب‌شده.
 */
import type { TimeSlot } from '~/types/availability'

defineProps<{
  slots: TimeSlot[]
  selectedSlot: TimeSlot | null
  loading?: boolean
  noSlotsAvailable?: boolean
}>()

defineEmits<{
  select: [slot: TimeSlot]
}>()

function formatSlotTime(slot: TimeSlot): string {
  return formatFaTime(new Date(slot.start))
}

function isSlotSelected(slot: TimeSlot, selected: TimeSlot | null): boolean {
  if (!selected) return false
  return slot.start === selected.start && slot.end === selected.end
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-3 gap-2">
      <USkeleton v-for="n in 9" :key="n" class="h-12 rounded-xl" />
    </div>

    <!-- No slots available -->
    <div v-else-if="noSlotsAvailable" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <UIcon name="i-lucide-calendar-clock" class="size-8 text-foreground-muted" />
      <p class="t-body-sm text-foreground-secondary">
        در این تاریخ وقت آزادی وجود ندارد.
      </p>
      <p class="t-caption text-foreground-muted">
        لطفاً تاریخ دیگری انتخاب کنید.
      </p>
    </div>

    <!-- Empty -->
    <div v-else-if="slots.length === 0" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <UIcon name="i-lucide-loader" class="size-8 animate-spin text-foreground-muted" />
      <p class="t-body-sm text-foreground-secondary">در حال دریافت زمان‌های آزاد...</p>
    </div>

    <!-- Slot grid -->
    <div v-else class="grid grid-cols-3 gap-2">
      <button
        v-for="slot in slots"
        :key="slot.start"
        type="button"
        class="pressable flex items-center justify-center rounded-xl border p-3 text-center"
        :class="[
          isSlotSelected(slot, selectedSlot)
            ? 'border-primary-border bg-primary text-primary-foreground'
            : slot.isAvailable
              ? 'border-line bg-surface text-foreground hover:border-primary-border hover:bg-primary-soft'
              : 'cursor-not-allowed border-line-subtle bg-surface-muted text-foreground-disabled line-through',
          !slot.isAvailable && 'pointer-events-none'
        ]"
        :disabled="!slot.isAvailable"
        :aria-label="`زمان ${formatSlotTime(slot)} — ${slot.isAvailable ? 'قابل رزرو' : 'رزرو شده'}`"
        @click="$emit('select', slot)"
      >
        <span class="t-num text-sm font-medium">
          {{ formatSlotTime(slot) }}
        </span>
      </button>
    </div>
  </div>
</template>
