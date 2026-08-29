<script setup lang="ts">
/**
 * پنل ویرایش برنامهٔ هفته — همان چیزی که صفحهٔ «ساعات کاری کسب‌وکار» و صفحهٔ
 * «ساعت کاری یک پرسنل» دورِ ویرایشگر می‌پیچند (فاز ۱۱).
 *
 * چرا جدا؟ چون آن دو صفحه باید *یکی* رفتار کنند: پیش‌نمایش زندهٔ هفته، قاعدهٔ
 * «ذخیرهٔ صریح»، نوار چسبان، پیام تغییرات ذخیره‌نشده و نحوهٔ نمایش خطا. دو
 * نسخهٔ این پنل یعنی دو تجربهٔ متفاوت برای یک کار.
 *
 * پنل فقط props می‌گیرد و emit می‌کند؛ هیچ سرویسی صدا نمی‌زند و هیچ state
 * دامنه‌ای ندارد (مالک state: `useScheduleEditor` در صفحه).
 */
import type { AvailabilityDay, ScheduleSummary, Weekday } from '~/types/availability'

const props = withDefaults(
  defineProps<{
    days: AvailabilityDay[]
    summary: ScheduleSummary
    dayError: (weekday: Weekday) => string | undefined
    intervalError: (weekday: Weekday, index: number) => string | undefined
    dirty: boolean
    saving: boolean
    /** `true` = روز روشنِ بدون بازه یا هم‌پوشانی — ذخیره قفل است */
    invalid: boolean
    validationMessage?: string | null
    /** خطای برگشتی از لایهٔ سرویس (دفاع دوم) */
    saveError?: string | null
    notice?: string | null
    /** برنامهٔ نفر «مطابق کسب‌وکار» است → ویرایشگر فقط‌خواندنی */
    locked?: boolean
    readonly?: boolean
    /** فقط وقتی هیچ چیز ذخیره نشده و هفته خالی است: دعوت به نقطهٔ شروع */
    offerTemplate?: boolean
    scope: 'business' | 'employee'
    /** توضیح ساعت کسب‌وکار بالای ویرایشگر پرسنل */
    context?: string | null
    conflictMessage?: string | null
    maxIntervalsPerDay?: number
  }>(),
  {
    validationMessage: null,
    saveError: null,
    notice: null,
    locked: false,
    readonly: false,
    offerTemplate: false,
    context: null,
    conflictMessage: null,
    maxIntervalsPerDay: undefined
  }
)

const emit = defineEmits<{
  toggle: [weekday: Weekday]
  add: [weekday: Weekday]
  change: [weekday: Weekday, index: number, part: 'start' | 'end', value: string]
  remove: [weekday: Weekday, index: number]
  save: []
  revert: []
  'apply-template': []
  'dismiss-notice': []
}>()

const errorCount = computed(() => props.days.filter(d => props.dayError(d.weekday)).length)
const canSave = computed(() => props.dirty && !props.invalid && !props.saving)
</script>

