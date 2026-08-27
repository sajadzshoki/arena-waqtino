<script setup lang="ts">
/**
 * AppPlaceholderPage — جای‌نگهدار موقت مسیرهای فازهای بعدی.
 * عمداً از حالت خالی محصولی متفاوت است (خط‌چین + برچسب ماژول) تا در تست
 * ناوبری قابل تشخیص باشد؛ جایگزین آن در فاز مربوط ساده است.
 */
withDefaults(
  defineProps<{
    title: string
    module: string
    icon?: string
  }>(),
  { icon: 'i-lucide-construction' }
)
</script>

<template>
  <div>
    <AppPageHeader :title="title" />

    <div
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface-muted px-6 py-12 text-center"
    >
      <span class="flex size-14 items-center justify-center rounded-2xl bg-surface">
        <UIcon :name="icon" class="size-6 text-foreground-muted" />
      </span>
      <h2 class="t-h3 text-foreground-secondary">ماژول «{{ module }}»</h2>
      <p class="t-body-sm text-foreground-muted max-w-72">
        این بخش در فازهای بعدی ساخته می‌شود؛ مسیر، ناوبری و دسترسی آن از همین حالا کار می‌کند.
      </p>
      <UBadge color="neutral" variant="soft" size="sm">placeholder</UBadge>
    </div>
  </div>
</template>
