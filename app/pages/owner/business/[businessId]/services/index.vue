<script setup lang="ts">
/**
 * فهرست سرویس‌های یک کسب‌وکار — نمای مدیر (فعال و غیرفعال با هم).
 *
 * سؤالی که این صفحه جواب می‌دهد: «این کسب‌وکار چه ارائه می‌دهد و کدام‌شان
 * همین حالا قابل رزرو است؟» برای همین سلسله‌مراتب هر سطر نام ← وضعیت ←
 * قیمت ← مدت است و توضیح در سطح دوم می‌ماند.
 *
 * سه چیز عمدًا *نیست*: جدول desktop-per-row (روی موبایل خوانا نیست)، ردیف‌های
 * اکشن هاور‌شونده (موبایل هاور ندارد؛ شیتِ خود سطر هست)، و «CRUD بدون زمینه»
 * (زمینه از URL و لایهٔ مالکیت می‌آید؛ دادهٔ کسب‌وکار الف در ب نمایش داده
 * نمی‌شود چون کش per-businessId است).
 *
 * داده فقط از `useBusinessServices` (و در نتیجه لایهٔ سرویس) می‌آید.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
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
} = useBusinessServices(businessId)

const {
  target: actionTarget,
  sheetOpen,
  deleteOpen,
  deleteMode,
  deleting,
  toggling,
  openActions,
  requestDelete,
  toggleStatus,
  confirmPrimaryAction
} = useServiceActions(businessId)

type ServiceFilter = 'all' | 'active' | 'inactive'
const filter = useState<ServiceFilter>('owner:services:filter', () => 'all')

const filters = computed(() => [
  { id: 'all' as const, label: 'همه', count: counts.value.all },
  { id: 'active' as const, label: serviceStatusLabel('active'), count: counts.value.active },
  { id: 'inactive' as const, label: serviceStatusLabel('inactive'), count: counts.value.inactive }
])

const visible = computed(() =>
  filter.value === 'all' ? items.value : items.value.filter(s => s.status === filter.value)
)

/** URL و زمینه باید جفت باشند؛ وگرنه دادهٔ کسب‌وکار دیگر زیرِ اسم این یکی نشان داده می‌شود. */
const aligned = computed(
  () => businessId.value !== null && contextBusinessId.value === businessId.value
)
const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/services` : '/owner'
)

function openCreate(): void {
  navigateTo(`${listPath.value}/new`)
}
function openDetails(service: { id: string }): void {
  navigateTo(`${listPath.value}/${service.id}`)
}

async function enterThenLoad(): Promise<void> {
  await boot()
  // فهرست فقط بعد از پذیرش مالکیت و برای همان کسب‌وکار خوانده می‌شود
  if (phase.value === 'ok') await ensure()
}

onMounted(enterThenLoad)
watch(businessId, id => {
  if (id) void enterThenLoad()
})
</script>

<template>
  <div class="pb-8">
    <AppBackHeader
      title="سرویس‌ها"
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
    <OwnerServicesSkeleton v-if="phase === 'loading' || !aligned" :rows="3" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش سرویس‌ها باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <OwnerServicesSkeleton v-else-if="initializing" :rows="4" />

    <AppErrorState
      v-else-if="error"
      title="فهرست سرویس‌ها باز نشد"
      :description="error"
      retryable
      @retry="refresh()"
    />

    <template v-else>
      <!-- فیلتر وضعیت: همان «چه چیزی الان قابل رزرو است» با شمارش -->
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

      <!-- حالت خالی: توضیح می‌دهد بدون سرویس چه اتفاقی می‌افتد، نه فقط «خالی است» -->
      <AppEmptyState
        v-if="items.length === 0"
        icon="i-lucide-tags"
        title="هنوز سرویسی نساخته‌اید"
        description="بدون سرویس، مشتری چیزی برای رزرو ندارد. نخستین سرویس را بسازید تا در صفحهٔ کسب‌وکار و جریان رزرو ظاهر شود."
      >
        <WqButton class="mt-1 min-h-12" icon="i-lucide-plus" @click="openCreate">
          افزودن نخستین سرویس
        </WqButton>
      </AppEmptyState>

      <AppEmptyState
        v-else-if="visible.length === 0"
        icon="i-lucide-filter-x"
        title="در این فیلتر سرویسی نیست"
        :description="filter === 'active'
          ? 'همهٔ سرویس‌های این کسب‌وکار فعلاً غیرفعلان؛ تا فعال‌سازی‌شان، رزرو تازه باز نمی‌شود.'
          : 'این کسب‌وکار سرویس غیرفعال ندارد — همه در فهرست رزرو مشتری‌اند.'"
      >
        <WqButton variant="tertiary" class="mt-1 min-h-12" @click="filter = 'all'">
          نمایش همه ({{ toFaDigits(counts.all) }})
        </WqButton>
      </AppEmptyState>

      <ul v-else class="flex flex-col gap-2">
        <OwnerServiceCard
          v-for="service in visible"
          :key="service.id"
          :service="service"
          @open="openDetails"
          @actions="openActions"
        />
      </ul>

      <p v-if="items.length > 0" class="t-caption mt-4 flex items-start gap-1.5 text-foreground-muted">
        <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" />
        <span>
          سرویس غیرفعال در رزرو تازه به مشتری نشان داده نمی‌شود، اما در همین فهرست
          و در تاریخچهٔ نوبت‌ها می‌ماند. حذف کار دیگری است.
        </span>
      </p>

      <WqButton
        v-if="items.length > 0"
        variant="secondary"
        block
        class="mt-4 min-h-12"
        icon="i-lucide-plus"
        @click="openCreate"
      >
        افزودن سرویس
      </WqButton>
    </template>

    <!-- اکشن‌های خود سطر + دیالوگ حذف (یک بار برای کل صفحه) -->
    <OwnerServiceActionsSheet
      v-model:open="sheetOpen"
      :service="actionTarget"
      :toggling="toggling"
      @toggle="toggleStatus"
      @delete="requestDelete"
    />
    <OwnerServiceDeleteDialog
      v-model:open="deleteOpen"
      :service="actionTarget"
      :mode="deleteMode"
      :loading="deleting"
      @confirm="confirmPrimaryAction"
    />
  </div>
</template>
