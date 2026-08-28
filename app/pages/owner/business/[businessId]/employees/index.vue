<script setup lang="ts">
/**
 * فهرست پرسنل یک کسب‌وکار — نمای مدیر (فعال و غیرفعال با هم).
 *
 * سؤالی که این صفحه جواب می‌دهد: «چه افرادی در این کسب‌وکار خدمات ارائه
 * می‌دهند و کدام‌شان همین حالا قابل رزرو است؟» برای همین سلسله‌مراتب هر سطر
 * هویت ← وضعیت ← سرویس‌هاست؛ شمارهٔ تماس و پیامد وضعیت در سطح دوم می‌مانند.
 *
 * سه چیز عمدًا *نیست*: جدول دسکتاپی (روی موبایل خوانا نیست)، ردیف‌های
 * اکشنِ هاورشونده (موبایل هاور ندارد؛ شیتِ خودِ سطر هست)، و «دفترچهٔ آدرس
 * بدون زمینه» (زمینه از URL و لایهٔ مالکیت می‌آید؛ پرسنل کسب‌وکار الف در ب
 * نشان داده نمی‌شود چون کش per-businessId است).
 *
 * داده فقط از `useBusinessEmployees` (و برای نام سرویس‌ها از
 * `useBusinessServices`) می‌آید — همان کشی که نوشتن‌ها به‌روز می‌کنند.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const toast = useAppToast()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))

const { phase, businessId, contextBusinessId, boot, business, accessMessage } =
  useOwnerBusinessEntry(routeBusinessId)

const {
  items,
  counts,
  error,
  initializing,
  refreshing,
  ensure,
  refresh
} = useBusinessEmployees(businessId)

/** برای همین صفحه: کارت‌ها نام سرویس نشان می‌دهند، نه شناسه — از همان کش فاز ۹. */
const servicesStore = useBusinessServices(businessId)

const {
  target: actionTarget,
  sheetOpen,
  removeOpen,
  removeMode,
  removing,
  toggling,
  openActions,
  requestRemove,
  toggleStatus,
  confirmPrimaryAction
} = useEmployeeActions(businessId)

/** اختصاص سرویس از همین‌جا هم در دسترس است (شیت اکشن) — همان مسیرِ صفحهٔ جزئیات.
 * refs را تاپ‌لول destructuring می‌گیریم تا در template خودکار unwrap شوند. */
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
  computed(() => actionTarget.value?.id ?? null)
)

type EmployeeFilter = 'all' | 'active' | 'inactive'
const filter = useState<EmployeeFilter>('owner:employees:filter', () => 'all')

const filters = computed(() => [
  { id: 'all' as const, label: 'همه', count: counts.value.all },
  { id: 'active' as const, label: employeeStatusLabel('active'), count: counts.value.active },
  { id: 'inactive' as const, label: employeeStatusLabel('inactive'), count: counts.value.inactive }
])

const visible = computed(() =>
  filter.value === 'all' ? items.value : items.value.filter(e => e.status === filter.value)
)

