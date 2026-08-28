<script setup lang="ts">
/**
 * WqStatusBadge — نشان وضعیت.
 * دو روش: ۱) با «status» رزرو (از نگاشت مرکزی BOOKING_STATUS_META)
 *          ۲) دستی با label/color/icon برای سایر وضعیت‌ها.
 */
const props = withDefaults(
  defineProps<{
    status?: BookingStatus
    label?: string
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
    icon?: string
    soft?: boolean
  }>(),
  {
    status: undefined,
    label: undefined,
    color: 'neutral',
    icon: undefined,
    soft: true
  }
)

const resolved = computed(() => {
  if (props.status) {
    const meta = BOOKING_STATUS_META[props.status]
    return { label: meta.label, color: meta.color, icon: meta.icon }
  }
  return {
    label: props.label ?? '',
    color: props.color,
    icon: props.icon
  }
})
</script>

<template>
  <UBadge
    :color="resolved.color"
    :variant="soft ? 'soft' : 'solid'"
    :icon="resolved.icon || undefined"
    size="md"
  >
    {{ resolved.label }}
  </UBadge>
</template>
