<script setup lang="ts">
/**
 * AppThemeToggle — میانبر هدر برای همان مدیر تم مرکزی (`useThemePreference`).
 * چرخش: سیستم → روشن → تیره. ترجیح در localStorage با کلید `wq-color-mode`
 * می‌ماند و پیش از paint اعمال می‌شود (فلاش تم اشتباه نداریم).
 * وضعیت فقط با رنگ منتقل نمی‌شود: آیکون عوض می‌شود و `aria-label` نام حالت را می‌گوید.
 */
const { currentOption, cycle } = useThemePreference()
</script>

<template>
  <WqIconButton
    :icon="currentOption.icon"
    :label="`حالت نمایش: ${currentOption.label} — برای تغییر لمس کنید`"
    variant="ghost"
    size="lg"
    @click="cycle"
  />
</template>
