<script setup lang="ts">
/**
 * تنظیمات — سه گروه معنایی، بدون فهرست «متفرقه»:
 *
 *   ظاهر (تم: سیستم / روشن / تیره)
 *   تنظیمات برنامه (اعلان‌ها — نقطهٔ ورود فاز بعد)
 *   حساب (پروفایل، نشان‌شده‌ها، خروج)
 *
 * تم از یک مدیر متمرکز (`useThemePreference`) خوانده/نوشته می‌شود؛ هیچ صفحه‌ای
 * کلاس `.dark` را دستی تغییر نمی‌دهد و هیچ کامپوننتی برای تم سوییچ کردن رنگ
 * hardcode نمی‌کند — همه‌چیز از توکن‌های معنایی `tokens.css` می‌آید.
 */
definePageMeta({ access: 'auth', tabbar: false })
useHead({ title: 'تنظیمات' })

const toast = useAppToast()
const { options, preference, resolvedLabel, followsSystem, setPreference } = useThemePreference()
const { count: savedCount } = useSavedBusinesses()
const { confirmOpen, pending, request: askLogout, confirmLogout, cancel } = useLogout()

function chooseTheme(value: ThemePreference): void {
  if (value === preference.value) return
  const persisted = setPreference(value)
  if (persisted) {
    toast.neutral(
      value === 'system' ? 'حالت نمایش با سیستم شما همگام شد.' : `حالت «${options.find(o => o.value === value)?.label}» فعال شد.`,
      'i-lucide-palette'
    )
    return
  }
  // صادقانه: اگر مرورگر اجازهٔ ذخیره نداد، قول «ماندگاری» نمی‌دهیم
  toast.warning('ترجیح نمایش ذخیره نشد.', {
    description: 'مرورگر اجازهٔ ذخیره نداد؛ تم فقط تا پایان همین نشست تغییر می‌کند.'
  })
}
</script>

<template>
  <div class="pb-6">
    <AppBackHeader title="تنظیمات" to="/profile" />

    <!-- ── ظاهر ── -->
    <SettingsSection
      title="ظاهر"
      description="همین‌جا انتخاب کنید وقتینو روشن باشد یا تیره"
    >
      <div class="flex flex-col gap-2 py-3" role="radiogroup" aria-label="حالت نمایش برنامه">
        <WqSelectCard
          v-for="option in options"
          :key="option.value"
          :title="option.label"
          :description="option.value === 'system' && followsSystem
            ? `اکنون ${resolvedLabel} — از تنظیمات دستگاه`
            : option.description"
          :icon="option.icon"
          :selected="preference === option.value"
          @select="chooseTheme(option.value)"
        />
      </div>

      <template #footer>
        ترجیح نمایش روی همین دستگاه نگه داشته می‌شود؛ با بستن و باز کردن برنامه
        هم همان حالت را می‌بینید و در حالت «هماهنگ با سیستم»، تغییر تمِ دستگاه
        بی‌درخواست شما اعمال می‌شود.
      </template>
    </SettingsSection>

    <!-- ── تنظیمات برنامه ── -->
    <SettingsSection title="تنظیمات برنامه">
      <SettingsRow
        to="/notifications"
        icon="i-lucide-bell"
        title="اعلان‌ها"
        subtitle="یادآوری نوبت و پاسخ کسب‌وکارها"
        badge="به‌زودی"
      />
      <SettingsRow
        to="/saved"
        icon="i-lucide-bookmark"
        title="کسب‌وکارهای نشان‌شده"
        :value="`${toFaDigits(savedCount)} مورد`"
      />
      <template #footer>
        اعلان‌ها در فاز مخصوص خودش ساخته می‌شود؛ تا آن زمان نوبت‌هایتان را در
        تب «نوبت‌ها» دنبال کنید.
      </template>
    </SettingsSection>

    <!-- ── حساب ── -->
    <SettingsSection title="حساب">
      <SettingsRow
        to="/profile"
        icon="i-lucide-user-round"
        title="پروفایل و اطلاعات حساب"
      />
      <SettingsInfoRow
        icon="i-lucide-shield-check"
        title="ورود با پیامک تأیید"
        subtitle="تغییر شمارهٔ موبایل به تأیید پیامکی نیاز دارد"
      />
    </SettingsSection>

    <!-- ── عملیات حساس — جدا از ناوبری عادی ── -->
    <SettingsSection tone="danger">
      <SettingsRow
        icon="i-lucide-log-out"
        title="خروج از حساب"
        subtitle="نشست بسته می‌شود و به صفحهٔ ورود می‌روید"
        destructive
        :chevron="false"
        @click="askLogout"
      />
    </SettingsSection>

    <p class="t-caption mt-6 text-center">وقتینو — رزرو آنلاین نوبت</p>

    <WqConfirm
      v-model:open="confirmOpen"
      title="خروج از حساب؟"
      description="برای دیدن نوبت‌ها و کسب‌وکارهای نشان‌شده باید دوباره با شمارهٔ موبایل وارد شوید."
      tone="destructive"
      confirm-label="خروج از حساب"
      cancel-label="می‌مانم"
      :loading="pending"
      @confirm="confirmLogout"
      @cancel="cancel"
    />
  </div>
</template>
