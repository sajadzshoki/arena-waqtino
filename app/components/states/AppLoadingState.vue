<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    /** اگر بزرگ‌تر از صفر باشد، به‌جای اسپینر اسکلت خط‌خطی نمایش می‌دهد */
    rows?: number
  }>(),
  { label: 'در حال بارگذاری…', rows: 0 }
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 px-6 py-10"
    role="status"
    aria-live="polite"
  >
    <template v-if="rows > 0">
      <div class="flex w-full flex-col gap-3">
        <USkeleton
          v-for="n in rows"
          :key="n"
          class="h-4 rounded-lg"
          :class="n % 2 ? 'w-full' : 'w-2/3'"
        />
      </div>
      <span class="t-caption">{{ label }}</span>
    </template>
    <template v-else>
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
      <span class="t-body-sm text-foreground-secondary">{{ label }}</span>
    </template>
  </div>
</template>
