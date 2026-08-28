<script setup lang="ts">
/**
 * نشان‌شده‌ها — پاسخ به یک سؤال ساده:
 *   «کدام کسب‌وکارها را بعداً می‌خواهم سراغشان برگردم؟»
 *
 * فهرست از همین‌جا ساخته نمی‌شود: state مشترک `useSavedBusinesses()` تنها
 * منبع است و از همان نقطه‌ای که کاربر در خانه/جستجو/جزئیات کسب‌وکار «نشان»
 * می‌زند، این صفحه پر می‌شود. کارت هم همان کارت کسب‌وکار فاز ۳ است (به‌علاوهٔ
 * اکشن حذف و یک خط متادیتا) — نسخهٔ دومی از کارت یا از فهرست نشان‌شده‌ها
 * در این پروژه وجود ندارد.
 */
definePageMeta({ access: 'auth' })
useHead({ title: 'نشان‌شده‌ها' })

const { items, count, status, initializing, error, refresh } = useSavedBusinesses()
const { categoryOf, load: loadCategories } = useBusinessCategories()

const isEmpty = computed(() => status.value === 'ready' && items.value.length === 0)
const showList = computed(() => items.value.length > 0)

onMounted(() => {
  // بازگشت به صفحه = همگام با واقعیتِ لایهٔ داده (بدون نیاز به reload کل اپ)
  void Promise.all([refresh(), loadCategories()])
})
</script>

<template>
  <div class="pb-4">
    <AppPageHeader
      title="نشان‌شده‌ها"
      subtitle="هر وقت خواستی، سریع برگرد سراغشان"
    >
      <template #actions>
        <WqIconButton
          icon="i-lucide-rotate-ccw"
          label="تازه‌سازی فهرست نشان‌شده‌ها"
          @click="refresh()"
        />
      </template>
    </AppPageHeader>

    <!-- زمینهٔ فهرست: تعداد + مسیر کشف -->
    <div class="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
      <p class="t-body-sm flex items-center gap-2 text-foreground-secondary">
        <UIcon name="i-lucide-bookmark-check" class="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span v-if="initializing">در حال بارگذاری…</span>
        <span v-else-if="count > 0">{{ toFaDigits(count) }} کسب‌وکار نشان‌شده</span>
        <span v-else>هنوز چیزی نشان نکرده‌اید</span>
      </p>
      <NuxtLink
        to="/search"
        class="pressable shrink-0 rounded-lg px-1 text-sm font-medium text-primary"
      >
        کشف جدید
      </NuxtLink>
    </div>

    <!-- بارگذاری -->
    <div v-if="initializing" class="mt-4">
      <BusinessCardCompactSkeleton :count="3" />
    </div>

    <!-- خطا + تلاش مجدد -->
    <AppErrorState
      v-else-if="error"
      class="mt-4"
      title="فهرست نشان‌شده‌ها باز نشد"
      :description="error"
      retryable
      @retry="refresh()"
    />

    <!-- حالت خالی عمدی: توضیح فیچر + CTA کشف -->
    <section
      v-else-if="isEmpty"
      class="mt-4 overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div class="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <UIcon name="i-lucide-bookmark-plus" class="size-6" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="t-h3 text-foreground-strong">جای محبوب‌هایت را نگه دار</h2>
          <p class="t-body-sm mt-1 text-foreground-secondary">
            روی نشانکِ هر کسب‌وکار بزن؛ آنجا می‌ماند و از همین صفحه با یک لمس
            به جزئیات و رزرو می‌رسی.
          </p>
          <ul class="t-caption mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <li class="flex items-center gap-1">
              <UIcon name="i-lucide-house" class="size-3.5" aria-hidden="true" />
              خانه
            </li>
            <li class="flex items-center gap-1">
              <UIcon name="i-lucide-search" class="size-3.5" aria-hidden="true" />
              جستجو و دسته‌بندی‌ها
            </li>
            <li class="flex items-center gap-1">
              <UIcon name="i-lucide-store" class="size-3.5" aria-hidden="true" />
              صفحهٔ کسب‌وکار
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-line-subtle p-4">
        <WqButton to="/search" icon="i-lucide-compass" block class="sm:max-w-60">
          مشاهده کسب‌وکارها
        </WqButton>
      </div>
    </section>

    <!-- فهرست -->
    <div
      v-else-if="showList"
      class="mt-4 flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4"
    >
      <BusinessCardCompact
        v-for="entry in items"
        :key="entry.business.id"
        :business="entry.business"
        :category="categoryOf(entry.business)"
        show-save-action
        save-mode="remove"
      >
        <template #meta>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span class="t-caption flex items-center gap-1 font-medium text-primary">
              <UIcon name="i-lucide-bookmark-check" class="size-3.5" aria-hidden="true" />
              نشان‌شده
            </span>
            <span class="t-caption">{{ formatRelativeFa(entry.savedAt) }}</span>
          </div>
        </template>
      </BusinessCardCompact>

      <p class="t-caption sm:col-span-full">
        با حذف از این فهرست، نشان کسب‌وکار در صفحهٔ جزئیات و بقیهٔ کارت‌ها هم
        برمی‌گردد — چند لحظه فرصت «بازگردانی» هم داری.
      </p>
    </div>
  </div>
</template>
