<script setup lang="ts">
/**
 * یک روز از هفته در ویرایشگر ساعات کاری (فاز ۱۱).
 *
 * سه حالت، همگی با متن + آیکون (نه فقط رنگ): باز است · تعطیل · فقط‌نمایش.
 * روز تعطیل عمداً «جمع‌شده» است ولی بازه‌هایش *پاک نشده‌اند*: اگر owner دوباره
 * روشنش کند، ساعت‌های قبل همان‌جا هستند — پس تعطیل‌کردن تنبیه نیست.
 *
 * سوییچ روی `role="switch"` است و `aria-checked` دارد؛ دکمهٔ «افزودن بازه» فقط
 * وقتی دیده می‌شود که روز باز باشد (روز تعطیل، ویرایشگر بازه ندارد).
 */
import type { AvailabilityDay, Weekday } from '~/types/availability'
import { weekdayLabel } from '~/config/availability'

const props = defineProps<{
  day: AvailabilityDay
  /** خطای همین روز از `validateSchedule` */
  error?: string
  /** خطای بازهٔ indexام (`weekday:index`) */
  intervalError?: (index: number) => string | undefined
  disabled?: boolean
  readonly?: boolean
  /** سقف بازه در روز از سیاست متمرکز — تا دکمهٔ بی‌فایده نماند */
  maxReached?: boolean
}>()

const emit = defineEmits<{
  toggle: [weekday: Weekday]
  add: [weekday: Weekday]
  change: [weekday: Weekday, index: number, part: 'start' | 'end', value: string]
  remove: [weekday: Weekday, index: number]
}>()

const open = computed(() => props.day.enabled)
const label = computed(() => weekdayLabel(props.day.weekday))
</script>

<template>
  <li
    class="rounded-xl border bg-surface"
    :class="error ? 'border-error-border' : open ? 'border-line' : 'border-dashed border-line-strong'"
  >
    <div class="flex items-center gap-3 p-3">
      <span class="min-w-0 flex-1">
        <span class="t-body block font-semibold text-foreground-strong">{{ label }}</span>
        <span
          class="t-caption mt-0.5 flex items-center gap-1"
          :class="open ? 'text-foreground-secondary' : 'text-foreground-muted'"
        >
          <UIcon
            :name="open ? 'i-lucide-clock' : 'i-lucide-calendar-x'"
            class="size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span v-if="open">
            {{ day.intervals.length > 0
              ? `${toFaDigits(day.intervals.length)} بازهٔ زمانی`
              : 'بدون بازه' }}
          </span>
          <span v-else>تعطیل</span>
        </span>
      </span>

      <span
        v-if="readonly"
        class="t-caption shrink-0 rounded-lg bg-surface-muted px-2 py-1 text-foreground-muted"
      >
        فقط نمایش
      </span>
      <button
        v-else
        type="button"
        role="switch"
        :aria-checked="open"
        :aria-label="`وضعیت ${label} در برنامهٔ کاری`"
        class="pressable flex min-h-12 shrink-0 items-center rounded-lg border px-2.5"
        :class="open ? 'border-primary-border bg-primary-soft' : 'border-line bg-surface'"
        :disabled="disabled"
        @click="emit('toggle', day.weekday)"
      >
        <span class="t-caption flex items-center gap-1 font-semibold">
          <UIcon
            :name="open ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
            class="size-5"
            :class="open ? 'text-primary' : 'text-foreground-muted'"
            aria-hidden="true"
          />
          {{ open ? 'باز' : 'تعطیل' }}
        </span>
      </button>
    </div>

    <div v-if="open" class="border-t border-line px-3 pt-2.5 pb-3">
      <ul v-if="day.intervals.length > 0" class="flex flex-col gap-2">
        <OwnerAvailabilityInterval
          v-for="(interval, index) in day.intervals"
          :key="`${day.weekday}-${index}`"
          :interval="interval"
          :error="intervalError?.(index)"
          :disabled="disabled"
          :readonly="readonly"
          @change="(part, value) => emit('change', day.weekday, index, part, value)"
          @remove="emit('remove', day.weekday, index)"
        />
      </ul>

      <p v-else class="t-body-sm rounded-lg border border-dashed border-line-strong p-2.5 text-foreground-secondary">
        هنوز بازه‌ای برای این روز وارد نشده است.
      </p>

      <WqButton
        v-if="!readonly"
        variant="secondary"
        size="sm"
        icon="i-lucide-plus"
        class="mt-2.5 min-h-12 w-full"
        :disabled="disabled || maxReached"
        @click="emit('add', day.weekday)"
      >
        {{ maxReached ? 'سقف بازه‌های روز پر شده' : 'افزودن بازهٔ زمانی' }}
      </WqButton>
    </div>

    <p v-if="error" class="t-caption flex items-start gap-1.5 border-t border-line px-3 py-2 text-error">
      <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
  </li>
</template>
