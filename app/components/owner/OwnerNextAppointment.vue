<script setup lang="ts">
/**
 * نوبت بعدی کسب‌وکار — مهم‌ترین «الان» فضای کاری.
 *
 * آگاهی از نزدیک‌ترین نوبت را می‌دهد (مشتری، سرویس، پرسنل، زمان، وضعیت) بدون
 * این‌که مدیریت نوبت را در این فاز باز کند: نه دکمهٔ تأیید/لغو، نه لینک —
 * چون مقصد آن (مدیریت نوبت‌ها) هنوز ساخته نشده. ورودیِ همان صفحه در معماری
 * همین‌جاست: `OwnerBookingItem` همان چیزی است که فهرست مدیریت هم مصرف می‌کند.
 */
import type { OwnerBookingItem } from '~/types/owner'
import { formatDateLabel, formatFaTime } from '~/utils/datetime'

const props = defineProps<{ item: OwnerBookingItem }>()

const start = computed(() => new Date(props.item.start))
const dayLabel = computed(() => formatDateLabel(start.value))
</script>

<template>
  <section class="rounded-xl border border-primary-border bg-primary-soft p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="t-label flex items-center gap-1.5 text-primary">
        <UIcon name="i-lucide-alarm-clock" class="size-4 shrink-0" aria-hidden="true" />
        نوبت بعدی
      </h3>
      <WqStatusBadge :status="item.status" />
    </div>

    <p class="t-h3 mt-2 truncate text-foreground">{{ item.customerName }}</p>
    <p class="t-body-sm mt-0.5 truncate text-foreground-secondary">{{ item.serviceName }}</p>

    <dl class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <div class="flex items-center gap-1.5">
        <dt class="sr-only">زمان</dt>
        <UIcon name="i-lucide-calendar-days" class="size-4 text-foreground-muted" aria-hidden="true" />
        <dd class="t-body-sm t-num text-foreground">
          {{ dayLabel }} · {{ formatFaTime(item.start) }}
        </dd>
      </div>
      <div class="flex min-w-0 items-center gap-1.5">
        <dt class="sr-only">پرسنل</dt>
        <UIcon name="i-lucide-user-round" class="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
        <dd class="t-body-sm truncate text-foreground-secondary">
          {{ item.employeeName ?? 'بدون پرسنل' }}
        </dd>
      </div>
    </dl>
  </section>
</template>
