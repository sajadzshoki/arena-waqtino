<script setup lang="ts">
/**
 * اکشن‌های سریع فضای کاری — فقط مقصد‌هایی که در این فاز واقعاً کار می‌کنند.
 *
 * «سرویس‌ها» از فاز ۹ این‌جا هست (چرخهٔ کامل ساخت/ویرایش/وضعیت/حذف)؛ «پرسنل» و
 * «دسترس‌پذیری» هنوز در صفحهٔ مدیریت با برچسب صادقانهٔ «به‌زودی» می‌مانند، نه
 * به‌صورت دکمهٔ مرده در داشبورد.
 */
import type { EntityId } from '~/types/common'

const props = defineProps<{ businessId: EntityId }>()

interface QuickAction {
  key: string
  label: string
  icon: string
  to: string
  /** تیپ آخر ردیف کامل می‌کشد تا گرید ۲×۲ «یک خانهٔ خالی» نماند */
  wide?: boolean
}

const actions = computed<QuickAction[]>(() => [
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
    key: 'services',
    label: 'سرویس‌ها و قیمت‌ها',
    icon: 'i-lucide-tags',
    to: `/owner/business/${props.businessId}/services`
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
    to: '/owner/businesses',
    wide: true
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
      :class="action.wide && 'col-span-2'"
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
