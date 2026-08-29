<script setup lang="ts">
/**
 * دیالوگ حذف پرسنل — دو حالت، یک کامپوننت:
 *   • `confirm` : تأیید حذف قطعی (اسم نفر + اینکه حذف *از این کسب‌وکار* است +
 *     آنچه در تاریخچه می‌ماند) با tone مخرب.
 *   • `blocked` : سیاست حذف اجازه نمی‌دهد؛ همان‌جا دلیل می‌آید و دکمهٔ اصلی
 *     «غیرفعال‌کردن» است — نه یک پیام خطای بن‌بست‌ساز.
 *
 * متن‌ها از `employee.removePolicy` (لایهٔ سرویس) می‌آیند؛ این کامپوننت تصمیمی
 * نمی‌سازد، فقط همان تصمیم را نمایش می‌دهد. هرگز `window.confirm`.
 */
import type { ManagedEmployee } from '~/types/employee'

const props = withDefaults(
  defineProps<{
    employee: ManagedEmployee | null
    mode?: 'confirm' | 'blocked'
    loading?: boolean
  }>(),
  { mode: 'confirm', loading: false }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const open = defineModel<boolean>('open', { default: false })

const blocked = computed(() => props.mode === 'blocked')

const historyNote = computed(() => {
  const count = props.employee?.bookingCount ?? 0
  return count > 0
    ? `${toFaDigits(count)} نوبت در تاریخچه به این نفر اشاره می‌کند؛ آن رکوردها با نام خودش می‌مانند.`
    : 'نوبتی به این نفر متصل نیست؛ فهرست از همین حالا تمیز می‌شود.'
})

/** اگر حذفش یک سرویس را «بدون پرسنل» بگذارد، همان‌جا گفته می‌شود (نه غافلگیری). */
const orphanNote = computed(() => {
  const names = props.employee?.orphanedServiceNames ?? []
  if (names.length === 0) return ''
  const list = names.slice(0, 3).join('، ')
  const rest = names.length > 3 ? ` و ${toFaDigits(names.length - 3)} مورد دیگر` : ''
  return ` بعد از حذف، ${list}${rest} بدون پرسنل اختصاصی می‌ماند؛ رزرو آن سرویس‌ها بدون انتخاب پرسنل ادامه می‌یابد.`
})

const accountNote = computed(() =>
  props.employee?.linkedAccount.state === 'linked'
    ? ' حساب کاربری وقتینوی این نفر حذف نمی‌شود؛ فقط رابطهٔ او با این کسب‌وکار قطع می‌شود.'
    : ''
)

const dialog = computed(() =>
  blocked.value
    ? {
        title: 'این پرسنل حذف نمی‌شود',
        description:
          `«${props.employee?.displayName ?? 'این نفر'}» حذف نمی‌شود، چون نوبت پیش‌رو دارد. ` +
          (props.employee?.removePolicy.hint ? `${props.employee.removePolicy.hint} ` : '') +
          'اگر می‌خواهید فعلاً نوبت تازه‌ای به او نرسد، غیرفعالش کنید.',
        confirmLabel: 'غیرفعال‌کردن پرسنل',
        cancelLabel: 'بعداً',
        tone: 'default' as const,
        icon: 'i-lucide-shield-alert'
      }
    : {
        title: 'حذف پرسنل از این کسب‌وکار؟',
        description:
          `«${props.employee?.displayName ?? ''}» از فهرست پرسنل این کسب‌وکار حذف می‌شود و دیگر در انتخاب پرسنلِ رزرو نشان داده نمی‌شود. `
          + historyNote.value + orphanNote.value + accountNote.value,
        confirmLabel: 'حذف پرسنل',
        cancelLabel: 'نگه‌داشتن',
        tone: 'destructive' as const,
        icon: 'i-lucide-user-minus'
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
