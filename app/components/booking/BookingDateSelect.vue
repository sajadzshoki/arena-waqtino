<script setup lang="ts">
/**
 * انتخاب تاریخ — گام سوم رزرو.
 *
 * فاز ۱۱ دو چیز را در این ردیف عوض کرد:
 *   • روز تعطیل از *برنامهٔ کاری* خوانده می‌شود، نه از «جمعه پس تعطیل است»؛
 *   • «وقت نیست» سه دلیل متفاوت دارد (تعطیل · پر · تنظیم‌نشده) و هر سه با متن
 *     خودش نشان داده می‌شود — حالت خالیِ بی‌دلیل، دقیقاً همان چیزی است که نباید
 *     بسازیم.
 *
 * روز/ساعت اینجا محاسبه نمی‌شود: `weekdayOf` و `formatDateKey` از
 * `utils/schedule-time`‌اند تا مبنای «امروز»، وقت کسب‌وکار باشد نه منطقهٔ زمانی
 * مرورگر.
 */
import type { DateAvailability } from '~/types/booking-flow'
import { formatDateKey, weekdayOf } from '~/utils/schedule-time'
import { weekdayShortLabel } from '~/config/availability'

const props = defineProps<{
  dates: DateAvailability[]
  /** ISO date string (YYYY-MM-DD) */
  selectedDate: string | null
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  select: [date: string]
  /** خطای شبکه/سرویس در پرس‌وجوی روزها — صفحه دوباره می‌خواند */
  retry: []
}>()

const scrollContainer = ref<HTMLDivElement | null>(null)

/** اسکرول به تاریخ انتخاب‌شده */
function scrollToSelected(dates: DateAvailability[], selected: string | null): void {
  const el = scrollContainer.value
  if (!el || !selected) return
  const index = dates.findIndex(d => d.dateStr === selected)
  if (index >= 0) {
    const children = el.children
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }
}

onMounted(() => nextTick(() => scrollToSelected(props.dates, props.selectedDate)))
watch(
  () => [props.dates, props.selectedDate] as const,
  () => nextTick(() => scrollToSelected(props.dates, props.selectedDate))
)

function dayNumber(dateStr: string): string {
  return toFaDigits(Number(dateStr.slice(8, 10)) || 0)
}

function weekdayInitial(dateStr: string): string {
  const weekday = weekdayOf(dateStr)
  return weekday ? weekdayShortLabel(weekday) : ''
}

function hint(item: DateAvailability): string {
  if (item.hasAvailableSlots) return item.isToday ? 'امروز' : item.isTomorrow ? 'فردا' : ''
  if (item.status === 'closed') return 'تعطیل'
  if (item.status === 'not-configured') return 'تنظیم‌نشده'
  if (item.status === 'past') return 'گذشته'
  if (item.status === 'unavailable') return ''
  return 'پر'
}

function ariaLabel(item: DateAvailability): string {
  const day = formatDateKey(item.dateStr, 'short')
  if (item.hasAvailableSlots) return `${day} — وقت آزاد دارد`
  const reason =
    item.status === 'closed'
      ? 'در این روز پذیرش نداریم'
      : item.status === 'not-configured'
        ? 'ساعت کاری این کسب‌وکار تنظیم نشده'
        : item.status === 'past'
          ? 'ساعت‌های این روز گذشته است'
          : item.status === 'unavailable'
            ? 'این انتخاب فعلاً قابل رزرو نیست'
            : 'همهٔ وقت‌های این روز رزرو شده'
  return `${day} — ${reason}`
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex gap-2 overflow-hidden" aria-hidden="true">
      <USkeleton v-for="n in 7" :key="n" class="h-20 w-16 shrink-0 rounded-xl" />
    </div>

    <p v-else-if="error" class="t-body-sm flex items-start gap-2 rounded-xl border border-error-border bg-error-soft px-3 py-2.5 text-error" role="alert">
      <UIcon name="i-lucide-wifi-off" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1">{{ error }}</span>
      <WqButton
        variant="tertiary"
        size="sm"
        class="min-h-11 shrink-0"
        icon="i-lucide-rotate-ccw"
        @click="emit('retry')"
      >
        تلاش دوباره
      </WqButton>
    </p>

    <!-- Empty -->
    <div v-else-if="dates.length === 0" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <UIcon name="i-lucide-calendar-x" class="size-8 text-foreground-muted" aria-hidden="true" />
      <p class="t-body-sm text-foreground-secondary">تاریخ قابل‌رزروی در روزهای پیش‌رو پیدا نشد.</p>
      <p class="t-caption text-foreground-muted">
        می‌توانید بعداً دوباره نگاه کنید یا کسب‌وکار دیگری انتخاب کنید.
      </p>
    </div>

    <!-- Date strip -->
    <div
      v-else
      ref="scrollContainer"
      class="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
      role="listbox"
      aria-label="روزهای قابل رزرو"
    >
      <button
        v-for="dateItem in dates"
        :key="dateItem.dateStr"
        type="button"
        role="option"
        :aria-selected="selectedDate === dateItem.dateStr"
        :aria-label="ariaLabel(dateItem)"
        :aria-disabled="!dateItem.hasAvailableSlots"
        class="pressable flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl border p-2.5"
        :class="[
          selectedDate === dateItem.dateStr
            ? 'border-primary-border bg-primary text-primary-foreground'
            : 'border-line bg-surface hover:border-line-strong',
          !dateItem.hasAvailableSlots && selectedDate !== dateItem.dateStr ? 'opacity-55' : '',
          !dateItem.hasAvailableSlots && 'cursor-not-allowed'
        ]"
        :disabled="!dateItem.hasAvailableSlots"
        @click="emit('select', dateItem.dateStr)"
      >
        <span
          class="t-caption flex items-center gap-1 font-medium"
          :class="selectedDate === dateItem.dateStr ? 'text-primary-foreground/80' : ''"
        >
          <UIcon
            v-if="!dateItem.hasAvailableSlots && dateItem.status === 'closed'"
            name="i-lucide-calendar-x"
            class="size-3"
            aria-hidden="true"
          />
          {{ weekdayInitial(dateItem.dateStr) }}
        </span>
        <span
          class="t-h2"
          :class="selectedDate === dateItem.dateStr ? 'text-primary-foreground' : 'text-foreground'"
        >
          {{ dayNumber(dateItem.dateStr) }}
        </span>
        <span
          class="t-caption leading-4"
          :class="selectedDate === dateItem.dateStr
            ? 'text-primary-foreground/70'
            : dateItem.hasAvailableSlots ? 'text-foreground-muted' : 'text-foreground-secondary'"
        >
          {{ hint(dateItem) }}
        </span>
      </button>
    </div>
  </div>
</template>
