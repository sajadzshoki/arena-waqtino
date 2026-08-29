<script setup lang="ts">
/**
 * خانهٔ مشتری — تجربهٔ اصلی کشف و شروع رزرو.
 *
 * سلسله‌مراتب اطلاعات:
 *   ۱. خوش‌آمدگویی شخصی + اعلان
 *   ۲. نقطهٔ ورود جستجو
 *   ۳. دسته‌بندی‌ها (اسکرول افقی)
 *   ۴. پیشنهاد برای شما (کارت‌های ویژه افقی)
 *   ۵. محبوب‌ترین‌ها (لیست فشرده)
 *   ۶. نزدیک شما (لیست فشرده + فاصله)
 *   ۷. اخیراً دیده‌اید (فقط وقتی تاریخچه وجود دارد)
 */
definePageMeta({ access: 'public', header: false })
useHead({ title: 'خانه' })

const {
  categories,
  featured,
  popular,
  nearby,
  loadAll,
  retrySection
} = useCustomerDiscovery()

const { items: recentlyViewed, loading: recentLoading, hasHistory, refresh: refreshRecent } = useRecentlyViewed()

// بارگذاری اولیه
await loadAll()
await refreshRecent()

// بازیابی هنگام بازگشت به صفحه
const route = useRoute()
watch(() => route.path, async (newPath) => {
  if (newPath === '/') {
    await refreshRecent()
  }
})

// پیدا کردن دسته برای هر کسب‌وکار
const categoryMap = computed(() => {
  const map = new Map(categories.data.value.map(c => [c.id, c]))
  return map
})

function getCategoryForBiz(categoryId: string) {
  return categoryMap.value.get(categoryId) ?? null
}


</script>

<template>
  <div class="pb-4">
    <!-- ۱. هدر خوش‌آمدگویی -->
    <CustomerHomeHeader />

    <!-- ۲. نقطهٔ ورود جستجو -->
    <div class="mt-5">
      <SearchEntry />
    </div>

    <!-- ۳. دسته‌بندی‌ها -->
    <section class="mt-7">
      <h2 class="t-section mb-3 text-foreground-strong">دسته‌بندی‌ها</h2>
      <CategoryGrid
        :categories="categories.data.value"
        :loading="categories.loading.value"
      />
      <!-- خطای دسته‌بندی‌ها -->
      <div v-if="categories.error.value && !categories.loading.value" class="mt-2 text-center">
        <WqButton variant="tertiary" size="sm" icon="i-lucide-rotate-ccw" @click="retrySection('categories')">
          تلاش مجدد
        </WqButton>
      </div>
    </section>

    <!-- ۴. پیشنهاد برای شما -->
    <DiscoverySection
      title="پیشنهاد برای شما"
      :loading="featured.loading.value"
      :error="featured.error.value"
      :empty="!featured.loading.value && !featured.error.value && featured.data.value.length === 0"
      action-label="مشاهده همه"
      action-to="/search"
      @retry="retrySection('featured')"
    >
      <template v-if="featured.loading.value">
        <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <BusinessCardFeaturedSkeleton :count="3" />
        </div>
      </template>
      <template v-else>
        <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <BusinessCardFeatured
            v-for="biz in featured.data.value"
            :key="biz.id"
            :business="biz"
            :category="getCategoryForBiz(biz.categoryId)"
            show-save-action
          />
        </div>
      </template>
    </DiscoverySection>

    <!-- ۵. محبوب‌ترین‌ها -->
    <DiscoverySection
      title="محبوب‌ترین‌ها"
      :loading="popular.loading.value"
      :error="popular.error.value"
      :empty="!popular.loading.value && !popular.error.value && popular.data.value.length === 0"
      action-label="مشاهده همه"
      action-to="/search"
      @retry="retrySection('popular')"
    >
      <template v-if="popular.loading.value">
        <BusinessCardCompactSkeleton :count="3" />
      </template>
      <template v-else>
        <div class="flex flex-col gap-3">
          <BusinessCardCompact
            v-for="biz in popular.data.value"
            :key="biz.id"
            :business="biz"
            :category="getCategoryForBiz(biz.categoryId)"
          />
        </div>
      </template>
    </DiscoverySection>

    <!-- ۶. نزدیک شما -->
    <DiscoverySection
      title="نزدیک شما"
      :loading="nearby.loading.value"
      :error="nearby.error.value"
      :empty="!nearby.loading.value && !nearby.error.value && nearby.data.value.length === 0"
      action-label="مشاهده همه"
      action-to="/search"
      @retry="retrySection('nearby')"
    >
      <template v-if="nearby.loading.value">
        <BusinessCardCompactSkeleton :count="3" />
      </template>
      <template v-else>
        <div class="flex flex-col gap-3">
          <BusinessCardCompact
            v-for="biz in nearby.data.value"
            :key="biz.id"
            :business="biz"
            :category="getCategoryForBiz(biz.categoryId)"
            :show-distance="true"
            :distance-km="biz.distanceKm"
          />
        </div>
      </template>
    </DiscoverySection>

    <!-- ۷. اخیراً دیده‌اید — فقط وقتی تاریخچه وجود دارد -->
    <DiscoverySection
      v-if="hasHistory || recentLoading"
      title="اخیراً دیده‌اید"
      :loading="recentLoading"
    >
      <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        <BusinessCardFeatured
          v-for="biz in recentlyViewed"
          :key="biz.id"
          :business="biz"
          :category="getCategoryForBiz(biz.categoryId)"
          show-save-action
        />
      </div>
    </DiscoverySection>
  </div>
</template>
