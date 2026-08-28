<script setup lang="ts">
/**
 * اسکلت بارگذاری کارت ویژه — همان ساختار کارت واقعی بدون داده.
 */
withDefaults(
  defineProps<{ count?: number }>(),
  { count: 3 }
)
</script>

<template>
  <div
    v-for="n in count"
    :key="n"
    class="w-72 shrink-0 overflow-hidden rounded-xl border border-line bg-surface"
    aria-hidden="true"
  >
    <USkeleton class="aspect-[3/2] w-full" />
    <div class="flex flex-col gap-2 p-3">
      <USkeleton class="h-5 w-40 rounded" />
      <USkeleton class="h-3 w-24 rounded" />
      <USkeleton class="h-3 w-32 rounded" />
      <USkeleton class="mt-1 h-3 w-28 rounded" />
    </div>
  </div>
</template>
