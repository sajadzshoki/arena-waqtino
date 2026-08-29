<script setup lang="ts">
/**
 * نمای کلی کسب‌وکار در داشبورد مالک — فشرده و فقط‌خواندنی، با همان اعدادی که
 * صفحات مدیریت نشان می‌دهند.
 *
 * ردیف «سرویس‌ها» (فاز ۹)، «پرسنل» (فاز ۱۰) و «ساعات کاری» (فاز ۱۱) لینک‌اند؛
 * بقیه هنوز ویرایش‌پذیر نیستند، پس به‌جای دکمهٔ ذخیرهٔ جعلی، نکتهٔ صادقانهٔ
 * پاورقی و لینک «اطلاعات و تماس» همان صفحهٔ واقعی را نشان می‌دهد.
 *
 * این کامپوننت داده‌ای از مخزن نمی‌خواند (props خالص) — برای همین ردیف ساعات
 * کاری فقط درِ همان صفحه است، نه عددِ تازه؛ عدد در صفحهٔ ساعات کاری خوانده
 * می‌شود تا داشبورد به یک دامنهٔ دیگر وابسته نشود.
 */
import type { OwnedBusiness } from '~/types/owner'
import { formatFaDate } from '~/utils/datetime'

const props = defineProps<{ owned: OwnedBusiness }>()

const rows = computed(() => {
  const b = props.owned.business
  return {
    category: props.owned.category?.name ?? 'دستهٔ نامشخص',
    services: `${toFaDigits(props.owned.metrics.serviceCount)} سرویس قابل رزرو`,
    servicesHint: 'وضعیت، قیمت و مدت هر سرویس از همین‌جا مدیریت می‌شود',
    employees:
      props.owned.metrics.employeeCount > 0
        ? `${toFaDigits(props.owned.metrics.employeeCount)} پرسنل فعال`
        : 'هنوز پرسنلی اضافه نشده',
    employeesHint: 'وضعیت هر نفر و سرویس‌هایی که انجام می‌دهد از همین‌جا مدیریت می‌شود',
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
    <SettingsRow
      icon="i-lucide-scissors"
      title="سرویس‌ها"
      :value="rows.services"
      :subtitle="rows.servicesHint"
      :to="`/owner/business/${owned.business.id}/services`"
    />
    <SettingsRow
      icon="i-lucide-users"
      title="پرسنل"
      :value="rows.employees"
      :subtitle="rows.employeesHint"
      :to="`/owner/business/${owned.business.id}/employees`"
    />
    <SettingsRow
      icon="i-lucide-calendar-clock"
      title="ساعات کاری"
      subtitle="روزها و بازه‌های پذیرش نوبت · ساعت کاری پرسنل از همان صفحه"
      :to="`/owner/business/${owned.business.id}/availability`"
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
      ویرایش اطلاعات کسب‌وکار در فاز بعدی اضافه می‌شود؛ شمارش سرویس‌ها از
      همان فهرست مدیریتی خوانده می‌شود و با هر تغییر، همین‌جا تازه می‌شود.
    </template>
  </SettingsSection>
</template>
