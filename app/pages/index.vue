<script setup lang="ts">
/**
 * خانه — فاز ۰: صفحهٔ پایه + نمایش و آزمون زیرساخت طراحی.
 * بخش‌های محصولی واقعی (کشف، جستجو، رزرو…) در فازهای بعد ساخته می‌شوند.
 */
useHead({ title: 'خانه' })

const toast = useToast()
const config = useRuntimeConfig()
const {
  user,
  isAuthenticated,
  pending: authPending,
  devSignIn
} = useAuth()
const { currentModeMeta } = useUserMode()

const isMock = computed(() => config.public.apiMode === 'mock')
const today = formatFaDateFull(new Date())

async function onDevSignIn() {
  try {
    await devSignIn()
    toast.add({
      title: 'با حساب آزمایشی وارد شدید.',
      icon: 'i-lucide-circle-check',
      color: 'success'
    })
  }
  catch (error) {
    toast.add({
      title: toServiceError(error).message,
      icon: 'i-lucide-triangle-alert',
      color: 'error'
    })
  }
}

const phoneInput = ref('')
const normalizedPhone = computed(() => normalizeDigits(phoneInput.value))

const colorSwatches: { name: string; class: string }[] = [
  { name: 'اصلی (primary)', class: 'bg-primary' },
  { name: 'موفقیت', class: 'bg-success' },
  { name: 'اطلاع', class: 'bg-info' },
  { name: 'هشدار', class: 'bg-warning' },
  { name: 'خطا', class: 'bg-error' }
]

const neutralSteps = [
  'bg-warm-50',
  'bg-warm-100',
  'bg-warm-200',
  'bg-warm-300',
  'bg-warm-400',
  'bg-warm-500',
  'bg-warm-600',
  'bg-warm-700',
  'bg-warm-800',
  'bg-warm-900'
]

const typographyScale: { name: string; class: string; sample: string }[] = [
  { name: 'display', class: 't-display', sample: 'وقت خود را هوشمندانه رزرو کنید' },
  { name: 'page-title', class: 't-page-title', sample: 'سالن زیبایی نارنج' },
  { name: 'section', class: 't-section', sample: 'خدمات پررزرو این هفته' },
  { name: 'heading', class: 't-heading', sample: 'کراتینه و احیای مو — ۱۲۰ دقیقه' },
  { name: 'body', class: 't-body', sample: 'متن معمولی فارسی با خوانایی بالا و ارتفاع خط مناسب برای مطالعه.' },
  { name: 'secondary', class: 't-secondary', sample: 'سعادت‌آباد، بلوار دریا' },
  { name: 'caption', class: 't-caption', sample: 'آخرین به‌روزرسانی: امروز' },
  { name: 'numeric', class: 't-num', sample: '۰۹۱۲ ۳۴۵ ۶۷۸۹ — ۱۴:۳۰' }
]

