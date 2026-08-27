<script setup lang="ts">
/**
 * خانه — فرود حالت مشتری (بازدید مهمان آزاد است).
 * تجربهٔ کامل کشف کسب‌وکار در فازهای بعد ساخته می‌شود.
 */
definePageMeta({ access: 'public' })
useHead({ title: 'خانه' })

const config = useRuntimeConfig()
const { user, isAuthenticated } = useAuth()
const { currentModeMeta } = useUserMode()

const isMock = computed(() => config.public.apiMode === 'mock')
const isDev = import.meta.dev
const today = formatFaDateFull(new Date())
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
          برای رزرو نوبت، ذخیرهٔ کسب‌وکارها و پیگیری نوبت‌ها وارد حساب خود شوید.
        </p>
        <WqButton icon="i-lucide-key-round" block @click="navigateTo('/login')">
          ورود یا ثبت‌نام
        </WqButton>
        <UAlert
          v-if="isMock"
          color="neutral"
          variant="subtle"
          icon="i-lucide-flask-conical"
          title="حالت توسعه فعال است — ورود با OTP ساختگی انجام می‌شود."
        />
      </div>
    </section>

    <!-- ورود به شوکیس سیستم طراحی — فقط محیط توسعه -->
    <section v-if="isMock && isDev" class="mt-6">
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
