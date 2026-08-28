<script setup lang="ts">
/**
 * محور مدیریت کسب‌وکار — جایی که کاربر می‌فهمد «از اینجا چه چیزی را می‌توانم
 * مدیریت کنم» و همان‌جا می‌بیند چه چیزی هنوز ساخته نشده است.
 *
 * ردیف‌های «به‌زودی» عمداً کلیک‌پذیر نیستند: ردیف قفل‌شده با توضیح، صادقانه
 * است؛ دکمه‌ای که به صفحهٔ خالی برود نه.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const { phase, businessId, boot, business, summary, accessMessage } =
  useOwnerBusinessEntry(routeBusinessId)

const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

onMounted(boot)

const counts = computed(() => {
  const m = summary.value?.metrics
  if (!m) return null
  return {
    services: `${toFaDigits(m.serviceCount)} سرویس قابل رزرو`,
    servicesHint: `${toFaDigits(m.serviceCount)} سرویس قابل رزرو · وضعیت و قیمت از همین‌جا`,
    employees: m.employeeCount > 0 ? `${toFaDigits(m.employeeCount)} پرسنل` : 'بدون پرسنل',
    upcoming: `${toFaDigits(m.upcomingCount)} نوبت پیش‌رو`,
    pending: m.pendingCount > 0 ? `${toFaDigits(m.pendingCount)} در انتظار تأیید` : 'مورد بازی نیست'
  }
})
</script>

<template>
  <div class="pb-6">
    <AppBackHeader
      title="مدیریت کسب‌وکار"
      :subtitle="business?.name ?? undefined"
      :to="businessId ? `/owner/business/${businessId}` : '/owner'"
    />

    <AppLoadingState v-if="phase === 'loading'" label="در حال آماده‌سازی…" :rows="5" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="بخش مدیریت باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <template v-else-if="business">
      <SettingsSection
        title="همین حالا در دسترس"
        description="هر ردیف به یک صفحهٔ واقعی می‌رود؛ سرویس‌ها از فاز ۹ مدیریت می‌شوند"
      >
        <SettingsRow
          icon="i-lucide-building-2"
          title="اطلاعات و تماس"
          subtitle="نمایه‌ای که مشتریان می‌بینند"
          :to="`/owner/business/${businessId}/info`"
        />
        <SettingsRow
          icon="i-lucide-eye"
          title="دید مشتری"
          subtitle="کسب‌وکار را آن‌طور که مشتری می‌بیند"
          :to="`/business/${businessId}`"
        />
        <SettingsRow
          v-if="businessId"
          icon="i-lucide-tags"
          title="سرویس‌ها و قیمت‌ها"
          :subtitle="counts ? counts.servicesHint : 'ساخت، ویرایش، فعال و غیرفعال‌کردن سرویس‌ها'"
          :to="`/owner/business/${businessId}/services`"
        />
        <SettingsRow
          v-if="businessId"
          icon="i-lucide-list"
          title="کسب‌وکارهای من"
          subtitle="تغییر کسب‌وکاری که مدیریت می‌کنید"
          to="/owner/businesses"
        />
      </SettingsSection>

      <SettingsSection
        v-if="counts"
        title="در فازهای بعدی"
        description="این بخش‌ها هنوز ساخته نشده‌اند؛ برای همین باز نمی‌شوند."
      >
        <SettingsInfoRow
          icon="i-lucide-users"
          title="پرسنل"
          :value="counts.employees"
          subtitle="افزودن پرسنل و تخصیص نوبت"
          locked
        />
        <SettingsInfoRow
          icon="i-lucide-calendar-clock"
          title="ساعات کاری و دسترس‌پذیری"
          subtitle="روزها و بازهٔ زمانی پذیرش نوبت"
          locked
        />
        <SettingsInfoRow
          icon="i-lucide-clipboard-list"
          title="مدیریت نوبت‌ها"
          :value="counts.upcoming"
          :subtitle="`تأیید، لغو یا جابه‌جایی نوبت‌ها · ${counts.pending}`"
          locked
        />
        <SettingsInfoRow
          icon="i-lucide-message-square-text"
          title="نظرات مشتریان"
          subtitle="پاسخ به نظر و گزارش امتیاز"
          locked
        />

        <template #footer>
          شمارش‌های بالا از همان دادهٔ فضای کاری می‌آیند؛ وقتی هر بخش فعال
          شود، ردیفش کلیک‌پذیر می‌شود.
        </template>
      </SettingsSection>
    </template>
  </div>
</template>
