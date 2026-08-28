<script setup lang="ts">
/**
 * سوییچر حالت — به‌صورت شیت پایین (WqSheet).
 * فقط حالت‌های قابل‌دسترس کاربر نمایش داده می‌شوند؛ بعد از سوییچ،
 * کاربر به مسیر فرود همان حالت هدایت می‌شود (MODE_LANDING).
 */
const { isAuthenticated, logout, pending: authPending } = useAuth()
const { currentMode, availableModes, setMode, modeContextLabel } = useUserMode()

const open = useState<boolean>('ui:mode-switcher', () => false)
const logoutConfirm = ref(false)
const toast = useAppToast()

const options = computed(() =>
  availableModes.value.map(mode => ({
    ...MODE_META[mode],
    context: modeContextLabel(mode),
    active: mode === currentMode.value
  }))
)

async function choose(mode: UserMode) {
  if (!setMode(mode)) return
  open.value = false
  toast.success(`حالت «${MODE_META[mode].label}» فعال شد.`)
  await navigateTo(MODE_LANDING[mode])
}

async function onLogoutConfirmed() {
  logoutConfirm.value = false
  open.value = false
  await logout()
  toast.neutral('از حساب خارج شدید.', 'i-lucide-log-out')
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <WqSheet
    v-model:open="open"
    title="حالت حساب"
    description="با کدام قابلیت وارد وقتینو شوید؟"
  >
    <div class="flex flex-col gap-2 pb-2" role="radiogroup" aria-label="انتخاب حالت">
      <WqSelectCard
        v-for="option in options"
        :key="option.mode"
        :title="option.label"
        :description="option.context ?? option.description"
        :icon="option.icon"
        :selected="option.active"
        @select="choose(option.mode)"
      />
    </div>

    <template v-if="isAuthenticated" #footer>
      <WqButton variant="destructive" block icon="i-lucide-log-out" @click="logoutConfirm = true">
        خروج از حساب
      </WqButton>
    </template>
  </WqSheet>

  <WqConfirm
    v-model:open="logoutConfirm"
    title="خروج از حساب؟"
    description="برای استفادهٔ دوباره باید با شمارهٔ موبایل وارد شوید."
    tone="destructive"
    confirm-label="خروج"
    cancel-label="می‌مانم"
    :loading="authPending"
    @confirm="onLogoutConfirmed"
  />
</template>
