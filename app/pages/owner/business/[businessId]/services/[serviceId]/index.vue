<script setup lang="ts">
/**
 * جزئیات یک سرویس — همان رکوردی که مشتری در فهرست رزرو می‌بیند، به‌همراه
 * آنچه فقط مدیر باید بداند: وضعیت و پیامدش، نوبت‌های درگیر، و اینکه حذف
 * مجاز است یا نه.
 *
 * deep link و refresh از همین مسیر کار می‌کنند: رکورد با `loadOne` خوانده
 * می‌شود (نه «حالت انتخاب‌شدهٔ فرار در حافظه») و اگر سرویس نباشد یا به این
 * کسب‌وکار تعلق نداشته باشد، همان Not Found عمدی نمایش داده می‌شود.
 * اکشن‌ها از `useServiceActions`‌اند — یعنی دقیقاً همان رفتارِ شیتِ فهرست.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const routeServiceId = computed(() => String(route.params.serviceId ?? ''))

const { phase, businessId, boot, business, accessMessage } = useOwnerBusinessEntry(routeBusinessId)

const { ensure, loadOne, find } = useBusinessServices(businessId)
const {
  target: actionTarget,
  deleteOpen,
  deleteMode,
  deleting,
  toggling,
  requestDelete,
  toggleStatus,
  confirmPrimaryAction
} = useServiceActions(businessId)

const detailLoading = ref(false)
const missing = ref(false)
const loadError = ref<string | null>(null)

/** رکورد از کش مخزن خوانده می‌شود؛ نوشتن‌ها همان‌جا را به‌روز می‌کنند. */
const service = computed(() => find(routeServiceId.value))
const statusMeta = computed(() => (service.value ? serviceStatusMeta(service.value.status) : null))
const toggle = computed(() => statusMeta.value?.toggle ?? null)

const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

