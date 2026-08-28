<script setup lang="ts">
/**
 * WqListRow — ردیف لیست استاندارد (تنظیمات، منوها، اکشن‌ها).
 * الگوی ثابت: [آیکون] [عنوان/زیرعنوان] [chevron] — برای رفتار لینک/رویداد.
 */
const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon?: string
    to?: string
    destructive?: boolean
    chevron?: boolean
  }>(),
  {
    subtitle: undefined,
    icon: undefined,
    to: undefined,
    destructive: false,
    chevron: true
  }
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const tag = computed(() => (props.to ? resolveComponent('NuxtLink') : 'button'))
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="to ? undefined : 'button'"
    class="pressable flex w-full items-center gap-3 px-1 py-3 text-start"
    @click="!to && emit('click', $event)"
  >
    <span
      v-if="icon"
      class="flex size-10 shrink-0 items-center justify-center rounded-xl"
      :class="destructive ? 'bg-error-soft text-error' : 'bg-surface-muted text-foreground-secondary'"
    >
      <UIcon :name="icon" class="size-5" />
    </span>

    <span class="min-w-0 flex-1">
      <span
        class="block truncate text-sm leading-6 font-medium"
        :class="destructive ? 'text-error' : 'text-foreground'"
      >
        {{ title }}
      </span>
      <span v-if="subtitle" class="t-caption block truncate">{{ subtitle }}</span>
    </span>

    <slot name="trailing">
      <UIcon
        v-if="chevron"
        name="i-lucide-chevron-left"
        class="size-4.5 shrink-0 text-foreground-muted"
      />
    </slot>
  </component>
</template>
