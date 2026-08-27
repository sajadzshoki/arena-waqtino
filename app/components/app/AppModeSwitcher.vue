<script setup lang="ts">
/**
 * سوییچر حالت — به‌صورت شیت پایین موبایل (WqSheet).
 * فقط حالت‌هایی نمایش داده می‌شوند که کاربر واقعاً به آن‌ها دسترسی دارد.
 */
const { isAuthenticated, user, logout } = useAuth()
const { currentMode, availableModes, setMode, modeContextLabel } = useUserMode()

const open = useState<boolean>('ui:mode-switcher', () => false)
const toast = useAppToast()

const options = computed(() =>
  availableModes.value.map(mode => ({
    ...MODE_META[mode],
    context: modeContextLabel(mode),
    active: mode === currentMode.value
  }))
)

function choose(mode: UserMode) {
  if (setMode(mode)) {
    open.value = false
    toast.success(`حالت «${MODE_META[mode].label}» فعال شد.`)
  }
}

async function onLogout() {
  await logout()
  open.value = false
  toast.neutral('از حساب خارج شدید.', 'i-lucide-log-out')
}
</script>

<template>
  <WqSheet
    v-model:open="open"
    :title="`حالت حساب${user ? ` — ${user.firstName} ${user.lastName}` : ''}`"
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
      <WqButton variant="destructive" block icon="i-lucide-log-out" @click="onLogout">
        خروج از حساب
      </WqButton>
    </template>
  </WqSheet>
</template>
