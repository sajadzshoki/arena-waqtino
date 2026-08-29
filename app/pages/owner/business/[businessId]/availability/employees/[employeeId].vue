<script setup lang="ts">
/**
 * ساعت کاری یک پرسنل (فاز ۱۱) — «مطابق کسب‌وکار» یا «برنامهٔ اختصاصی».
 *
 * سه رفتار عمدی:
 *   ۱) حالت پیش‌فرض *بدون کپی* است: تا «اختصاصی» را انتخاب نکنید، هیچ برنامه‌ای
 *      برای این نفر ذخیره نمی‌شود و ویرایشگر فقط‌خواندنی است (پیش‌نمایش ساعت
 *      کسب‌وکار). برای همین تغییر ساعت کسب‌وکار، اینجا هم خودبه‌خود تازه می‌شود.
 *   ۲) برنامهٔ اختصاصی باید *داخل* ساعات کسب‌وکار بگنجد؛ اگر نشود، همان‌جا با
 *      متن توضیح داده می‌شود (نه بی‌صدا بریده، نه بی‌صدا ذخیره).
 *   ۳) «بازگشت به ساعات کسب‌وکار» رکورد اختصاصی را پاک می‌کند — با تأیید، چون
 *      دادهٔ کاربر را دور می‌ریزد.
 *
 * deep link و refresh از `loadOne` می‌گذرند؛ پرسنلِ کسب‌وکار دیگر Not Found
 * می‌گیرد (همان قرارداد فاز ۱۰)، و پرسنل بدون سرویس هم می‌تواند ساعت داشته باشد.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const routeEmployeeId = computed(() => String(route.params.employeeId ?? ''))

const { phase, businessId, boot, business, accessMessage } = useOwnerBusinessEntry(routeBusinessId)

const {
  days,
  summary,
  source,
  dirty,
  saving,
  booting,
  loadError,
  notFound,
  notice,
  validation,
  dayError,
  intervalError,
  emptyDraft,
  locked,
  saveError,
  conflictMessage,
  employeeNote,
  businessSummary,
  businessNotConfigured,
  employeeView,
  boot: bootEditor,
  toggleDay,
  addInterval,
  removeInterval,
  setIntervalPart,
  selectSource,
  applyTemplate,
  save,
  revert,
  resetToBusinessDefault,
  clearNotice,
  clearActionError
} = useScheduleEditor({ businessId, employeeId: computed(() => routeEmployeeId.value) })

const guard = useUnsavedChangesGuard(() => dirty.value)
const { confirmOpen: leaveConfirmOpen, settleLeave, release } = guard

const resetConfirmOpen = ref(false)

const basePath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/availability` : ''
)
const listPath = computed(() => basePath.value)
const employeePath = computed(() =>
  businessId.value && routeEmployeeId.value
    ? `/owner/business/${businessId.value}/employees/${routeEmployeeId.value}`
    : '/owner'
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)
const { busyFor } = useBusinessAvailability(businessId)
/** شلوغیِ اکشن بازنشانی از همان کش می‌آید (نه flag محلی، تا دو منبع حقیقت نباشیم). */
const resetting = computed(() => busyFor(routeEmployeeId.value) === 'resetting-employee')

const statusLabel = computed(() =>
  employeeView.value ? employeeStatusLabel(employeeView.value.status) : ''
)
const context = computed(() =>
  businessSummary.value
    ? `ساعت کاری کسب‌وکار: ${businessSummary.value.headline} — برنامهٔ این نفر نمی‌تواند از این پنجره بیرون بزند.`
    : 'کسب‌وکار هنوز ساعت کاری ندارد؛ تا تنظیم نشود، برنامهٔ اختصاصی معنا ندارد.'
)

useHead({
  title: computed(() =>
    employeeView.value ? `ساعت کاری ${employeeView.value.displayName}` : 'ساعت کاری پرسنل'
  )
})

async function enterThenLoad(): Promise<void> {
  await boot()
  if (phase.value === 'ok') await bootEditor()
}

