<script setup lang="ts">
/**
 * حالت‌های دسترسی به یک کسب‌وکار: «مال شما نیست» و «پیدا نشد».
 *
 * سرور (و در این فاز mock) مرجع مالکیت است؛ این حالت‌ها همان پاسخ ServiceError
 * را با مسیر بازیابی نشان می‌دهند تا کاربر در بن‌بست نماند: فهرست
 * کسب‌وکارهای خودش یا داشبورد.
 */
import type { BusinessAccess } from '~/types/owner'

const props = defineProps<{
  access: Extract<BusinessAccess, 'forbidden' | 'not_found'>
  message?: string | null
}>()

const { items } = useOwnerBusinesses()
const { currentBusinessId } = useBusinessContext()

const copy = computed(() =>
  props.access === 'forbidden'
    ? {
        icon: 'i-lucide-shield-off',
        title: 'دسترسی به این کسب‌وکار ندارید',
        fallback: 'فقط کسب‌وکارهایی که مدیر آن‌ها هستید قابل مدیریت‌اند.'
      }
    : {
        icon: 'i-lucide-search-x',
        title: 'چنین کسب‌وکاری پیدا نشد',
        fallback: 'ممکن است حذف شده یا نشانی اشتباه باشد.'
      }
)

/**
 * «بازگشت به داشبورد» باید به جایی برود که *واقعاً* باز می‌شود: زمینهٔ فعلی،
 * و اگر نبود اولین کسب‌وکارِ خودِ کاربر (دکمهٔ مرده نسازیم).
 */
const homeId = computed(() => currentBusinessId.value ?? items.value[0]?.business.id ?? null)
</script>

<template>
  <AppEmptyState :icon="copy.icon" :title="copy.title" :description="message ?? copy.fallback">
    <div class="mt-1 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
      <WqButton variant="tertiary" size="lg" class="min-h-12" icon="i-lucide-list" to="/owner/businesses">
        کسب‌وکارهای من
      </WqButton>
      <WqButton
        v-if="homeId"
        size="lg"
        class="min-h-12"
        icon="i-lucide-layout-dashboard"
        :to="`/owner/business/${homeId}`"
      >
        رفتن به داشبورد
      </WqButton>
    </div>
  </AppEmptyState>
</template>
