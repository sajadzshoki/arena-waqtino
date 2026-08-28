<script setup lang="ts">
/**
 * اکشن‌های سریع فضای کاری — فقط مقصد‌هایی که در این فاز واقعاً کار می‌کنند.
 *
 * عمداً هیچ دکمهٔ «سرویس‌ها/پرسنل/دسترس‌پذیری» اینجا نیست؛ آن‌ها در همان صفحهٔ
 * مدیریت با برچسب صادقانهٔ «به‌زودی» دیده می‌شوند، نه به‌صورت دکمهٔ مرده در
 * داشبورد.
 */
import type { EntityId } from '~/types/common'

const props = defineProps<{ businessId: EntityId }>()

const actions = computed(() => [
  {
    key: 'manage',
    label: 'مدیریت کسب‌وکار',
    icon: 'i-lucide-settings-2',
    to: `/owner/business/${props.businessId}/manage`
  },
  {
    key: 'info',
    label: 'اطلاعات و تماس',
    icon: 'i-lucide-building-2',
    to: `/owner/business/${props.businessId}/info`
  },
  {
    key: 'customer-view',
    label: 'دید مشتری',
    icon: 'i-lucide-eye',
    to: `/business/${props.businessId}`
  },
  {
    key: 'businesses',
    label: 'کسب‌وکارهای من',
    icon: 'i-lucide-store',
    to: '/owner/businesses'
  }
])
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <NuxtLink
      v-for="action in actions"
      :key="action.key"
      :to="action.to"
      class="pressable flex min-h-16 items-center gap-2.5 rounded-xl border border-line bg-surface px-3"
    >
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-primary"
        aria-hidden="true"
      >
        <UIcon :name="action.icon" class="size-5" />
      </span>
      <span class="t-label min-w-0 flex-1 truncate text-foreground">{{ action.label }}</span>
      <UIcon name="i-lucide-chevron-left" class="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
