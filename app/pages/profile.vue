<script setup lang="ts">
/**
 * پروفایل (حالت مشتری) — هویت، قابلیت‌ها، خروج.
 * ویرایش پروفایل و بخش‌های بیشتر در فازهای بعد می‌آیند.
 */
definePageMeta({ access: 'auth' })
useHead({ title: 'پروفایل' })

const toast = useAppToast()
const { user, logout, pending } = useAuth()
const { availableModes, modeContextLabel } = useUserMode()

const logoutConfirm = ref(false)

const capabilityRows = computed(() =>
  availableModes.value.map(mode => ({
    ...MODE_META[mode],
    context: modeContextLabel(mode)
  }))
)

async function onLogoutConfirmed() {
  logoutConfirm.value = false
  await logout()
  toast.neutral('از حساب خارج شدید.', 'i-lucide-log-out')
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div v-if="user">
    <AppPageHeader title="پروفایل" />

    <!-- هویت -->
    <section class="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
      <WqAvatar :name="`${user.firstName} ${user.lastName}`" size="xl" />
      <div class="min-w-0 flex-1">
        <p class="t-h2 text-foreground-strong">{{ user.firstName }} {{ user.lastName }}</p>
        <p class="t-caption t-num mt-1" dir="ltr">{{ formatPhoneFa(user.phone) }}</p>
      </div>
    </section>

    <!-- قابلیت‌ها -->
    <WqSectionHeader
      class="mt-6"
      title="قابلیت‌های حساب"
      subtitle="از سوییچر حالت (هدر) بین آن‌ها جابه‌جا شوید"
    >
      <div class="flex flex-col gap-2">
        <WqSelectCard
          v-for="cap in capabilityRows"
          :key="cap.mode"
          :title="cap.label"
          :description="cap.context ?? cap.description"
          :icon="cap.icon"
          :selected="false"
          disabled
        />
      </div>
    </WqSectionHeader>

    <!-- حساب -->
    <WqSectionHeader class="mt-6" title="حساب کاربری">
      <div class="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface px-4">
        <WqListRow
icon="i-lucide-pencil" title="ویرایش پروفایل" :chevron="true"
          @click="toast.neutral('ویرایش پروفایل در فازهای بعدی فعال می‌شود.', 'i-lucide-construction')" />
        <WqListRow
          icon="i-lucide-log-out"
          title="خروج از حساب"
          destructive
          :chevron="false"
          @click="logoutConfirm = true"
        />
      </div>
    </WqSectionHeader>

    <WqConfirm
      v-model:open="logoutConfirm"
      title="خروج از حساب؟"
      description="برای استفادهٔ دوباره باید با شمارهٔ موبایل وارد شوید."
      tone="destructive"
      confirm-label="خروج"
      cancel-label="می‌مانم"
      :loading="pending"
      @confirm="onLogoutConfirmed"
    />
  </div>
</template>
