<script setup lang="ts">
/**
 * صفحهٔ جزئیات کسب‌وکار — تجربهٔ کامل اطلاعات + رزرو.
 */
definePageMeta({ access: 'public', tabbar: false })

const route = useRoute()
const businessId = computed(() => route.params.id as string)
const toast = useAppToast()

const {
  business,
  category,
  services: businessServices,
  employees,
  distance,
  loading,
  error,
  hasServices,
  hasEmployees,
  hasGallery,
  load
} = useBusinessDetails(businessId)

const { trackView } = useRecentlyViewed()
const { isFavorite, toggle, initialized } = useFavorites()

// بارگذاری داده‌ها
await load()

// ثبت مشاهده
onMounted(() => {
  if (businessId.value) trackView(businessId.value)
})

// Set page title
useHead({
  title: computed(() => business.value?.name ?? 'کسب‌وکار')
})

// Favorite toggle
async function toggleFavorite() {
  if (!initialized.value || !business.value) return
  const result = await toggle(business.value.id)
  toast.success(result ? 'به علاقه‌مندی‌ها اضافه شد.' : 'از علاقه‌مندی‌ها حذف شد.')
}

const isFav = computed(() => business.value ? isFavorite(business.value.id) : false)

// Booking handoff — navigate to booking flow
function bookService(serviceId: string) {
  if (!business.value) return
  navigateTo({
    path: '/booking',
    query: { business: business.value.id, service: serviceId }
  })
}

function bookGeneral() {
  if (!business.value) return
  navigateTo({
    path: '/booking',
    query: { business: business.value.id }
  })
}

// Share
async function share() {
  if (!business.value) return
  if (navigator.share) {
    try {
      await navigator.share({
        title: business.value.name,
        text: business.value.description,
        url: window.location.href
      })
    }
    catch {
      // User cancelled or error
    }
  }
  else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('لینک کپی شد.')
    }
    catch {
      toast.neutral('اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود.')
    }
  }
}
</script>

<template>
  <div class="pb-4">
    <AppBackHeader title="جزئیات کسب‌وکار" to="/" />

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col gap-4">
      <USkeleton class="aspect-[16/10] w-full rounded-xl" />
      <USkeleton class="h-7 w-3/4 rounded" />
      <USkeleton class="h-4 w-1/2 rounded" />
      <USkeleton class="h-20 w-full rounded-xl" />
      <USkeleton class="h-32 w-full rounded-xl" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <UIcon name="i-lucide-alert-circle" class="size-12 text-error" />
      <p class="t-h3 text-foreground">خطا در دریافت اطلاعات</p>
      <WqButton variant="secondary" icon="i-lucide-rotate-ccw" @click="load">
        تلاش مجدد
      </WqButton>
    </div>

    <!-- Not Found -->
    <div v-else-if="!business" class="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <UIcon name="i-lucide-store" class="size-12 text-foreground-muted" />
      <p class="t-h3 text-foreground-secondary">کسب‌وکار یافت نشد</p>
      <WqButton variant="tertiary" icon="i-lucide-arrow-right" @click="navigateTo('/')">
        بازگشت به خانه
      </WqButton>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Gallery -->
      <BusinessGallery
        v-if="hasGallery"
        :cover-image-url="business.coverImageUrl"
        :gallery="business.gallery"
        :business-name="business.name"
      />

      <!-- Hero Info -->
      <div class="mt-4 flex flex-col gap-3">
        <!-- Title + Favorite/Share -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h1 class="t-h1 text-foreground-strong">{{ business.name }}</h1>
            <p v-if="category" class="t-body-sm mt-1 text-foreground-secondary">
              <UIcon :name="category.icon" class="me-1 size-4 inline-block" />
              {{ category.name }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="pressable flex size-10 items-center justify-center rounded-full border border-line bg-surface"
              :aria-label="isFav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
              @click="toggleFavorite"
            >
              <UIcon
                name="i-lucide-heart"
                class="size-5"
                :class="isFav ? 'fill-error text-error' : 'text-foreground-secondary'"
              />
            </button>
            <WqIconButton
              icon="i-lucide-share-2"
              label="اشتراک‌گذاری"
              @click="share"
            />
          </div>
        </div>

        <!-- Rating + Meta -->
        <div class="flex flex-wrap items-center gap-3">
          <WqRating
            v-if="business.rating.count > 0"
            :value="business.rating.average"
            :count="business.rating.count"
          />
          <UBadge v-if="business.isVerified" color="primary" variant="soft" size="sm">
            <UIcon name="i-lucide-circle-check" class="me-1 size-3" />
            تأییدشده
          </UBadge>
          <span v-if="distance !== null" class="t-body-sm flex items-center gap-1 text-foreground-muted">
            <UIcon name="i-lucide-navigation" class="size-3.5" />
            {{ toFaDigits(distance.toFixed(1)) }} کیلومتر
          </span>
        </div>

        <!-- Phone -->
        <WqMetaRow
          v-if="business.phone"
          icon="i-lucide-phone"
          label="تلفن"
          :value="formatPhoneFa(business.phone)"
        />
      </div>

      <!-- About -->
      <section v-if="business.description" class="mt-6">
        <h2 class="t-section mb-3 text-foreground-strong">درباره</h2>
        <BusinessAbout :description="business.description" />
      </section>

      <!-- Services -->
      <section v-if="hasServices" class="mt-6">
        <h2 class="t-section mb-3 text-foreground-strong">خدمات</h2>
        <BusinessServiceList
          :services="businessServices"
          :business-id="business.id"
          @book="bookService"
        />
      </section>

      <!-- Employees -->
      <section v-if="hasEmployees" class="mt-6">
        <h2 class="t-section mb-3 text-foreground-strong">تیم ما</h2>
        <BusinessEmployeeList :employees="employees" />
      </section>

      <!-- Location -->
      <section class="mt-6">
        <h2 class="t-section mb-3 text-foreground-strong">موقعیت</h2>
        <BusinessLocation
          :address="business.address"
          :distance-km="distance"
        />
      </section>

      <!-- Rating Summary -->
      <section v-if="business.rating.count > 0" class="mt-6">
        <h2 class="t-section mb-3 text-foreground-strong">امتیاز و نظرات</h2>
        <div class="rounded-xl border border-line bg-surface p-4">
          <BusinessRatingSummary :rating="business.rating" />
        </div>
      </section>
    </div>

    <!-- Sticky Booking CTA -->
    <AppStickyAction v-if="business && !loading && !error">
      <WqButton
        variant="primary"
        size="lg"
        icon="i-lucide-calendar-plus"
        block
        @click="bookGeneral"
      >
        رزرو نوبت
      </WqButton>
    </AppStickyAction>
  </div>
</template>
