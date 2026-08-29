<script setup lang="ts">
/**
 * بنر نازک «اتصال قطع است» — بالای محتوا، بدون بلوکه‌کردن صفحه (§۲۷).
 *
 * چرا بنر و نه دیالوگ؟ قطعِ شبکه مانع *دیدن* دادهٔ موجود نیست، فقط مانع
 * تازه‌سازی است؛ پس نباید کاربر را در یک مودال گیر بدهد. برای همین هم این
 * کامپوننت کلهک است: هیچ خواندنی ندارد، فقط پیام و یک اکشن اختیاری.
 */
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="mb-4 flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-soft px-3 py-2.5"
  >
    <UIcon name="i-lucide-wifi-off" class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
    <p class="t-body-sm min-w-0 flex-1 text-foreground-secondary">
      اتصال اینترنت قطع است. آنچه می‌بینید ممکن است کهنه باشد؛ برای تازه‌سازی
      اتصال را بررسی کنید.
    </p>
    <button
      type="button"
      class="pressable shrink-0 rounded-lg px-1 py-0.5 t-body-sm font-medium text-primary"
      @click="emit('retry')"
    >
      تلاش مجدد
    </button>
  </div>
</template>
