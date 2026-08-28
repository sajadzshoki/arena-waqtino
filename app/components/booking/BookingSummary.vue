<script setup lang="ts">
/**
 * خلاصهٔ رزرو — مرحلهٔ پنجم (بازبینی قبل از تأیید).
 */
import type { BookingFlowDraft } from '~/types/booking-flow'
import type { Business, BusinessCategory } from '~/types/business'
import type { BookableService } from '~/types/service'
import type { BookableEmployee } from '~/types/employee'

defineProps<{
  draft: BookingFlowDraft
  business: Business | null
  category: BusinessCategory | null
  service: BookableService | null
  /** نمای مشتری پرسنل (فاز ۱۰) — `displayName` از لایهٔ سرویس آماده می‌آید. */
  employee: BookableEmployee | null | undefined // null = «فرقی نمی‌کند»، undefined = انتخاب‌نشده
  warnings?: Array<{ code: string; message: string; type: string }>
}>()

defineEmits<{
  editStep: [step: 'service' | 'employee' | 'date' | 'time']
}>()

function formatSlotTime(start: string): string {
  return formatFaTime(new Date(start))
}

function formatDate(date: string): string {
  return formatDateLabel(new Date(date))
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Warnings -->
    <div
      v-if="warnings && warnings.length > 0"
      class="flex flex-col gap-2 rounded-xl border border-warning-border bg-warning-soft p-4"
    >
      <div v-for="warning in warnings" :key="warning.code" class="flex items-start gap-2">
        <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-4 shrink-0 text-warning" />
        <p class="t-body-sm text-foreground">{{ warning.message }}</p>
      </div>
    </div>

    <!-- Business -->
    <div v-if="business" class="rounded-xl border border-line bg-surface p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="t-caption mb-1">کسب‌وکار</p>
          <h3 class="t-h3 truncate text-foreground">{{ business.name }}</h3>
          <p v-if="category" class="t-caption mt-0.5 text-foreground-secondary">
            {{ category.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Service -->
    <div v-if="service" class="rounded-xl border border-line bg-surface p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="t-caption mb-1">خدمت</p>
          <h3 class="t-h3 text-foreground">{{ service.name }}</h3>
          <div class="mt-1.5 flex items-center gap-3">
            <WqDuration :minutes="service.durationMinutes" />
          </div>
        </div>
        <button
          type="button"
          class="pressable shrink-0 rounded-lg p-1.5 text-primary hover:bg-primary-soft"
          aria-label="تغییر خدمت"
          @click="$emit('editStep', 'service')"
        >
          <UIcon name="i-lucide-pencil" class="size-4" />
        </button>
      </div>
    </div>

    <!-- Employee -->
    <div v-if="employee !== undefined" class="rounded-xl border border-line bg-surface p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="t-caption mb-1">متخصص</p>
          <template v-if="employee === null">
            <p class="t-body-sm font-medium text-foreground">فرقی نمی‌کند</p>
            <p class="t-caption text-foreground-secondary">اولین متخصص آزاد</p>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <WqAvatar :name="employee.displayName" :src="employee.avatarUrl" size="sm" />
              <div>
                <p class="t-body-sm font-medium text-foreground">{{ employee.displayName }}</p>
                <p v-if="employee.title" class="t-caption text-foreground-secondary">{{ employee.title }}</p>
              </div>
            </div>
          </template>
        </div>
        <button
          type="button"
          class="pressable shrink-0 rounded-lg p-1.5 text-primary hover:bg-primary-soft"
          aria-label="تغییر متخصص"
          @click="$emit('editStep', 'employee')"
        >
          <UIcon name="i-lucide-pencil" class="size-4" />
        </button>
      </div>
    </div>

    <!-- Date & Time -->
    <div v-if="draft.date && draft.timeSlot" class="rounded-xl border border-line bg-surface p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="t-caption mb-1">زمان</p>
          <p class="t-body-sm font-medium text-foreground">
            {{ formatDate(draft.date) }}
          </p>
          <p class="t-caption mt-0.5 t-num text-foreground-secondary">
            ساعت {{ formatSlotTime(draft.timeSlot.start) }}
          </p>
        </div>
        <button
          type="button"
          class="pressable shrink-0 rounded-lg p-1.5 text-primary hover:bg-primary-soft"
          aria-label="تغییر تاریخ و زمان"
          @click="$emit('editStep', 'time')"
        >
          <UIcon name="i-lucide-pencil" class="size-4" />
        </button>
      </div>
    </div>

    <!-- Price -->
    <div v-if="service" class="rounded-xl border border-line bg-surface p-4">
      <div class="flex items-center justify-between">
        <p class="t-body-sm font-medium text-foreground">هزینه</p>
        <WqPrice :amount="service.price" size="lg" />
      </div>
    </div>
  </div>
</template>
