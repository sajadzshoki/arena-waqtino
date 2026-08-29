<script setup lang="ts">
/**
 * جزئیات یک نوبت — «این نوبت چیست، کِی است، و چه کاری از دستم برمی‌آید؟»
 *
 * سه چیز را فاز ۱۲ درست کرد:
 *  ۱) مسیرهای `/bookings/cancel` و `/bookings/reschedule` که لینک شده بودند
 *     **وجود نداشتند** (۴۰۴). لغو حالا شیتی روی همین صفحه است و جابه‌جایی یک
 *     صفحهٔ واقعی زیر `/bookings/:id/reschedule`؛ هیچ «دکمهٔ مرده» نمی‌ماند.
 *  ۲) «دکمه لغو» بی‌دلیل غیرفعال نمی‌شود: پیامِ دلیل از همان سیاست مرکزی
 *     (`bookingCancelBlock`) می‌آید که سرویس هم استفاده می‌کند.
 *  ۳) خطای شبکه از «نبودِ داده» جداست: اولی «تلاش مجدد» می‌گیرد، دومی حالت
 *     خالی (§۲۴ — یک استراتژی خطا، یک مجموعه UI).
 *
 * صفحه از *یک* نمونهٔ `useCustomerBookings` می‌خواند (دو نمونه = دو state جدا؛
 * تازه‌سازیِ بعد از لغو، فقط یکی از دو نسخه را به‌روز می‌کرد).
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
  cancelBlock,
  rescheduleBlock,
  cancelBooking,
  cancelPending,
  actionError
} = useCustomerBookings()

const cancelOpen = ref(false)

useHead(() => ({ title: detail.value ? `نوبت ${detail.value.businessName}` : 'جزئیات نوبت' }))

const isLive = computed(() => (detail.value ? isLiveBooking(detail.value.status) : false))
const isBlocked = computed(() => (detail.value ? cancelBlock(detail.value) !== null : true))
const canReschedule = computed(() => (detail.value ? rescheduleBlock(detail.value) === null : false))

const cancelReasonLabel = computed(() => {
  const raw = detail.value?.cancelReason
  if (!raw) return null
  return BOOKING_CANCEL_REASONS.find(r => r.value === raw)?.label ?? raw
})

onMounted(() => loadBookingById(bookingId.value))
watch(bookingId, id => { if (id) void loadBookingById(id) })

/** فقط در صورت موفقیت بسته می‌شود؛ پیام خطا داخل شیت می‌ماند (§۳۵). */
async function confirmCancel(reason?: string): Promise<void> {
  if (!detail.value) return
  if (await cancelBooking(detail.value.id, reason)) cancelOpen.value = false
}
</script>

