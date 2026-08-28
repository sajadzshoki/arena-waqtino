<script setup lang="ts">
/**
 * نمایش سیستم طراحی وقتی‌نو — فقط محیط توسعه (Production: 404).
 * هدف: مرجع بصری زنده برای ساخت صفحات آینده بدون اختراع سبک تازه.
 */
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'صفحهٔ موردنظر یافت نشد' })
}

useHead({ title: 'سیستم طراحی' })

const toast = useAppToast()

/* ——— رنگ‌های معنایی ——— */
const brandSwatches = [
  { label: 'primary', class: 'bg-primary' },
  { label: 'hover', class: 'bg-primary-hover' },
  { label: 'active', class: 'bg-primary-active' },
  { label: 'soft', class: 'bg-primary-soft' },
  { label: 'border', class: 'bg-primary-border' }
]
const statusSwatches = [
  { label: 'موفقیت', base: 'bg-success', soft: 'bg-success-soft', border: 'border-success-border' },
  { label: 'هشدار', base: 'bg-warning', soft: 'bg-warning-soft', border: 'border-warning-border' },
  { label: 'خطا', base: 'bg-error', soft: 'bg-error-soft', border: 'border-error-border' },
  { label: 'اطلاع', base: 'bg-info', soft: 'bg-info-soft', border: 'border-info-border' }
]
const surfaceSwatches = [
  { label: 'background', class: 'bg-background' },
  { label: 'surface', class: 'bg-surface' },
  { label: 'raised', class: 'bg-surface-raised' },
  { label: 'muted', class: 'bg-surface-muted' },
  { label: 'inverse', class: 'bg-surface-inverse' }
]
const textSamples = [
  { label: 'foreground', class: 'text-foreground' },
  { label: 'secondary', class: 'text-foreground-secondary' },
  { label: 'muted', class: 'text-foreground-muted' },
  { label: 'disabled', class: 'text-foreground-disabled' }
]

/* ——— تایپوگرافی ——— */
const typeScale = [
  { name: 'display', class: 't-display', sample: 'وقت شما، برنامهٔ شماست' },
  { name: 'h1', class: 't-h1', sample: 'سالن زیبایی نارنج' },
  { name: 'h2', class: 't-h2', sample: 'خدمات پررزرو هفته' },
  { name: 'h3', class: 't-h3', sample: 'کراتینه و احیای مو' },
  { name: 'section', class: 't-section', sample: 'عنوان بخش در صفحات' },
  { name: 'body-lg', class: 't-body-lg', sample: 'متن اصلی بزرگ برای خواندن توضیحات مهم صفحه.' },
  { name: 'body', class: 't-body', sample: 'متن بدنهٔ استاندارد فارسی با ارتفاع خط مناسب برای مطالعهٔ راحت در موبایل.' },
  { name: 'body-sm', class: 't-body-sm', sample: 'متن کوچک برای توضیحات تکمیلی و جزئیات.' },
  { name: 'label', class: 't-label', sample: 'برچسب فرم' },
  { name: 'caption', class: 't-caption', sample: 'متن خیلی کوچک و کم‌رنگ برای متادیتا' },
  { name: 'numeric', class: 't-num', sample: '۱۹٬۵۰۰٬۰۰۰ تومان · ۱۴:۳۰ · ۰۹۱۲۳۴۵۶۷۸۹' }
]

/* ——— فاصله/شعاع/ارتفاع ——— */
const spacingSteps = [1, 2, 3, 4, 6, 8, 12, 16]
const radiusSteps = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

/* ——— فرم‌ها ——— */
const nameValue = ref('سارا محمدی')
const phoneValue = ref('')
const searchValue = ref('')
const noteValue = ref('')
const selectValue = ref<string>()
const selectItems = [
  { label: 'تهران', value: 'tehran', icon: 'i-lucide-map-pin' },
  { label: 'اصفهان', value: 'isfahan', icon: 'i-lucide-map-pin' },
  { label: 'شیراز', value: 'shiraz', icon: 'i-lucide-map-pin' },
  { label: 'مشهد', value: 'mashhad', icon: 'i-lucide-map-pin' }
]
const errorDemo = ref('این فیلد الزامی است')

