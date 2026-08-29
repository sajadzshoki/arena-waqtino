<script setup lang="ts">
/**
 * نشان وضعیت کسب‌وکار — همیشه از نگاشت متمرکزِ `BUSINESS_STATUS_META`.
 *
 * هیچ کامپوننتی برچسب/آیکون/رنگ وضعیت را در خودش نمی‌نویسد تا افزودن یا
 * تغییر وضعیت در بک‌اند (AdonisJS) فقط همان نگاشت را جابه‌جا کند. وضعیت هرگز
 * فقط با رنگ منتقل نمی‌شود: متن + آیکون همیشه همراه‌اند.
 */
const props = defineProps<{ status: string }>()

const meta = computed(() => businessStatusMeta(props.status))
</script>

<template>
  <WqStatusBadge
    :label="meta.label"
    :color="meta.color"
    :icon="meta.icon"
    soft
  />
</template>
