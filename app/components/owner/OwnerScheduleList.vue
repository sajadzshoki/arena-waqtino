<script setup lang="ts">
/**
 * ردیف‌های فشردهٔ نوبت برای مالک — ساعت، مشتری، سرویس، پرسنل و وضعیت.
 *
 * فقط نمایش می‌دهد؛ هیچ اکشن مدیریتی (تأیید/لغو/جابه‌جایی) ندارد، چون مدیریت
 * نوبت‌ها فاز بعدی است. معماری طوری است که همان ردیف‌ها در آینده با اکشن‌های
 * واقعی جایگزین شوند، نه با بازنویسی صفحه.
 */
import type { OwnerBookingItem } from '~/types/owner'
import { formatFaTime } from '~/utils/datetime'

defineProps<{ items: OwnerBookingItem[] }>()
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
    >
      <div class="flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-lg bg-surface-muted px-1 py-1.5">
        <span class="t-num text-sm leading-none text-foreground">{{ formatFaTime(item.start) }}</span>
        <span class="t-num text-[0.625rem] leading-none text-foreground-muted">{{ formatFaTime(item.end) }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <p class="t-body-sm truncate font-medium text-foreground">
          {{ item.customerName }}
        </p>
        <p class="t-caption truncate text-foreground-muted">
          {{ item.serviceName }}
          <span class="whitespace-nowrap">· {{ item.employeeName ?? 'بدون پرسنل' }}</span>
        </p>
      </div>

      <WqStatusBadge :status="item.status" class="shrink-0" />
    </li>
  </ul>
</template>
