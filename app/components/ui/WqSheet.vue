<script setup lang="ts">
/**
 * WqSheet — الگوی استاندارد «شیت پایین» (mobile-first overlay).
 * برای فیلترها، انتخاب‌ها، سوییچر حالت، اکشن‌شیت‌ها. مدال مرکزی فقط برای
 * تأییدیه‌های کوتاه است (WqConfirm)؛ بقیهٔ تعامل‌ها شیت هستند.
 */
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  { title: undefined, description: undefined }
)

const open = defineModel<boolean>('open', { default: false })

// دکمهٔ بازگشت Android/webview: وقتی شیت باز است، «بازگشت» یعنی «بستن همین شیت»
// (§۱۰). استراتژی در `services/native/system-back` است؛ صفحه‌ها چیزی نمی‌دانند.
useSystemBackHandler(open)
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ body: 'px-4 pb-2 pt-1', footer: 'p-4 pt-2' }"
  >
    <template #body>
      <slot />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UDrawer>
</template>