/* ——— انتخاب ——— */
const chips = reactive([
  { label: 'امروز', icon: 'i-lucide-sun', selected: true },
  { label: 'فردا', selected: false },
  { label: 'این هفته', selected: false },
  { label: 'آخر هفته', icon: 'i-lucide-calendar-heart', selected: false }
])
const wantReminder = ref(true)
const wantSms = ref(false)
const paymentMethod = ref('online')
const paymentItems = [
  { label: 'پرداخت آنلاین', value: 'online' },
  { label: 'پرداخت در محل', value: 'onsite' },
  { label: 'کیف پول', value: 'wallet' }
]
const selectedCard = ref<'a' | 'b'>('a')

/* ——— اورلی ——— */
const sheetOpen = ref(false)
const confirmOpen = ref(false)
const confirmDestructiveOpen = ref(false)
const confirmLoading = ref(false)

const sheetOptions = [
  { title: 'نزدیک‌ترین', description: 'بر اساس فاصلهٔ مکانی', icon: 'i-lucide-locate-fixed', selected: true },
  { title: 'بالاترین امتیاز', description: 'محبوب‌ترین‌ها اول', icon: 'i-lucide-star', selected: false },
  { title: 'ارزان‌ترین', description: 'کمترین قیمت اول', icon: 'i-lucide-banknote', selected: false }
]
const sheetSelected = ref(0)

async function onConfirm() {
  confirmLoading.value = true
  await delay(700)
  confirmLoading.value = false
  confirmOpen.value = false
  confirmDestructiveOpen.value = false
  toast.success('انجام شد.')
}

/* ——— ناوبری ——— */
const modes: UserMode[] = ['customer', 'business', 'employee']

/* دادهٔ نمایشی از لایهٔ سرویس (نه دسترسی مستقیم به mock) */
const services = useServices()
const { data: business } = await useAsyncData('design-demo-business', () =>
  services.businesses.getById('biz_narenj')
)

/* ——— شبیه‌سازی mock ——— */
const mockFlags = useMockFlags()
const { data: probe, refresh: probeRefresh, pending: probePending, error: probeError, clear: probeClear } =
  await useAsyncData('design-mock-probe', () => services.businesses.list({ perPage: 3 }))

watch([mockFlags.forceError, mockFlags.forceEmpty], () => {
  probeClear()
  probeRefresh()
})

/* ——— بازنشانی دادهٔ محلی (فقط توسعه — از لایهٔ سرویس، نه از mock) ——— */
const resetting = ref(false)
const management = services.serviceManagement

const assignments = services.employeeManagement

/**
 * دو domain، دو delta مستقل — پس هر دو پاک می‌شوند تا «دموی کاملِ فاز ۹ و ۱۰»
 * یکجا از اول شروع شود؛ هیچ‌کدام دیگری را پاک نمی‌کند.
 */
async function resetLocalData(): Promise<void> {
  resetting.value = true
  try {
    await Promise.all([management.resetLocalChanges(), assignments.resetLocalChanges()])
    toast.success('دادهٔ سرویس‌ها و پرسنل به حالت پایه برگشت.')
  }
  catch (e) {
    toast.error(toServiceError(e).message)
  }
  finally {
    resetting.value = false
  }
}
</script>