onMounted(enterThenLoad)
watch(routeEmployeeId, () => {
  void enterThenLoad()
})

async function onSave(): Promise<void> {
  const result = await save()
  if (result === 'saved') {
    toast.success(
      'برنامهٔ کاری این نفر ذخیره شد؛ ساعت‌های رزرو از همین لحظه همین است.',
      'i-lucide-clock'
    )
    release()
    await navigateTo(listPath.value, { replace: true })
    return
  }
  if (result === 'unchanged') {
    toast.info('تغییری ایجاد نشده بود.')
    return
  }
  if (result === 'invalid') {
    toast.error(validation.value.message ?? 'برنامهٔ هفته کامل نیست.')
    return
  }
  if (saveError.value) toast.error(saveError.value)
}

function onRevert(): void {
  revert()
  toast.info('تغییرات ذخیره‌نشده بازگردانده شد.')
}

async function onReset(): Promise<void> {
  const result = await resetToBusinessDefault()
  resetConfirmOpen.value = false
  if (result === 'reset') {
    toast.success(
      'برنامهٔ اختصاصی حذف شد؛ این نفر از این پس مطابق ساعات کسب‌وکار است.',
      'i-lucide-rotate-ccw'
    )
    release()
    await navigateTo(listPath.value, { replace: true })
    return
  }
  if (result === 'unchanged') toast.info('این نفر از قبل مطابق ساعات کسب‌وکار است.')
}
</script>

