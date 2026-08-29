<script setup lang="ts">
/**
 * صفحهٔ فرآیند رزرو — چندمرحله‌ای (service → employee → date → time → review).
 */
import type { TimeSlot } from '~/types/availability'

definePageMeta({ access: 'auth', tabbar: false, header: false })

const route = useRoute()
const router = useRouter()
const toast = useAppToast()
const services = useServices()

const businessId = computed(() => route.query.business as string)
const serviceId = computed(() => route.query.service as string | undefined)

const {
  draft,
  currentStep,
  warnings,
  staleServiceNotice,
  staleEmployeeNotice,
  loadingBusiness,
  loadingSlots,
  loadingDates,
  error,
  business,
  category,
  businessServices,
  availableSlots,
  dateAvailability,
  currentService,
  currentEmployee,
  employeeOptional,
  eligibleEmployees,
  requiresEmployee,
  isDraftComplete,
  noSlotsAvailable,
  dayStatus,
  dayMessage,
  dayWindow,
  availabilityError,
  initDraft,
  setService,
  setEmployee,
  setDate,
  setTimeSlot,
  nextStep,
  prevStep,
  clearDraft,
  loadDateAvailability,
  loadTimeSlots,
  validateStep,
  setWarnings
} = useBookingFlow()

// Initialize
if (!businessId.value) {
  navigateTo('/')
}
else {
  await initDraft(businessId.value, serviceId.value)
}

// Page title
useHead({
  title: computed(() => {
    if (!business.value) return 'رزرو نوبت'
    const stepLabels: Record<string, string> = {
      service: 'انتخاب خدمت',
      employee: 'انتخاب متخصص',
      date: 'انتخاب تاریخ',
      time: 'انتخاب زمان',
      review: 'بازبینی و تأیید'
    }
    return `${stepLabels[currentStep.value]} — ${business.value.name}`
  })
})

// ثبت نوبت
const submitting = ref(false)

async function submitBooking() {
  if (!isDraftComplete.value || !draft.value.timeSlot || !currentService.value) return

  submitting.value = true
  try {
    const request = {
      businessId: draft.value.businessId!,
      serviceId: draft.value.serviceId!,
      employeeId: draft.value.employeeId === null ? null : draft.value.employeeId ?? undefined,
      start: draft.value.timeSlot.start,
      end: draft.value.timeSlot.end,
      price: currentService.value.price
    }

    // اول اعتبارسنجی پیش از ثبت
    const validation = await services.bookings.validateDraft(request)

    if (!validation.valid) {
      const errorMsg = validation.errors[0]?.message ?? 'خطا در اعتبارسنجی رزرو.'
      toast.error(errorMsg)

      // رابطهٔ سرویس/پرسنل در لایهٔ سرویس سنجیده می‌شود (دفاع دوم). اگر همان‌جا
      // رد شدیم، کاربر را به همان گامِ تصمیم می‌بریم و توضیح را همان‌جا نشان
      // می‌دهیم — نه فقط یک toast که محو می‌شود.
      const firstError = validation.errors[0]
      if (firstError?.field === 'service') {
        staleServiceNotice.value = firstError.message
        draft.value.employeeId = undefined
        draft.value.timeSlot = null
        currentStep.value = 'service'
        return
      }
      if (firstError?.field === 'employee') {
        staleEmployeeNotice.value = firstError.message
        draft.value.employeeId = undefined
        draft.value.timeSlot = null
        currentStep.value = requiresEmployee.value ? 'employee' : 'date'
        return
      }

      // اگر ساعت رزروشدنی نبود، بازگشت به انتخاب ساعت
      if (validation.errors[0]?.field === 'timeSlot') {
        draft.value.timeSlot = null
        currentStep.value = 'time'
        if (draft.value.date) {
          await loadTimeSlots(draft.value.date)
        }
      }
      return
    }

    // مدیریت هشدارها (مثلاً تغییر قیمت)
    if (validation.warnings.length > 0) {
      setWarnings(validation.warnings.map(w => ({
        code: w.code,
        message: w.message,
        type: w.type
      })))
    }

    // ساخت نوبت
    const result = await services.bookings.create(request)

    if (!result.success) {
      if (result.error.code === 'PRICE_CHANGED' && result.error.suggestedPrice !== undefined) {
        toast.warning(result.error.message)
        setWarnings([{
          code: 'PRICE_CHANGED',
          message: result.error.message,
          type: 'price_change'
        }])
        return
      }

      if (result.error.code === 'SLOT_UNAVAILABLE') {
        toast.error(result.error.message)
        draft.value.timeSlot = null
        currentStep.value = 'time'
        if (draft.value.date) {
          await loadTimeSlots(draft.value.date)
        }
        return
      }

      toast.error(result.error.message)
      return
    }

    // Success!
    const bookingId = result.bookingId
    clearDraft()
    navigateTo(`/booking/success?id=${bookingId}`)
  }
  catch (err) {
    // پیام از `ServiceError` خوانده می‌شود (متن فارسیِ لایهٔ سرویس) و اگر چیزی
    // نبود، جملهٔ عمومیِ خودمان؛ هیچ خطای فنی خام به کاربر نمی‌رسد (§۲۳).
    // `console` لازم نیست: خطا در همان لحظه به کاربر گفته می‌شود و بعداً
    // `reportError` (اگر اضافه شد) منبع واحد لاگ خواهد بود (§۶۱).
    const message = toServiceError(err).message || 'خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.'
    toast.error(message)
  }
  finally {
    submitting.value = false
  }
}