<template>
  <div class="pb-8">
    <AppPageHeader
      title="سیستم طراحی وقتینو"
      subtitle="مرجع زندهٔ توکن‌ها و کامپوننت‌ها — فقط محیط توسعه، خارج از ناوبری محصول"
    >
      <template #actions>
        <UBadge color="neutral" variant="soft">dev</UBadge>
      </template>
    </AppPageHeader>

    <!-- ══ رنگ‌ها ══ -->
    <WqSectionHeader title="رنگ‌های معنایی" subtitle="تم با دکمهٔ آفتاب/ماه در هدر سوییچ می‌شود">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2">
          <div v-for="s in brandSwatches" :key="s.label" class="flex w-[4.7rem] flex-col items-center gap-1">
            <span class="size-10 w-full rounded-lg border border-line" :class="s.class" />
            <span class="t-caption" dir="ltr">{{ s.label }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="s in statusSwatches"
            :key="s.label"
            class="flex items-center gap-2 rounded-lg border bg-surface p-2"
            :class="s.border"
          >
            <span class="size-6 rounded-md" :class="s.base" />
            <span class="size-6 rounded-md border border-line" :class="s.soft" />
            <span class="t-caption">{{ s.label }}</span>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-line">
          <div
            v-for="s in surfaceSwatches"
            :key="s.label"
            class="flex items-center justify-between border-b border-line-subtle px-4 py-2.5 last:border-b-0"
            :class="s.class"
          >
            <span class="t-body-sm" :class="s.label === 'inverse' ? 'text-foreground' : 'text-foreground'" style="direction: ltr" dir="ltr">{{ s.label }}</span>
            <span v-if="s.label === 'inverse'" class="t-caption" style="color: #fafaf8">سطح معکوس</span>
          </div>
        </div>

        <div class="rounded-xl border border-line bg-surface p-4">
          <p v-for="t in textSamples" :key="t.label" :class="['t-body-sm', t.class]">
            {{ t.label }} — نمونهٔ متن فارسی <span dir="ltr">Waqtino 2026</span>
          </p>
        </div>

        <div class="flex gap-2">
          <span class="h-10 flex-1 rounded-lg border border-line bg-surface" />
          <span class="h-10 flex-1 rounded-lg border border-line-subtle bg-surface" />
          <span class="h-10 flex-1 rounded-lg border-2 border-line-strong bg-surface" />
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ تایپوگرافی ══ -->
    <WqSectionHeader class="mt-8" title="تایپوگرافی فارسی" subtitle="utilityهای t-* — وزیرمتن">
      <ul class="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
        <li v-for="t in typeScale" :key="t.name" class="flex flex-col gap-0.5 px-4 py-3">
          <span class="t-caption" dir="ltr">{{ t.name }}</span>
          <span :class="[t.class, 'text-foreground']">{{ t.sample }}</span>
        </li>
      </ul>
    </WqSectionHeader>

    <!-- ══ فاصله / شعاع / ارتفاع ══ -->
    <WqSectionHeader class="mt-8" title="فاصله، شعاع و ارتفاع">
      <div class="flex flex-col gap-4">
        <div class="rounded-xl border border-line bg-surface p-4">
          <p class="t-caption mb-3">شبکهٔ ۴px — فاصله‌گذاری با کلاس‌های Tailwind</p>
          <div class="flex items-end gap-2">
            <div v-for="s in spacingSteps" :key="s" class="flex flex-col items-center gap-1">
              <span class="w-6 rounded-sm bg-primary" :style="{ height: `${s * 0.25}rem` }" />
              <span class="t-caption t-num">{{ toFaDigits(s) }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="r in radiusSteps"
            :key="r"
            class="flex h-12 min-w-14 items-center justify-center border border-line-strong bg-surface px-3"
            :class="`rounded-${r}`"
          >
            <span class="t-caption" dir="ltr">{{ r }}</span>
          </span>
          <span class="flex h-12 min-w-14 items-center justify-center rounded-full border border-line-strong bg-surface px-3">
            <span class="t-caption">pill</span>
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-xl border border-line bg-surface-raised p-4 shadow-raised">
            <p class="t-label">shadow-raised</p>
            <p class="t-caption">کارت‌های برجستهٔ خفیف</p>
          </div>
          <div class="rounded-xl bg-surface-overlay p-4 shadow-pop">
            <p class="t-label">shadow-pop</p>
            <p class="t-caption">شیت‌ها، دیالوگ‌ها، منوها</p>
          </div>
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ دکمه‌ها ══ -->
    <WqSectionHeader class="mt-8" title="دکمه‌ها">
      <div class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <div class="flex flex-wrap items-center gap-2">
          <WqButton icon="i-lucide-calendar-plus">رزرو نوبت</WqButton>
          <WqButton variant="secondary">ثانویه</WqButton>
          <WqButton variant="tertiary">سوم/متنی</WqButton>
          <WqButton variant="destructive" icon="i-lucide-trash-2">حذف</WqButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <WqButton size="sm">کوچک</WqButton>
          <WqButton size="md">متوسط</WqButton>
          <WqButton size="lg">بزرگ (پیش‌فرض)</WqButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <WqButton loading>در حال ارسال</WqButton>
          <WqButton disabled>غیرفعال</WqButton>
          <WqButton variant="secondary" trailing-icon="i-lucide-chevron-left">ادامه</WqButton>
        </div>
        <div class="flex items-center gap-2">
          <WqIconButton icon="i-lucide-heart" label="نشان کردن" />
          <WqIconButton icon="i-lucide-share-2" label="اشتراک‌گذاری" variant="outline" />
          <WqIconButton icon="i-lucide-trash-2" label="حذف" variant="soft" color="error" />
          <WqIconButton icon="i-lucide-settings" label="تنظیمات" size="sm" />
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ فرم‌ها ══ -->
    <WqSectionHeader class="mt-8" title="فرم‌ها" subtitle="label / hint / error / required">
      <div class="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
        <WqInput v-model="nameValue" label="نام و نام خانوادگی" required icon="i-lucide-user-round" />
        <WqPhoneInput
          v-model="phoneValue"
          required
          hint="کد تأیید به این شماره ارسال می‌شود"
        />
        <WqSearchInput v-model="searchValue" placeholder="نام کسب‌وکار، خدمت یا محله…" />
        <WqSelect v-model="selectValue" :items="selectItems" label="شهر" />
        <WqTextarea v-model="noteValue" label="یادداشت برای کسب‌وکار" hint="حداکثر ۵۰۰ کاراکتر" />
        <WqInput label="فیلد با خطا" :error="errorDemo" placeholder="مقدار نامعتبر" />
      </div>
    </WqSectionHeader>

    <!-- ══ کنترل‌های انتخاب ══ -->
    <WqSectionHeader class="mt-8" title="کنترل‌های انتخاب">
      <div class="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
        <div class="flex flex-wrap gap-2">
          <WqChip
            v-for="chip in chips"
            :key="chip.label"
            :selected="chip.selected"
            :icon="chip.icon"
            @toggle="chip.selected = !chip.selected"
          >
            {{ chip.label }}
          </WqChip>
        </div>

        <div class="flex flex-col gap-2.5">
          <UCheckbox v-model="wantReminder" color="primary" size="lg" label="یادآوری پیامکی نوبت" />
          <UCheckbox v-model="wantSms" color="primary" size="lg" label="ارسال رسید با پیامک" />
        </div>

        <URadioGroup
          v-model="paymentMethod"
          color="primary"
          :items="paymentItems"
          size="lg"
          orientation="horizontal"
        />

        <div class="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-muted px-3 py-2.5">
          <span class="t-label">دریافت اعلان</span>
          <USwitch color="primary" default-value />
        </div>

        <div class="grid gap-2">
          <WqSelectCard
            title="مینا رحیمی"
            description="آرایشگر مو و رنگ — ۴٫۸ ★"
            icon="i-lucide-user-round"
            :selected="selectedCard === 'a'"
            @select="selectedCard = 'a'"
          />
          <WqSelectCard
            title="امید کاظمی"
            description="متخصص پوست — ۴٫۵ ★"
            icon="i-lucide-user-round"
            :selected="selectedCard === 'b'"
            @select="selectedCard = 'b'"
          />
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ نشان‌های وضعیت ══ -->
    <WqSectionHeader class="mt-8" title="نشان‌های وضعیت">
      <div class="flex flex-wrap gap-2 rounded-xl border border-line bg-surface p-4">
        <WqStatusBadge v-for="(meta, status) in BOOKING_STATUS_META" :key="status" :status="status" />
        <WqStatusBadge :soft="false" status="confirmed" />
        <WqStatusBadge label="تأییدشده" color="success" icon="i-lucide-badge-check" />
        <WqStatusBadge label="نقدی" color="neutral" icon="i-lucide-banknote" />
      </div>
    </WqSectionHeader>

    <!-- ══ نمایش داده ══ -->
    <WqSectionHeader class="mt-8" title="نمایش داده">
      <div class="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
        <div class="flex items-center gap-2">
          <WqAvatar name="سارا محمدی" size="xs" />
          <WqAvatar name="سارا محمدی" size="sm" />
          <WqAvatar name="سارا محمدی" size="md" />
          <WqAvatar name="مینا رحیمی" size="lg" />
          <WqAvatar name="کیان رنجبر" size="xl" />
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <WqRating :value="business?.rating.average ?? 4.6" :count="business?.rating.count ?? 218" />
          <WqRating :value="3.5" size="sm" :show-count="false" />
        </div>

        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <WqPrice :amount="2450000" size="lg" />
          <WqPrice :amount="890000" />
          <WqPrice :amount="1200000" size="sm" strike />
          <WqPrice :amount="0" />
          <WqDuration :minutes="120" />
          <WqDuration :minutes="45" />
        </div>

        <div class="flex flex-col gap-1">
          <WqMetaRow
            v-if="business"
            icon="i-lucide-map-pin"
            label="آدرس"
            :value="`${business.address.city}، ${business.address.district}`"
          />
          <WqMetaRow icon="i-lucide-clock" label="ساعت">
            <WqDateTime :value="new Date()" mode="datetime" class="t-body-sm text-foreground" />
          </WqMetaRow>
          <WqMetaRow icon="i-lucide-phone" label="تلفن">
            <span class="t-body-sm t-num text-foreground" dir="ltr">{{ formatPhoneFa('02122083145') }}</span>
          </WqMetaRow>
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ حالت‌های رابط ══ -->
    <WqSectionHeader class="mt-8" title="حالت‌های رابط (loading / empty / error / offline)">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-line bg-surface"><AppLoadingState label="در حال دریافت نوبت‌ها" /></div>
        <div class="rounded-xl border border-line bg-surface"><AppLoadingState :rows="3" label="در حال دریافت فهرست" /></div>
        <div class="rounded-xl border border-line bg-surface">
          <AppEmptyState title="نوبتی یافت نشد" description="هنوز نوبتی ثبت نکرده‌اید؛ از بخش جستجو شروع کنید.">
            <WqButton size="md" variant="secondary" class="mt-1">جستجوی کسب‌وکار</WqButton>
          </AppEmptyState>
        </div>
        <div class="rounded-xl border border-line bg-surface">
          <AppErrorState retryable description="اتصال برقرار نشد. لطفاً دوباره تلاش کنید." @retry="toast.info('تلاش مجدد (نمایشی)')" />
        </div>
        <div class="rounded-xl border border-line bg-surface sm:col-span-2">
          <AppOfflineState @retry="toast.info('بررسی مجدد اتصال (نمایشی)')" />
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ اورلی ══ -->
    <WqSectionHeader class="mt-8" title="اورلی (شیت، دیالوگ، اعلان)">
      <div class="flex flex-wrap gap-2 rounded-xl border border-line bg-surface p-4">
        <WqButton variant="secondary" icon="i-lucide-panel-bottom" @click="sheetOpen = true">باز کردن شیت</WqButton>
        <WqButton variant="secondary" icon="i-lucide-circle-help" @click="confirmOpen = true">تأیید عادی</WqButton>
        <WqButton variant="destructive" icon="i-lucide-triangle-alert" @click="confirmDestructiveOpen = true">تأیید مخرب</WqButton>
      </div>
      <div class="mt-2 flex flex-wrap gap-2 rounded-xl border border-line bg-surface p-4">
        <WqButton variant="tertiary" @click="toast.success('رزرو شما با موفقیت ثبت شد.')">toast موفقیت</WqButton>
        <WqButton variant="tertiary" @click="toast.error('زمان انتخابی دیگر در دسترس نیست.')">toast خطا</WqButton>
        <WqButton variant="tertiary" @click="toast.info('یادآوری نوبت فعال شد.', 'i-lucide-bell')">toast اطلاع</WqButton>
      </div>
    </WqSectionHeader>

    <!-- ══ شبیه‌سازی mock ══ -->
    <WqSectionHeader
      v-if="mockFlags.enabled.value"
      class="mt-8"
      title="شبیه‌سازی پاسخ mock"
      subtitle="loading / success / empty / error / ۴۰۱ بدون بک‌اند واقعی"
    >
      <div class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <div class="flex items-center justify-between">
          <span class="t-label">شبیه‌سازی خطای شبکه</span>
          <USwitch v-model="mockFlags.forceError.value" color="primary" />
        </div>
        <div class="flex items-center justify-between">
          <span class="t-label">شبیه‌سازی پاسخ خالی</span>
          <USwitch v-model="mockFlags.forceEmpty.value" color="primary" />
        </div>
        <p class="t-caption text-foreground-tertiary">
          «خطای شبکه» همه‌جا پیام خطا می‌سازد و «پاسخ خالی» فهرست‌ها را خالی
          می‌کند — از جمله فهرست سرویس‌ها و پرسنل مدیر. برای دیدن «هنوز
          سرویسی/پرسنلی ندارم» با دادهٔ واقعی‌تر، کسب‌وکار آینه (صفر سرویس، صفر
          پرسنل) را انتخاب کنید.
        </p>
        <div class="flex items-start justify-between gap-3">
          <span class="min-w-0">
            <span class="t-label block">شبیه‌سازی نشست نامعتبر (۴۰۱)</span>
            <span class="t-caption block">
              هر کارِ کاربر-محور (نشان‌کردن، پروفایل، ذخیرهٔ پروفایل) خطای نشست
              می‌گیرد → پاک‌سازی مرکزی نشست و هدایت به /login.
            </span>
          </span>
          <USwitch v-model="mockFlags.forceUnauthorized.value" color="primary" />
        </div>
        <USeparator />
        <div class="flex items-start justify-between gap-3">
          <span class="min-w-0">
            <span class="t-label block">بازنشانی تغییرات محلی سرویس‌ها و پرسنل</span>
            <span class="t-caption block">
              هر چه در فاز ۹ و ۱۰ ساخته/ویرایش/اختصاص/غیرفعال/حذف شده در کوکی‌های
              «wq_business_services» و «wq_business_employees» می‌نشیند؛ این دکمه
              همان deltaها را پاک می‌کند تا دادهٔ پایه برگردد و دمو از اول قابل
              تکرار باشد.
            </span>
          </span>
          <WqButton size="md" variant="tertiary" :loading="resetting" @click="resetLocalData">
            بازنشانی
          </WqButton>
        </div>
        <USeparator />
        <div class="min-h-16">
          <AppLoadingState v-if="probePending" label="در حال واکشی نمونه" />
          <AppErrorState
            v-else-if="probeError"
            retryable
            :description="toServiceError(probeError).message"
            @retry="probeRefresh()"
          />
          <AppEmptyState
            v-else-if="!probe || probe.items.length === 0"
            title="پاسخ خالی"
            description="فهرست کسب‌وکار خالی برگشت (شبیه‌سازی‌شده)."
          />
          <p v-else class="t-body-sm text-foreground-secondary">
            پاسخ موفق: {{ toFaDigits(probe.items.length) }} کسب‌وکار از {{ toFaDigits(probe.total) }}
          </p>
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ ناوبری ══ -->
    <WqSectionHeader class="mt-8" title="ناوبری (بر اساس حالت)" subtitle="سوییچر حالت را از هدر باز کنید تا تب‌بار تغییر کند">
      <div class="flex flex-col gap-3">
        <div
          v-for="mode in modes"
          :key="mode"
          class="overflow-hidden rounded-xl border border-line bg-surface"
        >
          <div class="border-b border-line-subtle bg-surface-muted px-4 py-2">
            <span class="t-label">{{ MODE_META[mode].label }}</span>
          </div>
          <div class="flex justify-around px-2 py-3">
            <span
              v-for="item in NAVIGATION[mode]"
              :key="item.key"
              class="flex flex-col items-center gap-1"
              :class="item.enabled ? 'text-primary' : 'text-foreground-muted opacity-60'"
            >
              <UIcon :name="item.icon" class="size-6" />
              <span class="t-caption">{{ item.label }}</span>
            </span>
          </div>
        </div>
      </div>
    </WqSectionHeader>

    <!-- ══ RTL ══ -->
    <WqSectionHeader class="mt-8" title="آزمون RTL و متن ترکیبی">
      <div class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <p class="t-body">
          سالن Beauty Clinic نارنج — رزرو آنلاین نوبت در تهران، ۲۰۲۶
        </p>
        <p class="t-body">
          شمارهٔ تماس: <span class="t-num" dir="ltr">۰۹۱۲ ۳۴۵ ۶۷۸۹</span>
          — ساعت: <span class="t-num">۱۴:۳۰</span>
        </p>
        <WqListRow icon="i-lucide-store" title="سالن زیبایی نارنج" subtitle="سعادت‌آباد — رزرو آنلاین" />
      </div>
    </WqSectionHeader>

    <!-- شیت نمونه -->
    <WqSheet v-model:open="sheetOpen" title="مرتب‌سازی" description="نحوهٔ نمایش فهرست را انتخاب کنید">
      <div class="grid gap-2 pb-2" role="radiogroup" aria-label="مرتب‌سازی">
        <WqSelectCard
          v-for="(option, i) in sheetOptions"
          :key="option.title"
          :title="option.title"
          :description="option.description"
          :icon="option.icon"
          :selected="sheetSelected === i"
          @select="sheetSelected = i"
        />
      </div>
      <template #footer>
        <WqButton block @click="sheetOpen = false; toast.info('مرتب‌سازی اعمال شد (نمایشی).')">
          اعمال
        </WqButton>
      </template>
    </WqSheet>

    <WqConfirm
      v-model:open="confirmOpen"
      title="ثبت نوبت؟"
      description="نوبت شما فردا ساعت ۱۴:۳۰ در سالن زیبایی نارنج ثبت می‌شود."
      confirm-label="ثبت نوبت"
      :loading="confirmLoading"
      @confirm="onConfirm"
    />
    <WqConfirm
      v-model:open="confirmDestructiveOpen"
      title="لغو نوبت؟"
      tone="destructive"
      confirm-label="بله، لغو شود"
      cancel-label="نگه دارم"
      :loading="confirmLoading"
      description="در صورت لغو، مبلغ پرداختی طبق قوانین کسب‌وکار برگردانده می‌شود."
      @confirm="onConfirm"
    />

    <!-- اکشن چسبیدهٔ نمونه -->
    <AppStickyAction>
      <WqButton block icon="i-lucide-calendar-plus" @click="toast.info('اکشن چسبیدهٔ پایین صفحه (نمایشی)')">
        اکشن اصلی صفحه (نمایشی)
      </WqButton>
    </AppStickyAction>
  </div>
</template>
