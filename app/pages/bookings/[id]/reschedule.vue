<script setup lang="ts">
/**
 * جابه‌جایی زمان یک نوبت (§۳۴) — «نوبت در همان رکورد جابه‌جا می‌شود، نه لغو + ساختِ تازه».
 *
 * چرا این صفحه در فاز ۱۲ اضافه شد؟ جزئیات نوبت به همین مسیر لینک می‌داد ولی
 * صفحه‌ای وجود نداشت؛ یعنی «تغییر زمان نوبت» عملاً یک دکمهٔ مرده بود.
 * انتخاب روز/ساعت از **همان سرویس دسترس‌پذیری فاز ۱۱** و **همان کامپوننت‌های
 * جریان رزرو** می‌آید (زبان UI دومی نساخته‌ایم)؛ اعتبار نهایی هم در لایهٔ سرویس
 * انجام می‌شود — state این صفحه فقط «انتخاب کاربر» است، نه مدرک (§۳۳).
 */
definePageMeta({ access: 'auth', tabbar: false })

const route = useRoute()
const bookingId = computed(() => String(route.params.id ?? ''))

const {
  detail,
  detailPending,
  detailLoaded,
  loadError,
  loadBookingById,
  rescheduleBlock,
  rescheduleBooking,
  reschedulePending,
  actionError
} = useCustomerBookings()

const source = computed(() =>
  detail.value
    ? {
        businessId: detail.value.businessId,
        serviceId: detail.value.serviceId,
        employeeId: detail.value.employeeId ?? null
      }
    : null
)

const {
  dates,
  selectedDate,
  slots,
  selectedSlot,
  dayStatus,
  dayMessage,
  dayWindow,
  noSlotsAvailable,
  loadingDates,
  loadingDay,
  datesError,
  dayError,
  loadDates,
  selectDate,
  selectSlot,
  retry
} = useRescheduleSlots(() => source.value)

const blocked = computed(() => (detail.value ? rescheduleBlock(detail.value) !== null : false))

useHead({ title: 'جابه‌جایی نوبت' })

async function boot(): Promise<void> {
  await loadBookingById(bookingId.value)
  if (detail.value && !blocked.value) await loadDates()
}

onMounted(boot)
watch(bookingId, () => { void boot() })

async function submit(): Promise<void> {
  const slot = selectedSlot.value
  if (!detail.value || !slot) return
  if (await rescheduleBooking(detail.value.id, slot.start, slot.end)) {
    await navigateTo(`/bookings/${detail.value.id}`)
  }
  // خطا در `actionError` می‌ماند و شیت/نوار بسته نمی‌شود؛ انتخاب کاربر هم پاک
  // نمی‌شود تا با تلاش تازه (یا ساعت دیگر) ادامه دهد (§۲۷)
}
</script>

<template>
  <div class="pb-28">
    <AppBackHeader title="جابه‌جایی نوبت" :subtitle="detail?.businessName" :to="`/bookings/${bookingId}`" />

    <AppLoadingState
      v-if="!detailLoaded || (detailPending && !detail)"
      :rows="3"
      label="در حال خواندن نوبت…"
    />

    <AppErrorState
      v-else-if="loadError"
      title="نوبت باز نشد"
      :description="loadError"
      retryable
      @retry="loadBookingById(bookingId)"
    />

    <AppEmptyState
      v-else-if="!detail"
      icon="i-lucide-calendar-x-2"
      title="این نوبت پیدا نشد"
      description="برای جابه‌جایی به نوبتی نیاز است که در حساب شما باشد."
    >
      <WqButton to="/bookings" icon="i-lucide-list" class="mt-1 min-h-12">
        فهرست نوبت‌ها
      </WqButton>
    </AppEmptyState>

    <AppEmptyState
      v-else-if="blocked"
      icon="i-lucide-lock"
      title="این نوبت قابل جابه‌جایی نیست"
      description="فقط نوبت‌های در انتظار تأیید یا تأییدشده جابه‌جا می‌شوند. اگر شرایط عوض شده، با کسب‌وکار هماهنگ کنید."
    >
      <WqButton :to="`/bookings/${detail.id}`" variant="secondary" class="mt-1 min-h-12">
        بازگشت به نوبت
      </WqButton>
    </AppEmptyState>

    <template v-else>
      <p class="t-body-sm rounded-xl border border-line bg-surface-muted p-3 text-foreground-secondary">
        زمان فعلی:
        <WqDateTime :value="detail.start" mode="datetime" class="t-num font-semibold text-foreground" />
        — یک روز و ساعت تازه انتخاب کنید. تا تأیید نکنید، نوبت جابه‌جا نمی‌شود.
      </p>

      <AppErrorState
        v-if="datesError"
        class="mt-4"
        title="روزهای آزاد خوانده نشد"
        :description="datesError"
        retryable
        @retry="retry()"
      />

      <template v-else>
        <BookingDateSelect
          class="mt-4"
          :dates="dates"
          :selected-date="selectedDate"
          :loading="loadingDates"
          :error="datesError"
          @select="selectDate($event)"
          @retry="retry()"
        />

        <BookingTimeSelect
          class="mt-4"
          :slots="slots"
          :selected-slot="selectedSlot"
          :loading="loadingDay"
          :no-slots-available="noSlotsAvailable"
          :status="dayStatus"
          :message="dayMessage"
          :window="dayWindow"
          :error="dayError"
          @select="selectSlot"
          @retry="retry()"
        />
      </template>
    </template>

    <AppStickyAction v-if="detail && !blocked">
      <p
        v-if="actionError"
        role="alert"
        class="t-body-sm mb-2 flex items-start gap-2 text-error"
      >
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ actionError }}</span>
      </p>
      <div class="flex items-center gap-3">
        <span class="min-w-0 flex-1">
          <span v-if="selectedSlot" class="t-body-sm block truncate text-foreground">
            زمان تازه:
            <WqDateTime :value="selectedSlot.start" mode="datetime" class="t-num font-semibold" />
          </span>
          <span v-else class="t-caption block truncate text-foreground-muted">
            اول یک ساعت انتخاب کنید
          </span>
        </span>
        <WqButton
          class="shrink-0"
          :disabled="!selectedSlot"
          :loading="reschedulePending"
          @click="submit"
        >
          جابه‌جایی
        </WqButton>
      </div>
    </AppStickyAction>
  </div>
</template>