function onRetryDemo() {
  toast.add({ title: 'تلاش مجدد انجام شد (نمایشی).', icon: 'i-lucide-rotate-ccw' })
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- خوش‌آمد -->
    <section class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2">
        <UBadge color="primary" variant="soft" size="sm">
          فاز ۰ — زیرساخت
        </UBadge>
        <UBadge color="neutral" variant="outline" size="sm">
          حالت: {{ currentModeMeta.label }}
        </UBadge>
      </div>
      <h1 class="t-display text-highlighted">
        {{ user ? `سلام، ${user.firstName} 👋` : 'به وقتینو خوش آمدید' }}
      </h1>
      <p class="t-secondary">{{ today }}</p>
    </section>

    <!-- نشست کاربر -->
    <section aria-labelledby="sec-session" class="flex flex-col gap-3">
      <h2 id="sec-session" class="t-section">نشست کاربر</h2>

      <div class="rounded-xl border border-default bg-elevated p-4">
        <div v-if="isAuthenticated && user" class="flex items-center gap-3">
          <AppUserAvatar :name="`${user.firstName} ${user.lastName}`" size="lg" />
          <div class="min-w-0 flex-1">
            <p class="t-heading truncate">{{ user.firstName }} {{ user.lastName }}</p>
            <p class="t-caption t-num" dir="ltr">{{ formatPhoneFa(user.phone) }}</p>
          </div>
        </div>

        <div v-else class="flex flex-col gap-3">
          <p class="t-body-sm">
            فعلاً مهمان هستید. برای آزمایش سوییچ حالت‌ها و ناوبری، با جریان
            آزمایشی OTP وارد شوید (بدون پیامک واقعی).
          </p>
          <UButton
            v-if="isMock"
            :loading="authPending"
            icon="i-lucide-smartphone"
            @click="onDevSignIn"
          >
            ورود آزمایشی توسعه (کد: {{ toFaDigits(config.public.mockOtpCode) }})
          </UButton>
          <UAlert
            v-else
            color="warning"
            variant="soft"
            icon="i-lucide-triangle-alert"
            title="حالت API فعال است اما بک‌اند هنوز متصل نشده است."
          />
        </div>
      </div>
    </section>

    <!-- رنگ‌ها -->
    <section aria-labelledby="sec-colors" class="flex flex-col gap-3">
      <h2 id="sec-colors" class="t-section">رنگ‌های معنایی</h2>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="swatch in colorSwatches" :key="swatch.name" class="flex flex-col items-center gap-1.5">
          <span class="size-12 w-full rounded-lg" :class="swatch.class" />
          <span class="t-caption text-center">{{ swatch.name }}</span>
        </div>
      </div>
      <div class="overflow-hidden rounded-lg border border-default">
        <div class="flex h-8">
          <span
            v-for="step in neutralSteps"
            :key="step"
            class="h-full flex-1"
            :class="step"
          />
        </div>
      </div>
      <p class="t-caption">
        پوستهٔ خنثی گرم — رنگ اصلی از tokens.css قابل تغییر است.
      </p>
    </section>

    <!-- تایپوگرافی -->
    <section aria-labelledby="sec-typography" class="flex flex-col gap-3">
      <h2 id="sec-typography" class="t-section">تایپوگرافی فارسی (وزیرمتن)</h2>
      <ul class="flex flex-col divide-y divide-default rounded-xl border border-default bg-elevated">
        <li v-for="row in typographyScale" :key="row.name" class="flex flex-col gap-0.5 px-4 py-3">
          <span class="t-caption" dir="ltr">{{ row.name }}</span>
          <span :class="[row.class, 'text-default']">{{ row.sample }}</span>
        </li>
      </ul>
    </section>

    <!-- دکمه‌ها و وضعیت‌های رزرو -->
    <section aria-labelledby="sec-controls" class="flex flex-col gap-3">
      <h2 id="sec-controls" class="t-section">دکمه‌ها و نشان‌های وضعیت</h2>
      <div class="flex flex-wrap items-center gap-2">
        <UButton icon="i-lucide-calendar-plus">رزرو نوبت</UButton>
        <UButton variant="soft">مشاهدهٔ خدمات</UButton>
        <UButton variant="outline" color="neutral">خنثی</UButton>
        <UButton variant="ghost" color="neutral">محو</UButton>
        <UButton color="error" variant="soft" icon="i-lucide-trash-2">حذف</UButton>
        <UButton loading>در حال ارسال</UButton>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-1">
        <template v-for="(meta, status) in BOOKING_STATUS_META" :key="status">
          <UBadge :color="meta.color" variant="soft" size="lg">
            <UIcon :name="meta.icon" class="size-4" />
            {{ meta.label }}
          </UBadge>
        </template>
      </div>

      <UFormField
        label="شمارهٔ موبایل"
        hint="ارقام فارسی هم پذیرفته می‌شوند"
        class="max-w-72 pt-2"
      >
        <UInput
          v-model="phoneInput"
          inputmode="tel"
          dir="ltr"
          placeholder="0912 345 6789"
          class="t-num w-full text-left"
          icon="i-lucide-smartphone"
        />
      </UFormField>
      <p v-if="normalizedPhone" class="t-caption t-num" dir="ltr">
        normalized: {{ normalizedPhone }}
      </p>
    </section>

    <!-- حالت‌های رابط -->
    <section aria-labelledby="sec-states" class="flex flex-col gap-3">
      <h2 id="sec-states" class="t-section">حالت‌های بارگذاری / خالی / خطا</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-default bg-elevated">
          <AppLoadingState label="در حال دریافت نوبت‌ها" />
        </div>
        <div class="rounded-xl border border-default bg-elevated">
          <AppEmptyState
            title="نوبتی یافت نشد"
            description="هنوز نوبتی ثبت نکرده‌اید؛ از بخش جستجو شروع کنید."
          />
        </div>
        <div class="rounded-xl border border-default bg-elevated">
          <AppErrorState
            retryable
            description="اتصال برقرار نشد. لطفاً دوباره تلاش کنید."
            @retry="onRetryDemo"
          />
        </div>
      </div>
      <p class="t-caption">
        قیمت نمونه: {{ formatToman(2450000) }} — وضعیت‌ها، دکمه‌ها و فونت‌ها
        از سیستم طراحی مرکزی تغذیه می‌شوند.
      </p>
    </section>
  </div>
</template>
