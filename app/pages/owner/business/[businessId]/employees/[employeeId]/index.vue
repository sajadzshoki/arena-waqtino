<script setup lang="ts">
/**
 * جزئیات یک پرسنل — همان رکوردی که مشتری در گام «انتخاب پرسنل» می‌بیند، به‌همراه
 * آنچه فقط مدیر باید بداند: وضعیت و پیامدش، سرویس‌های اختصاصی، تماس، وضعیت اتصال
 * حساب، نوبت‌های درگیر، و اینکه حذف مجاز است یا نه.
 *
 * deep link و refresh از همین مسیر کار می‌کنند: رکورد با `loadOne` خوانده
 * می‌شود (نه «حالت انتخاب‌شدهٔ فرار در حافظه») و اگر پرسنل نباشد یا به این
 * کسب‌وکار تعلق نداشته باشد، همان Not Found عمدی نمایش داده می‌شود.
 * اکشن‌ها از `useEmployeeActions`‌اند — یعنی دقیقاً همان رفتارِ شیتِ فهرست.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const routeEmployeeId = computed(() => String(route.params.employeeId ?? ''))

const { phase, businessId, boot, business, accessMessage } = useOwnerBusinessEntry(routeBusinessId)

const { ensure, loadOne, find } = useBusinessEmployees(businessId)
const {
  target: actionTarget,
  removeOpen,
  removeMode,
  removing,
  toggling,
  requestRemove,
  toggleStatus,
  confirmPrimaryAction
} = useEmployeeActions(businessId)

const {
  open: assignmentOpen,
  rows: assignmentRows,
  selectedCount: assignmentSelected,
  danglingCount: assignmentDangling,
  dirty: assignmentDirty,
  saving: assignmentSaving,
  error: assignmentError,
  start: startAssignment,
  toggle: toggleAssignment,
  selectAllActive: selectAllActiveServices,
  clearAll: clearAllServices,
  save: saveAssignment
} = useEmployeeAssignment(
  businessId,
  computed(() => routeEmployeeId.value)
)

const { items: serviceItems, rowsFor, nameOf, load: loadServiceOptions } = useEmployeeServiceOptions(businessId)

const detailLoading = ref(false)
const missing = ref(false)
const loadError = ref<string | null>(null)

/** رکورد از کش مخزن خوانده می‌شود؛ نوشتن‌ها همان‌جا را به‌روز می‌کنند. */
const employee = computed(() => find(routeEmployeeId.value))
const statusMeta = computed(() => (employee.value ? employeeStatusMeta(employee.value.status) : null))
const toggle = computed(() => statusMeta.value?.toggle ?? null)

const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

