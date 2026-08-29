<script setup lang="ts">
/**
 * پروفایل مشتری — «فضای شخصی کاربر و مرکز کنترل اپلیکیشن».
 *
 * سلسله‌مراتب (موبایل‌اول، بدون انبوههٔ کارت):
 *   هویت  →  اطلاعات شخصی  →  تنظیمات و اعلان‌ها  →  عملیات حساب (مخرب، جدا)
 *
 * سه قانون فاز ۷ در همین صفحه رعایت شده است:
 *   - هویت از state مرکزی (`useUserProfile` → `useAuth`) خوانده می‌شود؛
 *     هیچ کپی محلی از کاربر و هیچ شیء mock ساختگی در کامپوننت نیست.
 *   - ردیف‌های ناوبری از اکشن‌های حساس جدا شده‌اند (بخش danger پایین صفحه).
 *   - هیچ آمار و تحلیلِ صاحب کسب‌وکاری در اینجا نیامده — این پروفایلِ مشتری است.
 */
definePageMeta({ access: 'auth' })
useHead({ title: 'پروفایل' })

const { profile, initializing, error, load } = useUserProfile()
const { availableModes, currentMode, canSwitchMode, modeContextLabel } = useUserMode()
const { count: savedCount } = useSavedBusinesses()
const { confirmOpen, pending: logoutPending, request: askLogout, confirmLogout, cancel } = useLogout()
const { label: themeLabel } = useThemePreference()

const modeSwitcherOpen = useState<boolean>('ui:mode-switcher', () => false)

onMounted(() => {
  void load()
})

const memberSince = computed(() =>
  profile.value?.createdAt ? formatFaDate(profile.value.createdAt) : ''
)

const modeLabel = computed(() => {
  const meta = MODE_META[currentMode.value]
  return modeContextLabel(currentMode.value) ?? meta.label
})
</script>

<template>
  <div class="pb-4">
    <AppPageHeader title="پروفایل" subtitle="حساب شما، تنظیمات و دسترسی‌ها" />

    <!-- خطای بارگذاری — صفحه شکسته نمی‌شود -->
    <AppErrorState
      v-if="error"
      title="پروفایل باز نشد"
      :description="error"
      retryable
      @retry="load()"
    />

    <template v-else>
      <!-- هویت -->
      <ProfileIdentity :user="profile" :loading="initializing" />

      <!-- اطلاعات شخصی (فقط‌خواندنی — شمارهٔ موبایل به احراز هویت وصل است) -->
      <SettingsSection
        v-if="!initializing"
        title="اطلاعات شخصی"
        description="آنچه کسب‌وکارها و نوبت‌های شما را مشخص می‌کند"
      >
        <SettingsInfoRow
          icon="i-lucide-smartphone"
          title="شمارهٔ موبایل"
          :value="profile ? formatPhoneFa(profile.phone) : '—'"
          ltr
          locked
        />
        <SettingsInfoRow
          v-if="memberSince"
          icon="i-lucide-calendar-days"
          title="عضویت از"
          :value="memberSince"
        />

        <SettingsRow
          to="/profile/edit"
          icon="i-lucide-pencil-line"
          title="ویرایش پروفایل"
          subtitle="نام و تصویر پروفایل"
        />

        <template #footer>
          تغییر شمارهٔ موبایل به جریان تأیید پیامکی نیاز دارد و در فازهای بعد
          فعال می‌شود؛ فعلاً همین شمارهٔ ورود شماست.
        </template>
      </SettingsSection>

      <!-- تنظیمات برنامه -->
      <SettingsSection v-if="!initializing" title="تنظیمات">
        <SettingsRow
          to="/settings"
          icon="i-lucide-palette"
          title="ظاهر و حالت نمایش"
          :value="themeLabel"
        />
        <SettingsRow
          to="/notifications"
          icon="i-lucide-bell"
          title="اعلان‌ها"
          badge="به‌زودی"
        />
        <SettingsRow
          v-if="canSwitchMode"
          icon="i-lucide-repeat"
          title="حالت حساب"
          :subtitle="`${toFaDigits(availableModes.length)} قابلیت فعال روی یک حساب`"
          :value="modeLabel"
          @click="modeSwitcherOpen = true"
        />
        <template #footer>
          فهرست نشان‌شده‌های شما: {{ toFaDigits(savedCount) }} کسب‌وکار — از تب
          «نشان‌شده‌ها» در دسترس است.
        </template>
      </SettingsSection>

      <!-- عملیات حساب — جدا از ناوبری عادی -->
      <SettingsSection
        title="حساب کاربری"
        description="اقدامات حساس روی حساب"
        tone="danger"
      >
        <SettingsRow
          icon="i-lucide-log-out"
          title="خروج از حساب"
          subtitle="برای ادامهٔ رزروها دوباره وارد شوید"
          destructive
          :chevron="false"
          @click="askLogout"
        />
      </SettingsSection>
    </template>

    <WqConfirm
      v-model:open="confirmOpen"
      title="خروج از حساب؟"
      description="نشست شما بسته می‌شود و برای دیدن نوبت‌ها و کسب‌وکارهای نشان‌شده باید دوباره با شمارهٔ موبایل وارد شوید."
      tone="destructive"
      confirm-label="خروج از حساب"
      cancel-label="می‌مانم"
      :loading="logoutPending"
      @confirm="confirmLogout"
      @cancel="cancel"
    />
  </div>
</template>
