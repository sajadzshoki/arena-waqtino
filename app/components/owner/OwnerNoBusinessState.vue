<script setup lang="ts">
/**
 * صاحب حساب بدون کسب‌وکار — حالت خالیِ عمدی، نه خطا.
 *
 * کاربر «مالک» است ولی هنوز کسب‌وکاری ندارد؛ پس نباید به حالت مشتری پرتاب
 * شود یا صفحه بشکند. ثبت کسب‌وکار در فاز بعدی است، بنابراین اینجا فقط واقعیت
 * گفته می‌شود و دو مسیر واقعی پیشنهاد می‌شود (نه فرم جعلی ساخت کسب‌وکار).
 */
const { setMode } = useUserMode()

/**
 * فقط حالت را عوض نمی‌کند: کاربر در حالت مشتری نباید روی `/owner` بماند،
 * پس همان کاری که سوییچر حالت می‌کند — حالت + مسیر فرود آن حالت.
 */
async function switchToCustomer(): Promise<void> {
  if (!setMode('customer')) return
  await navigateTo(MODE_LANDING.customer)
}
</script>

<template>
  <AppEmptyState
    icon="i-lucide-store-plus"
    title="هنوز کسب‌وکاری برای مدیریت ندارید"
    description="حساب شما قابلیت مدیریت کسب‌وکار دارد، اما به هیچ کسب‌کاری متصل نیست. افزودن و ثبت کسب‌وکار در فاز بعدی وقتینو باز می‌شود."
  >
    <div class="mt-1 flex w-full flex-col items-stretch gap-2 sm:max-w-80">
      <WqButton size="lg" block class="min-h-12" icon="i-lucide-user-round" to="/profile">
        بررسی پروفایل و حساب
      </WqButton>
      <WqButton variant="tertiary" size="lg" block class="min-h-12" icon="i-lucide-compass" @click="switchToCustomer">
        رفتن به حالت مشتری
      </WqButton>
    </div>
  </AppEmptyState>
</template>