<template>
  <div>
    <AppBackHeader
      title="ساعت کاری پرسنل"
      :subtitle="business?.name"
      :to="listPath"
    >
      <template v-if="employeeView && !accessKind && phase === 'ok'" #actions>
        <WqButton size="sm" variant="tertiary" icon="i-lucide-user" :to="employeePath">
          پرسنل
        </WqButton>
      </template>
    </AppBackHeader>

    <AppLoadingState
      v-if="phase === 'loading' || booting"
      label="برنامهٔ کاری این نفر خوانده می‌شود…"
      :rows="4"
    />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="phase === 'forbidden' ? 'برای ویرایش ساعت کاری پرسنل، باید مدیر همین کسب‌وکار باشید.' : accessMessage ?? undefined"
    />

    <AppEmptyState
      v-else-if="notFound"
      icon="i-lucide-file-question"
      title="چنین پرسنلی در این کسب‌وکار نیست"
      description="ممکن است حذف شده باشد یا نشانی متعلق به کسب‌وکار دیگری باشد؛ برای همین برنامهٔ ساعتش نمایش داده نمی‌شود."
    >
      <WqButton v-if="basePath" class="mt-1 min-h-12" icon="i-lucide-clock" :to="basePath">
        ساعات کاری کسب‌وکار
      </WqButton>
    </AppEmptyState>

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش ساعات کاری باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <AppErrorState
      v-else-if="loadError"
      title="برنامهٔ کاری خوانده نشد"
      :description="loadError"
      retryable
      @retry="enterThenLoad()"
    />

    <template v-else-if="employeeView">
      <!-- هویت پرسنل + وضعیت (زمینهٔ تصمیم، نه دوباره‌نویسی فرم پرسنل) -->
      <section class="mb-3 flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
        <WqAvatar :name="employeeView.displayName" size="lg" class="shrink-0" />
        <div class="min-w-0 flex-1">
          <h1 class="t-h3 text-foreground-strong">{{ employeeView.displayName }}</h1>
          <p class="t-body-sm mt-0.5 text-foreground-secondary">{{ employeeView.headline }}</p>
        </div>
        <WqStatusBadge
          :color="employeeView.status === 'active' ? 'success' : 'neutral'"
          :icon="employeeView.status === 'active' ? 'i-lucide-circle-check' : 'i-lucide-eye-off'"
          :label="statusLabel"
          class="shrink-0"
        />
      </section>

      <p v-if="employeeNote" class="t-body-sm mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-foreground-secondary">
        <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ employeeNote }}</span>
      </p>

      <!-- منبع برنامه: پیش‌فرض یا اختصاصی -->
      <fieldset class="mb-3">
        <legend class="t-label mb-2 block">منبع برنامهٔ کاری</legend>
        <div class="flex flex-col gap-2">
          <WqSelectCard
            role="radio"
            :selected="source === 'business-default'"
            :disabled="saving"
            icon="i-lucide-building-2"
            title="مطابق ساعات کاری کسب‌وکار"
            :description="businessSummary ? businessSummary.headline : 'کسب‌وکار هنوز ساعت کاری ندارد'"
            @select="selectSource('business-default')"
          />
          <WqSelectCard
            role="radio"
            :selected="source === 'custom'"
            :disabled="saving || businessNotConfigured"
            icon="i-lucide-pencil-ruler"
            title="برنامهٔ اختصاصی این نفر"
            description="فقط بازه‌هایی که داخل ساعات کسب‌وکار جا می‌شوند ذخیره می‌شوند"
            @select="selectSource('custom')"
          />
        </div>
        <p v-if="businessNotConfigured" class="t-caption mt-2 flex items-start gap-1.5 text-warning">
          <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            اول ساعات کاری کسب‌وکار را تنظیم کنید؛ برنامهٔ پرسنل باید داخل آن بگنجد.
            <NuxtLink :to="`${basePath}/business`" class="font-semibold underline">تنظیم ساعت کسب‌وکار</NuxtLink>
          </span>
        </p>
      </fieldset>

      <OwnerAvailabilityEditorPanel
        scope="employee"
        :days="days"
        :summary="summary"
        :day-error="dayError"
        :interval-error="intervalError"
        :dirty="dirty"
        :saving="saving"
        :invalid="!validation.ok"
        :validation-message="validation.message"
        :save-error="saveError"
        :notice="notice"
        :locked="locked"
        :offer-template="emptyDraft && source === 'custom'"
        :context="context"
        :conflict-message="conflictMessage"
        @toggle="toggleDay"
        @add="addInterval"
        @change="setIntervalPart"
        @remove="removeInterval"
        @apply-template="applyTemplate"
        @save="onSave"
        @revert="onRevert"
        @dismiss-notice="() => { clearNotice(); clearActionError() }"
      />

      <!-- بازگشت به پیش‌فرض — اکشن دوم، چون دادهٔ اختصاصی را پاک می‌کند -->
      <WqButton
        v-if="employeeView.source === 'custom'"
        variant="tertiary"
        block
        icon="i-lucide-rotate-ccw"
        class="mt-1 min-h-12"
        :loading="resetting"
        :disabled="saving || resetting"
        @click="resetConfirmOpen = true"
      >
        بازگشت به ساعات کاری کسب‌وکار
      </WqButton>
      <p v-if="employeeView.source === 'custom'" class="t-caption mt-1.5 text-center text-foreground-muted">
        برنامهٔ اختصاصی این نفر حذف می‌شود؛ برنامهٔ کسب‌وکار دست نمی‌خورد.
      </p>
    </template>

    <WqConfirm
      v-model:open="leaveConfirmOpen"
      title="خروج با تغییرات ذخیره‌نشده؟"
      description="ساعت‌هایی که عوض کرده‌اید ذخیره نشده‌اند؛ با خروج، رزرو مشتری همان برنامهٔ قبلی را می‌بیند."
      confirm-label="خروج"
      cancel-label="می‌مانم"
      icon="i-lucide-circle-alert"
      @confirm="settleLeave(true)"
      @cancel="settleLeave(false)"
    />

    <WqConfirm
      v-model:open="resetConfirmOpen"
      title="برنامهٔ اختصاصی حذف شود؟"
      description="با تأیید، این نفر دوباره مطابق ساعات کاری کسب‌وکار است و بازه‌های اختصاصی‌اش پاک می‌شود."
      confirm-label="بله، بازگشت"
      cancel-label="نه"
      tone="destructive"
      :loading="resetting"
      @confirm="onReset"
      @cancel="resetConfirmOpen = false"
    />
  </div>
</template>
