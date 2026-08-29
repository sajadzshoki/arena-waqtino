<script setup lang="ts">
/**
 * رسیدِ رزرو — «چه چیزی واقعاً ثبت شد».
 *
 * این صفحه همه‌چیز را از **اسنپ‌شات داخل خود رکورد نوبت** می‌خواند (نه از فهرست
 * جاری کسب‌وکار)، پس حذف یا ویرایشِ خدمت/پرسنل، رسیدِ گذشته را خراب نمی‌کند.
 * سه حالت در نظر گرفته شده: در حال خواندن (اسکلت)، خطای شبکه (تلاش مجدد —
 * نرسیدن داده ≠ نبودِ داده)، و نبودن واقعی نوبت (حالت خالی با راهِ بعد).
 * مسیر موفقیت با `?id=` است؛ اگر id نبود یا نوبت به همین حساب مربوط نبود،
 * فهرست نوبت‌ها مقصد است (§۱۱ — بن‌بست نداریم).
 */
definePageMeta({ access: 'auth', tabbar: false, header: false })

const route = useRoute()
const services = useServices()

const bookingId = computed(() => route.query.id as string)

const booking = ref<Booking | null>(null)
const businessName = ref<string>('')
const serviceName = ref<string>('')
const employeeName = ref<string>('')
const categoryName = ref<string>('')
const loading = ref(true)
const error = ref<string | null>(null)

/** خواندن رسید: یک بار در mount و هر بار که کاربر «تلاش مجدد» می‌زند. */

