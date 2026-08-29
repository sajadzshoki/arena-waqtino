<script setup lang="ts">
/**
 * ساعات کاری و دسترس‌پذیری — نمای مدیر (فاز ۱۱).
 *
 * دو سوال این صفحه: «این کسب‌وکار چه روزهایی و چه ساعتی پذیرش دارد؟» و
 * «هر نفر از پرسنل داخل همین ساعت‌ها کجاست؟». پاسخ‌ها از *برنامهٔ هفته* ساخته
 * می‌شوند، نه از فهرست اسلات‌ها — اسلات‌ها لحظه‌ای از همین پنجره‌ها + مدت سرویس
 * + نوبت‌های موجود تولید می‌شوند.
 *
 * سه چیز عمدًا نیست: تقویم تعاملی، ردیف «تعطیلات/مرخصی» (فاز بعد)، و ویرایش
 * سریع ساعت در همین صفحه (ذخیره، صریح و در صفحهٔ ویرایش انجام می‌شود).
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))

const { phase, businessId, contextBusinessId, boot, business, accessMessage } =
  useOwnerBusinessEntry(routeBusinessId)

const {
  business: scheduleView,
  employees,
  initializing,
  refreshing,
  error,
  ensure,
  refresh
} = useBusinessAvailability(businessId)

const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)
/** URL و زمینه باید جفت بمانند، وگرنه ساعت کاری یک کسب‌وکار زیر اسم دیگری می‌آید. */
const aligned = computed(
  () => businessId.value !== null && contextBusinessId.value === businessId.value
)

const basePath = computed(() =>
  businessId.value ? `/owner/business/${businessId.value}/availability` : ''
)

const customCount = computed(() => employees.value.filter(e => e.source === 'custom').length)

async function enterThenLoad(): Promise<void> {
  await boot()
  if (phase.value === 'ok') await ensure()
}

onMounted(enterThenLoad)
watch(businessId, id => {
  if (id) void enterThenLoad()
})

function openBusinessEditor(): void {
  if (basePath.value) navigateTo(`${basePath.value}/business`)
}
</script>

<template>
  <div class="pb-6">
    <AppBackHeader
      title="ساعات کاری و دسترس‌پذیری"
      :subtitle="business?.name"
      :to="businessId ? `/owner/business/${businessId}` : '/owner'"
    >
      <template v-if="phase === 'ok' && !accessKind && aligned" #actions>
        <WqButton size="sm" variant="secondary" icon="i-lucide-pen-line" @click="openBusinessEditor">
          ویرایش
        </WqButton>
      </template>
    </AppBackHeader>

    <!-- زمینه هنوز حل نشده → اسکلت، نه دادهٔ کسب‌وکار قبلی -->
    <OwnerAvailabilitySkeleton v-if="phase === 'loading' || !aligned" :rows="3" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش ساعات کاری باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <OwnerAvailabilitySkeleton v-else-if="initializing" :rows="4" />

    <AppErrorState
      v-else-if="error"
      title="ساعات کاری خوانده نشد"
      :description="error"
      retryable
      @retry="refresh()"
    />

    <template v-else-if="scheduleView">
      <p v-if="refreshing" class="t-caption mb-2 inline-flex items-center gap-1.5 text-foreground-muted">
        <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" />
        در حال تازه‌سازی…
      </p>

      <OwnerBusinessHoursCard :view="scheduleView" @edit="openBusinessEditor" />

      <WqSectionHeader
        class="mt-5"
        title="ساعت کاری پرسنل"
        :subtitle="employees.length > 0
          ? `${toFaDigits(customCount)} نفر از ${toFaDigits(employees.length)} نفر برنامهٔ اختصاصی دارند.`
          : 'پرسنلی ثبت نشده که بتوان برایش ساعت مستقل تعریف کرد.'"
      >
        <AppEmptyState
          v-if="employees.length === 0"
          icon="i-lucide-users"
          title="بدون پرسنل، فقط ساعت کسب‌وکار اعمال می‌شود"
          description="تا کسی را اضافه نکنید، همهٔ سرویس‌ها در همان پنجرهٔ کاریِ بالا قابل رزرواند. ساعت کاری پرسنل را بعداً که نفرها را تعریف کردید تنظیم کنید."
        >
          <WqButton
            v-if="businessId"
            class="mt-1 min-h-12"
            icon="i-lucide-user-plus"
            :to="`/owner/business/${businessId}/employees`"
          >
            افزودن پرسنل
          </WqButton>
        </AppEmptyState>

        <ul v-else class="flex flex-col gap-2">
          <OwnerEmployeeHoursRow
            v-for="item in employees"
            :key="item.employeeId"
            :item="item"
            :to="`${basePath}/employees/${item.employeeId}`"
          />
        </ul>
      </WqSectionHeader>

      <p v-if="employees.length > 0" class="t-caption mt-2.5 text-foreground-muted">
        «مطابق کسب‌وکار» یعنی برنامهٔ مستقلی برای آن نفر ذخیره نشده؛ اگر ساعت
        کسب‌وکار عوض شود، ساعت او هم عوض‌شده خوانده می‌شود.
      </p>

      <p class="t-caption mt-4 flex items-start gap-1.5 rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-foreground-secondary">
        <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          تعطیلات مناسبتی، مرخصی و «آن روز خاص باز نیست» در این برنامه لحاظ
          نمی‌شود؛ ساختار ساعت کاری برای همان استثنائات آماده است و با فاز
          مدیریت نوبت‌ها فعال می‌شود.
        </span>
      </p>
    </template>
  </div>
</template>
