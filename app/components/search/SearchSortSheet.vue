<script setup lang="ts">
/**
 * شیت مرتب‌سازی نتایج جستجو.
 */
import type { SearchSort } from '~/types/search'
import { SORT_OPTIONS } from '~/types/search'

defineProps<{
  currentSort: SearchSort
}>()

const emit = defineEmits<{
  select: [sort: SearchSort]
}>()

const open = defineModel<boolean>('open', { default: false })

function selectSort(sort: SearchSort) {
  emit('select', sort)
  open.value = false
}
</script>

<template>
  <WqSheet
    v-model:open="open"
    title="مرتب‌سازی"
    description="نتایج را بر اساس معیار دلخواه مرتب کنید"
  >
    <div class="flex flex-col gap-2 pb-4">
      <button
        v-for="option in SORT_OPTIONS"
        :key="option.value"
        type="button"
        class="pressable flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-4 text-start transition-colors"
        :class="[
          currentSort === option.value
            ? 'border-primary-border bg-primary-soft'
            : 'hover:border-line-strong'
        ]"
        @click="selectSort(option.value)"
      >
        <UIcon
          :name="option.icon"
          class="size-5"
          :class="currentSort === option.value ? 'text-primary' : 'text-foreground-secondary'"
        />
        <span
          class="t-body-sm flex-1 font-medium"
          :class="currentSort === option.value ? 'text-primary' : 'text-foreground'"
        >
          {{ option.label }}
        </span>
        <UIcon
          v-if="currentSort === option.value"
          name="i-lucide-check"
          class="size-5 text-primary"
        />
      </button>
    </div>
  </WqSheet>
</template>
