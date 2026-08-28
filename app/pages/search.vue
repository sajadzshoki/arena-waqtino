<script setup lang="ts">
/**
 * جستجو — placeholder با پشتیبانی از فیلتر دسته‌بندی.
 * صفحهٔ کامل جستجو در فاز بعدی پیاده‌سازی می‌شود.
 */
definePageMeta({ access: 'public' })
useHead({ title: 'جستجو' })

const route = useRoute()
const categoryFilter = computed(() => route.query.category as string | undefined)

const services = useServices()

const { data: categories } = await useAsyncData(
  'search:categories',
  () => services.businesses.listCategories()
)

const selectedCategory = computed(() => {
  if (!categoryFilter.value || !categories.value) return null
  return categories.value.find(c => c.id === categoryFilter.value) ?? null
})
</script>

<template>
  <div>
    <AppPageHeader title="جستجو">
      <template v-if="selectedCategory" #actions>
        <UBadge color="primary" variant="soft" size="sm">
          <UIcon :name="selectedCategory.icon" class="me-1 size-3.5" />
          {{ selectedCategory.name }}
        </UBadge>
      </template>
    </AppPageHeader>

    <!-- نقطهٔ ورود جستجو -->
    <div class="mb-6">
      <CustomerSearchEntry />
    </div>

    <!-- placeholder محتوا -->
    <div
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface-muted px-6 py-12 text-center"
    >
      <span class="flex size-14 items-center justify-center rounded-2xl bg-surface">
        <UIcon name="i-lucide-search" class="size-6 text-foreground-muted" />
      </span>
      <h2 class="t-h3 text-foreground-secondary">
        {{ selectedCategory ? `جستجو در «${selectedCategory.name}»` : 'جستجوی کسب‌وکار و خدمات' }}
      </h2>
      <p class="t-body-sm text-foreground-muted max-w-72">
        صفحهٔ کامل جستجو و فیلتر در فاز بعدی فعال می‌شود.
      </p>
      <UBadge color="neutral" variant="soft" size="sm">placeholder</UBadge>
    </div>
  </div>
</template>
