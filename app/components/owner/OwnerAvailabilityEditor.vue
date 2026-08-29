<script setup lang="ts">
/**
 * ویرایشگر هفتگی — درخت مشترک کسب‌وکار و پرسنل (فاز ۱۱).
 *
 * دو صفحه (ساعت کسب‌وکار، ساعت یک پرسنل) همین یک درخت را مصرف می‌کنند:
 * `WeeklyScheduleEditor → ScheduleDay → Interval`. اگر برای هرکدام یک درخت
 * می‌ساختیم، قاعده‌ها (ترتیب روز، سقف بازه، حالت تعطیل) دو بار پیاده می‌شد و
 * روزی فرق می‌کردند.
 *
 * این کامپوننت هیچ state دامنه‌ای ندارد: `days` را می‌گیرد و رویداد می‌فرستد؛
 * پیش‌نویس، اعتبارسنجی و ذخیره در `useScheduleEditor` است.
 */
import { AVAILABILITY_POLICY } from '~/config/availability'
import type { AvailabilityDay, Weekday } from '~/types/availability'

const props = withDefaults(
  defineProps<{
    days: AvailabilityDay[]
    dayError: (weekday: Weekday) => string | undefined
    intervalError: (weekday: Weekday, index: number) => string | undefined
    /** روزهای تعطیل/خاموش — وقتی برنامهٔ نفر «مطابق کسب‌وکار» است */
    disabled?: boolean
    readonly?: boolean
    maxIntervalsPerDay?: number
  }>(),
  { disabled: false, readonly: false, maxIntervalsPerDay: AVAILABILITY_POLICY.maxIntervalsPerDay }
)

function maxReached(day: AvailabilityDay): boolean {
  return day.intervals.length >= props.maxIntervalsPerDay
}

const emit = defineEmits<{
  toggle: [weekday: Weekday]
  add: [weekday: Weekday]
  change: [weekday: Weekday, index: number, part: 'start' | 'end', value: string]
  remove: [weekday: Weekday, index: number]
}>()
</script>

<template>
  <ul class="flex flex-col gap-2.5">
    <OwnerAvailabilityDay
      v-for="day in days"
      :key="day.weekday"
      :day="day"
      :error="dayError(day.weekday)"
      :interval-error="index => intervalError(day.weekday, index)"
      :disabled="disabled"
      :readonly="readonly"
      :max-reached="maxReached(day)"
      @toggle="emit('toggle', $event)"
      @add="emit('add', $event)"
      @change="(weekday, index, part, value) => emit('change', weekday, index, part, value)"
      @remove="(weekday, index) => emit('remove', weekday, index)"
    />
  </ul>
</template>
