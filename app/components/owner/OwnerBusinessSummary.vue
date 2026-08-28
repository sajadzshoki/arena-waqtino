<script setup lang="ts">
/**
 * نمای کلی کسب‌وکار در داشبورد مالک — همان دادهٔ پروفایل، فشرده و فقط‌خواندنی.
 *
 * ویرایش در این فاز ساخته نمی‌شود؛ به‌جای دکمهٔ ذخیرهٔ جعلی، یک نکتهٔ صادقانه
 * در پاورقی هست و لینک «اطلاعات و تماس» که صفحهٔ واقعی را نشان می‌دهد.
 */
import type { OwnedBusiness } from '~/types/owner'
import { formatFaDate } from '~/utils/datetime'

const props = defineProps<{ owned: OwnedBusiness }>()

const rows = computed(() => {
  const b = props.owned.business
  return {
    category: props.owned.category?.name ?? 'دستهٔ نامشخص',
    services: `${toFaDigits(props.owned.metrics.serviceCount)} سرویس ثبت‌شده`,
    employees:
      props.owned.metrics.employeeCount > 0
        ? `${toFaDigits(props.owned.metrics.employeeCount)} پرسنل فعال`
        : 'هنوز پرسنلی اضافه نشده',
    address: `${b.address.district}، ${b.address.city}`,
    since: formatFaDate(b.createdAt),
    statusHint: businessStatusMeta(b.status).hint
  }
})
</script>

<template>
  <SettingsSection title="نمای کلی کسب‌وکار">
    <SettingsInfoRow
      icon="i-lucide-tags"
      title="دستهٔ فعالیت"
      :value="rows.category"
    />
    <SettingsInfoRow
      icon="i-lucide-scissors"
      title="سرویس‌ها"
      :value="rows.services"
    />
    <SettingsInfoRow
      icon="i-lucide-users"
      title="پرسنل"
      :value="rows.employees"
    />
    <SettingsInfoRow
      icon="i-lucide-map-pin"
      title="منطقه"
      :value="rows.address"
    />
    <SettingsInfoRow
      icon="i-lucide-calendar-plus"
      title="عضویت در وقتینو"
      :value="rows.since"
    />
    <SettingsInfoRow
      icon="i-lucide-info"
      title="وضعیت"
      :subtitle="rows.statusHint"
    />

    <template #footer>
      ویرایش اطلاعات کسب‌وکار در فاز بعدی اضافه می‌شود؛ فعلاً همین صفحه فقط‌خواندنی است.
    </template>
  </SettingsSection>
</template>
