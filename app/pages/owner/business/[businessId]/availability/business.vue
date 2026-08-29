<script setup lang="ts">
/**
 * ویرایش ساعات کاری کسب‌وکار (فاز ۱۱).
 *
 * قاعده‌ها همان‌جا است که فرم هم می‌بیند (`validateSchedule`) — پس «فرم قبول
 * کرد، سرویس رد کرد» ممکن نیست. ذخیره صریح است، دوباره‌ارسال قفل است، و خروج با
 * تغییر ذخیره‌نشده نگهبان دارد.
 *
 * چرا «ذخیرهٔ صریح» برای ساعت کاری اهمیت بیشتری دارد؟ چون این داده مستقیماً
 * ساعت‌های پیشنهادی رزرو مشتری را عوض می‌کند؛ autosave یعنی یک لمس اشتباه،
 * امروزِ مشتری را ببندد.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))

const { phase, businessId, boot, business, accessMessage } = useOwnerBusinessEntry(routeBusinessId)

const {
  days,
  summary,
  dirty,
  saving,
  booting,
  loadError,
  notice,
  validation,
  dayError,
  intervalError,
  emptyDraft,
  locked,
  saveError,
  toggleDay,
  addInterval,
  removeInterval,
  setIntervalPart,
  applyTemplate,
  boot: bootEditor,
  save,
  revert,
  clearNotice,
  clearActionError
} = useScheduleEditor({ businessId })

const guard = useUnsavedChangesGuard(() => dirty.value)
const { confirmOpen: leaveConfirmOpen, settleLeave, release } = guard

const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/availability` : '/owner'
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)
const notConfigured = computed(() => !booting.value && !summary.value.openDays && emptyDraft.value)

useHead({ title: 'ساعات کاری کسب‌وکار' })

async function enterThenLoad(): Promise<void> {
  await boot()
  // ترتیب مهم است: اول مالکیت/زمینه، بعد draft — وگرنه برای کسب‌وکار اشتباه draft می‌سازیم
  if (phase.value === 'ok') await bootEditor()
}

async function onSave(): Promise<void> {
  const result = await save()
  if (result === 'saved') {
    toast.success(
      'ساعات کاری ذخیره شد؛ از همین لحظه ساعت‌های رزرو مشتری از همین برنامه ساخته می‌شود.',
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
</script>

<template>
  <div>
    <AppBackHeader
      title="ساعات کاری کسب‌وکار"
      :subtitle="business?.name"
      :to="listPath"
    />

    <AppLoadingState
      v-if="phase === 'loading' || booting"
      label="برنامهٔ هفته خوانده می‌شود…"
      :rows="4"
    />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="phase === 'forbidden' ? 'برای ویرایش ساعات کاری، باید مدیر همین کسب‌وکار باشید.' : accessMessage ?? undefined"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش ساعات کاری باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <AppErrorState
      v-else-if="loadError"
      title="برنامهٔ هفته خوانده نشد"
      :description="loadError"
      retryable
      @retry="enterThenLoad()"
    />

    <template v-else>
      <p
        v-if="notConfigured"
        class="t-body-sm mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-foreground-secondary"
      >
        <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          این کسب‌وکار هنوز ساعت کاری ندارد؛ تا روزی را روشن نکنید، مشتری هیچ
          ساعتی برای رزرو نمی‌بیند.
        </span>
      </p>

      <OwnerAvailabilityEditorPanel
        scope="business"
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
        :offer-template="emptyDraft"
        @toggle="toggleDay"
        @add="addInterval"
        @change="setIntervalPart"
        @remove="removeInterval"
        @apply-template="applyTemplate"
        @save="onSave"
        @revert="onRevert"
        @dismiss-notice="() => { clearNotice(); clearActionError() }"
      />
    </template>

    <WqConfirm
      v-model:open="leaveConfirmOpen"
      title="خروج با تغییرات ذخیره‌نشده؟"
      description="ساعت‌هایی که عوض کرده‌اید ذخیره نشده‌اند؛ با خروج از بین می‌روند و رزرو مشتری همان برنامهٔ قبلی را می‌بیند."
      confirm-label="خروج"
      cancel-label="می‌مانم"
      icon="i-lucide-circle-alert"
      @confirm="settleLeave(true)"
      @cancel="settleLeave(false)"
    />
  </div>
</template>