/** URL و زمینه باید جفت باشند؛ وگرنه پرسنل یک کسب‌وکار زیرِ اسم دیگری نشان داده می‌شود. */
const aligned = computed(
  () => businessId.value !== null && contextBusinessId.value === businessId.value
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/employees` : '/owner'
)

/** شناسهٔ سرویس → نام (و اگر سرویس حذف شده باشد، برچسب صادقانه). */
function serviceNames(employee: { serviceIds: string[] }): string[] {
  return employee.serviceIds.map(id => servicesStore.find(id)?.name ?? 'سرویس حذف‌شده')
}

function openCreate(): void {
  navigateTo(`${listPath.value}/new`)
}
function openDetails(employee: { id: string }): void {
  navigateTo(`${listPath.value}/${employee.id}`)
}

async function enterThenLoad(): Promise<void> {
  await boot()
  // فهرست فقط بعد از پذیرش مالکیت و برای همان کسب‌وکار خوانده می‌شود
  if (phase.value === 'ok') {
    await Promise.all([ensure(), servicesStore.ensure()])
  }
}

onMounted(enterThenLoad)
watch(businessId, id => {
  if (id) void enterThenLoad()
})

/** «حذف شد» یعنی دیگر ردیفی نیست؛ کش فهرست همان لحظه پاکش می‌کند (بازخورد را
 * `useEmployeeActions` می‌دهد، پس این‌جا فقط منتظر می‌مانیم). */
async function onConfirmPrimaryAction(): Promise<void> {
  await confirmPrimaryAction()
}

/** ذخیرهٔ اختصاص‌ها از شیتِ فهرست — همان پیامدی که در صفحهٔ جزئیات دارد. */
async function onAssignmentSave(): Promise<void> {
  const out = await saveAssignment()
  if (out === 'saved') {
    toast.success('اختصاص سرویس‌ها ذخیره شد؛ در انتخاب پرسنلِ رزرو هم همین است.', 'i-lucide-tags')
  }
}
</script>

<template>
  <div class="pb-8">
    <AppBackHeader
      title="پرسنل"
      :subtitle="business?.name"
      :to="businessId ? `/owner/business/${businessId}` : '/owner'"
    >
      <template v-if="!accessKind && phase === 'ok'" #actions>
        <WqButton size="sm" icon="i-lucide-plus" @click="openCreate">
          افزودن
        </WqButton>
      </template>
    </AppBackHeader>

    <!-- زمینه هنوز حل نشده (یا در میانهٔ سوییچ) → اسکلت، نه دادهٔ کسب‌وکار قبلی -->
    <OwnerEmployeesSkeleton v-if="phase === 'loading' || !aligned" :rows="3" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش پرسنل باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <OwnerEmployeesSkeleton v-else-if="initializing" :rows="4" />

    <AppErrorState
      v-else-if="error"
      title="فهرست پرسنل باز نشد"
      :description="error"
      retryable
      @retry="refresh()"
    />

    <template v-else>
      <!-- فیلتر وضعیت: «چه کسی الان قابل رزرو است» با شمارش -->
      <div v-if="items.length > 0" class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <WqChip
          v-for="option in filters"
          :key="option.id"
          class="min-h-12 shrink-0"
          :selected="filter === option.id"
          @toggle="filter = option.id"
        >
          {{ option.label }}
          <span class="t-num text-foreground-muted">{{ toFaDigits(option.count) }}</span>
        </WqChip>
      </div>

      <p
        v-if="refreshing"
        class="mb-2 inline-flex items-center gap-1.5 t-caption text-foreground-muted"
      >
        <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
        در حال تازه‌سازی…
      </p>

      <!-- حالت خالی: توضیح می‌دهد بدون پرسنل چه اتفاقی می‌افتد، نه فقط «خالی است» -->
      <AppEmptyState
        v-if="items.length === 0"
        icon="i-lucide-users"
        title="هنوز پرسنلی ثبت نکرده‌اید"
        description="بدون پرسنل، مشتری در گام «انتخاب پرسنل» کسی را نمی‌بیند و نوبت‌ها به کسب‌وکار می‌چسبند. نخستین نفر را اضافه کنید و سرویس‌هایش را مشخص کنید."
      >
        <WqButton class="mt-1 min-h-12" icon="i-lucide-plus" @click="openCreate">
          افزودن نخستین پرسنل
        </WqButton>
      </AppEmptyState>

      <AppEmptyState
        v-else-if="visible.length === 0"
        icon="i-lucide-filter-x"
        :title="filter === 'active' ? 'پرسنل فعالی نیست' : 'پرسنل غیرفعالی نیست'"
        :description="filter === 'active'
          ? 'همهٔ پرسنل این کسب‌وکار فعلاً غیرفعلان؛ تا فعال‌سازی‌شان، در انتخاب پرسنلِ رزرو کسی نیست.'
          : 'این کسب‌وکار پرسنل غیرفعال ندارد — همه در انتخاب رزرو می‌مانند.'"
      >
        <WqButton variant="tertiary" class="mt-1 min-h-12" @click="filter = 'all'">
          نمایش همه ({{ toFaDigits(counts.all) }})
        </WqButton>
      </AppEmptyState>

      <ul v-else class="flex flex-col gap-2">
        <OwnerEmployeeCard
          v-for="employee in visible"
          :key="employee.id"
          :employee="employee"
          :service-names="serviceNames(employee)"
          @open="openDetails"
          @actions="openActions"
        />
      </ul>

      <p v-if="items.length > 0" class="t-caption mt-4 flex items-start gap-1.5 text-foreground-muted">
        <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" />
        <span>
          پرسنل غیرفعال در گام «انتخاب پرسنل» به مشتری نشان داده نمی‌شود، اما در همین
          فهرست و در تاریخچهٔ نوبت‌ها می‌ماند. حذف کار دیگری است.
        </span>
      </p>

      <WqButton
        v-if="items.length > 0"
        variant="secondary"
        block
        class="mt-4 min-h-12"
        icon="i-lucide-user-round-plus"
        @click="openCreate"
      >
        افزودن پرسنل
      </WqButton>
    </template>

    <!-- اکشن‌های خود سطر + دیالوگ حذف + شیت اختصاص سرویس (یک بار برای کل صفحه) -->
    <OwnerEmployeeActionsSheet
      v-model:open="sheetOpen"
      :employee="actionTarget"
      :toggling="toggling"
      @toggle="toggleStatus"
      @assign="startAssignment()"
      @remove="requestRemove"
    />
    <OwnerEmployeeRemoveDialog
      v-model:open="removeOpen"
      :employee="actionTarget"
      :mode="removeMode"
      :loading="removing"
      @confirm="onConfirmPrimaryAction"
    />
    <OwnerEmployeeAssignmentSheet
      v-model:open="assignmentOpen"
      :employee-name="actionTarget?.displayName"
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
