<script setup lang="ts">
/**
 * سوییچر کسب‌وکار — شیت پایین موبایلی (هم‌الگوی سوییچر حالت).
 *
 * هیچ‌وقت دراپ‌داون سایدبار دسکتاپی نیست؛ روی تبلت/دسکتاپ هم همان شیت
 * تمام‌عرضِ موبایلی می‌ماند. انتخاب، فقط «زمینه» را عوض می‌کند و بعد به فضای
 * کاری همان کسب‌وکار می‌رود — همان مسیرِ کارت‌های «کسب‌وکارهای من»، پس دو
 * منطق موازی برای سوییچ نداریم.
 */
import type { EntityId } from '~/types/common'

const open = useState<boolean>('owner:ui:switcher', () => false)
const { items, initializing, error, refresh, ensureLoaded } = useOwnerBusinesses()
const { isCurrent, enter, accessMessage } = useBusinessContext()

const busyId = ref<EntityId | null>(null)
const switchFailed = ref(false)
const busy = computed(() => busyId.value !== null)

const options = computed(() =>
  items.value.map(owned => ({
    id: owned.business.id,
    name: owned.business.name,
    icon: owned.category?.icon ?? 'i-lucide-store',
    description: `${toFaDigits(owned.metrics.todayCount)} نوبت امروز · ${owned.business.address.district}`,
    selected: isCurrent(owned.business.id)
  }))
)

watch(open, value => {
  switchFailed.value = false
  busyId.value = null
  if (value) void ensureLoaded()
})

async function choose(id: EntityId): Promise<void> {
  if (isCurrent(id)) {
    open.value = false
    return
  }
  busyId.value = id
  switchFailed.value = false
  const result = await enter(id)
  busyId.value = null
  if (!result.ok) {
    // پاسخ سرور مرجع است: اگر دیگر مال این کسب‌وکار نبودیم، صادقانه می‌گوییم
    switchFailed.value = true
    return
  }
  open.value = false
  await navigateTo(`/owner/business/${id}`)
}

async function retry(): Promise<void> {
  await refresh()
  switchFailed.value = false
}
</script>

<template>
  <WqSheet
    v-model:open="open"
    title="تغییر کسب‌وکار"
    description="با هر جابه‌جایی، همهٔ محتوای فضای کاری برای همان کسب‌وکار تازه می‌شود."
  >
    <div class="flex flex-col gap-2 pb-2">
      <template v-if="initializing">
        <USkeleton v-for="n in 3" :key="n" class="h-16 rounded-xl" />
        <span class="t-caption text-center text-foreground-muted" role="status">
          در حال دریافت کسب‌وکارها…
        </span>
      </template>

      <AppErrorState
        v-else-if="error"
        title="فهرست کسب‌وکارها دریافت نشد"
        :description="error"
        retryable
        @retry="retry"
      />

      <template v-else>
        <p
          v-if="switchFailed"
          class="flex items-start gap-2 rounded-lg bg-error-soft px-3 py-2"
          role="alert"
        >
          <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0 text-error" aria-hidden="true" />
          <span class="t-body-sm text-foreground-secondary">{{ accessMessage }}</span>
        </p>

        <div v-if="options.length" role="radiogroup" aria-label="کسب‌وکارهای شما">
          <WqSelectCard
            v-for="option in options"
            :key="option.id"
            :title="option.name"
            :description="option.description"
            :icon="option.icon"
            :selected="option.selected"
            :disabled="busy"
            @select="choose(option.id)"
          />
        </div>
        <p v-else class="t-body-sm py-4 text-center text-foreground-muted">
          فعلاً کسب‌وکاری برای مدیریت ندارید.
        </p>
      </template>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <span class="t-caption text-foreground-muted">
          {{ toFaDigits(options.length) }} کسب‌وکار قابل مدیریت
        </span>
        <WqButton
          variant="tertiary"
          size="md"
          class="min-h-12 px-3"
          icon="i-lucide-list"
          to="/owner/businesses"
          @click="open = false"
        >
          همهٔ کسب‌وکارها
        </WqButton>
      </div>
    </template>
  </WqSheet>
</template>
