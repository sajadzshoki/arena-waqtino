<script setup lang="ts">
/**
 * نوار سه‌شاخص داشبورد مالک.
 *
 * هر خانه «برچسب کامل + آیکون + عدد» دارد تا وضعیت هرگز فقط با رنگ یا فقط با
 * عدد منتقل نشود. اعداد را سرویس مالک می‌شمارد، نه صفحه.
 */
import type { OwnerBusinessMetrics } from '~/types/owner'

const props = defineProps<{ metrics: OwnerBusinessMetrics }>()

const cells = computed(() => [
  {
    key: 'today',
    label: 'نوبت امروز',
    value: props.metrics.todayCount,
    icon: 'i-lucide-calendar-check'
  },
  {
    key: 'upcoming',
    label: 'نوبت پیش‌رو',
    value: props.metrics.upcomingCount,
    icon: 'i-lucide-calendar-days'
  },
  {
    key: 'pending',
    label: 'در انتظار تأیید',
    value: props.metrics.pendingCount,
    icon: 'i-lucide-hourglass-medium'
  }
] as const)
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <div
      v-for="cell in cells"
      :key="cell.key"
      class="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface px-2 py-3 text-center"
    >
      <UIcon :name="cell.icon" class="size-4 text-foreground-muted" aria-hidden="true" />
      <span class="t-num text-lg leading-none text-foreground">{{ toFaDigits(cell.value) }}</span>
      <span class="text-[0.6875rem] leading-tight text-foreground-muted">{{ cell.label }}</span>
    </div>
  </div>
</template>
