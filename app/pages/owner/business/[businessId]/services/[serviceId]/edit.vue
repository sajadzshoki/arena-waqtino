<script setup lang="ts">
/**
 * ویرایش سرویس — همان فرم «افزودن» با همان قواعد (تفاوت فقط در مقدار اولیه و
 * متد ذخیره). دلیل یکی‌بودن: یک موجودیت، دو حالت آغاز است، نه دو فرم.
 *
 * رفتارهای عمدی:
 *   • ذخیره صریح است (autosave نداریم) و تا موفق نشده‌ایم از صفحه نمی‌رویم.
 *   • دوباره‌ارسال ممکن نیست (`saving` دکمه را قفل می‌کند).
 *   • خروج با تغییر ذخیره‌نشده (بازگشت اپ، back مرورگر، بستن تب) نگهبان دارد.
 *   • Not Found واقعی برای «سرویس نیست / مال این کسب‌وکار نیست» ساخته می‌شود،
 *     نه خطای فنی؛ deep link و refresh هم از همان مسیر می‌گذرند.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const routeServiceId = computed(() => String(route.params.serviceId ?? ''))

const { phase, businessId, boot, business } = useOwnerBusinessEntry(routeBusinessId)

const {
  name,
  description,
  duration,
  price,
  status,
  service,
  loading,
  loadError,
  notFound,
  isValid,
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
  boot: bootForm,
  submit
} = useServiceForm({
  mode: 'edit',
  businessId,
  serviceId: computed(() => routeServiceId.value)
})

useHead({
  title: computed(() => (service.value ? `ویرایش ${service.value.name}` : 'ویرایش سرویس'))
})

const guard = useUnsavedChangesGuard(() => dirty.value)
const { confirmOpen: leaveConfirmOpen, settleLeave, release } = guard

const basePath = computed(() =>
  businessId.value && routeServiceId.value
    ? `/owner/business/${businessId.value}/services/${routeServiceId.value}`
    : null
)
const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/services` : '/owner'
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)
/** وضعیتِ فعلی سرویس، از نگاشت متمرکز (برچسب + آیکون + پیامد) */
const statusMeta = computed(() => (service.value ? serviceStatusMeta(service.value.status) : null))

async function enterThenLoad(): Promise<void> {
  await boot()
  if (phase.value === 'ok') await bootForm()
}

onMounted(enterThenLoad)
watch(routeServiceId, () => {
  void enterThenLoad()
})

async function onSave(): Promise<void> {
  const result = await submit()
  if (result === 'saved') {
    toast.success('تغییرات ذخیره شد؛ فهرست و صفحهٔ کسب‌وکار هم همین را می‌بینند.', 'i-lucide-circle-check')
    release()
    if (basePath.value) await navigateTo(basePath.value, { replace: true })
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
      title="ویرایش سرویس"
      :subtitle="service?.name ?? business?.name"
      :to="basePath ?? (businessId ? `/owner/business/${businessId}` : '/owner')"
    />

    <AppLoadingState v-if="phase === 'loading' || loading" label="سرویس خوانده می‌شود…" :rows="4" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="phase === 'forbidden' ? 'برای ویرایش سرویس، باید مدیر همین کسب‌وکار باشید.' : undefined"
    />

    <!-- سرویس نیست یا به این کسب‌وکار تعلق ندارد → حالت Not Found (نه خطای فنی) -->
    <AppEmptyState
      v-else-if="notFound"
      icon="i-lucide-file-question"
      title="چنین سرویسی در این کسب‌وکار نیست"
      description="ممکن است حذف شده باشد یا نشانی متعلق به کسب‌وکار دیگری باشد."
    >
      <WqButton class="mt-1 min-h-12" icon="i-lucide-tags" :to="listPath">
        فهرست سرویس‌ها
      </WqButton>
    </AppEmptyState>

    <AppErrorState
      v-else-if="loadError"
      title="سرویس باز نشد"
      :description="loadError"
      retryable
      @retry="bootForm"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="فرم باز نشد"
      description="زمینهٔ کسب‌وکار باز نشد؛ بدون آن ویرایش ممکن نیست."
      retryable
      @retry="boot"
    />

    <!-- محافظ: هنوز رکورد نرسیده (مثلاً درخواست در جریان است) → اسکلت، نه صفحهٔ سفید -->
    <OwnerServicesSkeleton v-else-if="!service" :rows="1" />

    <template v-else>
      <!-- زمینهٔ تصمیم: مدیر بداند دارد چه چیزی را عوض می‌کند -->
      <div v-if="statusMeta" class="mb-5 flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
        <UIcon :name="statusMeta.icon" class="mt-0.5 size-4 shrink-0 text-foreground-secondary" aria-hidden="true" />
        <p class="t-body-sm text-foreground-secondary">
          <span class="font-semibold text-foreground">{{ statusMeta.label }}</span>
          — {{ statusMeta.hint }}
        </p>
      </div>

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

        <AppStickyAction>
          <WqButton type="submit" block :loading="saving" :disabled="!canSave">
            {{ dirty ? 'ذخیرهٔ تغییرات' : 'تغییری برای ذخیره نیست' }}
          </WqButton>
          <p v-if="dirty" class="t-caption mt-1.5 text-center text-foreground-muted">
            تغییرات هنوز ذخیره نشده‌اند.
          </p>
          <p v-else-if="submitAttempted && !isValid" class="t-caption mt-1.5 text-center text-error">
            پیش از ذخیره، خطاهای فرم را برطرف کنید.
          </p>
        </AppStickyAction>
      </form>
    </template>

    <WqConfirm
      v-model:open="leaveConfirmOpen"
      title="خروج با تغییرات ذخیره‌نشده؟"
      description="تغییراتی که در این فرم نوشته‌اید ذخیره نشده‌اند؛ با خروج از بین می‌روند."
      confirm-label="خروج"
      cancel-label="می‌مانم"
      icon="i-lucide-circle-alert"
      @confirm="settleLeave(true)"
      @cancel="settleLeave(false)"
    />
  </div>
</template>