<template>
  <div class="pb-28">
    <!-- ۱) زمینه: این برنامه روی چه ساعتی سوار است -->
    <p
      v-if="context"
      class="t-body-sm mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-foreground-secondary"
    >
      <UIcon name="i-lucide-building-2" class="mt-0.5 size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
      <span>{{ context }}</span>
    </p>

    <!-- ۲) هشدار تناقض (بعد از تغییر ساعت کسب‌وکار) — توضیح می‌دهد، پاک نمی‌کند -->
    <p
      v-if="conflictMessage"
      class="t-body-sm mb-3 flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft px-3 py-2.5 text-warning"
    >
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{{ conflictMessage }}</span>
    </p>

    <!-- ۳) خطای ذخیره از لایهٔ سرویس (دفاع دوم) -->
    <div
      v-if="saveError"
      class="t-body-sm mb-3 flex items-start gap-2 rounded-xl border border-error-border bg-error-soft px-3 py-2.5 text-error"
      role="alert"
    >
      <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1">{{ saveError }}</span>
      <button
        type="button"
        class="pressable -m-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-error"
        aria-label="بستن پیام خطا"
        @click="emit('dismiss-notice')"
      >
        <UIcon name="i-lucide-x" class="size-4" aria-hidden="true" />
      </button>
    </div>

    <!-- ۴) دعوت به نقطهٔ شروع — صریح و دستی، نه پرکردن خودکار داده -->
    <div
      v-if="offerTemplate"
      class="mb-3 rounded-xl border border-dashed border-line-strong bg-surface p-3.5"
    >
      <p class="t-body-sm text-foreground-secondary">
        هنوز هیچ روزی برای این برنامه روشن نشده. می‌توانید از شنبه شروع کنید و
        هر روز را خودتان باز کنید — یا یک نقطهٔ ساده بگذاریم و شما اصلاحش کنید.
      </p>
      <WqButton
        variant="secondary"
        icon="i-lucide-wand-sparkles"
        class="mt-2.5 min-h-12 w-full"
        :disabled="locked"
        @click="emit('apply-template')"
      >
        شروع از «شنبه تا چهارشنبه، ۰۹:۰۰ تا ۱۸:۰۰»
      </WqButton>
      <p class="t-caption mt-2 text-foreground-muted">
        این فقط پیش‌فرم است؛ تا «ذخیره» را نزنید چیزی ثبت نمی‌شود.
      </p>
    </div>

    <!-- ۵) ویرایشگر هفته -->
    <OwnerAvailabilityEditor
      :days="days"
      :day-error="dayError"
      :interval-error="intervalError"
      :disabled="locked || saving"
      :readonly="readonly || locked"
      :max-intervals-per-day="maxIntervalsPerDay"
      @toggle="emit('toggle', $event)"
      @add="emit('add', $event)"
      @change="(weekday, index, part, value) => emit('change', weekday, index, part, value)"
      @remove="(weekday, index) => emit('remove', weekday, index)"
    />

    <p
      v-if="locked"
      class="t-caption mt-2.5 flex items-start gap-1.5 text-foreground-muted"
    >
      <UIcon name="i-lucide-lock" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        این برنامه همان ساعت‌های کسب‌وکار است و اینجا ویرایش نمی‌شود؛ برای ساعت
        مستقل، «برنامهٔ اختصاصی» را انتخاب کنید.
      </span>
    </p>

    <!-- ۶) پیش‌نمایش زندهٔ هفته — «مشتری چه می‌بیند؟» -->
    <section class="mt-4 rounded-xl border border-line bg-surface p-3.5">
      <h2 class="t-section mb-2 flex items-center gap-1.5 text-foreground-strong">
        <UIcon name="i-lucide-eye" class="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
        خلاصهٔ همین برنامه
      </h2>
      <OwnerScheduleSummary :summary="summary" />
    </section>

    <AppStickyAction>
      <p
        v-if="notice"
        class="t-caption mb-2 flex items-start gap-1.5 text-warning"
        role="status"
      >
        <UIcon name="i-lucide-circle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{{ notice }}</span>
      </p>

      <div class="flex items-center gap-2">
        <WqButton
          variant="secondary"
          class="min-h-12 shrink-0"
          :disabled="!dirty || saving"
          @click="emit('revert')"
        >
          بازگردانی
        </WqButton>
        <WqButton
          class="min-h-12 min-w-0 flex-1"
          icon="i-lucide-check"
          :loading="saving"
          :disabled="!canSave"
          @click="emit('save')"
        >
          {{ saving ? 'در حال ذخیره…' : dirty ? (scope === 'business' ? 'ذخیرهٔ ساعات کاری' : 'ذخیرهٔ برنامهٔ این نفر') : 'تغییری نیست' }}
        </WqButton>
      </div>

      <p v-if="invalid && errorCount > 0" class="t-caption mt-2 flex items-start gap-1.5 text-error">
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          {{ validationMessage ?? `${toFaDigits(errorCount)} روز نیاز به اصلاح دارد.` }}
        </span>
      </p>
      <p v-else-if="dirty" class="t-caption mt-2 flex items-start gap-1.5 text-foreground-muted">
        <UIcon name="i-lucide-circle-dot" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>تغییرات هنوز ذخیره نشده است.</span>
      </p>
    </AppStickyAction>
  </div>
</template>