// جابه‌جایی بین گام‌ها
function handleServiceSelect(serviceId: string) {
  setService(serviceId)
}

function handleEmployeeSelect(employeeId: string | null) {
  setEmployee(employeeId)
}

function handleDateSelect(date: string) {
  setDate(date)
}

function handleTimeSelect(slot: TimeSlot) {
  setTimeSlot(slot)
}

function handleNext() {
  nextStep()
}

function handlePrev() {
  if (currentStep.value === 'service') {
    router.back()
  }
  else {
    prevStep()
  }
}

function handleEditStep(step: 'service' | 'employee' | 'date' | 'time') {
  currentStep.value = step
  if (step === 'date') {
    loadDateAvailability()
  }
  else if (step === 'time' && draft.value.date) {
    loadTimeSlots(draft.value.date)
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background">
    <!-- هدر -->
    <header class="sticky top-0 z-40 border-b border-line bg-surface pt-safe">
      <div class="mx-auto flex max-w-(--wq-content-max) flex-col gap-3 px-4 py-3">
        <!-- بازگشت + عنوان -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="pressable flex size-10 items-center justify-center rounded-full hover:bg-surface-muted"
            aria-label="بازگشت"
            @click="handlePrev"
          >
            <UIcon name="i-lucide-arrow-right" class="size-5 text-foreground" />
          </button>
          <div class="min-w-0 flex-1">
            <h1 class="t-h3 truncate text-foreground">
              {{ business?.name ?? 'رزرو نوبت' }}
            </h1>
          </div>
        </div>

        <!-- نشانگر گام‌ها -->
        <BookingStepIndicator :current-step="currentStep" />
      </div>
    </header>

    <!-- محتوا -->
    <main class="mx-auto w-full max-w-(--wq-content-max) flex-1 px-4 py-6">
      <!-- بارگذاری -->
      <div v-if="loadingBusiness" class="flex flex-col items-center gap-3 py-12">
        <UIcon name="i-lucide-loader" class="size-8 animate-spin text-primary" />
        <p class="t-body-sm text-foreground-secondary">در حال دریافت اطلاعات...</p>
      </div>

      <!-- خطا -->
      <div v-else-if="error" class="flex flex-col items-center gap-4 py-12 text-center">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-error" />
        <p class="t-body text-foreground">{{ error }}</p>
        <WqButton variant="secondary" size="md" @click="initDraft(businessId, serviceId)">
          تلاش مجدد
        </WqButton>
      </div>

      <!-- گام‌ها -->
      <div v-else class="flex flex-col gap-6">
        <!-- گام ۱: خدمت -->
        <div v-if="currentStep === 'service'">
          <h2 class="t-h2 mb-4 text-foreground">انتخاب خدمت</h2>
          <div
            v-if="staleServiceNotice"
            class="mb-4 flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft p-3"
            role="status"
          >
            <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0 text-warning" />
            <p class="t-body-sm text-foreground">{{ staleServiceNotice }}</p>
          </div>
          <BookingServiceSelect
            :services="businessServices"
            :selected-id="draft.serviceId"
            @select="handleServiceSelect"
          />
        </div>

        <!-- گام ۲: پرسنل -->
        <div v-if="currentStep === 'employee'">
          <h2 class="t-h2 mb-4 text-foreground">انتخاب متخصص</h2>
          <div
            v-if="staleEmployeeNotice"
            class="mb-4 flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft p-3"
            role="status"
          >
            <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0 text-warning" />
            <p class="t-body-sm text-foreground">{{ staleEmployeeNotice }}</p>
          </div>
          <BookingEmployeeSelect
            :employees="eligibleEmployees"
            :selected-id="draft.employeeId"
            :optional="employeeOptional"
            @select="handleEmployeeSelect"
          />
        </div>

        <!-- گام ۳: روز -->
        <div v-if="currentStep === 'date'">
          <h2 class="t-h2 mb-4 text-foreground">انتخاب تاریخ</h2>
          <BookingDateSelect
            :dates="dateAvailability"
            :selected-date="draft.date"
            :loading="loadingDates"
            :error="availabilityError"
            @select="handleDateSelect"
            @retry="loadDateAvailability()"
          />
        </div>

        <!-- گام ۴: ساعت -->
        <div v-if="currentStep === 'time'">
          <h2 class="t-h2 mb-4 text-foreground">انتخاب زمان</h2>
          <p v-if="draft.date" class="t-caption mb-3 text-foreground-secondary">
            {{ formatDateKeyLabel(draft.date) }}
          </p>
          <BookingTimeSelect
            :slots="availableSlots"
            :selected-slot="draft.timeSlot"
            :loading="loadingSlots"
            :no-slots-available="noSlotsAvailable"
            :status="dayStatus"
            :message="dayMessage"
            :window="dayWindow"
            :error="availabilityError"
            @select="handleTimeSelect"
            @retry="loadTimeSlots(draft.date ?? '')"
          />
        </div>

        <!-- گام ۵: بازبینی -->
        <div v-if="currentStep === 'review'">
          <h2 class="t-h2 mb-4 text-foreground">بازبینی و تأیید</h2>
          <BookingSummary
            :draft="draft"
            :business="business"
            :category="category"
            :service="currentService"
            :employee="currentEmployee"
            :warnings="warnings"
            @edit-step="handleEditStep"
          />
        </div>
      </div>
    </main>

    <!-- اکشن چسبنده -->
    <div v-if="!loadingBusiness && !error" class="sticky bottom-0 border-t border-line bg-surface pb-safe">
      <div class="mx-auto max-w-(--wq-content-max) px-4 py-3">
        <div class="flex items-center gap-3">
          <!-- دکمهٔ بازگشت (به‌جز گام اول) -->
          <button
            v-if="currentStep !== 'service'"
            type="button"
            class="pressable flex size-12 items-center justify-center rounded-full border border-line"
            aria-label="مرحلهٔ قبل"
            @click="handlePrev"
          >
            <UIcon name="i-lucide-arrow-right" class="size-5 text-foreground" />
          </button>

          <!-- دکمهٔ ادامه / تأیید -->
          <WqButton
            v-if="currentStep !== 'review'"
            variant="primary"
            size="lg"
            block
            :disabled="!validateStep(currentStep)"
            @click="handleNext"
          >
            ادامه
          </WqButton>
          <WqButton
            v-else
            variant="primary"
            size="lg"
            block
            :disabled="!isDraftComplete"
            :loading="submitting"
            @click="submitBooking"
          >
            تأیید و ثبت رزرو
          </WqButton>
        </div>
      </div>
    </div>
  </div>
</template>
