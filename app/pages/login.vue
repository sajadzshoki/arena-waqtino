<script setup lang="ts">
/**
 * ورود — شمارهٔ موبایل ← درخواست OTP.
 * در حالت توسعه (mock) شماره‌های از پیش‌شناخته‌شده سناریوهای قابلیت را روشن می‌کند.
 */
definePageMeta({ layout: 'guest', access: 'guest', tabbar: false })
useHead({ title: 'ورود یا ثبت‌نام' })

const route = useRoute()
const config = useRuntimeConfig()
const toast = useAppToast()
const { requestOtp, pending } = useAuth()

const isMock = computed(() => config.public.apiMode === 'mock')

const phone = ref('')
const phoneError = ref<string | false>(false)

/** سناریوهای توسعه → فقط در حالت mock در UI نمایش داده می‌شود */
const devScenarios = [
  { phone: '09111111111', label: 'مشتری' },
  { phone: '09222222222', label: 'مشتری + مالک' },
  { phone: '09333333333', label: 'مشتری + کارمند' },
  { phone: '09123456789', label: 'هر سه قابلیت' }
]

async function submit() {
  const normalized = normalizeDigits(phone.value).replace(/\s/g, '')
  if (!isValidIranianMobile(normalized)) {
    phoneError.value = 'شمارهٔ موبایل معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹'
    return
  }
  phoneError.value = false
  try {
    const result = await requestOtp(normalized)
    toast.info('کد تأیید برای شما ارسال شد.', 'i-lucide-mail-check')
    await navigateTo({
      path: '/login/otp',
      query: {
        phone: normalized,
        ...(typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {}),
        ...(isMock.value && result.devCode ? { dev: '1' } : {})
      }
    })
  }
  catch (error) {
    toast.error(toServiceError(error).message)
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="flex flex-col items-center gap-3 pb-8 text-center">
      <AppLogo compact class="scale-125" />
      <p class="t-h2 mt-4 text-foreground-strong">به وقتینو خوش آمدید</p>
      <p class="t-body-sm text-foreground-secondary max-w-72">
        با شمارهٔ موبایل وارد شوید یا حساب بسازید؛ رزرو نوبت چند دقیقه بیشتر طول نمی‌کشد.
      </p>
    </div>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <WqPhoneInput
        v-model="phone"
        :error="phoneError"
        required
        :hint="phoneError ? undefined : 'کد تأیید به این شماره پیامک می‌شود'"
        @update:model-value="phoneError = false"
      />

      <WqButton type="submit" :loading="pending" block icon="i-lucide-key-round">
        دریافت کد تأیید
      </WqButton>
    </form>

    <!-- راهنمای توسعه — فقط حالت mock -->
    <div
      v-if="isMock"
      class="mt-8 rounded-xl border border-dashed border-line-strong bg-surface-muted p-3.5"
    >
      <p class="t-label flex items-center gap-1.5 text-foreground-secondary">
        <UIcon name="i-lucide-flask-conical" class="size-4" />
        حالت توسعه (OTP ثابت: {{ toFaDigits(config.public.mockOtpCode) }})
      </p>
      <p class="t-caption mt-1">شمارههای از پیش‌تعریف‌شده برای آزمودن سناریوهای قابلیت:</p>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <WqChip
          v-for="s in devScenarios"
          :key="s.phone"
          :selected="phone === s.phone"
          @toggle="phone = s.phone; phoneError = false"
        >
          <span class="t-num" dir="ltr">{{ toFaDigits(s.phone) }}</span>
          <span class="opacity-75">· {{ s.label }}</span>
        </WqChip>
      </div>
      <p class="t-caption mt-2">هر شمارهٔ دیگری = کاربر تازهٔ مشتری</p>
    </div>

    <p class="t-caption mt-auto pt-8 text-center">
      با ورود یا ثبت‌نام در وقتینو، <span class="font-medium text-foreground-secondary">قوانین استفاده</span> و
      <span class="font-medium text-foreground-secondary">حریم خصوصی</span> را می‌پذیرید.
    </p>
  </div>
</template>
