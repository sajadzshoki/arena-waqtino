<script setup lang="ts">
/**
 * اطلاعات کسب‌وکار — پروفایل پایه، فقط‌خواندنی.
 *
 * فاز ۸ «خواندن» نمایه را ممکن می‌کند، نه ویرایش آن؛ پس هیچ فرم و دکمهٔ
 * ذخیره‌ای اینجا نیست (دکمهٔ ذخیره‌ای که چیزی ذخیره نکند از همین پروژه
 * رد شده). مسیر ویرایش در همان پاورقی صادقانه اعلام می‌شود.
 */
import { formatFaDate } from '~/utils/datetime'

definePageMeta({ access: 'auth', capability: 'business', tabbar: false })

const route = useRoute()
const routeBusinessId = computed(() => String(route.params.businessId ?? ''))
const { phase, businessId, boot, business, category, accessMessage } =
  useOwnerBusinessEntry(routeBusinessId)

const accessKind = computed(() =>
  phase.value === 'forbidden' || phase.value === 'not_found' ? phase.value : null
)

onMounted(boot)

const rows = computed(() => {
  const b = business.value
  if (!b) return null
  const rating =
    b.rating.count > 0
      ? `${new Intl.NumberFormat('fa-IR').format(b.rating.average)} از ۵ · ${toFaDigits(b.rating.count)} نظر`
      : 'هنوز نظری ثبت نشده'
  return {
    status: businessStatusMeta(b.status),
    phone: b.phone ? formatPhoneFa(b.phone) : 'شماره‌ای ثبت نشده',
    address: [b.address.street, b.address.district, b.address.city].filter(Boolean).join('، '),
    rating,
    since: formatFaDate(b.createdAt),
    gallery: toFaDigits(b.gallery.length),
    verified: b.isVerified ? 'تأییدشده' : 'تأیید نشده'
  }
})
</script>

<template>
  <div class="pb-6">
    <AppBackHeader
      title="اطلاعات کسب‌وکار"
      :subtitle="business?.name ?? undefined"
      :to="businessId ? `/owner/business/${businessId}` : '/owner'"
    />

    <AppLoadingState v-if="phase === 'loading'" label="در حال دریافت اطلاعات…" :rows="5" />

    <OwnerAccessState
      v-else-if="accessKind"
      :access="accessKind"
      :message="accessMessage"
    />

    <AppErrorState
      v-else-if="phase === 'error'"
      title="اطلاعات کسب‌وکار باز نشد"
      :description="accessMessage ?? undefined"
      retryable
      @retry="boot"
    />

    <template v-else-if="business && rows">
      <SettingsSection title="هویت">
        <SettingsInfoRow
          icon="i-lucide-store"
          title="نام کسب‌وکار"
          :value="business.name"
        />
        <SettingsInfoRow
          icon="i-lucide-tags"
          title="دستهٔ فعالیت"
          :value="category?.name ?? 'نامشخص'"
        />
        <SettingsInfoRow
          icon="i-lucide-badge-check"
          title="تأیید پلتفرم"
          :value="rows.verified"
        />
        <SettingsInfoRow
          icon="i-lucide-info"
          title="وضعیت کسب‌وکار"
          :subtitle="rows.status.hint"
        >
          <template #trailing>
            <BusinessStatusBadge :status="business.status" />
          </template>
        </SettingsInfoRow>
      </SettingsSection>

      <SettingsSection title="تماس و نشانی">
        <SettingsInfoRow
          icon="i-lucide-phone"
          title="تلفن"
          :value="rows.phone"
          ltr
        />
        <SettingsInfoRow
          icon="i-lucide-map-pin"
          title="نشانی"
          :value="rows.address"
        />
        <SettingsInfoRow
          icon="i-lucide-images"
          title="تصویرهای گالری"
          :value="`${rows.gallery} تصویر`"
        />
      </SettingsSection>

      <SettingsSection title="امتیاز و عضویت">
        <SettingsInfoRow
          icon="i-lucide-star"
          title="میانگین امتیاز"
          :value="rows.rating"
        />
        <SettingsInfoRow
          icon="i-lucide-calendar-plus"
          title="عضویت در وقتینو"
          :value="rows.since"
        />
      </SettingsSection>

      <SettingsSection title="دربارهٔ کسب‌وکار">
        <p class="t-body-sm py-3 leading-7 text-foreground-secondary">
          {{ business.description }}
        </p>
        <template #footer>
          ویرایش این اطلاعات، افزودن سرویس و معرفی پرسنل در فازهای بعدی فضای
          کاری اضافه می‌شود؛ تا آن زمان همین صفحه فقط‌خواندنی است.
        </template>
      </SettingsSection>
    </template>
  </div>
</template>
