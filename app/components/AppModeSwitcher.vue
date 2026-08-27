<script setup lang="ts">
/**
 * سوییچر حالت — به شیت پایین موبایل (Drawer).
 * فقط حالت‌هایی نمایش داده می‌شوند که کاربر واقعاً به آن‌ها دسترسی دارد.
 */
const { isAuthenticated, user, logout } = useAuth()
const {
  currentMode,
  availableModes,
  setMode,
  modeContextLabel
} = useUserMode()

const open = useState<boolean>('ui:mode-switcher', () => false)
const toast = useToast()

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
    toast.add({
      title: `حالت «${MODE_META[mode].label}» فعال شد.`,
      icon: MODE_META[mode].icon,
      color: 'primary',
      duration: 2000
    })
  }
}

async function onLogout() {
  await logout()
  open.value = false
  toast.add({ title: 'از حساب خارج شدید.', icon: 'i-lucide-log-out', color: 'neutral' })
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="`حالت حساب ${user ? `— ${user.firstName} ${user.lastName}` : ''}`"
    description="انتخاب کنید با کدام قابلیت وارد وقتینو شوید"
    :ui="{ body: 'pt-2' }"
  >
    <template #body>
      <div class="flex flex-col gap-2 pb-2" role="radiogroup" aria-label="انتخاب حالت">
        <button
          v-for="option in options"
          :key="option.mode"
          type="button"
          role="radio"
          :aria-checked="option.active"
          class="flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors"
          :class="
            option.active
              ? 'border-primary/50 bg-primary/5'
              : 'border-default bg-default hover:border-accented'
          "
          @click="choose(option.mode)"
        >
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-lg"
            :class="option.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted'"
          >
            <UIcon :name="option.icon" class="size-5.5" />
          </span>

          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">{{ option.label }}</span>
            <span class="t-caption block truncate">
              {{ option.context ?? option.description }}
            </span>
          </span>

          <UIcon
            v-if="option.active"
            name="i-lucide-circle-check"
            class="size-5 shrink-0 text-primary"
          />
          <UIcon
            v-else
            name="i-lucide-chevron-left"
            class="size-5 shrink-0 text-dimmed"
          />
        </button>
      </div>
    </template>

    <template #footer>
      <UButton
        v-if="isAuthenticated"
        color="error"
        variant="soft"
        block
        icon="i-lucide-log-out"
        @click="onLogout"
      >
        خروج از حساب
      </UButton>
    </template>
  </UDrawer>
</template>
