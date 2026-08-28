<script setup lang="ts">
/**
 * یک بازهٔ کاری (فاز ۱۱): «از» و «تا» + حذف.
 *
 * چرا `props`/`emit` خالص؟ چون همین ردیف هم در ویرایشگر کسب‌وکار استفاده می‌شود
 * و هم در ویرایشگر پرسنل؛ اگر یکی‌شان state یا سرویس صدا می‌زد، فردا دو رفتار
 * مختلف داشتیم. اعتبار «شروع < پایان» و هم‌پوشانی هم در `validateSchedule` است،
 * این‌جا فقط پیام نمایش داده می‌شود.
 *
 * RTL: چیدمان از راست شروع می‌شود، پس «از» همیشه *پیش از* «تا» خوانده می‌شود و
 * مقدار ساعت با `dir="ltr"` جدا از جهت متن می‌ماند (۰۹:۰۰–۱۸:۰۰ وارونه نمی‌شود).
 */
import type { AvailabilityInterval } from '~/types/availability'

defineProps<{
  interval: AvailabilityInterval
  /** متن خطای همین بازه (از `validateSchedule`) */
  error?: string
  disabled?: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  change: [part: 'start' | 'end', value: string]
  remove: []
}>()
</script>

<template>
  <li class="rounded-xl border border-line bg-surface-muted p-2.5">
    <div class="flex items-end gap-2">
      <WqTimeField
        :model-value="interval.start"
        label="از ساعت"
        :invalid="!!error"
        :disabled="disabled"
        :readonly="readonly"
        @update:model-value="emit('change', 'start', $event)"
      />
      <UIcon
        name="i-lucide-arrow-left"
        class="mb-3.5 size-4 shrink-0 text-foreground-muted dir-flip"
        aria-hidden="true"
      />
      <WqTimeField
        :model-value="interval.end"
        label="تا ساعت"
        :invalid="!!error"
        :disabled="disabled"
        :readonly="readonly"
        @update:model-value="emit('change', 'end', $event)"
      />
      <button
        v-if="!readonly"
        type="button"
        class="pressable mb-0.5 flex size-12 shrink-0 items-center justify-center rounded-xl border border-line text-foreground-muted hover:text-error"
        :disabled="disabled"
        :aria-label="`حذف این بازه`"
        @click="emit('remove')"
      >
        <UIcon name="i-lucide-trash-2" class="size-4.5" aria-hidden="true" />
      </button>
    </div>

    <p v-if="error" class="t-caption mt-2 flex items-start gap-1.5 text-error">
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
  </li>
</template>
