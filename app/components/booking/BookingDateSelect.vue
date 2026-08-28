<script setup lang="ts">
/**
 * انتخاب تاریخ — مرحلهٔ سوم رزرو.
 * نمایش اسکرول افقی تاریخ‌های آینده.
 */
import type { DateAvailability } from '~/types/booking-flow'

const props = defineProps<{
  dates: DateAvailability[]
  selectedDate: string | null // ISO date string
  loading?: boolean
}>()

defineEmits<{
  select: [date: string]
}>()

const scrollContainer = ref<HTMLDivElement | null>(null)

/** اسکرول به تاریخ انتخاب‌شده */
function scrollToSelected() {
  if (!scrollContainer.value || !props.selectedDate) return
  const index = props.dates.findIndex(d => d.dateStr === props.selectedDate)
  if (index >= 0) {
    const children = scrollContainer.value.children
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }
}

onMounted(() => {
  nextTick(() => scrollToSelected())
})

watch(() => props.dates, () => {
  nextTick(() => scrollToSelected())
})

function getDayNumber(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return toFaDigits(d.getDate())
}

function getWeekdayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
  // JS: 0=Sunday → Persian: 0=Saturday
  const persianDay = (d.getDay() + 1) % 7
  return weekdays[persianDay] ?? ''
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex gap-2 overflow-hidden">
      <USkeleton v-for="n in 7" :key="n" class="h-20 w-16 shrink-0 rounded-xl" />
    </div>

    <!-- Empty -->
    <div v-else-if="dates.length === 0" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <UIcon name="i-lucide-calendar-x" class="size-8 text-foreground-muted" />
      <p class="t-body-sm text-foreground-secondary">تاریخ قابل‌رزروی یافت نشد.</p>
    </div>

    <!-- Date strip -->
    <div
      v-else
      ref="scrollContainer"
      class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
    >
      <button
        v-for="dateItem in dates"
        :key="dateItem.dateStr"
        type="button"
        class="pressable flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl border p-2.5"
        :class="[
          selectedDate === dateItem.dateStr
            ? 'border-primary-border bg-primary text-primary-foreground'
            : 'border-line bg-surface hover:border-line-strong',
          !dateItem.hasAvailableSlots && selectedDate !== dateItem.dateStr
            ? 'opacity-40'
            : ''
        ]"
        :disabled="!dateItem.hasAvailableSlots"
        :aria-label="`${formatDateLabel(new Date(dateItem.dateStr))} — ${dateItem.hasAvailableSlots ? 'قابل رزرو' : 'بدون وقت آزاد'}`"
        @click="$emit('select', dateItem.dateStr)"
      >
        <span
          class="t-caption font-medium"
          :class="selectedDate === dateItem.dateStr ? 'text-primary-foreground/80' : ''"
        >
          {{ getWeekdayShort(dateItem.dateStr) }}
        </span>
        <span
          class="t-h2"
          :class="selectedDate === dateItem.dateStr ? 'text-primary-foreground' : 'text-foreground'"
        >
          {{ getDayNumber(dateItem.dateStr) }}
        </span>
        <span
          class="t-caption"
          :class="selectedDate === dateItem.dateStr ? 'text-primary-foreground/70' : ''"
        >
          {{ dateItem.isToday ? 'امروز' : dateItem.isTomorrow ? 'فردا' : '' }}
        </span>
      </button>
    </div>
  </div>
</template>
