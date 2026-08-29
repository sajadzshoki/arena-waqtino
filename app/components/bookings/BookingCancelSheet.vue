<script setup lang="ts">
/**
 * شیت لغو نوبت — تأیید در همان زمینه (§۲۳/§۲۴).
 *
 * چرا شیت و نه `confirm()` مرورگر؟ (قاعدهٔ پروژه + §۹/§۱۰: دیالوگ native روی
 * Android استایل اپ را نمی‌گیرد و قابل‌کنترل نیست؛ بستنش هم از همان استک
 * بازگشتِ `WqSheet` انجام می‌شود.)
 * چرا دلیل لغو اختیاری است؟ چون قرارداد `reason?: string` می‌گیرد؛ سخت‌گیری
 * جلوی لغو را می‌گیرد و تجربه را خراب می‌کند.
 *
 * کامپوننت «کلهک» است: state و سرویس نمی‌شناسد؛ `pending`/`error` را از
 * `useCustomerBookings` می‌گیرد و `confirm` را بیرون می‌فرستد.
 */
import type { BookingWithDetails } from '~/types/booking'
import { BOOKING_CANCEL_REASONS, BOOKING_POLICY } from '~/config/booking-policy'

defineProps<{
  booking: BookingWithDetails | null
  pending?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  confirm: [reason: string | undefined]
}>()

const open = defineModel<boolean>('open', { default: false })
const reason = ref<string | null>(null)
const note = ref('')

const noteLimit = BOOKING_POLICY.notesMaxLength
const finalReason = computed(() => note.value.trim() || reason.value || undefined)

const policyNote = computed(() =>
  `لغو نوبت تا ${bookingPolicyWindowLabel()} پیش از شروع آن ممکن است؛ بعد از آن با کسب‌وکار هماهنگ کنید.`
)

function close(): void {
  open.value = false
}

// بستن شیت، انتخاب نیمه‌کاربردی را نگه نمی‌دارد تا بار بعد تصادفی اعمال نشود
watch(open, (value) => {
  if (!value) {
    reason.value = null
    note.value = ''
  }
})
</script>

<template>
  <WqSheet v-model:open="open" title="لغو نوبت" :description="policyNote">
    <div class="flex flex-col gap-4">
      <p v-if="booking" class="t-body-sm rounded-xl border border-line bg-surface-muted p-3 text-foreground-secondary">
        <span class="block font-semibold text-foreground">{{ booking.businessName }}</span>
        <span class="mt-0.5 block">{{ booking.serviceName }}</span>
        <span class="mt-1 block">
          <WqDateTime :value="booking.start" mode="datetime" class="t-num" />
        </span>
      </p>

      <fieldset class="flex flex-col gap-2">
        <legend class="t-label mb-1.5 text-foreground-secondary">
          دلیل لغو (اختیاری)
        </legend>
        <div class="flex flex-wrap gap-2">
          <WqChip
            v-for="option in BOOKING_CANCEL_REASONS"
            :key="option.value"
            :selected="reason === option.value"
            @toggle="reason = reason === option.value ? null : option.value"
          >
            {{ option.label }}
          </WqChip>
        </div>
      </fieldset>

      <WqTextarea
        v-model="note"
        label="توضیح برای کسب‌وکار"
        :maxlength="noteLimit"
        placeholder="اگر لازم است همان‌جا بنویسید (مثلاً برای هماهنگی مجدد)."
        :hint="`${toFaDigits(note.length)} از ${toFaDigits(noteLimit)} کاراکتر`"
      />

      <p
        v-if="error"
        role="alert"
        class="t-body-sm flex items-start gap-2 rounded-xl border border-error-border bg-error-soft p-3 text-error"
      >
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>

      <div class="flex gap-2">
        <WqButton variant="secondary" class="min-h-12 flex-1" :disabled="pending" @click="close">
          برگشت
        </WqButton>
        <WqButton
          variant="destructive"
          class="min-h-12 flex-1"
          :loading="pending"
          :disabled="pending"
          @click="emit('confirm', finalReason)"
        >
          لغو نوبت
        </WqButton>
      </div>
    </div>
  </WqSheet>
</template>
