<script setup lang="ts">
/**
 * خانه — پوستهٔ محصولی + ورود آزمایشی توسعه.
 * تجربهٔ واقعی مشتری (کشف/جستجو/پیشنهادها) در فازهای بعد ساخته می‌شود.
 */
useHead({ title: 'خانه' })

const config = useRuntimeConfig()
const toast = useAppToast()
const { user, isAuthenticated, pending: authPending, devSignIn } = useAuth()
const { currentModeMeta } = useUserMode()

const isMock = computed(() => config.public.apiMode === 'mock')
const today = formatFaDateFull(new Date())

async function onDevSignIn() {
  try {
    await devSignIn()
    toast.success('با حساب آزمایشی وارد شدید.')
  }
  catch (error) {
    toast.error(toServiceError(error).message)
  }
}
</script>

<template>
  <div>
    <AppPageHeader
      :title="user ? `سلام، ${user.firstName}` : 'به وقتینو خوش آمدید'"
      :subtitle="`${today} · حالت فعال: ${currentModeMeta.label}`"
    />

    <!-- نشست کاربر -->
    <section class="rounded-xl border border-line bg-surface p-4">
      <div v-if="isAuthenticated && user" class="flex items-center gap-3">
        <WqAvatar :name="`${user.firstName} ${user.lastName}`" size="lg" />
        <div class="min-w-0 flex-1">
          <p class="t-h3 truncate text-foreground">{{ user.firstName }} {{ user.lastName }}</p>
          <p class="t-caption t-num" dir="ltr">{{ formatPhoneFa(user.phone) }}</p>
        </div>
        <WqStatusBadge label="فعال" color="success" icon="i-lucide-circle-check" />
      </div>

      <div v-else class="flex flex-col gap-3">
        <p class="t-body-sm text-foreground-secondary">
          فعلاً مهمان هستید. برای آزمایش سوییچ حالت‌ها (مشتری / کسب‌وکار / کارمند)
          با جریان آزمایشی OTP وارد شوید — بدون پیامک واقعی.
        </p>
        <WqButton
          v-if="isMock"
          :loading="authPending"
          icon="i-lucide-smartphone"
          block
          @click="onDevSignIn"
        >
          ورود آزمایشی توسعه (کد: {{ toFaDigits(config.public.mockOtpCode) }})
        </WqButton>
        <UAlert
          v-else
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="حالت API فعال است اما بک‌اند هنوز متصل نشده است."
        />
      </div>
    </section>

    <!-- ورود به شوکیس سیستم طراحی — فقط محیط توسعه -->
    <section v-if="isMock" class="mt-6">
      <WqSectionHeader title="ابزارهای توسعه" subtitle="فقط در حالت توسعه نمایش داده می‌شود">
        <div class="rounded-xl border border-line bg-surface px-4">
          <WqListRow
            title="نمایش سیستم طراحی"
            subtitle="توکن‌ها، کامپوننت‌ها، تم‌ها و الگوها"
            icon="i-lucide-palette"
            to="/dev/design"
          />
        </div>
      </WqSectionHeader>
    </section>
  </div>
</template>
