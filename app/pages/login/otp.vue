<script setup lang="ts">
/**
 * تأیید OTP — کد پیامک‌شده (در توسعه: کد mock ثابت).
 * بدون OTP معلق به /login برمی‌گردد. تأیید موفق → redirect یا فرود حالت.
 */
definePageMeta({ layout: 'guest', access: 'guest', tabbar: false })
useHead({ title: 'کد تأیید' })

const route = useRoute()
const config = useRuntimeConfig()
const toast = useAppToast()
const { otpRequest, verifyOtp, requestOtp, pending } = useAuth()
const { currentMode } = useUserMode()

const isMock = computed(() => config.public.apiMode === 'mock')

const phone = ref(typeof route.query.phone === 'string' ? route.query.phone : '')

onMounted(() => {
  // رفرش صفحهٔ OTP بدون درخواست معلق معتبر → بازگشت به ورود
  if (!otpRequest.value && phone.value) {
    navigateTo({ path: '/login', query: { redirect: route.query.redirect } })
  }
})

const code = ref<number[]>([])
const codeError = ref<string | null>(null)
const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : undefined
)

/* ——— تایمر ارسال مجدد ——— */
const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function restartTimer(seconds?: number) {
  clearInterval(timer)
  secondsLeft.value = seconds ?? otpRequest.value?.expiresIn ?? 120
  timer = setInterval(() => {
    secondsLeft.value = Math.max(0, secondsLeft.value - 1)
    if (secondsLeft.value === 0) clearInterval(timer)
  }, 1000)
}
onMounted(() => restartTimer())
onBeforeUnmount(() => clearInterval(timer))

const timerLabel = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${toFaDigits(m)}:${toFaDigits(String(s).padStart(2, '0'))}`
})

async function verify(value?: number[]) {
  const digits = (value ?? code.value).join('')
  if (digits.length < 4) {
    codeError.value = 'کد ۴ رقمی را کامل وارد کنید.'
    return
  }
  codeError.value = null
  try {
    await verifyOtp(phone.value, digits)
    toast.success('خوش آمدید! ورود شما انجام شد.')
    await navigateTo(redirectTarget.value ?? MODE_LANDING[currentMode.value], {
      replace: true
    })
  }
  catch (error) {
    codeError.value = toServiceError(error).message
    code.value = []
  }
}

async function resend() {
  if (secondsLeft.value > 0) return
  try {
    await requestOtp(phone.value)
    code.value = []
    restartTimer()
    toast.info('کد تأیید دوباره ارسال شد.', 'i-lucide-mail-check')
  }
  catch (error) {
    toast.error(toServiceError(error).message)
  }
}

function fillDevCode() {
  code.value = config.public.mockOtpCode.split('').map(Number)
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <div class="mb-8">
      <WqIconButton
        icon="i-lucide-arrow-right"
        label="بازگشت: ویرایش شماره"
        variant="ghost"
        @click="navigateTo({ path: '/login', query: { redirect: redirectTarget } })"
      />
    </div>

    <div class="flex flex-col gap-2 pb-6">
      <h1 class="t-h2 text-foreground-strong">کد تأیید را وارد کنید</h1>
      <p class="t-body-sm text-foreground-secondary">
        کد ۴ رقمی به شمارهٔ <span class="t-num font-medium text-foreground" dir="ltr">{{ formatPhoneFa(phone) }}</span> ارسال شد.
      </p>
    </div>

    <form class="flex flex-col items-center gap-5" novalidate @submit.prevent="verify()">
      <UFormField :error="codeError ?? undefined" size="lg" :ui="{ error: 'text-center' }">
        <UPinInput
          v-model="code"
          :length="4"
          type="number"
          otp
          size="xl"
          autofocus
          dir="ltr"
          :ui="{ base: 't-num' }"
          @complete="verify"
          @update:model-value="codeError = null"
        />
      </UFormField>

      <WqButton type="submit" :loading="pending" block size="lg" icon="i-lucide-check">
        تأیید و ورود
      </WqButton>
    </form>

    <div class="mt-5 flex flex-col items-center gap-2">
      <template v-if="secondsLeft > 0">
        <p class="t-caption">
          ارسال مجدد تا <span class="t-num font-semibold text-foreground-secondary">{{ timerLabel }}</span> دیگر
        </p>
      </template>
      <WqButton
        v-else
        variant="tertiary"
        size="md"
        icon="i-lucide-rotate-ccw"
        :loading="pending"
        @click="resend"
      >
        ارسال مجدد کد
      </WqButton>
    </div>

    <!-- فقط حالت توسعه -->
    <div
      v-if="isMock"
      class="mt-8 flex items-center justify-between rounded-xl border border-dashed border-line-strong bg-surface-muted px-3.5 py-3"
    >
      <p class="t-caption">
        <UIcon name="i-lucide-flask-conical" class="me-1 inline-block size-4 align-middle" />
        کد توسعه: <span class="t-num font-semibold text-foreground">{{ toFaDigits(config.public.mockOtpCode) }}</span>
      </p>
      <WqButton variant="tertiary" size="sm" @click="fillDevCode">درج خودکار</WqButton>
    </div>
  </div>
</template>
