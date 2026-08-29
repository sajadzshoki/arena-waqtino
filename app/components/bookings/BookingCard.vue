<script setup lang="ts">
/**
 * BookingCard — یک نوبت در فهرست تاریخچه.
 *
 * دو نمای یک‌شکل با یک کامپوننت (به‌جای «کارت پیش‌رو» + «کارت گذشته» که دو نسخهٔ
 * هم‌رنگ می‌شدند): تفاوت فقط در سطر آخر است — پیش‌رو «چقدر مانده» یا دلیلِ ردِ
 * لغو، گذشته «مدت خدمت». وضعیت هرگز فقط رنگ نیست: `WqStatusBadge` آیکون + متن
 * دارد و از نگاشت مرکزی می‌خواند (§۴۸/§۲۱).
 */
import type { BookingWithDetails } from '~/types/booking'

const props = withDefaults(
  defineProps<{
    booking: BookingWithDetails
    scope?: 'upcoming' | 'past'
  }>(),
  { scope: 'upcoming' }
)

const timeUntil = computed(() => {
  const diffMs = new Date(props.booking.start).getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)
  if (diffMinutes < 0) return 'گذشته'
  if (diffMinutes < 60) return `${toFaDigits(Math.max(1, diffMinutes))} دقیقه دیگر`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${toFaDigits(diffHours)} ساعت دیگر`
  return `${toFaDigits(Math.floor(diffHours / 24))} روز دیگر`
})

/** سیاست از config (همان تابعی که سرویس مصرف می‌کند) — صفحه قاعده نمی‌سازد. */
const block = computed(() => (props.scope === 'upcoming' ? bookingCancelBlock(props.booking) : null))
</script>

<template>
  <NuxtLink
    :to="`/bookings/${booking.id}`"
    class="pressable block rounded-xl border border-line bg-surface p-4 hover:border-line-strong"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl"
        :class="scope === 'upcoming' ? 'bg-primary-soft text-primary' : 'bg-surface-muted text-foreground-secondary'"
        aria-hidden="true"
      >
        <UIcon :name="scope === 'upcoming' ? 'i-lucide-calendar-clock' : 'i-lucide-calendar-check'" class="size-5" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="t-body min-w-0 truncate font-semibold text-foreground-strong">
            {{ booking.businessName }}
          </h3>
          <UIcon name="i-lucide-chevron-left" class="mt-1 size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
        </div>

        <p class="t-body-sm mt-0.5 truncate text-foreground-secondary">
          {{ booking.serviceName }}
          <span v-if="booking.employeeName" class="text-foreground-muted">
            • {{ booking.employeeName }}
          </span>
        </p>

        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <WqDateTime :value="booking.start" mode="datetime" class="t-body-sm text-foreground" />
          <WqStatusBadge :status="booking.status" />
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle pt-2">
          <span class="t-caption flex items-start gap-1.5 text-foreground-muted">
            <UIcon
              v-if="block === 'window'"
              name="i-lucide-clock-alert"
              class="mt-0.5 size-3.5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <template v-if="scope === 'upcoming' && block === null">
              {{ timeUntil }}
            </template>
            <template v-else-if="scope === 'upcoming'">
              {{ bookingCancelBlockLabel(block ?? 'status') }}
            </template>
            <template v-else>
              {{ toFaDigits(booking.serviceDuration) }} دقیقه
            </template>
          </span>
          <WqPrice :amount="booking.price" size="sm" class="shrink-0" />
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
