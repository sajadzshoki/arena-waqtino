<script setup lang="ts">
/**
 * هدر صفحهٔ خانهٔ مشتری — جایگزین هدر سراسری.
 * شامل: خوش‌آمدگویی شخصی، آواتار، اعلان، سوییچ تم، دسترسی به سوییچر حالت.
 */
const { user, isAuthenticated } = useAuth()
const { canSwitchMode, currentModeMeta } = useUserMode()
const switcherOpen = useState<boolean>('ui:mode-switcher', () => false)

const greeting = computed(() => {
  if (!isAuthenticated.value || !user.value) return null
  const hour = new Date().getHours()
  let timeGreeting = 'سلام'
  if (hour < 12) timeGreeting = 'صبح بخیر'
  else if (hour < 17) timeGreeting = 'ظهر بخیر'
  else if (hour < 21) timeGreeting = 'عصر بخیر'
  else timeGreeting = 'شب بخیر'
  return `${timeGreeting}، ${user.value.firstName}`
})

const displayName = computed(() =>
  user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
)
</script>

<template>
  <div>
    <!-- ردیف بالا: لوگو + تم + سوییچر -->
    <div class="flex items-center justify-between gap-2">
      <NuxtLink to="/" class="rounded-lg" aria-label="وقتینو — خانه">
        <AppLogo />
      </NuxtLink>

      <div class="flex items-center gap-1.5">
        <AppThemeToggle />

        <button
          v-if="isAuthenticated && canSwitchMode"
          type="button"
          class="pressable flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 ps-1 pe-2.5 hover:border-line-strong"
          aria-haspopup="dialog"
          :aria-expanded="switcherOpen"
          :aria-label="`تغییر حالت — حالت فعلی: ${currentModeMeta.label}`"
          @click="switcherOpen = true"
        >
          <WqAvatar
            v-if="user"
            :name="displayName"
            :src="user.avatarUrl"
            size="xs"
          />
          <span class="text-xs font-medium text-foreground">{{ currentModeMeta.label }}</span>
          <UIcon name="i-lucide-chevron-down" class="size-3.5 text-foreground-muted" />
        </button>
      </div>
    </div>

    <!-- ردیف خوش‌آمدگویی -->
    <div class="mt-5 flex items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h1 v-if="greeting" class="t-h1 truncate text-foreground-strong">
          {{ greeting }}
          <span aria-hidden="true"> 👋</span>
        </h1>
        <h1 v-else class="t-h1 text-foreground-strong">
          به وقتینو خوش آمدید
        </h1>
        <p class="t-body-sm text-foreground-secondary mt-0.5">
          امروز دنبال چه خدماتی هستید؟
        </p>
      </div>

      <!-- دکمهٔ اعلان -->
      <button
        type="button"
        class="pressable relative flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-foreground-secondary"
        aria-label="اعلان‌ها"
      >
        <UIcon name="i-lucide-bell" class="size-5" />
        <span
          class="absolute end-1 top-1 size-2 rounded-full bg-error"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