async function load(): Promise<void> {
  if (!bookingId.value) {
    await navigateTo('/')
    return
  }

  loading.value = true
  error.value = null
  try {
    const bok = await services.bookings.getById(bookingId.value)
    // `getById` مالکیت را در لایهٔ سرویس چک می‌کند و null برمی‌گرداند؛ یعنی
    // «نوبت نیست» ≠ «خطا داد». در هر دو حالت کاربر را رها نمی‌کنیم.
    if (!bok) {
      await navigateTo('/bookings')
      return
    }

    booking.value = bok

    // خواندن داده‌های مرتبط
    const [biz, bizCategories] = await Promise.all([
      services.businesses.getById(bok.businessId),
      services.businesses.listCategories()
    ])

    businessName.value = biz?.name ?? ''
    const cat = bizCategories.find(c => c.id === biz?.categoryId)
    categoryName.value = cat?.name ?? ''

    // نام خدمت از «تاریخچهٔ خود رزرو» خوانده می‌شود: اسنپ‌شاتِ زمان رزرو، وگرنه
    // رکوردِ تاریخچه (که سرویسِ حذف‌شده را هم از گورِ محلی درمی‌آورد). فهرست
    // قابل‌رزرو منبع رسید نیست: حذف یا غیرفعال‌شدن سرویس نباید رسیدِ مشتری را
    // بی‌نام کند یا نامش را با یک ویرایشِ تازه عوض کند.
    const history = bok.serviceSnapshot ?? await services.businesses.getServiceForHistory(bok.serviceId)
    serviceName.value = history?.name ?? 'سرویس حذف‌شده'

    // نام پرسنل هم از تاریخچهٔ خود رزرو (اسنپ‌شات، وگرنه رکورد تاریخچه/گور) —
    // تغییر نام، غیرفعال‌کردن یا حذف او از کسب‌وکار نباید رسیدِ مشتری را خراب کند.
    if (bok.employeeId) {
      const employeeHistory = bok.employeeSnapshot
        ?? await services.businesses.getEmployeeForHistory(bok.employeeId)
      employeeName.value = employeeHistory?.name ?? 'پرسنل حذف‌شده'
    }
  }
  catch (err) {
    error.value = toServiceError(err).message || 'دریافت اطلاعات رزرو ممکن نشد.'
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

useHead({ title: 'رزرو ثبت شد' })

function formatDate(iso: string): string {
  return formatDateLabel(new Date(iso))
}

function formatTime(iso: string): string {
  return formatFaTime(new Date(iso))
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background pt-safe">
    <!-- محتوا -->
    <div class="mx-auto flex w-full max-w-(--wq-content-max) flex-1 flex-col px-4 py-8">
      <!-- Loading: اسکلت، نه اسپینر تمام‌صفحه (§۲۵) -->
      <AppLoadingState v-if="loading" :rows="4" label="در حال خواندن رسید نوبت…" />

      <!-- خطا ≠ نبودِ داده: تلاش مجدد همان‌جا (§۲۴) -->
      <AppErrorState
        v-else-if="error"
        class="flex-1"
        title="رسید نوبت باز نشد"
        :description="error"
        retryable
        @retry="load()"
      />

      <!-- موفقیت -->
      <div v-else-if="booking" class="flex flex-1 flex-col">
        <!-- نشان موفقیت -->
        <div class="flex flex-col items-center gap-4 pb-8 text-center">
          <div class="flex size-20 items-center justify-center rounded-full bg-success-soft">
            <UIcon name="i-lucide-check" class="size-10 text-success" aria-hidden="true" />
          </div>
          <div>
            <h1 class="t-h1 text-foreground-strong">نوبت شما ثبت شد</h1>
            <p class="t-body-sm mt-2 max-w-sm text-foreground-secondary">
              درخواست شما برای کسب‌وکار فرستاده شد و در فهرست نوبت‌های من با
              وضعیت «در انتظار تأیید» پیگیری می‌شود.
            </p>
          </div>
        </div>

        <!-- مشخصات نوبت -->
        <div class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <!-- کسب‌وکار -->
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
              <UIcon name="i-lucide-store" class="size-5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">کسب‌وکار</p>
              <p class="t-body-sm font-medium text-foreground">{{ businessName }}</p>
              <p v-if="categoryName" class="t-caption text-foreground-secondary">{{ categoryName }}</p>
            </div>
          </div>

          <hr class="border-line-subtle">

          <!-- خدمت -->
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-info-soft">
              <UIcon name="i-lucide-concierge-bell" class="size-5 text-info" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">خدمت</p>
              <p class="t-body-sm font-medium text-foreground">{{ serviceName }}</p>
            </div>
          </div>

          <!-- پرسنل -->
          <div v-if="employeeName" class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft">
              <UIcon name="i-lucide-user" class="size-5 text-warning" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">متخصص</p>
              <p class="t-body-sm font-medium text-foreground">{{ employeeName }}</p>
            </div>
          </div>

          <hr class="border-line-subtle">

          <!-- تاریخ و ساعت -->
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft">
              <UIcon name="i-lucide-calendar" class="size-5 text-success" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">تاریخ و ساعت</p>
              <p class="t-body-sm font-medium text-foreground">{{ formatDate(booking.start) }}</p>
              <p class="t-caption t-num text-foreground-secondary">ساعت {{ formatTime(booking.start) }}</p>
            </div>
          </div>

          <hr class="border-line-subtle">

          <!-- هزینه -->
          <div class="flex items-center justify-between">
            <p class="t-caption">هزینه</p>
            <WqPrice :amount="booking.price" size="md" />
          </div>
        </div>

        <!-- وضعیت -->
        <div class="mt-4 flex items-center justify-center gap-2" role="status">
          <UIcon name="i-lucide-clock" class="size-4 text-warning" aria-hidden="true" />
          <span class="t-body-sm text-warning">در انتظار تأیید کسب‌وکار</span>
        </div>

        <!-- فاصله‌دهنده -->
        <div class="flex-1" />

        <!-- اکشن‌ها -->
        <div class="flex flex-col gap-3 pt-8">
          <WqButton
            variant="primary"
            size="lg"
            block
            icon="i-lucide-home"
            @click="navigateTo('/')"
          >
            بازگشت به خانه
          </WqButton>
          <WqButton
            variant="tertiary"
            size="md"
            block
            icon="i-lucide-compass"
            @click="navigateTo('/search')"
          >
            کشف کسب‌وکارهای دیگر
          </WqButton>
        </div>
      </div>

      <!-- نوبت واقعاً پیدا نشد → حالت خالی با مقصد مشخص، نه متن تنگ‌تنی -->
      <AppEmptyState
        v-else
        class="flex-1"
        icon="i-lucide-calendar-x-2"
        title="این نوبت پیدا نشد"
        description="شاید از همین دستگاه ثبت نشده یا در حساب دیگری است. از فهرست نوبت‌ها می‌توانید همه را ببینید."
      >
        <WqButton to="/bookings" icon="i-lucide-list" class="mt-1 min-h-12">
          فهرست نوبت‌ها
        </WqButton>
        <WqButton to="/" variant="tertiary" class="min-h-12">
          بازگشت به خانه
        </WqButton>
      </AppEmptyState>
    </div>
  </div>
</template>
