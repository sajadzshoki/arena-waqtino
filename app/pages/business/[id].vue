<script setup lang="ts">
/**
 * صفحهٔ جزئیات کسب‌وکار — placeholder برای فاز بعد.
 * فقط ساختار مسیر و اطلاعات اولیه را نمایش می‌دهد.
 */
definePageMeta({ access: 'public', tabbar: false })
useHead({ title: 'جزئیات کسب‌وکار' })

const route = useRoute()
const businessId = computed(() => route.params.id as string)
const services = useServices()

const { data: business, status } = await useAsyncData(
  `biz:${businessId.value}`,
  () => services.businesses.getById(businessId.value),
  { watch: [businessId] }
)

const { data: categories } = await useAsyncData(
  'biz:categories',
  () => services.businesses.listCategories()
)

const category = computed(() => {
  if (!business.value || !categories.value) return null
  return categories.value.find(c => c.id === business.value?.categoryId) ?? null
})

const { trackView } = useRecentlyViewed()

// ثبت مشاهده هنگام ورود
onMounted(() => {
  if (businessId.value) trackView(businessId.value)
})
</script>

<template>
  <div>
    <AppBackHeader title="جزئیات کسب‌وکار" />

    <!-- بارگذاری -->
    <div v-if="status === 'pending'" class="flex flex-col gap-4">
      <USkeleton class="aspect-[16/9] w-full rounded-xl" />
      <USkeleton class="h-6 w-48 rounded" />
      <USkeleton class="h-4 w-32 rounded" />
      <USkeleton class="h-20 w-full rounded-xl" />
    </div>

    <!-- محتوا -->
    <div v-else-if="business">
      <!-- تصویر cover -->
      <div class="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-muted">
        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-soft to-surface-muted">
          <UIcon :name="category?.icon ?? 'i-lucide-store'" class="size-16 text-primary/40" />
        </div>
        <img
          v-if="business.coverImageUrl"
          :src="business.coverImageUrl"
          :alt="`تصویر ${business.name}`"
          class="absolute inset-0 size-full object-cover"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        >
      </div>

      <!-- اطلاعات اصلی -->
      <div class="mt-4 flex flex-col gap-2">
        <h1 class="t-h1 text-foreground-strong">{{ business.name }}</h1>
        <span class="t-body-sm text-foreground-secondary">{{ category?.name }}</span>
        <div class="flex items-center gap-3">
          <WqRating
            v-if="business.rating.count > 0"
            :value="business.rating.average"
            :count="business.rating.count"
          />
          <UBadge v-if="business.isVerified" color="primary" variant="soft" size="sm">
            <UIcon name="i-lucide-circle-check" class="me-1 size-3" />
            تأییدشده
          </UBadge>
        </div>
      </div>

      <!-- توضیحات -->
      <p class="t-body mt-4 text-foreground-secondary">
        {{ business.description }}
      </p>

      <!-- آدرس -->
      <div class="mt-4 rounded-xl border border-line bg-surface p-4">
        <WqMetaRow
          icon="i-lucide-map-pin"
          label="آدرس"
          :value="`${business.address.district}، ${business.address.street ?? ''}، ${business.address.city}`"
        />
        <WqMetaRow
          v-if="business.phone"
          icon="i-lucide-phone"
          label="تلفن"
          :value="formatPhoneFa(business.phone)"
        />
      </div>

      <!-- placeholder برای خدمات و نوبت‌دهی -->
      <div class="mt-6 rounded-xl border border-dashed border-line-strong bg-surface-muted px-6 py-8 text-center">
        <UIcon name="i-lucide-calendar-clock" class="mx-auto size-10 text-foreground-muted" />
        <p class="t-body-sm mt-3 text-foreground-secondary">
          انتخاب خدمات و رزرو نوبت در فاز بعدی فعال می‌شود.
        </p>
        <UBadge color="neutral" variant="soft" size="sm" class="mt-3">placeholder</UBadge>
      </div>
    </div>

    <!--NotFound -->
    <div v-else class="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <UIcon name="i-lucide-store" class="size-12 text-foreground-muted" />
      <p class="t-h3 text-foreground-secondary">کسب‌وکار یافت نشد</p>
      <WqButton variant="tertiary" icon="i-lucide-arrow-right" @click="navigateTo('/')">
        بازگشت به خانه
      </WqButton>
    </div>
  </div>
</template>
