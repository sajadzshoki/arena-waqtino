<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
  }>(),
  { icon: 'i-lucide-package-open', description: undefined }
)

defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
    <span class="flex size-16 items-center justify-center rounded-2xl bg-surface-muted">
      <UIcon :name="icon" class="size-7 text-foreground-muted" />
    </span>
    <h3 class="t-h3 text-foreground">{{ title }}</h3>
    <p v-if="description" class="t-body-sm text-foreground-secondary max-w-72">{{ description }}</p>
    <slot />
  </div>
</template>