<template>
  <div class="pb-6">
    <AppBackHeader title="جزئیات نوبت" to="/bookings" />

    <AppLoadingState
      v-if="!detailLoaded || (detailPending && !detail)"
      :rows="4"
      label="در حال خواندن نوبت…"
    />

    <AppErrorState
      v-else-if="loadError"
      title="جزئیات نوبت باز نشد"
      :description="loadError"
      retryable
      @retry="loadBookingById(bookingId)"
    />

    <AppEmptyState
      v-else-if="!detail"
      icon="i-lucide-calendar-x-2"
      title="این نوبت پیدا نشد"
      description="شاید لغو یا حذف شده، یا به حساب دیگری مربوط است. از فهرست نوبت‌ها می‌توانید بقیه را ببینید."
    >
      <WqButton to="/bookings" icon="i-lucide-list" class="mt-1 min-h-12">
        فهرست نوبت‌ها
      </WqButton>
    </AppEmptyState>

    <template v-else>
      <!-- سربرگ وضعیت: زمان + نتیجه، بدون اینکه رنگ تنها حامل معنا باشد -->
      <section class="rounded-xl border border-line bg-surface p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h1 class="t-h2 truncate text-foreground-strong">{{ detail.businessName }}</h1>
            <p class="t-body-sm mt-0.5 truncate text-foreground-secondary">
              {{ detail.serviceName }}
            </p>
          </div>
          <WqStatusBadge :status="detail.status" class="shrink-0" />
        </div>

        <div class="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-line-subtle pt-3">
          <UIcon name="i-lucide-calendar" class="size-4 shrink-0 text-primary" aria-hidden="true" />
          <WqDateTime :value="detail.start" mode="full" class="t-body text-foreground" />
          <span class="text-foreground-muted" aria-hidden="true">•</span>
          <WqDateTime :value="detail.start" mode="time" class="t-body text-foreground" />
        </div>
      </section>

      <section class="mt-4 rounded-xl border border-line bg-surface p-4">
        <h2 class="t-h3 mb-1 text-foreground-strong">
          اطلاعات کسب‌وکار و خدمت
        </h2>
        <div class="divide-y divide-line-subtle">
          <WqMetaRow icon="i-lucide-store" label="کسب‌وکار" :value="detail.businessName" />
          <WqMetaRow
            v-if="detail.businessCategoryName"
            icon="i-lucide-tags"
            label="دسته‌بندی"
            :value="detail.businessCategoryName"
          />
          <WqMetaRow icon="i-lucide-concierge-bell" label="خدمت" :value="detail.serviceName" />
          <WqMetaRow
            icon="i-lucide-user-round"
            label="ارائه‌دهنده"
            :value="detail.employeeName ?? 'بدون ترجیح — هر کسی که آزاد باشد'"
          />
          <WqMetaRow icon="i-lucide-clock" label="مدت خدمت">
            <template #default>
              <WqDuration :minutes="detail.serviceDuration" :icon="false" class="t-body-sm text-foreground" />
            </template>
          </WqMetaRow>
          <WqMetaRow icon="i-lucide-wallet" label="مبلغ ثبت‌شده">
            <template #default>
              <WqPrice :amount="detail.price" size="sm" />
            </template>
          </WqMetaRow>
        </div>
        <p class="t-caption mt-2 text-foreground-muted">
          مبلغ و مدت، همان چیزی است که در لحظهٔ ثبت نوبت تأیید شده — تغییر بعدی
          قیمت خدمت، این رکورد را عوض نمی‌کند.
        </p>
      </section>

      <section
        v-if="detail.notes || cancelReasonLabel"
        class="mt-4 rounded-xl border border-line bg-surface p-4"
      >
        <h2 class="t-h3 mb-2 text-foreground-strong">
          یادداشت‌ها
        </h2>
        <p v-if="detail.notes" class="t-body-sm whitespace-pre-line text-foreground-secondary">
          {{ detail.notes }}
        </p>
        <p v-if="cancelReasonLabel" class="t-body-sm mt-2 flex items-start gap-1.5 text-foreground-secondary">
          <UIcon name="i-lucide-circle-x" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>دلیل لغو: {{ cancelReasonLabel }}</span>
        </p>
      </section>

      <!-- اکشن‌ها: غیرفعال‌شدن فقط با توضیح؛ «چرا نمی‌شود» دیده می‌شود -->
      <section v-if="isLive" class="mt-4 flex flex-col gap-2">
        <WqButton
          v-if="canReschedule"
          variant="secondary"
          block
          icon="i-lucide-calendar-clock"
          :to="`/bookings/${detail.id}/reschedule`"
        >
          جابه‌جایی زمان نوبت
        </WqButton>
        <WqButton
          variant="destructive"
          block
          icon="i-lucide-circle-x"
          :disabled="isBlocked || cancelPending"
          :loading="cancelPending"
          @click="cancelOpen = true"
        >
          لغو نوبت
        </WqButton>
        <p v-if="isBlocked" class="t-caption flex items-start gap-1.5 text-warning">
          <UIcon name="i-lucide-clock-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ bookingCancelBlockLabel(cancelBlock(detail) ?? 'status') }}</span>
        </p>
      </section>
    </template>

    <BookingCancelSheet
      v-model:open="cancelOpen"
      :booking="detail"
      :pending="cancelPending"
      :error="actionError"
      @confirm="confirmCancel"
    />
  </div>
</template>
