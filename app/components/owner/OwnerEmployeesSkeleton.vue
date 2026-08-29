<script setup lang="ts">
/**
 * اسکلت فهرست پرسنل — جای هر سطر شکل خودش را می‌گیرد (آواتار + دو خط متن) تا
 * رسیدن داده، صفحه «بپرد»؛ اسپینر تمام‌صفحه نه.
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="flex flex-col gap-2" role="status" aria-live="polite">
    <span class="sr-only">در حال بارگذاری پرسنل…</span>
    <div
      v-for="row in rows"
      :key="row"
      class="flex items-start gap-3 rounded-xl border border-line bg-surface p-3"
    >
      <USkeleton class="size-10 shrink-0 rounded-full" />
      <div class="min-w-0 flex-1">
        <div class="flex items-start gap-2">
          <USkeleton class="h-4 w-32 rounded-md" />
          <USkeleton class="ms-auto h-6 w-16 rounded-full" />
        </div>
        <USkeleton class="mt-2 h-3 w-48 rounded-md" />
        <USkeleton class="mt-2 h-3 w-24 rounded-md" />
      </div>
    </div>
  </div>
</template>
