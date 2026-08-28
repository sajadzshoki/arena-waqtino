<script setup lang="ts">
/**
 * SettingsInfoRow — ردیف «فقط‌خواندنی» کنار ردیف‌های قابل‌کلیک.
 *
 * چرا لازم است؟ اطلاعات حساب (شمارهٔ موبایل، تاریخ عضویت، وضعیت ورود) باید
 * در همان ظرف تنظیمات دیده شود، اما نباید وانمود کند دکمه/لینک است:
 * اینجا نه `href` هست نه `role=button` — دقیقاً برعکس `SettingsRow`.
 */
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon?: string
    value?: string
    /** نمایش قفل — یعنی «فعلاً قابل ویرایش نیست» */
    locked?: boolean
    /** محتوای چپ‌چین (شمارهٔ تلفن و ارقام) */
    ltr?: boolean
  }>(),
  { subtitle: undefined, icon: undefined, value: undefined, locked: false, ltr: false }
)
</script>

<template>
  <div class="flex min-h-14 items-center gap-3 py-3">
    <span
      v-if="icon"
      class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-foreground-secondary"
    >
      <UIcon :name="icon" class="size-5" aria-hidden="true" />
    </span>

    <span class="min-w-0 flex-1">
      <span class="t-label block truncate text-foreground">{{ title }}</span>
      <span v-if="subtitle" class="t-caption block">{{ subtitle }}</span>
    </span>

    <span class="flex shrink-0 items-center gap-1.5">
      <span
        v-if="value"
        class="t-body-sm t-num text-foreground-secondary"
        :dir="ltr ? 'ltr' : undefined"
      >{{ value }}</span>
      <slot name="trailing" />
      <UIcon
        v-if="locked"
        name="i-lucide-lock"
        class="size-3.5 text-foreground-muted"
        role="img"
        aria-label="غیرقابل ویرایش"
      />
    </span>
  </div>
</template>
