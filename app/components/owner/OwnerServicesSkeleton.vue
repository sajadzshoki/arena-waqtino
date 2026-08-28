<script setup lang="ts">
/**
 * اسکلت فهرست سرویس‌ها — جای هر سطر شکل خودش را می‌گیرد تا رسیدن داده،
 * صفحه «بپرد» (اسپینر تمام‌صفحه نه).
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="flex flex-col gap-2" role="status" aria-live="polite">
    <span class="sr-only">در حال بارگذاری سرویس‌ها…</span>
    <div
      v-for="row in rows"
      :key="row"
      class="rounded-xl border border-line bg-surface p-3"
    >
      <div class="flex items-start gap-2">
        <USkeleton class="h-4 flex-1 rounded-md" />
        <USkeleton class="h-6 w-16 rounded-full" />
      </div>
      <div class="mt-3 flex items-center gap-3">
        <USkeleton class="h-4 w-24 rounded-md" />
        <USkeleton class="h-4 w-16 rounded-md" />
      </div>
      <USkeleton class="mt-2 h-3 w-40 rounded-md" />
    </div>
  </div>
</template>
