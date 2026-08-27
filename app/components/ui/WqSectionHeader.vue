<script setup lang="ts">
/**
 * WqSectionHeader — سربرگ بخش: عنوان + اکشن اختیاری («مشاهدهٔ همه»).
 * لااقل یک فاصلهٔ استاندارد بالا/پایین دارد؛ بین بخش‌ها از mt/space-y استفاده کنید.
 */
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    actionLabel?: string
    actionTo?: string
  }>(),
  { subtitle: undefined, actionLabel: undefined, actionTo: undefined }
)

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="mb-3 flex items-end justify-between gap-3">
    <div class="min-w-0">
      <h2 class="t-h3 text-foreground-strong">{{ title }}</h2>
      <p v-if="subtitle" class="t-caption mt-0.5">{{ subtitle }}</p>
    </div>
    <slot name="action">
      <NuxtLink
        v-if="actionLabel"
        :to="actionTo"
        class="pressable flex shrink-0 items-center gap-0.5 rounded-md px-1 text-sm font-medium text-primary"
        @click="emit('action')"
      >
        {{ actionLabel }}
        <UIcon name="i-lucide-chevron-left" class="size-4" />
      </NuxtLink>
    </slot>
  </div>
  <div>
    <slot />
  </div>
</template>
