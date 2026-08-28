<script setup lang="ts">
/**
 * هدر زمینهٔ مالک — «الان کدام کسب‌وکار را مدیریت می‌کنم».
 *
 * روی همهٔ صفحه‌های فضای کاری یکسان نمایش داده می‌شود تا کاربر هرگز دربارهٔ
 * زمینهٔ فعلی تردید نکند. دکمهٔ «تغییر» فقط وقتی صاحب چند کسب‌وکار باشد هست
 * (دکمهٔ بی‌کار برای صاحب تک‌کسب‌وکار نمی‌سازیم).
 */
import type { Business, BusinessCategory } from '~/types/business'

const props = withDefaults(
  defineProps<{
    business: Business
    category?: BusinessCategory | null
    canSwitch?: boolean
    switching?: boolean
  }>(),
  { category: null, canSwitch: false, switching: false }
)

const emit = defineEmits<{ switch: [] }>()

const categoryIcon = computed(() => props.category?.icon ?? 'i-lucide-store')

const statusMeta = computed(() => businessStatusMeta(props.business.status))

const metaLine = computed(() =>
  [
    props.category?.name,
    `${props.business.address.district}، ${props.business.address.city}`
  ]
    .filter(Boolean)
    .join(' · ')
)

/**
 * notice فقط از پرچم معناییِ نگاشت وضعیت می‌آید (نه مقایسه با enum) و متنش همان
 * `hint` متمرکز است؛ برای کسب‌وکار فعال چیزی نمایش داده نمی‌شود.
 */
const statusNotice = computed(() =>
  statusMeta.value.attentionNeeded ? statusMeta.value.hint : null
)
</script>

<template>
  <section class="rounded-xl border border-line bg-surface p-4">
    <div class="flex items-start gap-3">
      <span
        class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
        aria-hidden="true"
      >
        <UIcon :name="categoryIcon" class="size-6" />
      </span>

      <div class="min-w-0 flex-1">
        <p class="t-label flex items-center gap-1.5 text-foreground-muted">
          <UIcon name="i-lucide-shield-check" class="size-3.5 shrink-0" aria-hidden="true" />
          کسب‌وکاری که مدیریت می‌کنید
        </p>
        <h2 class="t-h2 mt-0.5 truncate text-foreground">{{ business.name }}</h2>
        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <BusinessStatusBadge :status="business.status" />
          <span class="t-caption text-foreground-muted">{{ metaLine }}</span>
        </div>
      </div>

      <WqButton
        v-if="canSwitch"
        variant="secondary"
        size="md"
        icon="i-lucide-arrow-left-right"
        :loading="switching"
        aria-haspopup="dialog"
        class="shrink-0 min-h-12 px-3.5"
        @click="emit('switch')"
      >
        تغییر
      </WqButton>
    </div>

    <p
      v-if="statusNotice"
      class="t-caption mt-3 flex items-start gap-1.5 rounded-lg bg-surface-muted px-3 py-2 text-foreground-secondary"
    >
      <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{{ statusNotice }}</span>
    </p>
  </section>
</template>
