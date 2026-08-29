<script setup lang="ts">
/**
 * فهرست کسب‌وکارهای قابل مدیریت (`/owner/businesses`).
 *
 * هم «ناوبری میان چند کسب‌وکار» است هم پاسخ به «چه چیزهایی را مدیریت می‌کنم».
 * فهرست از `useOwnerBusinesses()` می‌آید (تک‌منبع، همان کشی که داشبورد و
 * سوییچر مصرف می‌کنند)؛ صفحه هیچ واکشی یا شمارشی خودش ندارد.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: true })
useHead({ title: 'کسب‌وکارهای من' })

const { items, count, initializing, error, refresh } = useOwnerBusinesses()
const { currentBusinessId, business } = useBusinessContext()

const hasActivity = computed(() => items.value.some(o => o.metrics.todayCount > 0 || o.metrics.upcomingCount > 0))
</script>

<template>
  <div class="pb-4">
    <AppPageHeader
      title="کسب‌وکارهای من"
      subtitle="هر کسب‌وکاری که مدیر آن هستید"
    >
      <template #actions>
        <WqIconButton
          icon="i-lucide-rotate-ccw"
          label="تازه‌سازی فهرست کسب‌وکارها"
          class="size-12"
          :loading="initializing"
          @click="refresh()"
        />
      </template>
    </AppPageHeader>

    <!-- زمینهٔ فعلی، همان‌جا که هست -->
    <div
      v-if="business"
      class="flex items-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-3"
    >
      <UIcon name="i-lucide-badge-check" class="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p class="t-body-sm min-w-0 flex-1 truncate text-foreground-secondary">
        در حال مدیریت: <span class="font-medium text-foreground">{{ business.name }}</span>
      </p>
      <NuxtLink
        v-if="currentBusinessId"
        :to="`/owner/business/${currentBusinessId}`"
        class="pressable t-label shrink-0 text-primary"
      >
        داشبورد
      </NuxtLink>
    </div>

    <div v-if="initializing" class="mt-4">
      <OwnerBusinessCardSkeleton :count="3" />
    </div>

    <AppErrorState
      v-else-if="error"
      title="فهرست کسب‌وکارها دریافت نشد"
      :description="error"
      retryable
      @retry="refresh()"
    />

    <template v-else-if="count > 0">
      <p class="t-caption mt-4 px-1 text-foreground-muted">
        {{ toFaDigits(count) }} کسب‌وکار ·
        <template v-if="hasActivity">شمارش‌ها تا امروز تازه است</template>
        <template v-else>فعلاً نوبتی در روزهای پیش‌رو ثبت نشده</template>
      </p>
      <div class="mt-2 flex flex-col gap-3">
        <OwnerBusinessCard
          v-for="owned in items"
          :key="owned.business.id"
          :owned="owned"
          :is-current="owned.business.id === currentBusinessId"
        />
      </div>
      <p class="t-caption mt-4 px-1 text-foreground-muted">
        با ورود به هر کارت، فضای کاری برای همان کسب‌وکار باز می‌شود و انتخابتان
        در یادمان می‌ماند.
      </p>
    </template>

    <OwnerNoBusinessState v-else />
  </div>
</template>
