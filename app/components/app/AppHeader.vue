<script setup lang="ts">
const { user, isAuthenticated } = useAuth()
const { canSwitchMode, currentModeMeta, currentMode } = useUserMode()

// لوگو کاربر را به خانهٔ «همین حالت» می‌برد، نه به حالت مشتری — در فضای کاری
// مدیر، بازگشت به / یعنی افتادن ناخواسته به UI مشتری.
const homeTo = computed(() => MODE_LANDING[currentMode.value])
const switcherOpen = useState<boolean>('ui:mode-switcher', () => false)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-background pt-safe">
    <div
      class="mx-auto flex h-(--wq-header-h) max-w-(--wq-content-max) items-center justify-between gap-3 px-4"
    >
      <NuxtLink
        :to="homeTo"
        class="rounded-lg"
        :aria-label="`وقتینو — بازگشت به ${currentModeMeta.label}`"
      >
        <AppLogo />
      </NuxtLink>

      <div class="flex items-center gap-1">
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
            :name="`${user.firstName} ${user.lastName}`"
            size="sm"
          />
          <span class="text-xs font-medium text-foreground">{{ currentModeMeta.label }}</span>
          <UIcon name="i-lucide-chevron-down" class="size-4 text-foreground-muted" />
        </button>
      </div>
    </div>
  </header>
</template>
