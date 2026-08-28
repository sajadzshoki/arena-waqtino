<script setup lang="ts">
/**
 * صفحه جزئیات رزرو
 * نمایش اطلاعات کامل یک رزرو خاص
 */
definePageMeta({
  layout: 'default'
})

const route = useRoute()
const bookingId = route.params.id as string

const { getBookingById, loading, error } = useCustomerBookings()

const booking = ref<BookingWithDetails | null>(null)

// بارگذاری اطلاعات رزرو
onMounted(async () => {
  booking.value = await getBookingById(bookingId)
})

useHead({
  title: computed(() => booking.value ? `جزئیات رزرو - ${booking.value.businessName}` : 'جزئیات رزرو')
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader title="جزئیات رزرو" back-to="/bookings" />

    <!-- Content -->
    <div class="container mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="animate-pulse rounded-2xl border border-line bg-surface p-6">
          <div class="h-6 w-3/4 rounded bg-line" />
          <div class="mt-4 h-4 w-1/2 rounded bg-line" />
          <div class="mt-2 h-4 w-2/3 rounded bg-line" />
        </div>
      </div>

      <!-- Error State -->
      <AppErrorState
        v-else-if="error || !booking"
        title="رزرو یافت نشد"
        description="متأسفانه اطلاعات این رزرو در دسترس نیست"
        icon="i-lucide-alert-circle"
      >
        <template #actions>
          <WqButton to="/bookings">
            بازگشت به نوبت‌ها
          </WqButton>
        </template>
      </AppErrorState>

      <!-- Booking Details -->
      <div v-else class="space-y-6">
        <!-- Status Card -->
        <div class="rounded-2xl border border-line bg-surface p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-foreground">وضعیت رزرو</h2>
              <p class="mt-1 text-sm text-foreground-secondary">
                آخرین به‌روزرسانی: {{ formatFaDate(new Date(booking.createdAt)) }}
              </p>
            </div>
            <div
              v-if="booking.status === 'confirmed'"
              class="flex items-center gap-2 rounded-full bg-success/10 px-4 py-2"
            >
              <UIcon name="i-lucide-check-circle" class="size-5 text-success" />
              <span class="font-medium text-success">تأیید شده</span>
            </div>
            <div
              v-else-if="booking.status === 'pending'"
              class="flex items-center gap-2 rounded-full bg-warning/10 px-4 py-2"
            >
              <UIcon name="i-lucide-clock" class="size-5 text-warning" />
              <span class="font-medium text-warning">در انتظار تأیید</span>
            </div>
            <div
              v-else-if="booking.status === 'completed'"
              class="flex items-center gap-2 rounded-full bg-info/10 px-4 py-2"
            >
              <UIcon name="i-lucide-check-circle-2" class="size-5 text-info" />
              <span class="font-medium text-info">انجام شده</span>
            </div>
            <div
              v-else-if="booking.status === 'cancelled'"
              class="flex items-center gap-2 rounded-full bg-error/10 px-4 py-2"
            >
              <UIcon name="i-lucide-x-circle" class="size-5 text-error" />
              <span class="font-medium text-error">لغو شده</span>
            </div>
            <div
              v-else-if="booking.status === 'no_show'"
              class="flex items-center gap-2 rounded-full bg-neutral-500/10 px-4 py-2"
            >
              <UIcon name="i-lucide-user-x" class="size-5 text-neutral-500" />
              <span class="font-medium text-neutral-500">عدم مراجعه</span>
            </div>
          </div>
        </div>

        <!-- Business Info -->
        <div class="rounded-2xl border border-line bg-surface p-6">
          <h3 class="mb-4 text-base font-semibold text-foreground">اطلاعات کسب‌وکار</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-store" class="size-5 text-primary" />
              <div>
                <p class="text-sm text-foreground-secondary">نام کسب‌وکار</p>
                <p class="font-medium text-foreground">{{ booking.businessName }}</p>
              </div>
            </div>
            <div v-if="booking.businessCategoryName" class="flex items-center gap-3">
              <UIcon name="i-lucide-tag" class="size-5 text-foreground-secondary" />
              <div>
                <p class="text-sm text-foreground-secondary">دسته‌بندی</p>
                <p class="font-medium text-foreground">{{ booking.businessCategoryName }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Info -->
        <div class="rounded-2xl border border-line bg-surface p-6">
          <h3 class="mb-4 text-base font-semibold text-foreground">اطلاعات خدمت</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-concierge-bell" class="size-5 text-primary" />
              <div>
                <p class="text-sm text-foreground-secondary">نام خدمت</p>
                <p class="font-medium text-foreground">{{ booking.serviceName }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-clock" class="size-5 text-foreground-secondary" />
              <div>
                <p class="text-sm text-foreground-secondary">مدت زمان</p>
                <p class="font-medium text-foreground">{{ booking.serviceDuration }} دقیقه</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-user" class="size-5 text-foreground-secondary" />
              <div>
                <p class="text-sm text-foreground-secondary">ارائه‌دهنده</p>
                <p class="font-medium text-foreground">{{ booking.employeeName || 'مشخص نشده' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Date & Time Info -->
        <div class="rounded-2xl border border-line bg-surface p-6">
          <h3 class="mb-4 text-base font-semibold text-foreground">زمان رزرو</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-calendar" class="size-5 text-primary" />
              <div>
                <p class="text-sm text-foreground-secondary">تاریخ</p>
                <p class="font-medium text-foreground">{{ formatFaDateFull(new Date(booking.start)) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-clock" class="size-5 text-foreground-secondary" />
              <div>
                <p class="text-sm text-foreground-secondary">ساعت</p>
                <p class="font-medium text-foreground">{{ formatFaTime(new Date(booking.start)) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Price Info -->
        <div class="rounded-2xl border border-line bg-surface p-6">
          <h3 class="mb-4 text-base font-semibold text-foreground">اطلاعات پرداخت</h3>
          <div class="flex items-center justify-between">
            <span class="text-sm text-foreground-secondary">مبلغ کل</span>
            <span class="text-lg font-bold text-primary">{{ formatToman(booking.price) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="booking.status === 'pending' || booking.status === 'confirmed'" class="space-y-3">
          <WqButton
            v-if="booking.status === 'confirmed'"
            variant="secondary"
            block
            icon="i-lucide-calendar-clock"
            to="/bookings/reschedule"
          >
            تغییر زمان رزرو
          </WqButton>
          <WqButton
            variant="destructive"
            block
            icon="i-lucide-x-circle"
            to="/bookings/cancel"
          >
            لغو رزرو
          </WqButton>
        </div>

        <!-- Back Button -->
        <WqButton
          variant="tertiary"
          block
          icon="i-lucide-arrow-right"
          to="/bookings"
        >
          بازگشت به نوبت‌ها
        </WqButton>
      </div>
    </div>
  </div>
</template>
