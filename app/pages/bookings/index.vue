<script setup lang="ts">
/**
 * نوبت‌های من — تاریخچهٔ رزرو مشتری.
 *
 * سؤالی که این صفحه جواب می‌دهد: «کدام نوبتم باقی است و کدام‌ها رد شده‌اند؟»
 * پس سلسله‌مراتب هر ردیف: کسب‌وکار ← خدمت/پرسنل ← زمان ← وضعیت. «پیش‌رو» و
 * «گذشته» دو منبع جدا نیستند: یک خواندن، دو نمای فیلترشده (چون «گذشتن» یک
 * واقعیت زمانی است، نه دو جدول).
 *
 * داده فقط از `useCustomerBookings` (و در نتیجه لایهٔ سرویس) می‌آید؛ خطا با
 * «تلاش مجدد» درست می‌شود، نه با reload کل اپ. صفحه عمداً `access: 'auth'` است:
 * بدون نشست، فهرست معنایی ندارد (§۱۲).
 */
definePageMeta({ access: 'auth' })
useHead({ title: 'نوبت‌های من' })

const { upcoming, past, listPending, listError, loaded, ensure, fetchBookings } = useCustomerBookings()
const { online } = useNetworkStatus()

type Scope = 'upcoming' | 'past'
const scope = useState<Scope>('bookings:scope', () => 'upcoming')

const rows = computed(() => (scope.value === 'upcoming' ? upcoming.value : past.value))
const counts = computed(() => ({ upcoming: upcoming.value.length, past: past.value.length }))
const hasAny = computed(() => upcoming.value.length + past.value.length > 0)

const options = computed(() => [
  { id: 'upcoming' as const, label: 'پیش‌رو', icon: 'i-lucide-calendar-clock' },
  { id: 'past' as const, label: 'گذشته', icon: 'i-lucide-archive' }
])

onMounted(ensure)
</script>

<template>
  <div class="pb-4">
    <AppPageHeader
      title="نوبت‌های من"
      subtitle="وقت‌هایی که گرفتی و نتیجه‌شان"
    >
      <template #actions>
        <WqIconButton
          icon="i-lucide-rotate-ccw"
          label="تازه‌سازی نوبت‌ها"
          :disabled="listPending"
          @click="fetchBookings()"
        />
      </template>
    </AppPageHeader>

    <!-- بارگذاری اولیه: اسکلت، نه صفحهٔ سفید (§۲۵) -->
    <AppLoadingState
      v-if="!loaded || (listPending && !hasAny)"
      :rows="3"
      label="در حال خواندن نوبت‌ها…"
    />

    <!-- اتصال قطع است → پیام «چرا» و تلاش مجدد، نه خطای سرویس (§۲۷) -->
    <AppOfflineState
      v-else-if="listError && !online"
      title="بدون اینترنت، نوبت‌ها تازه نمی‌شوند"
      description="اتصال را بررسی کنید؛ نوبت‌ها همان‌جا مانده‌اند و با یک تلاش دوباره خوانده می‌شوند."
      @retry="fetchBookings()"
    />

    <AppErrorState
      v-else-if="listError"
      title="نوبت‌ها باز نشد"
      :description="listError"
      retryable
      @retry="fetchBookings()"
    />

    <!-- هیچ نوبتی نیست → مسیر بعدی را نشان می‌دهد، نه فقط «خالی» -->
    <AppEmptyState
      v-else-if="!hasAny"
      icon="i-lucide-calendar-plus-2"
      title="هنوز نوبتی نگرفته‌اید"
      description="از فهرست کسب‌وکارها یک خدمت و ساعت انتخاب کنید؛ نوبت‌هایتان همین‌جا با وضعیت و نتیجهٔشان می‌مانند."
    >
      <WqButton to="/search" icon="i-lucide-compass" class="mt-1 min-h-12">
        کشف کسب‌وکارها
      </WqButton>
    </AppEmptyState>

    <template v-else>
      <div class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <WqChip
          v-for="option in options"
          :key="option.id"
          class="min-h-12 shrink-0"
          :icon="option.icon"
          :selected="scope === option.id"
          @toggle="scope = option.id"
        >
          {{ option.label }}
          <span class="t-num text-foreground-muted">{{ toFaDigits(counts[option.id]) }}</span>
        </WqChip>
      </div>

      <p
        v-if="listPending"
        class="t-caption mb-2 inline-flex items-center gap-1.5 text-foreground-muted"
      >
        <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" aria-hidden="true" />
        در حال تازه‌سازی…
      </p>

      <!-- نمای خالیِ یک فیلتر، با توضیحِ همان فیلتر -->
      <AppEmptyState
        v-if="rows.length === 0"
        :icon="scope === 'upcoming' ? 'i-lucide-calendar-check-2' : 'i-lucide-archive'"
        :title="scope === 'upcoming' ? 'نوبت پیش‌رو ندارید' : 'چیزی در گذشته نیست'"
        :description="scope === 'upcoming'
          ? 'یا همهٔ نوبت‌ها انجام شده‌اند یا لغوشان کرده‌اید. برای زمان تازه، یک خدمت انتخاب کنید.'
          : 'به‌محض اینکه نوبتی انجام شود یا لغو شود، به این نما منتقل می‌شود.'"
      >
        <WqButton
          variant="tertiary"
          class="mt-1 min-h-12"
          @click="scope = scope === 'upcoming' ? 'past' : 'upcoming'"
        >
          نمایش {{ scope === 'upcoming' ? 'گذشته' : 'پیش‌رو' }}
        </WqButton>
      </AppEmptyState>

      <ul v-else class="flex flex-col gap-2">
        <li v-for="booking in rows" :key="booking.id">
          <BookingCard :booking="booking" :scope="scope" />
        </li>
      </ul>

      <p v-if="scope === 'upcoming' && counts.upcoming > 0" class="t-caption mt-4 flex items-start gap-1.5 text-foreground-muted">
        <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          برای لغو یا جابه‌جایی، وارد همان نوبت شوید. سیاست زمانی لغو از تنظیمات
          کسب‌وکار می‌آید و نزدیک زمان نوبت ممکن نیست.
        </span>
      </p>
    </template>
  </div>
</template>
