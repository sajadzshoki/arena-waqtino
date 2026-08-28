<script setup lang="ts">
/**
 * بخش دربارهٔ کسب‌وکار — با expand/collapse برای متن طولانی.
 */
const props = defineProps<{
  description: string
}>()

const expanded = ref(false)
const isLong = computed(() => props.description.length > 200)
</script>

<template>
  <div>
    <div
      class="t-body-sm text-foreground-secondary"
      :class="{ 'line-clamp-4': !expanded && isLong }"
    >
      {{ description }}
    </div>
    <button
      v-if="isLong"
      type="button"
      class="pressable mt-2 t-body-sm font-medium text-primary"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'بستن' : 'مشاهدهٔ بیشتر' }}
    </button>
  </div>
</template>
