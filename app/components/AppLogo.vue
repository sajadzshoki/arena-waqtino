<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="inline-flex items-center gap-2 select-none">
    <svg
      class="size-8 shrink-0"
      viewBox="0 0 32 32"
      role="img"
      aria-label="نشان وقتینو"
    >
      <rect width="32" height="32" rx="9" fill="var(--ui-primary)" />
      <circle
        cx="16"
        cy="16.5"
        r="8.25"
        fill="none"
        stroke="#fff"
        stroke-width="2.4"
      />
      <path
        d="M16 12v4.5l3.25 2"
        fill="none"
        stroke="#fff"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span v-if="!compact" class="t-page-title text-highlighted">وقتینو</span>
  </span>
</template>
