<script setup lang="ts">
/**
 * نشان وضعیت پرسنل — همیشه از نگاشت متمرکزٔ `EMPLOYEE_STATUS_META`
 * (برچسب + آیکون + رنگ). هیچ صفحه‌ای «فعال/غیرفعال» را hardcode نمی‌کند و
 * وضعیت هرگز فقط با رنگ اعلام نمی‌شود.
 */
const props = defineProps<{ status: string }>()

const meta = computed(() => employeeStatusMeta(props.status))
</script>

<template>
  <WqStatusBadge
    :label="meta.label"
    :color="meta.color"
    :icon="meta.icon"
    soft
  />
</template>