const basePath = computed(() => (businessId.value ? `/owner/business/${businessId.value}` : '/owner'))
const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/employees` : '/owner'
)

/**
 * ردیف‌های سرویس این نفر، به همان ترتیب فهرست سرویس‌ها (+ اختصاص‌های معلقِ آخر) —
 * شناسهٔ خام هرگز نمایش داده نمی‌شود؛ اگر سرویس حذف شده باشد برچسب صادقانه می‌آید
 * و موقع ذخیرهٔ اختصاص‌ها پاک می‌شود.
 */
const assignedRows = computed(() => {
  const ids = employee.value?.serviceIds ?? []
  const known = new Set(serviceItems.value.map(s => s.id))
  const ordered = rowsFor(ids).filter(row => row.selected)
  const rows = ordered.map(row => ({
    id: row.id,
    name: row.name,
    inactive: row.status !== 'active',
    statusLabel: serviceStatusLabel(row.status)
  }))
  const dangling = ids
    .filter(id => !known.has(id))
    .map(id => ({ id, name: nameOf(id), inactive: true, statusLabel: 'دیگر در فهرست نیست' }))
  return [...rows, ...dangling]
})

const rows = computed(() => {
  const item = employee.value
  if (!item) return []
  const out: Array<{ icon: string; label: string; value?: string }> = [
    {
      icon: 'i-lucide-calendar-clock',
      label: 'نوبت‌ها',
      value: item.liveBookingCount > 0
        ? `${toFaDigits(item.liveBookingCount)} نوبت پیش‌رو · ${toFaDigits(item.bookingCount)} نوبت در مجموع`
        : (item.bookingCount > 0
            ? `${toFaDigits(item.bookingCount)} نوبت در تاریخچه`
            : 'هنوز نوبتی به این نفر متصل نیست')
    },
    {
      icon: 'i-lucide-tags',
      label: 'سرویس‌ها',
      value: item.serviceIds.length > 0
        ? `${toFaDigits(item.activeServiceCount)} سرویس فعال از ${toFaDigits(item.serviceIds.length)} اختصاص`
        : 'بدون سرویس اختصاصی'
    }
  ]
  if (item.createdAt) out.push({ icon: 'i-lucide-calendar-plus', label: 'افزوده شد', value: formatFaDate(item.createdAt) })
  if (item.updatedAt) out.push({ icon: 'i-lucide-history', label: 'آخرین ویرایش', value: formatFaDate(item.updatedAt) })
  return out
})

useHead({
  title: computed(() => (employee.value ? `پرسنل ${employee.value.displayName}` : 'جزئیات پرسنل'))
})

async function enterThenLoad(): Promise<void> {
  await boot()
  if (phase.value !== 'ok') return
  detailLoading.value = true
  missing.value = false
  loadError.value = null
  const result = await loadOne(routeEmployeeId.value)
  if (result.missing) missing.value = true
  else if (result.message) loadError.value = result.message
  else if (result.employee) await Promise.all([ensure(true), loadServiceOptions()])
  detailLoading.value = false
}

onMounted(enterThenLoad)
watch([routeBusinessId, routeEmployeeId], () => {
  void enterThenLoad()
})

async function onToggle(): Promise<void> {
  if (employee.value) await toggleStatus(employee.value)
}

/**
 * «حذف شد» یعنی دیگر صفحه‌ای نیست — به فهرست برمی‌گردیم. «غیرفعال شد» (حالت
 * بلوکهٔ سیاست) همان‌جا می‌ماند و وضعیت تازه را نشان می‌دهد.
 */
async function onConfirmPrimaryAction(): Promise<void> {
  const result = await confirmPrimaryAction()
  if (result === 'removed') await navigateTo(listPath.value, { replace: true })
}

async function onAssignmentSave(): Promise<void> {
  const out = await saveAssignment()
  if (out === 'saved') {
    toast.success('اختصاص سرویس‌ها ذخیره شد؛ در انتخاب پرسنلِ رزرو هم همین است.', 'i-lucide-tags')
  }
  else if (out === 'unchanged') {
    toast.info('تغییری ایجاد نشده بود.')
  }
}
</script>

<template>
  <div class="pb-8">
    <AppBackHeader
      title="جزئیات پرسنل"
      :subtitle="business?.name"
      :to="listPath"
    >
      <template v-if="employee" #actions>
        <WqButton
          size="sm"
          variant="secondary"
          icon="i-lucide-pen-line"
          :to="`${basePath}/employees/${routeEmployeeId}/edit`"
        >
          ویرایش
        </WqButton>
      </template>
    </AppBackHeader>

    <AppLoadingState
      v-if="phase === 'loading' || detailLoading"
      label="پرسنل خوانده می‌شود…"
      :rows="4"
    />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppEmptyState
      v-else-if="missing"
      icon="i-lucide-file-question"
      title="چنین پرسنلی در این کسب‌وکار نیست"
      description="ممکن است حذف شده باشد یا نشانی متعلق به کسب‌وکار دیگری باشد؛ برای همین جزئیاتش نمایش داده نمی‌شود."
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
      @retry="enterThenLoad"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش مدیریت باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <template v-else-if="employee">
      <!-- ۱) هویت + وضعیت -->
      <section
        class="rounded-xl border bg-surface p-4"
        :class="statusMeta?.bookable ? 'border-line' : 'border-dashed border-line-strong'"
      >
        <div class="flex items-start gap-3">
          <WqAvatar :name="employee.displayName" :src="employee.avatarUrl" size="lg" />
          <div class="min-w-0 flex-1">
            <h1 class="t-h3 text-foreground-strong">{{ employee.displayName }}</h1>
            <p v-if="employee.title" class="t-body-sm mt-0.5 text-foreground-secondary">
              {{ employee.title }}
            </p>
          </div>
          <OwnerEmployeeStatusBadge class="shrink-0" :status="employee.status" />
        </div>

        <dl class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <div v-if="employee.phone" class="flex items-center gap-1.5">
            <dt class="sr-only">شمارهٔ تماس</dt>
            <dd class="t-body-sm t-num inline-flex items-center gap-1.5 text-foreground-secondary" dir="ltr">
              <UIcon name="i-lucide-phone" class="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
              {{ formatPhoneFa(employee.phone) }}
            </dd>
          </div>
          <div v-else class="t-caption text-foreground-muted">
            شمارهٔ تماسی ثبت نشده است.
          </div>
        </dl>

        <div class="mt-4 flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2.5">
          <UIcon :name="statusMeta?.icon ?? 'i-lucide-info'" class="mt-0.5 size-4 shrink-0 text-foreground-secondary" aria-hidden="true" />
          <p class="t-caption text-foreground-secondary">
            {{ statusMeta?.hint }}
            <span v-if="employee.liveBookingCount > 0">
              این نفر {{ toFaDigits(employee.liveBookingCount) }} نوبت پیش‌رو هم دارد.
            </span>
          </p>
        </div>

        <!-- اتصال حساب: فقط اطلاع، بدون دکمهٔ جعلی «دعوت‌نامه» (فاز ۱۰) -->
        <p class="t-caption mt-2 flex items-start gap-1.5 text-foreground-muted">
          <UIcon
            :name="employee.linkedAccount.state === 'linked' ? 'i-lucide-link' : 'i-lucide-link-2'"
            class="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span v-if="employee.linkedAccount.state === 'linked'">
            به یک حساب کاربری وقتینو متصل است؛ ورود به فضای کاری پرسنل در همان فاز
            ساخته می‌شود.
          </span>
          <span v-else>
            بدون حساب کاربری هم می‌توان پرسنل داشت؛ اتصال حساب، چرخهٔ نوبت‌دهی را
            عوض نمی‌کند.
          </span>
        </p>
      </section>

      <!-- ۲) سرویس‌های اختصاصی -->
      <WqSectionHeader
        title="سرویس‌هایی که انجام می‌دهد"
        subtitle="همین رابطه تعیین می‌کند او در گام «انتخاب پرسنل» کدام سرویس‌ها دیده شود."
      >
        <ul v-if="assignedRows.length > 0" class="flex flex-col gap-2">
          <li
            v-for="row in assignedRows"
            :key="row.id"
            class="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5"
          >
            <UIcon
              :name="row.inactive ? 'i-lucide-circle-dashed' : 'i-lucide-tags'"
              class="size-4 shrink-0 text-foreground-muted"
              aria-hidden="true"
            />
            <span class="t-body-sm min-w-0 flex-1 truncate text-foreground">{{ row.name }}</span>
            <span v-if="row.inactive" class="t-caption shrink-0 text-foreground-muted">
              {{ row.statusLabel }}
            </span>
          </li>
        </ul>

        <p v-else class="t-body-sm rounded-xl border border-dashed border-line-strong bg-surface p-3 text-foreground-secondary">
          هنوز سرویسی به این نفر اختصاص نیافته؛ به همین دلیل در انتخاب پرسنلِ هیچ
          سرویسی دیده نمی‌شود. خطا نیست — ولی اگر قرار است نوبت بگیرد، یک سرویس
          اختصاصش بدهید.
        </p>

        <WqButton
          variant="secondary"
          block
          class="mt-3 min-h-12"
          icon="i-lucide-list-checks"
          @click="startAssignment()"
        >
          {{ assignedRows.length > 0 ? 'مدیریت سرویس‌ها' : 'اختصاص سرویس‌ها' }}
        </WqButton>
      </WqSectionHeader>

      <!-- ۳) متاداده (فقط آنچه واقعاً ثبت شده) -->
      <SettingsSection title="نوبت‌ها و سابقهٔ این نفر">
        <WqMetaRow
          v-for="row in rows"
          :key="row.label"
          :icon="row.icon"
          :label="row.label"
          :value="row.value"
        />
      </SettingsSection>

      <!-- ۴) اکشن‌های چرخهٔ حیات -->
      <WqSectionHeader title="اکشن‌ها" subtitle="هر کدام همان لحظه در فهرست پرسنل و رزرو مشتری اعمال می‌شود.">
        <div class="flex flex-col gap-2">
          <WqButton
            v-if="toggle"
            block
            class="min-h-12"
            :variant="toggle.to === 'inactive' ? 'secondary' : 'primary'"
            :icon="toggle.to === 'inactive' ? 'i-lucide-eye-off' : 'i-lucide-circle-check'"
            :loading="toggling"
            @click="onToggle"
          >
            {{ toggle.label }}
          </WqButton>
          <p v-if="toggle" class="t-caption text-center text-foreground-muted">
            {{ toggle.consequence }}
          </p>

          <WqButton
            variant="tertiary"
            block
            class="min-h-12"
            icon="i-lucide-pen-line"
            :to="`${basePath}/employees/${employee.id}/edit`"
          >
            ویرایش اطلاعات پرسنل
          </WqButton>

          <USeparator class="my-1" />

          <WqButton
            variant="destructive"
            block
            class="min-h-12"
            icon="i-lucide-user-minus"
            @click="requestRemove(employee)"
          >
            حذف از این کسب‌وکار
          </WqButton>
          <p v-if="!employee.removePolicy.canRemove" class="t-caption text-center text-warning">
            {{ employee.removePolicy.hint }}
          </p>
        </div>
      </WqSectionHeader>
    </template>

    <OwnerEmployeeRemoveDialog
      v-model:open="removeOpen"
      :employee="actionTarget ?? employee"
      :mode="removeMode"
      :loading="removing"
      @confirm="onConfirmPrimaryAction"
    />
    <OwnerEmployeeAssignmentSheet
      v-model:open="assignmentOpen"
      :employee-name="employee?.displayName"
      :rows="assignmentRows"
      :selected-count="assignmentSelected"
      :dangling-count="assignmentDangling"
      :dirty="assignmentDirty"
      :saving="assignmentSaving"
      :error="assignmentError"
      @toggle="toggleAssignment"
      @select-active="selectAllActiveServices"
      @clear-all="clearAllServices"
      @save="onAssignmentSave"
    />
  </div>
</template>
