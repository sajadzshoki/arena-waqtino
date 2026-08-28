<script setup lang="ts">
/**
 * کارت کسب‌وکارِ صاحب — صفحهٔ «کسب‌وکارهای من».
 *
 * یک کارت = یک ورودی: «ورود به مدیریت» همان کسب‌وکار. اگر زمینهٔ فعلی باشد،
 * به‌جای دکمهٔ تکراری، برچسب «در حال مدیریت» نشان می‌دهد (و با ورود به کارت،
 * زمینه عوض می‌شود؛ سوییچر شیت فقط میان‌بُر سریعِ همان منطق است).
 */
import type { OwnedBusiness } from '~/types/owner'

const props = withDefaults(
  defineProps<{
    owned: OwnedBusiness
    isCurrent?: boolean
  }>(),
  { isCurrent: false }
)

const { select } = useBusinessContext()

const imgError = ref(false)

const metricsLine = computed(() => {
  const m = props.owned.metrics
  return [
    `${toFaDigits(m.todayCount)} نوبت امروز`,
    `${toFaDigits(m.serviceCount)} سرویس`,
    m.employeeCount > 0 ? `${toFaDigits(m.employeeCount)} پرسنل` : 'بدون پرسنل'
  ].join(' · ')
})

const to = computed(() => `/owner/business/${props.owned.business.id}`)

/** ورود به کارت = انتخاب زمینه، همان کاری که سوییچر می‌کند (ناوبری با لینک است). */
function enter(): void {
  select(props.owned.business.id)
}
</script>

<template>
  <article
    class="overflow-hidden rounded-xl border bg-surface transition-colors"
    :class="isCurrent ? 'border-primary-border' : 'border-line'"
  >
    <NuxtLink :to="to" class="pressable flex gap-3 p-3" @click="enter">
      <span class="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
        <UIcon
          v-if="!owned.business.coverImageUrl || imgError"
          :name="owned.category?.icon ?? 'i-lucide-store'"
          class="size-6 text-foreground-muted"
          aria-hidden="true"
        />
        <img
          v-else
          :src="owned.business.coverImageUrl"
          :alt="`تصویر ${owned.business.name}`"
          class="size-full object-cover"
          loading="lazy"
          @error="imgError = true"
        >
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-1.5">
          <h3 class="t-h3 truncate text-foreground">{{ owned.business.name }}</h3>
          <UIcon
            v-if="owned.business.isVerified"
            name="i-lucide-circle-check"
            class="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
        </span>
        <span class="t-caption mt-0.5 block truncate text-foreground-secondary">
          {{ owned.category?.name ?? 'دستهٔ نامشخص' }} · {{ owned.business.address.district }}، {{ owned.business.address.city }}
        </span>
        <span class="t-caption t-num mt-1.5 block truncate text-foreground-muted">{{ metricsLine }}</span>
      </span>
    </NuxtLink>

    <div class="flex items-center justify-between gap-2 border-t border-line-subtle px-3 py-2">
      <BusinessStatusBadge :status="owned.business.status" />
      <span
        v-if="isCurrent"
        class="t-label flex items-center gap-1 text-primary"
      >
        <UIcon name="i-lucide-badge-check" class="size-4 shrink-0" aria-hidden="true" />
        در حال مدیریت
      </span>
      <NuxtLink
        v-else
        :to="to"
        class="t-label pressable flex min-h-12 items-center gap-1 text-primary"
        :aria-label="`ورود به مدیریت ${owned.business.name}`"
        @click="enter"
      >
        ورود به مدیریت
        <UIcon name="i-lucide-chevron-left" class="size-4 shrink-0" aria-hidden="true" />
      </NuxtLink>
    </div>
  </article>
</template>
