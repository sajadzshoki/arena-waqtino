<script setup lang="ts">
/**
 * نشان وضعیت سرویس — همیشه از نگاشت متمرکزٔ `SERVICE_STATUS_META`
 * (برچسب + آیکون + رنگ). هیچ صفحه‌ای «فعال/غیرفعال» را hardcode نمی‌کند و
 * وضعیت هرگز فقط با رنگ اعلام نمی‌شود.
 */
const props = defineProps<{ status: string }>()

const meta = computed(() => serviceStatusMeta(props.status))
</script>

<template>
  <WqStatusBadge
    :label="meta.label"
    :color="meta.color"
    :icon="meta.icon"
    soft
  />
</template>
