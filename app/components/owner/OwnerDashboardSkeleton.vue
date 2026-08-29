<script setup lang="ts">
/**
 * اسکلت داشبورد مالک — به‌جای اسپینر تمام‌صفحه، جای‌هر‌موضوع شکلش را می‌گیرد.
 * ترتیب بلوک‌ها عمداً با ترتیب واقعی داشبورد یکی است تا جابه‌جایی هنگام
 * رسیدن داده حس «پریدن صفحه» ندهد.
 */
</script>

<template>
  <div class="flex flex-col gap-4" role="status" aria-live="polite">
    <span class="sr-only">در حال بارگذاری فضای کاری…</span>

    <div class="rounded-xl border border-line bg-surface p-4">
      <div class="flex items-start gap-3">
        <USkeleton class="size-12 rounded-lg" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-3 w-28 rounded-md" />
          <USkeleton class="h-5 w-44 rounded-md" />
          <USkeleton class="h-3 w-36 rounded-md" />
        </div>
        <USkeleton class="h-9 w-20 rounded-full" />
      </div>
    </div>

    <div class="rounded-xl border border-line bg-primary-soft p-4">
      <USkeleton class="h-3 w-20 rounded-md" />
      <USkeleton class="mt-3 h-5 w-40 rounded-md" />
      <USkeleton class="mt-2 h-4 w-52 rounded-md" />
    </div>

    <div class="grid grid-cols-3 gap-2">
      <USkeleton v-for="n in 3" :key="n" class="h-20 rounded-xl" />
    </div>

    <div class="space-y-2">
      <USkeleton v-for="n in 3" :key="n" class="h-[4.5rem] rounded-xl" />
    </div>
  </div>
</template>
