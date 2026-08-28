<script setup lang="ts">
/**
 * اسکلت بارگذاری کارت فشرده.
 */
withDefaults(
  defineProps<{ count?: number }>(),
  { count: 3 }
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="n in count"
      :key="n"
      class="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5"
      aria-hidden="true"
    >
      <USkeleton class="size-20 shrink-0 rounded-lg" />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <USkeleton class="h-4 w-3/4 rounded" />
        <USkeleton class="h-3 w-1/2 rounded" />
        <USkeleton class="h-3 w-2/3 rounded" />
      </div>
    </div>
  </div>
</template>
