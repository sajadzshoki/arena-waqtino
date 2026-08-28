<script setup lang="ts">
/**
 * دیالوگ حذف سرویس — دو حالت، یک کامپوننت:
 *   • `confirm` : تأیید حذف قطعی (اسم سرویس + برگشت‌ناپذیری + آنچه در تاریخچه
 *     می‌ماند) با tone مخرب.
 *   • `blocked` : سیاست حذف اجازه نمی‌دهد؛ همان‌جا دلیل می‌آید و دکمهٔ اصلی
 *     «غیرفعال‌کردن» است — نه یک پیام خطای بن‌بست‌ساز.
 *
 * متن‌ها از `service.deletePolicy` (لایهٔ سرویس) می‌آیند؛ این کامپوننت
 * تصمیمی نمی‌سازد، فقط همان تصمیم را نمایش می‌دهد. هرگز `window.confirm`.
 */
import type { ManagedService } from '~/types/service'

const props = withDefaults(
  defineProps<{
    service: ManagedService | null
    mode?: 'confirm' | 'blocked'
    loading?: boolean
  }>(),
  { mode: 'confirm', loading: false }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const open = defineModel<boolean>('open', { default: false })

const blocked = computed(() => props.mode === 'blocked')
const historyNote = computed(() => {
  const count = props.service?.bookingCount ?? 0
  return count > 0
    ? `${toFaDigits(count)} رزرو در تاریخچه به این سرویس اشاره می‌کند و با نام و مدت خودش می‌ماند.`
    : 'رزروی به این سرویس متصل نیست؛ فهرست از همین حالا تمیز می‌شود.'
})

const dialog = computed(() =>
  blocked.value
    ? {
        title: 'این سرویس حذف نمی‌شود',
        description:
          `${props.service?.name ?? 'این سرویس'} حذف نمی‌شود، چون نوبت پیش‌رو دارد. ` +
          (props.service?.deletePolicy.hint ? `${props.service.deletePolicy.hint} ` : '') +
          'اگر می‌خواهید فعلاً کسی نوبت تازه نگیرد، غیرفعالش کنید.',
        confirmLabel: 'غیرفعال‌کردن سرویس',
        cancelLabel: 'بعداً',
        tone: 'default' as const,
        icon: 'i-lucide-shield-alert'
      }
    : {
        title: 'حذف سرویس؟',
        description:
          `«${props.service?.name ?? ''}» برای همیشه از فهرست سرویس‌های این کسب‌وکار حذف می‌شود و در رزرو تازه به مشتری نشان داده نمی‌شود. ` +
          historyNote.value,
        confirmLabel: 'حذف سرویس',
        cancelLabel: 'نگه‌داشتن',
        tone: 'destructive' as const,
        icon: 'i-lucide-trash-2'
      }
)
</script>

<template>
  <WqConfirm
    v-model:open="open"
    :title="dialog.title"
    :description="dialog.description"
    :confirm-label="dialog.confirmLabel"
    :cancel-label="dialog.cancelLabel"
    :tone="dialog.tone"
    :icon="dialog.icon"
    :loading="loading"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>
