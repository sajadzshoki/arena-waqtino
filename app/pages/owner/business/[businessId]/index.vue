<script setup lang="ts">
/**
 * داشبورد مدیر کسب‌وکار — قلب فضای کاری.
 *
 * سلسله‌مراتب (از «الان» تا «کلیات»):
 *   زمینهٔ کسب‌وکار → نوبت بعدی → نوبت‌های امروز → شاخص‌ها → دسترسی سریع → نمای کلی
 *
 * چیزی که این صفحه انجام *نمی‌دهد*: فیلتر رزروها، جمع‌کردن آمار، ترجمهٔ
 * وضعیت، یا حل‌کردن زمینه. همه در لایهٔ سرویس/کامپوزبل است
 * (`useOwnerDashboard` + `useOwnerBusinessEntry`)؛ پس فردا که صفحهٔ «مدیریت
 * نوبت‌ها» ساخته شود، همان داده‌ها آن صفحه را هم تغذیه می‌کند.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: true })

const route = useRoute()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))

// مالکیت و «زمینه» — تصمیم مشترک همهٔ صفحه‌های فضای کاری
const {
  phase,
  businessId,
  contextBusinessId,
  boot,
  business,
  category,
  summary,
  switching,
  accessMessage
} = useOwnerBusinessEntry(routeBusinessId)
const { count: ownedCount } = useOwnerBusinesses()
const switcherOpen = useState<boolean>('owner:ui:switcher', () => false)
const {
  data: dashboard,
  error: dashboardError,
  refreshing,
  ensure: ensureDashboard,
  refresh: refreshDashboard
} = useOwnerDashboard(businessId)

useHead({
  title: computed(() =>
    business.value ? `فضای کاری — ${business.value.name}` : 'فضای کاری کسب‌وکار'
  )
})

/**
 * URL و زمینه باید «جفت» باشند. در یک فریمِ میان سوییچ (زمینه=B، URL هنوز=A)
 * صفحه کل بدنه را اسکلت می‌کند تا دادهٔ A زیرِ نام B دیده نشود.
 */
const aligned = computed(
  () => businessId.value !== null && contextBusinessId.value === businessId.value
)

const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

/** همهٔ شاخص‌ها صفر → نوار آمار عمداً نمایش داده نمی‌شود (عدد بی‌معنی نه). */
const hasActivity = computed(() => {
  const m = dashboard.value?.metrics
  if (!m) return false
  return m.todayCount > 0 || m.upcomingCount > 0 || m.pendingCount > 0
})

async function enterThenLoad(): Promise<void> {
  await boot()
  // دادهٔ داشبورد فقط بعد از پذیرش مالکیت و برای *همان* businessId خوانده
  // می‌شود؛ پیش از آن، صفحه اسکلت است (نه دادهٔ کسب‌وکار قبلی).
  if (phase.value === 'ok') await ensureDashboard()
}

onMounted(enterThenLoad)
// سوییچ از همین صفحه (ناوبری به /owner/business/<id> دیگر): URL مرجع است
watch(businessId, id => {
  if (id) void enterThenLoad()
})
</script>

<template>
  <div class="pb-4">
    <!-- هنوز زمینه حل نشده ( یا در میانهٔ سوییچ) → اسکلت، نه دادهٔ قبلی -->
    <OwnerDashboardSkeleton v-if="phase === 'loading' || !aligned" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="فضای کاری باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <!-- زمینه حل شده اما رکورد کسب‌وکار هنوز نیست (مثلاً فهرست خالی) → اسکلت -->
    <OwnerDashboardSkeleton v-else-if="!business || !summary" />

    <template v-else>
      <!-- ۱) زمینه: کدام کسب‌وکار را مدیریت می‌کنم -->
      <OwnerBusinessHeader
        :business="business"
        :category="category"
        :can-switch="ownedCount > 1"
        :switching="switching"
        @switch="switcherOpen = true"
      />

      <AppLoadingState
        v-if="!dashboard"
        label="در حال دریافت نوبت‌ها و نمای فعالیت…"
        :rows="4"
      />

      <template v-else>
        <p
          v-if="dashboardError"
          class="mt-3 flex items-center gap-2 rounded-xl border border-warning-border bg-warning-soft px-3 py-2"
          role="status"
        >
          <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span class="t-caption flex-1 text-foreground-secondary">{{ dashboardError }}</span>
          <WqButton variant="tertiary" size="md" class="min-h-12 px-3" :loading="refreshing" @click="refreshDashboard()">
            تلاش دوباره
          </WqButton>
        </p>

        <!-- ۲) نزدیک‌ترین نوبت -->
        <OwnerNextAppointment v-if="dashboard.next" :item="dashboard.next" class="mt-3" />

        <!-- ۳) امروز -->
        <section class="mt-6">
          <WqSectionHeader title="نوبت‌های امروز" />
          <OwnerScheduleList v-if="dashboard.today.length" :items="dashboard.today" />
          <div
            v-else
            class="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface-muted px-4 py-4"
          >
            <UIcon name="i-lucide-calendar-off" class="size-5 shrink-0 text-foreground-muted" aria-hidden="true" />
            <p class="t-body-sm text-foreground-secondary">
              امروز نوبت فعالی ندارید؛ نوبت‌های لغوشده در این شمارش نیستند.
            </p>
          </div>
        </section>

        <!-- ۴) شاخص‌ها — فقط وقتی معنا دارند -->
        <section v-if="hasActivity" class="mt-6">
          <WqSectionHeader title="نمای فعالیت" />
          <OwnerMetricsStrip :metrics="dashboard.metrics" />
        </section>

        <!-- ۵) اکشن‌های سریع -->
        <section class="mt-6">
          <WqSectionHeader title="دسترسی سریع" />
          <OwnerQuickActions :business-id="routeBusinessId" />
        </section>

        <!-- کسب‌وکار بدون فعالیت: قدم بعدی، نه آمار صفر -->
        <section v-if="!hasActivity" class="mt-6 rounded-xl border border-line bg-surface p-4">
          <h3 class="t-h3 flex items-center gap-2 text-foreground">
            <UIcon name="i-lucide-signpost-big" class="size-5 shrink-0 text-primary" aria-hidden="true" />
            قدم بعدی
          </h3>
          <p class="t-body-sm mt-1.5 text-foreground-secondary">
            هنوز نوبتی برای این کسب‌وکار ثبت نشده. تا فعال‌شدن مدیریت سرویس و
            پرسنل، می‌توانید نمایهٔ کسب‌وکار را ببینید و از مشتریان بخواهید از
            همان‌جا نوبت بگیرند.
          </p>
          <div class="mt-3 flex flex-col gap-2 sm:flex-row">
            <WqButton size="lg" class="min-h-12" icon="i-lucide-eye" :to="`/business/${routeBusinessId}`">
              دید مشتری
            </WqButton>
            <WqButton
              variant="secondary"
              size="lg"
              class="min-h-12"
              icon="i-lucide-building-2"
              :to="`/owner/business/${routeBusinessId}/info`"
            >
              اطلاعات و تماس
            </WqButton>
          </div>
        </section>

        <!-- ۶) نمای کلی کسب‌وکار -->
        <div class="mt-7">
          <OwnerBusinessSummary :owned="summary" />
        </div>
      </template>
    </template>

    <OwnerBusinessSwitcher />
  </div>
</template>
