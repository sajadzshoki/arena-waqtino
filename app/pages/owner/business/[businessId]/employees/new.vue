<script setup lang="ts">
/**
 * افزودن پرسنل — فرم متمرکز روی یک تصمیم: «این کیست، چطور پیدایش کنند، و چه
 * سرویس‌هایی را انجام می‌دهد».
 *
 * هیچ «پیش‌نمایش بک‌اند» جعلی‌ای نیست: قواعد از `validateEmployeeForm` می‌آیند،
 * ذخیره از `useEmployeeForm` → لایهٔ سرویس، و موفقیت یعنی «رفتم فهرست و آن‌جا
 * هست» (کش همان لحظه به‌روز می‌شود، نه با reload).
 *
 * عمدی: هیچ قلم «حساب کاربری» یا «دعوت‌نامه» این‌جا نیست — پرسنل می‌تواند بدون
 * حساب وجود داشته باشد و اتصال حساب به فاز فضای کاری پرسنل موکول است.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })
useHead({ title: 'افزودن پرسنل' })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))

const { phase, businessId, boot, business } = useOwnerBusinessEntry(routeBusinessId)

const {
  firstName,
  lastName,
  title,
  phone,
  avatarUrl,
  status,
  isValid,
  errorCount,
  dirty,
  canSave,
  errorFor,
  markTouched,
  submitAttempted,
  displayNamePreview,
  phonePreview,
  serviceIds,
  selectedServiceCount,
  toggleService,
  commitPhone,
  saving,
  submitError,
  submit,
  boot: bootForm
} = useEmployeeForm({ mode: 'create', businessId })

/** گزینه‌ها از همان کش سرویس‌ها (فاز ۹) می‌آیند؛ انتخاب در خود فرم می‌ماند. */
const { rowsFor, load: loadServiceOptions } = useEmployeeServiceOptions(businessId)

const guard = useUnsavedChangesGuard(() => dirty.value)
const { confirmOpen: leaveConfirmOpen, settleLeave, release } = guard

const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/employees` : '/owner'
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

onMounted(() => {
  void boot().then(async () => {
    if (phase.value !== 'ok') return
    await Promise.all([bootForm(), loadServiceOptions()])
  })
})

async function onSave(): Promise<void> {
  const result = await submit()
  if (result === 'saved') {
    toast.success('پرسنل اضافه شد و در فهرست این کسب‌وکار قرار گرفت.', 'i-lucide-circle-check')
    release()
    await navigateTo(listPath.value, { replace: true })
    return
  }
  if (result === 'invalid') {
    toast.error('چند مورد از فرم کامل نشده است؛ پیام‌های زیر فیلدها را ببینید.')
    return
  }
  if (result === 'error' && submitError.value) toast.error(submitError.value)
}
</script>

<template>
  <div class="pb-28">
    <AppBackHeader
      title="افزودن پرسنل"
      :subtitle="business?.name"
      :to="businessId ? `/owner/business/${businessId}` : '/owner'"
    />

    <AppLoadingState v-if="phase === 'loading'" label="در حال آماده‌سازی…" :rows="3" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="phase === 'forbidden' ? 'برای افزودن پرسنل، باید مدیر همین کسب‌وکار باشید.' : undefined"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="فرم باز نشد"
      description="زمینهٔ کسب‌وکار باز نشد. بدون آن نمی‌توان پرسنلی ثبت کرد."
      retryable
      @retry="boot"
    />

    <template v-else>
      <p class="t-body-sm mb-5 text-foreground-secondary">
        نام و سرویس‌های این نفر تعیین می‌کند مشتری در گام «انتخاب پرسنل» او را ببیند
        یا نه. حساب کاربری لازم نیست — بعداً هم می‌توان وصلش کرد.
      </p>

      <form class="flex flex-col" @submit.prevent="onSave">
        <OwnerEmployeeForm
          v-model:first-name="firstName"
          v-model:last-name="lastName"
          v-model:title="title"
          v-model:phone="phone"
          v-model:avatar-url="avatarUrl"
          v-model:status="status"
          :rows="rowsFor(serviceIds)"
          :selected-count="selectedServiceCount"
          :error-for="errorFor"
          :display-name="displayNamePreview"
          :phone-preview="phonePreview"
          :disabled="saving"
          @touch="markTouched"
          @commit-phone="commitPhone"
          @toggle-service="toggleService"
        />

        <p
          v-if="submitError"
          class="t-body-sm mt-5 flex items-start gap-2 rounded-lg bg-error-soft px-3 py-2.5 text-error"
          role="alert"
        >
          <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{{ submitError }}</span>
        </p>

        <p v-if="!isValid && submitAttempted" class="t-caption mt-3 flex items-center gap-1.5 text-foreground-muted" role="status">
          <UIcon name="i-lucide-circle-alert" class="size-3.5 shrink-0" aria-hidden="true" />
          {{ toFaDigits(errorCount) }} مورد از فرم کامل نشده است.
        </p>

        <AppStickyAction>
          <WqButton type="submit" block :loading="saving" :disabled="!canSave">
            افزودن پرسنل
          </WqButton>
          <p v-if="!isValid && submitAttempted" class="t-caption mt-1.5 text-center text-error">
            پیش از افزودن، خطاها را برطرف کنید.
          </p>
          <p v-else class="t-caption mt-1.5 text-center text-foreground-muted">
            با وضعیت «{{ employeeStatusLabel(status) }}» ثبت می‌شود{{
              selectedServiceCount === 0 ? '، بدون سرویس اختصاصی' : ''
            }}.
          </p>
        </AppStickyAction>
      </form>
    </template>

    <WqConfirm
      v-model:open="leaveConfirmOpen"
      title="خروج با فرم ذخیره‌نشده؟"
      description="اگر از این صفحه بروید، متن‌هایی که نوشته‌اید ذخیره نشده‌اند و از بین می‌روند."
      confirm-label="خروج"
      cancel-label="می‌مانم"
      icon="i-lucide-circle-alert"
      @confirm="settleLeave(true)"
      @cancel="settleLeave(false)"
    />
  </div>
</template>