const basePath = computed(() => (businessId.value ? `/owner/business/${businessId.value}` : '/owner'))
const listPath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/services` : '/owner'
)

const rows = computed(() => {
  const item = service.value
  if (!item) return []
  const out: Array<{ icon: string; label: string; value?: string }> = [
    {
      icon: 'i-lucide-calendar-clock',
      label: 'نوبت‌ها',
      value: item.liveBookingCount > 0
        ? `${toFaDigits(item.liveBookingCount)} نوبت پیش‌رو · ${toFaDigits(item.bookingCount)} نوبت در مجموع`
        : (item.bookingCount > 0
            ? `${toFaDigits(item.bookingCount)} نوبت در تاریخچه`
            : 'هنوز نوبتی با این سرویس ثبت نشده')
    },
    { icon: 'i-lucide-timer', label: 'مدت سرویس', value: formatDurationFa(item.durationMinutes) },
    { icon: 'i-lucide-wallet', label: 'قیمت', value: formatToman(item.price) }
  ]
  if (item.createdAt) out.push({ icon: 'i-lucide-calendar-plus', label: 'افزوده شد', value: formatFaDate(item.createdAt) })
  if (item.updatedAt) out.push({ icon: 'i-lucide-history', label: 'آخرین ویرایش', value: formatFaDate(item.updatedAt) })
  return out
})

useHead({
  title: computed(() => (service.value ? `سرویس ${service.value.name}` : 'جزئیات سرویس'))
})

async function enterThenLoad(): Promise<void> {
  await boot()
  if (phase.value !== 'ok') return
  detailLoading.value = true
  missing.value = false
  loadError.value = null
  const result = await loadOne(routeServiceId.value)
  if (result.missing) missing.value = true
  else if (result.message) loadError.value = result.message
  else if (result.service) await ensure(true)
  detailLoading.value = false
}

onMounted(enterThenLoad)
watch([routeBusinessId, routeServiceId], () => {
  void enterThenLoad()
})

async function onToggle(): Promise<void> {
  if (service.value) await toggleStatus(service.value)
}

/**
 * «حذف شد» یعنی دیگر صفحه‌ای نیست — به فهرست برمی‌گردیم. «غیرفعال شد»
 * (حالت بلوکهٔ سیاست) همان‌جا می‌ماند و وضعیت تازه را نشان می‌دهد.
 */
async function onConfirmPrimaryAction(): Promise<void> {
  const result = await confirmPrimaryAction()
  if (result === 'deleted') await navigateTo(listPath.value, { replace: true })
}
</script>

<template>
  <div class="pb-8">
    <AppBackHeader
      title="جزئیات سرویس"
      :subtitle="business?.name"
      :to="listPath"
    >
      <template v-if="service" #actions>
        <WqButton
          size="sm"
          variant="secondary"
          icon="i-lucide-pen-line"
          :to="`${basePath}/services/${routeServiceId}/edit`"
        >
          ویرایش
        </WqButton>
      </template>
    </AppBackHeader>

    <AppLoadingState
      v-if="phase === 'loading' || detailLoading"
      label="سرویس خوانده می‌شود…"
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
      title="چنین سرویسی در این کسب‌وکار نیست"
      description="ممکن است حذف شده باشد یا نشانی متعلق به کسب‌وکار دیگری باشد؛ برای همین جزئیاتش نمایش داده نمی‌شود."
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
      @retry="enterThenLoad"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش مدیریت باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <template v-else-if="service">
      <!-- ۱) هویت + وضعیت (سلسله‌مراتب همان فهرست: نام ← وضعیت ← قیمت ← مدت) -->
      <section
        class="rounded-xl border bg-surface p-4"
        :class="statusMeta?.bookable ? 'border-line' : 'border-dashed border-line-strong'"
      >
        <div class="flex items-start gap-3">
          <h1 class="t-h3 min-w-0 flex-1 text-foreground-strong">{{ service.name }}</h1>
          <OwnerServiceStatusBadge class="shrink-0" :status="service.status" />
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <WqPrice :amount="service.price" size="lg" />
          <WqDuration :minutes="service.durationMinutes" />
        </div>

        <p class="t-body-sm mt-3 text-foreground-secondary">
          {{ service.description || 'این سرویس توضیحی ندارد؛ در فهرست مشتری فقط نام، قیمت و مدتش دیده می‌شود.' }}
        </p>

        <div class="mt-4 flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2.5">
          <UIcon :name="statusMeta?.icon ?? 'i-lucide-info'" class="mt-0.5 size-4 shrink-0 text-foreground-secondary" aria-hidden="true" />
          <p class="t-caption text-foreground-secondary">
            {{ statusMeta?.hint }}
            <span v-if="service.liveBookingCount > 0">
              این سرویس {{ toFaDigits(service.liveBookingCount) }} نوبت پیش‌رو هم دارد.
            </span>
          </p>
        </div>
      </section>

      <!-- ۲) اکشن‌های چرخهٔ حیات -->
      <WqSectionHeader title="اکشن‌ها" subtitle="هر کدام همان لحظه در فهرست و رزرو مشتری اعمال می‌شود.">
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
            :to="`${basePath}/services/${service.id}/edit`"
          >
            ویرایش اطلاعات سرویس
          </WqButton>

          <USeparator class="my-1" />

          <WqButton
            variant="destructive"
            block
            class="min-h-12"
            icon="i-lucide-trash-2"
            @click="requestDelete(service)"
          >
            حذف سرویس
          </WqButton>
          <p v-if="!service.deletePolicy.canDelete" class="t-caption text-center text-warning">
            {{ service.deletePolicy.hint }}
          </p>
        </div>
      </WqSectionHeader>

      <!-- ۳) متاداده (فقط آنچه واقعاً ثبت شده) -->
      <SettingsSection title="اطلاعات این سرویس">
        <WqMetaRow
          v-for="row in rows"
          :key="row.label"
          :icon="row.icon"
          :label="row.label"
          :value="row.value"
        />

        <template #footer>
          غیرفعال‌کردن با حذف فرق دارد: سرویس غیرفعال در این فهرست و در
          تاریخچهٔ نوبت‌ها می‌ماند و فقط برای رزرو تازه باز نمی‌شود.
        </template>
      </SettingsSection>
    </template>

    <OwnerServiceDeleteDialog
      v-model:open="deleteOpen"
      :service="actionTarget ?? service"
      :mode="deleteMode"
      :loading="deleting"
      @confirm="onConfirmPrimaryAction"
    />
  </div>
</template>
