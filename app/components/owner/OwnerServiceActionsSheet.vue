<script setup lang="ts">
/**
 * شیت اکشن‌های سرویس (الگوی موبایل‌محور). اکشن‌ها در یک منوی شناور روی سطر
 * پنهان نمی‌مانند: هر ردیف *پیامدش* را زیر عنوان دارد، و «حذف» — تنها اکشن
 * برگشت‌ناپذیر — با جداکننده و رنگ هشدار از بقیه جداست.
 *
 * اگر سیاست حذف اجازهٔ حذف ندهد، ردیف حذف همچنان می‌ماند و همان‌جا توضیح
 * می‌دهد (کاربر به بن‌بست نمی‌رسد؛ دیالوگ همان‌جا «غیرفعال‌کردن» پیشنهاد
 * می‌دهد). تصمیم از `service.deletePolicy` می‌آید، نه از شرطِ این کامپوننت.
 */
import type { ManagedService } from '~/types/service'

const props = defineProps<{
  service: ManagedService | null
  /** در حال تغییر وضعیت؟ (ردیف سوییچ loading می‌شود تا دوباره‌کلیک نشود) */
  toggling?: boolean
}>()

const emit = defineEmits<{
  toggle: [service: ManagedService]
  delete: [service: ManagedService]
}>()

const open = defineModel<boolean>('open', { default: false })

const meta = computed(() => (props.service ? serviceStatusMeta(props.service.status) : null))
const base = computed(() =>
  props.service ? `/owner/business/${props.service.businessId}/services/${props.service.id}` : ''
)

const deleteSubtitle = computed(() => {
  const service = props.service
  if (!service) return undefined
  return service.deletePolicy.canDelete
    ? 'از فهرست سرویس‌ها برای همیشه حذف می‌شود'
    : (service.deletePolicy.hint ?? 'فعلاً قابل حذف نیست')
})
</script>

<template>
  <WqSheet
    v-model:open="open"
    title="اکشن‌های سرویس"
    :description="service?.name"
  >
    <div v-if="service && meta" class="flex flex-col pb-1">
      <WqListRow
        icon="i-lucide-eye"
        title="مشاهده جزئیات"
        subtitle="وضعیت، توضیح و نوبت‌های این سرویس"
        :to="base"
      />
      <USeparator />
      <WqListRow
        icon="i-lucide-pen-line"
        title="ویرایش سرویس"
        subtitle="نام، توضیح، مدت و قیمت"
        :to="`${base}/edit`"
      />
      <template v-if="meta.toggle">
        <USeparator />
        <WqListRow
          :icon="meta.toggle.to === 'inactive' ? 'i-lucide-eye-off' : 'i-lucide-circle-check'"
          :title="meta.toggle.label"
          :subtitle="meta.toggle.consequence"
          :chevron="false"
          :disabled="toggling"
          @click="emit('toggle', service)"
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
        icon="i-lucide-trash-2"
        title="حذف سرویس"
        :subtitle="deleteSubtitle"
        destructive
        :chevron="false"
        @click="emit('delete', service)"
      />
    </div>
  </WqSheet>
</template>
