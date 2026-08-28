<script setup lang="ts">
/**
 * کارت «ساعات کاری کسب‌وکار» در صفحهٔ دسترس‌پذیری (فاز ۱۱).
 *
 * سه حالت را همین‌جا جدا می‌کند تا صفحهٔ parent فقط data بدهد:
 *   • تنظیم‌نشده → توضیح + دکمهٔ شروع (بدون جدول خالی و بدون صفر ساختگی)
 *   • تنظیم‌شدهٔ تماماً تعطیل → همان خلاصه با هشدار، چون «هفت روز تعطیل» هم
 *     یک پاسخ معتبر است و باید دیده شود
 *   • عادی → خلاصهٔ هفته + ویرایش
 * اکشن‌ها `to` هستند (ناوبری واقعی)، نه دکمهٔ بی‌نتیجه.
 */
import type { BusinessScheduleView } from '~/types/availability'

defineProps<{
  view: BusinessScheduleView
  /** در حال ذخیره؟ (دکمه‌ها قفل می‌شوند تا دوباره‌کلیک نشود) */
  busy?: boolean
}>()

const emit = defineEmits<{ edit: [] }>()
</script>

<template>
  <section class="rounded-xl border bg-surface p-4" :class="view.schedule ? 'border-line' : 'border-dashed border-line-strong'">
    <div class="flex items-start gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-secondary">
        <UIcon :name="view.schedule ? 'i-lucide-clock' : 'i-lucide-calendar-x'" class="size-5" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="t-h3 text-foreground-strong">ساعات کاری کسب‌وکار</h2>
        <p v-if="view.schedule" class="t-body-sm mt-0.5 text-foreground-secondary">
          {{ view.summary?.headline }}
        </p>
        <p v-else class="t-body-sm mt-0.5 text-foreground-secondary">
          هنوز مشخص نشده این کسب‌وکار چه روزهایی و چه ساعتی پذیرش دارد.
        </p>
      </div>
      <WqStatusBadge
        v-if="!view.schedule"
        color="neutral"
        icon="i-lucide-circle-dashed"
        label="تنظیم‌نشده"
        class="shrink-0"
      />
    </div>

    <OwnerScheduleSummary
      v-if="view.schedule && view.summary"
      class="mt-3.5"
      :summary="view.summary"
      :footnote="view.schedule.updatedAt ? `آخرین تغییر: ${formatRelativeFa(view.schedule.updatedAt)}` : undefined"
    />

    <p v-else-if="view.schedule" class="t-body-sm mt-3 rounded-lg bg-warning-soft px-3 py-2 text-warning">
      همهٔ روزها تعطیل است؛ تا روزی را روشن نکنید، مشتری ساعتی نمی‌بیند.
    </p>

    <WqButton
      class="mt-3.5 min-h-12 w-full"
      :variant="view.schedule ? 'secondary' : 'primary'"
      :icon="view.schedule ? 'i-lucide-pen-line' : 'i-lucide-calendar-clock'"
      :disabled="busy"
      @click="emit('edit')"
    >
      {{ view.schedule ? 'ویرایش ساعات کاری' : 'تنظیم ساعات کاری' }}
    </WqButton>
  </section>
</template>
