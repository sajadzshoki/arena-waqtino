<script setup lang="ts">
/**
 * انتخاب زمان — گام چهارم رزرو.
 *
 * فاز ۱۱: ساعت‌ها از «برنامهٔ کاری + مدت سرویس + نوبت‌های موجود» می‌آیند و
 * وقتی ساعتی نیست، دلیلش نشان داده می‌شود — «تعطیل»، «پر»، «گذشته» و
 * «ساعت کاری تنظیم نشده» چهار پیام متفاوت‌اند. کسب‌وکار در این تفاوت‌ها نقش ندارد؛
 * همه از `status` همان روز می‌آید.
 *
 * نمایش ساعت با `localTimeOf` است (وقت کسب‌وکار)، نه منطقهٔ زمانی مرورگر — وگرنه
 * «۱۰:۰۰» برای مشتریِ خارج از تهران ساعت دیگری را نشان می‌دهد.
 */
import type { AvailabilityInterval, DayAvailabilityStatus, TimeSlot } from '~/types/availability'
import { formatIntervalFa, localTimeOf, formatTimeFa } from '~/utils/schedule-time'

const props = defineProps<{
  slots: TimeSlot[]
  selectedSlot: TimeSlot | null
  loading?: boolean
  noSlotsAvailable?: boolean
  /** وضعیت همان روز — از پرس‌وجوی دسترس‌پذیری (فاز ۱۱) */
  status?: DayAvailabilityStatus | null
  /** توضیح فارسی آماده از سرویس؛ اگر نبود از خود `status` ساخته می‌شود */
  message?: string | null
  /** پنجرهٔ کاری همان روز، برای صادق‌بودنِ پیام («تا ۱۸:۰۰ باز است ولی پر است») */
  window?: AvailabilityInterval[]
  error?: string | null
}>()

const emit = defineEmits<{
  select: [slot: TimeSlot]
  retry: []
}>()

const reasons: Record<DayAvailabilityStatus, { icon: string; title: string; hint: string }> = {
  available: { icon: 'i-lucide-clock', title: '', hint: '' },
  'fully-booked': {
    icon: 'i-lucide-calendar-check',
    title: 'همهٔ وقت‌های این روز رزرو شده است.',
    hint: 'یک روز دیگر را امتحان کنید.'
  },
  closed: {
    icon: 'i-lucide-calendar-x',
    title: 'در این روز پذیرش نداریم.',
    hint: 'روزهای کاری این کسب‌وکار در تقویم روشن است.'
  },
  'not-configured': {
    icon: 'i-lucide-circle-dashed',
    title: 'این کسب‌وکار هنوز ساعات کاری‌اش را تنظیم نکرده است.',
    hint: 'برای همین ساعتی برای انتخاب وجود ندارد.'
  },
  past: {
    icon: 'i-lucide-hourglass',
    title: 'ساعت‌های کاری امروز گذشته است.',
    hint: 'فردا را انتخاب کنید.'
  },
  unavailable: {
    icon: 'i-lucide-ban',
    title: 'این انتخاب فعلاً قابل رزرو نیست.',
    hint: 'سرویس یا پرسنل ممکن است غیرفعال شده باشد.'
  }
}

const reason = computed(() => {
  const key = props.status ?? 'fully-booked'
  const meta = reasons[key]
  return {
    icon: meta.icon,
    title: props.message || meta.title,
    hint: meta.hint
  }
})

const windowLabel = computed(() =>
  (props.window ?? []).map(interval => formatIntervalFa(interval, '–')).join('، ')
)

function slotTime(slot: TimeSlot): string {
  return formatTimeFa(localTimeOf(slot.start))
}

function isSlotSelected(slot: TimeSlot, selected: TimeSlot | null): boolean {
  if (!selected) return false
  return slot.start === selected.start && slot.end === selected.end
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-3 gap-2" aria-hidden="true">
      <USkeleton v-for="n in 9" :key="n" class="h-12 rounded-xl" />
    </div>

    <p v-else-if="error" class="t-body-sm flex items-start gap-2 rounded-xl border border-error-border bg-error-soft px-3 py-2.5 text-error" role="alert">
      <UIcon name="i-lucide-wifi-off" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1">{{ error }}</span>
      <WqButton variant="tertiary" size="sm" class="min-h-11 shrink-0" icon="i-lucide-rotate-ccw" @click="emit('retry')">
        تلاش دوباره
      </WqButton>
    </p>

    <!-- No slots — با دلیل، نه «خالی است» خام -->
    <div
      v-else-if="noSlotsAvailable || slots.length === 0"
      class="flex flex-col items-center gap-2 px-6 py-9 text-center"
    >
      <UIcon :name="reason.icon" class="size-8 text-foreground-muted" aria-hidden="true" />
      <p class="t-body-sm font-medium text-foreground-secondary">{{ reason.title }}</p>
      <p v-if="reason.hint" class="t-caption text-foreground-muted">{{ reason.hint }}</p>
      <p v-if="windowLabel" class="t-caption t-num rounded-lg bg-surface-muted px-2.5 py-1 text-foreground-secondary" dir="ltr">
        پنجرهٔ کاری آن روز: {{ windowLabel }}
      </p>
    </div>

    <!-- Slot grid -->
    <div v-else class="grid grid-cols-3 gap-2">
      <button
        v-for="slot in slots"
        :key="slot.start"
        type="button"
        class="pressable flex min-h-12 items-center justify-center rounded-xl border p-3 text-center"
        :class="[
          isSlotSelected(slot, selectedSlot)
            ? 'border-primary-border bg-primary text-primary-foreground'
            : slot.isAvailable
              ? 'border-line bg-surface text-foreground hover:border-primary-border hover:bg-primary-soft'
              : 'cursor-not-allowed border-line bg-surface-muted text-foreground-muted'
        ]"
        :disabled="!slot.isAvailable"
        :aria-pressed="isSlotSelected(slot, selectedSlot)"
        :aria-label="`ساعت ${slotTime(slot)} — ${slot.isAvailable ? 'قابل رزرو' : 'رزرو شده'}`"
        @click="emit('select', slot)"
      >
        <span class="t-num text-sm font-medium" dir="ltr">{{ slotTime(slot) }}</span>
        <span v-if="!slot.isAvailable" class="sr-only">رزرو شده</span>
      </button>
    </div>
  </div>
</template>
