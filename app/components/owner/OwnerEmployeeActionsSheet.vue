<script setup lang="ts">
/**
 * شیت اکشن‌های پرسنل (الگوی موبایل‌محور). اکشن‌ها در یک منوی شناور روی سطر پنهان
 * نمی‌مانند: هر ردیف *پیامدش* را زیر عنوان دارد، و «حذف» — تنها اکشن
 * برگشت‌ناپذیر — با جداکننده و رنگ هشدار از بقیه جداست.
 *
 * اگر سیاست حذف اجازهٔ حذف ندهد، ردیف حذف همچنان می‌ماند و همان‌جا توضیح
 * می‌دهد (کاربر به بن‌بست نمی‌رسد؛ دیالوگ همان‌جا «غیرفعال‌کردن» پیشنهاد می‌دهد).
 * تصمیم از `employee.removePolicy` می‌آید، نه از شرطِ این کامپوننت.
 */
import type { ManagedEmployee } from '~/types/employee'

const props = defineProps<{
  employee: ManagedEmployee | null
  /** در حال تغییر وضعیت؟ (ردیف سوییچ loading می‌شود تا دوباره‌کلیک نشود) */
  toggling?: boolean
}>()

const emit = defineEmits<{
  toggle: [employee: ManagedEmployee]
  assign: [employee: ManagedEmployee]
  remove: [employee: ManagedEmployee]
}>()

const open = defineModel<boolean>('open', { default: false })

const meta = computed(() => (props.employee ? employeeStatusMeta(props.employee.status) : null))
const base = computed(() =>
  props.employee ? `/owner/business/${props.employee.businessId}/employees/${props.employee.id}` : ''
)

const removeSubtitle = computed(() => {
  const employee = props.employee
  if (!employee) return undefined
  return employee.removePolicy.canRemove
    ? 'از فهرست پرسنل این کسب‌وکار حذف می‌شود'
    : (employee.removePolicy.hint ?? 'فعلاً قابل حذف نیست')
})

const assignSubtitle = computed(() => {
  const employee = props.employee
  if (!employee) return undefined
  return employee.serviceIds.length > 0
    ? `${toFaDigits(employee.activeServiceCount)} سرویس فعال به او اختصاص یافته`
    : 'هنوز سرویسی به او اختصاص نیافته'
})
</script>

<template>
  <WqSheet
    v-model:open="open"
    title="اکشن‌های پرسنل"
    :description="employee?.displayName"
  >
    <div v-if="employee && meta" class="flex flex-col pb-1">
      <WqListRow
        icon="i-lucide-eye"
        title="مشاهده جزئیات"
        subtitle="وضعیت، تماس و سرویس‌های این نفر"
        :to="base"
      />
      <USeparator />
      <WqListRow
        icon="i-lucide-pen-line"
        title="ویرایش پرسنل"
        subtitle="نام، عنوان شغلی، تماس و وضعیت"
        :to="`${base}/edit`"
      />
      <USeparator />
      <WqListRow
        icon="i-lucide-tags"
        title="اختصاص سرویس‌ها"
        :subtitle="assignSubtitle"
        :chevron="false"
        @click="emit('assign', employee)"
      />
      <template v-if="meta.toggle">
        <USeparator />
        <WqListRow
          :icon="meta.toggle.to === 'inactive' ? 'i-lucide-eye-off' : 'i-lucide-circle-check'"
          :title="meta.toggle.label"
          :subtitle="meta.toggle.consequence"
          :chevron="false"
          :disabled="toggling"
          @click="emit('toggle', employee)"
        >
          <template #trailing>
            <UIcon
              v-if="toggling"
              name="i-lucide-loader-circle"
              class="size-4.5 shrink-0 animate-spin text-foreground-muted"
            />
          </template>
        </WqListRow>
      </template>
      <USeparator />
      <WqListRow
        icon="i-lucide-user-minus"
        title="حذف از این کسب‌وکار"
        :subtitle="removeSubtitle"
        destructive
        :chevron="false"
        @click="emit('remove', employee)"
      />
    </div>
  </WqSheet>
</template>
