<script setup lang="ts">
/**
 * ورود به فضای کاری صاحب کسب‌وکار (`/owner`) — «حل‌کنندهٔ زمینه».
 *
 * این صفحه خودش داشبورد نیست؛ تصمیم می‌دهد کاربر کجا باید باشد:
 *   • کسب‌وکار واحد یا انتخاب ذخیره‌شده → جای‌گیری (replace) به داشبورد همان
 *     کسب‌وکار. `replace` تا دکمهٔ «بازگشت» گوشی کاربر را دوباره به این
 *     صفحه برنگرداند و در چرخه بیفتد.
 *   • چند کسب‌وکار بدون انتخاب → همان‌جا فهرست انتخاب را می‌گذارد (بدون
 *     پرش اجباری): «کدام را مدیریت می‌کنم؟» یک تصمیم واقعی است، نه خطا.
 *   • هیچ کسب‌وکاری → حالت خالی عمدی؛ نه صفحه می‌شکند و نه کاربر به حالت
 *     مشتری پرتاب می‌شود.
 *
 * منطق تصمیم در `useBusinessContext()` است، نه اینجا — همان‌جا که کوکی
 * زمینه و مالکیت هم تعریف شده‌اند.
 */
definePageMeta({ access: 'auth', capability: 'business', tabbar: true })
useHead({ title: 'فضای کاری کسب‌وکار' })

const { resolve } = useBusinessContext()
const { items } = useOwnerBusinesses()

const pending = ref(true)
const failed = ref<string | null>(null)
const needsChoice = ref(false)

async function boot(): Promise<void> {
  pending.value = true
  failed.value = null
  needsChoice.value = false

  const decision = await resolve()
  switch (decision.kind) {
    case 'open':
      await navigateTo(`/owner/business/${decision.businessId}`, { replace: true })
      return
    case 'choose':
      needsChoice.value = true
      break
    case 'error':
      failed.value = decision.message
      break
    case 'empty':
      break
  }
  pending.value = false
}

/**
 * زیرتیتر دروغ نمی‌گوید: اگر هنوز انتخابی نباشد، جملهٔ «همان کسب‌وکار قبلی»
 * بی‌معنی است و سؤالِ واقعی صفحه جای آن می‌آید.
 */
const subtitle = computed(() =>
  needsChoice.value
    ? 'چند کسب‌وکار را مدیریت می‌کنید — یکی را انتخاب کنید'
    : 'هر وقت وارد شوید، همان کسب‌وکاری را می‌بینید که آخرین بار مدیریت می‌کردید'
)

onMounted(boot)
</script>

<template>
  <div class="pb-4">
    <AppPageHeader title="فضای کاری کسب‌وکار" :subtitle="subtitle" />

    <OwnerDashboardSkeleton v-if="pending" />

    <AppErrorState
      v-else-if="failed"
      title="فضای کاری باز نشد"
      :description="failed"
      retryable
      @retry="boot"
    />

    <OwnerNoBusinessState v-else-if="items.length === 0" />

    <!-- چند کسب‌وکار، بدون انتخاب قبلی → کاربر خودش انتخاب می‌کند -->
    <section v-else-if="needsChoice" class="mt-1">
      <p class="t-body-sm mb-3 text-foreground-secondary">
        شما مدیر {{ toFaDigits(items.length) }} کسب‌وکار هستید. برای شروع، یکی را انتخاب کنید:
      </p>
      <div class="flex flex-col gap-3">
        <OwnerBusinessCard
          v-for="owned in items"
          :key="owned.business.id"
          :owned="owned"
        />
      </div>
      <p class="t-caption mt-3 px-1 text-foreground-muted">
        دفعهٔ بعد که وارد شوید، همان انتخاب آخرتان را باز می‌کنیم.
      </p>
    </section>
  </div>
</template>
