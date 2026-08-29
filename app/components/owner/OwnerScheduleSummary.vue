<script setup lang="ts">
/**
 * خلاصهٔ هفته — پاسخ صریح «چه روزها و ساعت‌هایی؟» (فاز ۱۱).
 *
 * هم در کارت کسب‌وکار استفاده می‌شود و هم به‌عنوان پیش‌نمایش زندهٔ draft در
 * ویرایشگر؛ برای همین props خالی است. روزهای تعطیل هم *متن* دارند («تعطیل»)،
 * پس وضعیت فقط با رنگ منتقل نمی‌شود.
 *
 * چیدمان: فهرست «برچسب → ساعت» با `dl`، نه جدول — روی دسکتاپ هم کشیده و
 * enterprise نمی‌شود، فقط کارت پهن‌تر.
 */
import type { ScheduleSummary } from '~/types/availability'

withDefaults(
  defineProps<{
    summary: ScheduleSummary
    /** متن زیر خلاصه (مثلاً توضیح منبع برنامه) */
    footnote?: string
  }>(),
  { footnote: undefined }
)
</script>

<template>
  <div>
    <dl class="flex flex-col gap-1.5">
      <div
        v-for="line in summary.lines"
        :key="line.label"
        class="flex items-baseline justify-between gap-3 rounded-lg px-1 py-1"
        :class="line.muted ? '' : 'bg-surface-muted/60'"
      >
        <dt class="t-body-sm shrink-0 font-semibold" :class="line.muted ? 'text-foreground-muted' : 'text-foreground'">
          {{ line.label }}
        </dt>
        <dd
          class="t-body-sm t-num min-w-0 flex-1 truncate text-end"
          :class="line.muted ? 'text-foreground-muted' : 'text-foreground-secondary'"
          :dir="line.muted ? undefined : 'ltr'"
        >
          {{ line.value }}
        </dd>
      </div>
    </dl>

    <p class="t-caption mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground-muted">
      <UIcon name="i-lucide-calendar-check" class="size-3.5 shrink-0" aria-hidden="true" />
      <span>{{ toFaDigits(summary.openDays) }} روز فعال · {{ toFaDigits(summary.intervalCount) }} بازهٔ زمانی</span>
      <span aria-hidden="true">·</span>
      <span>{{ summary.timezone }}</span>
    </p>

    <p v-if="footnote" class="t-caption mt-1.5 text-foreground-muted">{{ footnote }}</p>
  </div>
</template>
