<script setup lang="ts">
/**
 * افزودن سرویس — فرم متمرکز روی یک تصمیم: «چه چیزی را، چقدر، چند دقیقه و
 * با چه وضعیتی بفروشم».
 *
 * هیچ «پیش‌نمایش بک‌اند» جعلی‌ای نیست: قواعد از `validateServiceForm` می‌آیند،
 * ذخیره از `useServiceForm` → لایهٔ سرویس، و موفقیت یعنی «رفتم فهرست و
 * آن‌جا هست» (کش همان لحظه به‌روز می‌شود، نه با reload).
 *
 * چهار حالتی که فرم‌ها معمولاً فراموش می‌کنند و اینجا هست: loading اولیهٔ
 * زمینه، خطای زمینه/دسترسی، دوباره‌ارسال (locking)، و خطای ذخیره با پیام
 * فارسی + خروج بی‌ذخیره با نگهبان تغییرات.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })
useHead({ title: 'افزودن سرویس' })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))

const { phase, businessId, boot, business } = useOwnerBusinessEntry(routeBusinessId)

const {
  name,
  description,
  duration,
  price,
  status,
  isValid,
  errorCount,
  dirty,
  canSave,
  errorFor,
  markTouched,
  submitAttempted,
  pricePreview,
  durationPreview,
  commitPrice,
  commitDuration,
  saving,
  submitError,
  submit,
  boot: bootForm
} = useServiceForm({ mode: 'create', businessId })

const guard = useUnsavedChangesGuard(() => dirty.value)
const { confirmOpen: leaveConfirmOpen, settleLeave, release } = guard

const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/services` : '/owner'
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

onMounted(() => {
  void boot().then(() => {
    if (phase.value === 'ok') void bootForm()
  })
})

async function onSave(): Promise<void> {
  const result = await submit()
  if (result === 'saved') {
    toast.success('سرویس اضافه شد و در فهرست کسب‌وکار قرار گرفت.', 'i-lucide-circle-check')
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
      title="افزودن سرویس"
      :subtitle="business?.name"
      :to="businessId ? `/owner/business/${businessId}` : '/owner'"
    />

    <AppLoadingState v-if="phase === 'loading'" label="در حال آماده‌سازی…" :rows="3" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="phase === 'forbidden' ? 'برای افزودن سرویس، باید مدیر همین کسب‌وکار باشید.' : undefined"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="فرم باز نشد"
      description="زمینهٔ کسب‌وکار باز نشد. بدون آن نمی‌توان سرویسی ساخت."
      retryable
      @retry="boot"
    />

    <template v-else>
      <p class="t-body-sm mb-5 text-foreground-secondary">
        نام سرویس همان چیزی است که مشتری در فهرست می‌بیند؛ قیمت و مدت هم دقیقاً
        همان‌جا نمایش داده می‌شود.
      </p>

      <form class="flex flex-col" @submit.prevent="onSave">
        <OwnerServiceForm
          v-model:name="name"
          v-model:description="description"
          v-model:duration="duration"
          v-model:price="price"
          v-model:status="status"
          :error-for="errorFor"
          :price-preview="pricePreview"
          :duration-preview="durationPreview"
          :disabled="saving"
          @touch="markTouched"
          @commit-price="commitPrice"
          @commit-duration="commitDuration"
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
            افزودن سرویس
          </WqButton>
          <p v-if="!isValid && submitAttempted" class="t-caption mt-1.5 text-center text-error">
            پیش از افزودن، خطاها را برطرف کنید.
          </p>
          <p v-else class="t-caption mt-1.5 text-center text-foreground-muted">
            سرویس تازه با وضعیت «{{ serviceStatusLabel(status) }}» ساخته می‌شود.
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
