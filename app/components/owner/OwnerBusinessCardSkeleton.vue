<script setup lang="ts">
/**
 * اسکلت کارت کسب‌وکار در فهرست «کسب‌وکارهای من» — هم‌ابعاد کارت واقعی، تا
 * فهرست هنگام رسیدن داده جابه‌جا نشود.
 */
defineProps<{ count?: number }>()
</script>

<template>
  <div class="flex flex-col gap-3" role="status" aria-live="polite">
    <span class="sr-only">در حال بارگذاری کسب‌وکارها…</span>
    <div
      v-for="n in count ?? 2"
      :key="n"
      class="flex gap-3 rounded-xl border border-line bg-surface p-3"
    >
      <USkeleton class="size-16 rounded-lg" />
      <div class="flex-1 space-y-2 pt-1">
        <USkeleton class="h-4 w-40 rounded-md" />
        <USkeleton class="h-3 w-28 rounded-md" />
        <USkeleton class="h-3 w-32 rounded-md" />
      </div>
    </div>
  </div>
</template>
