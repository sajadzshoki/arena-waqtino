<script setup lang="ts">
/**
 * WqTimeField — نمایش و انتخاب ساعت `HH:mm` روی موبایل.
 *
 * چرا `input[type=time]` خام نه؟ دو دلیل عملی: در RTL بعضی موتورهای موبایل
 * جای «ساعت» و «دقیقه» را جابه‌جا می‌کنند (یعنی همان «معکوس‌شدن معنای شروع/پایان»
 * که در فاز ۱۱ ممنوع است)، و صفحه‌کلید عددی روی کیبورد موبایل جا می‌گیرد. یک
 * شیت با تراشه‌های ۴۸px هم مطمئن‌تر است هم بدون کیبورد.
 *
 * قانون دامنه: مقدار همیشه `HH:mm` دوازده‌وعشیرهٔ بی‌قلم است («14:30») و قالب
 * فارسی فقط نمایشی است؛ ورودی تایپی هم با `normalizeTime` نرمال می‌شود، پس
 * «۹:۳۰» همان `09:30` است — نه یک ساعت مبهم.
 */
import { MINUTE_STEP } from '~/config/availability'
import { formatTimeFa, minutesToTime, timeToMinutes } from '~/utils/schedule-time'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    hint?: string
    error?: string
    /** فقط ظاهر هشدار (پیام را جای دیگری نشان می‌دهیم) */
    invalid?: boolean
    disabled?: boolean
    readonly?: boolean
  }>(),
  { hint: undefined, error: undefined, invalid: false, disabled: false, readonly: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const draft = ref<{ hour: number, minute: number }>({ hour: 9, minute: 0 })

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = computed(() => {
  const step = MINUTE_STEP > 0 ? MINUTE_STEP : 15
  const set = new Set<number>()
  for (let m = 0; m < 60; m += step) set.add(m)
  // مقدار فعلی باید همیشه قابل انتخاب بماند، حتی روی شبکهٔ گام نیست
  const current = timeToMinutes(props.modelValue)
  if (current !== null) set.add(current % 60)
  return [...set].sort((a, b) => a - b)
})

const display = computed(() => formatTimeFa(props.modelValue) || '—')
const draftText = computed(() => formatTimeFa(minutesToTime(draft.value.hour * 60 + draft.value.minute)))

function toggle(): void {
  if (props.disabled || props.readonly) return
  const current = timeToMinutes(props.modelValue)
  draft.value = current === null
    ? { hour: 9, minute: 0 }
    : { hour: Math.floor(current / 60), minute: current % 60 }
  open.value = true
}

function apply(): void {
  const value = minutesToTime(draft.value.hour * 60 + draft.value.minute)
  if (value !== props.modelValue) emit('update:modelValue', value)
  open.value = false
}
</script>

<template>
  <div class="min-w-0 flex-1">
    <span class="t-label mb-1 block text-foreground-muted">{{ label }}</span>
    <button
      type="button"
      class="pressable flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-3 text-start"
      :class="error || invalid ? 'border-error-border bg-error-soft' : 'border-line bg-surface'"
      :disabled="disabled || readonly"
      :aria-haspopup="readonly ? undefined : 'dialog'"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="t-num t-body" dir="ltr">{{ display }}</span>
      <UIcon
        v-if="!readonly"
        name="i-lucide-clock"
        class="size-4.5 shrink-0 text-foreground-muted"
        aria-hidden="true"
      />
    </button>
    <p v-if="error" class="t-caption mt-1 flex items-start gap-1 text-error">
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
    <p v-else-if="hint" class="t-caption mt-1 text-foreground-muted">{{ hint }}</p>

    <WqSheet
      v-if="!readonly"
      v-model:open="open"
      :title="`انتخاب ساعت — ${label}`"
      :description="hint"
    >
      <div class="flex flex-col gap-4 pb-1">
        <p class="t-h3 t-num text-center" dir="ltr" aria-live="polite">{{ draftText }}</p>

        <div>
          <span class="t-label mb-2 block">ساعت</span>
          <div class="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
            <button
              v-for="hour in hours"
              :key="`h-${hour}`"
              type="button"
              class="pressable t-num min-h-12 rounded-lg border text-sm"
              :class="draft.hour === hour
                ? 'border-primary-border bg-primary-soft font-bold text-primary'
                : 'border-line bg-surface text-foreground'"
              :aria-pressed="draft.hour === hour"
              @click="draft.hour = hour"
            >
              {{ toFaDigits(pad2(hour)) }}
            </button>
          </div>
        </div>

        <div>
          <span class="t-label mb-2 block">دقیقه</span>
          <div class="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            <button
              v-for="minute in minutes"
              :key="`m-${minute}`"
              type="button"
              class="pressable t-num min-h-12 rounded-lg border text-sm"
              :class="draft.minute === minute
                ? 'border-primary-border bg-primary-soft font-bold text-primary'
                : 'border-line bg-surface text-foreground'"
              :aria-pressed="draft.minute === minute"
              @click="draft.minute = minute"
            >
              {{ toFaDigits(pad2(minute)) }}
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center gap-2">
          <WqButton variant="secondary" class="min-h-12 flex-1" @click="open = false">
            انصراف
          </WqButton>
          <WqButton class="min-h-12 flex-1" @click="apply">
            ثبت ساعت
          </WqButton>
        </div>
      </template>
    </WqSheet>
  </div>
</template>
