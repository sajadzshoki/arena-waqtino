<script setup lang="ts">
/**
 * BookingCardUpcoming - کارت نمایش رزروهای آینده
 * نمایش اطلاعات اصلی رزرو شامل کسب‌وکار، خدمت، تاریخ و زمان
 */
import type { BookingWithDetails } from '~/types/booking'
import { formatFaTime, formatDateLabel } from '~/utils/datetime'

const props = defineProps<{
  booking: BookingWithDetails
}>()

// محاسبه زمان باقی‌مانده تا رزرو
const timeUntil = computed(() => {
  const now = new Date()
  const bookingTime = new Date(props.booking.start)
  const diffMs = bookingTime.getTime() - now.getTime()
  
  if (diffMs < 0) return 'گذشته'
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) return `${diffDays} روز دیگر`
  if (diffHours > 0) return `${diffHours} ساعت دیگر`
  return 'کمتر از یک ساعت'
})
</script>

<template>
  <NuxtLink
    :to="`/bookings/${booking.id}`"
    class="block rounded-2xl border border-line bg-surface p-4 transition-all hover:border-primary hover:shadow-sm"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- اطلاعات اصلی -->
      <div class="flex-1 space-y-2">
        <!-- نام کسب‌وکار -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-store" class="size-4 text-primary" />
          <h3 class="truncate font-semibold text-foreground">{{ booking.businessName }}</h3>
        </div>

        <!-- نام خدمت -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-concierge-bell" class="size-4 text-foreground-secondary" />
          <p class="truncate text-sm text-foreground-secondary">{{ booking.serviceName }}</p>
        </div>

        <!-- تاریخ و زمان -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="size-4 text-foreground-secondary" />
          <div class="flex items-center gap-1.5">
            <span class="text-sm text-foreground">{{ formatDateLabel(new Date(booking.start)) }}</span>
            <span class="text-foreground-secondary">•</span>
            <span class="text-sm text-foreground">{{ formatFaTime(new Date(booking.start)) }}</span>
          </div>
        </div>
      </div>

      <!-- وضعیت و زمان باقی‌مانده -->
      <div class="flex flex-col items-end gap-2">
        <!-- Badge وضعیت -->
        <div
          v-if="booking.status === 'confirmed'"
          class="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1"
        >
          <UIcon name="i-lucide-check-circle" class="size-3.5 text-success" />
          <span class="text-xs font-medium text-success">تأیید شده</span>
        </div>
        <div
          v-else-if="booking.status === 'pending'"
          class="flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1"
        >
          <UIcon name="i-lucide-clock" class="size-3.5 text-warning" />
          <span class="text-xs font-medium text-warning">در انتظار</span>
        </div>

        <!-- زمان باقی‌مانده -->
        <span class="text-xs text-foreground-secondary">{{ timeUntil }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
