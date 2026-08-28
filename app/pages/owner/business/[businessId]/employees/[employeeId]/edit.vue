<script setup lang="ts">
/**
 * ویرایش پرسنل — همان فرم «افزودن» با همان قواعد (تفاوت فقط در مقدار اولیه و
 * متد ذخیره). دلیل یکی‌بودن: یک موجودیت، دو حالت آغاز است، نه دو فرم.
 *
 * رفتارهای عمدی:
 *   • ذخیره صریح است (autosave نداریم) و تا موفق نشده‌ایم از صفحه نمی‌رویم.
 *   • دوباره‌ارسال ممکن نیست (`saving` دکمه را قفل می‌کند).
 *   • خروج با تغییر ذخیره‌نشده (بازگشت اپ، back مرورگر، بستن تب) نگهبان دارد.
 *   • Not Found واقعی برای «نیست / مال این کسب‌وکار نیست» ساخته می‌شود، نه خطای
 *     فنی؛ deep link و refresh هم از همان مسیر می‌گذرند.
 *   • رابطهٔ سرویس‌ها هم از همین فرم قابل تغییر است (و لایهٔ سرویس همان‌جا
 *     «مال همین کسب‌وکار بودن» را دوباره می‌سنجد).
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const routeEmployeeId = computed(() => String(route.params.employeeId ?? ''))

const { phase, businessId, boot, business } = useOwnerBusinessEntry(routeBusinessId)

const {
  firstName,
  lastName,
  title,
  phone,
  avatarUrl,
  status,
  serviceIds,
  employee,
  loading,
  loadError,
  notFound,
  isValid,
  dirty,
  canSave,
  errorFor,
  markTouched,
  submitAttempted,
  displayNamePreview,
  phonePreview,
  selectedServiceCount,
  toggleService,
  commitPhone,
  saving,
  submitError,
  boot: bootForm,
  submit
} = useEmployeeForm({
  mode: 'edit',
  businessId,
  employeeId: computed(() => routeEmployeeId.value)
})

const { rowsFor, load: loadServiceOptions } = useEmployeeServiceOptions(businessId)

const guard = useUnsavedChangesGuard(() => dirty.value)
const { confirmOpen: leaveConfirmOpen, settleLeave, release } = guard

const basePath = computed(() =>
  businessId.value && routeEmployeeId.value
    ? `/owner/business/${businessId.value}/employees/${routeEmployeeId.value}`
    : null
)
const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/employees` : '/owner'
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)
/** وضعیتِ فعلی پرسنل، از نگاشت متمرکز (برچسب + آیکون + پیامد) */
const statusMeta = computed(() => (employee.value ? employeeStatusMeta(employee.value.status) : null))

async function enterThenLoad(): Promise<void> {
  await boot()
  if (phase.value === 'ok') {
    await Promise.all([bootForm(), loadServiceOptions()])
  }
}

onMounted(enterThenLoad)
watch(routeEmployeeId, () => {
  void enterThenLoad()
})

async function onSave(): Promise<void> {
  const result = await submit()
  if (result === 'saved') {
    toast.success('تغییرات ذخیره شد؛ فهرست پرسنل و انتخاب رزرو مشتری هم همین را می‌بینند.', 'i-lucide-circle-check')
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
      title="ویرایش پرسنل"
      :subtitle="employee ? displayNamePreview : business?.name"
      :to="basePath ?? (businessId ? `/owner/business/${businessId}` : '/owner')"
    />

    <AppLoadingState v-if="phase === 'loading' || loading" label="پرسنل خوانده می‌شود…" :rows="4" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="phase === 'forbidden' ? 'برای ویرایش پرسنل، باید مدیر همین کسب‌وکار باشید.' : undefined"
    />

    <!-- نیست یا به این کسب‌وکار تعلق ندارد → حالت Not Found (نه خطای فنی) -->
    <AppEmptyState
      v-else-if="notFound"
      icon="i-lucide-file-question"
      title="چنین پرسنلی در این کسب‌وکار نیست"
      description="ممکن است حذف شده باشد یا نشانی متعلق به کسب‌وکار دیگری باشد."
    >
      <WqButton class="mt-1 min-h-12" icon="i-lucide-users" :to="listPath">
        فهرست پرسنل
      </WqButton>
    </AppEmptyState>

    <AppErrorState
      v-else-if="loadError"
      title="پرسنل باز نشد"
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

    <!-- محافظ: هنوز رکورد نرسیده → اسکلت، نه صفحهٔ سفید -->
    <OwnerEmployeesSkeleton v-else-if="!employee" :rows="1" />

    <template v-else>
      <!-- زمینهٔ تصمیم: مدیر بداند دارد چه چیزی را عوض می‌کند -->
      <div v-if="statusMeta" class="mb-5 flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
        <UIcon :name="statusMeta.icon" class="mt-0.5 size-4 shrink-0 text-foreground-secondary" aria-hidden="true" />
        <p class="t-body-sm text-foreground-secondary">
          <span class="font-semibold text-foreground">{{ employee.displayName }}</span>
          — {{ statusMeta.label }} · {{ statusMeta.hint }}
        </p>
      </div>

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
