<script setup lang="ts">
/**
 * صفحهٔ موفقیت رزرو — نمایش اطلاعات رزرو ثبت‌شده.
 */
definePageMeta({ access: 'auth', tabbar: false, header: false })

const route = useRoute()
const services = useServices()

const bookingId = computed(() => route.query.id as string)

const booking = ref<Booking | null>(null)
const businessName = ref<string>('')
const serviceName = ref<string>('')
const employeeName = ref<string>('')
const categoryName = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  if (!bookingId.value) {
    navigateTo('/')
    return
  }

  try {
    const bok = await services.bookings.getById(bookingId.value)
    if (!bok) {
      navigateTo('/')
      return
    }

    booking.value = bok

    // Load related data
    const [biz, bizCategories, bizServices, bizEmployees] = await Promise.all([
      services.businesses.getById(bok.businessId),
      services.businesses.listCategories(),
      services.businesses.listServices(bok.businessId),
      bok.employeeId ? services.businesses.listEmployees(bok.businessId) : Promise.resolve([])
    ])

    businessName.value = biz?.name ?? ''
    const cat = bizCategories.find(c => c.id === biz?.categoryId)
    categoryName.value = cat?.name ?? ''

    const srv = bizServices.find(s => s.id === bok.serviceId)
    serviceName.value = srv?.name ?? ''

    if (bok.employeeId) {
      const emp = bizEmployees.find(e => e.id === bok.employeeId)
      employeeName.value = emp?.name ?? ''
    }
  }
  catch (err) {
    console.error('Error loading booking:', err)
  }
  finally {
    loading.value = false
  }
})

useHead({ title: 'رزرو ثبت شد' })

function formatDate(iso: string): string {
  return formatDateLabel(new Date(iso))
}

function formatTime(iso: string): string {
  return formatFaTime(new Date(iso))
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background pt-safe">
    <!-- Content -->
    <div class="mx-auto flex w-full max-w-(--wq-content-max) flex-1 flex-col px-4 py-8">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-1 flex-col items-center justify-center gap-3">
        <UIcon name="i-lucide-loader" class="size-8 animate-spin text-primary" />
        <p class="t-body-sm text-foreground-secondary">در حال دریافت اطلاعات رزرو...</p>
      </div>

      <!-- Success -->
      <div v-else-if="booking" class="flex flex-1 flex-col">
        <!-- Success icon -->
        <div class="flex flex-col items-center gap-4 pb-8 text-center">
          <div class="flex size-20 items-center justify-center rounded-full bg-success-soft">
            <UIcon name="i-lucide-check" class="size-10 text-success" />
          </div>
          <div>
            <h1 class="t-h1 text-foreground-strong">رزرو شما ثبت شد</h1>
            <p class="t-body-sm mt-2 text-foreground-secondary">
              نوبت شما با موفقیت ثبت شد. اطلاعات زیر را بررسی کنید.
            </p>
          </div>
        </div>

        <!-- Booking details -->
        <div class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <!-- Business -->
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
              <UIcon name="i-lucide-store" class="size-5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">کسب‌وکار</p>
              <p class="t-body-sm font-medium text-foreground">{{ businessName }}</p>
              <p v-if="categoryName" class="t-caption text-foreground-secondary">{{ categoryName }}</p>
            </div>
          </div>

          <hr class="border-line-subtle">

          <!-- Service -->
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-info-soft">
              <UIcon name="i-lucide-concierge-bell" class="size-5 text-info" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">خدمت</p>
              <p class="t-body-sm font-medium text-foreground">{{ serviceName }}</p>
            </div>
          </div>

          <!-- Employee -->
          <div v-if="employeeName" class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft">
              <UIcon name="i-lucide-user" class="size-5 text-warning" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">متخصص</p>
              <p class="t-body-sm font-medium text-foreground">{{ employeeName }}</p>
            </div>
          </div>

          <hr class="border-line-subtle">

          <!-- Date & Time -->
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft">
              <UIcon name="i-lucide-calendar" class="size-5 text-success" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="t-caption">تاریخ و ساعت</p>
              <p class="t-body-sm font-medium text-foreground">{{ formatDate(booking.start) }}</p>
              <p class="t-caption t-num text-foreground-secondary">ساعت {{ formatTime(booking.start) }}</p>
            </div>
          </div>

          <hr class="border-line-subtle">

          <!-- Price -->
          <div class="flex items-center justify-between">
            <p class="t-caption">هزینه</p>
            <WqPrice :amount="booking.price" size="md" />
          </div>
        </div>

        <!-- Status -->
        <div class="mt-4 flex items-center justify-center gap-2">
          <UIcon name="i-lucide-clock" class="size-4 text-warning" />
          <span class="t-body-sm text-warning">در انتظار تأیید کسب‌وکار</span>
        </div>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Actions -->
        <div class="flex flex-col gap-3 pt-8">
          <WqButton
            variant="primary"
            size="lg"
            block
            icon="i-lucide-home"
            @click="navigateTo('/')"
          >
            بازگشت به خانه
          </WqButton>
          <WqButton
            variant="tertiary"
            size="md"
            block
            icon="i-lucide-compass"
            @click="navigateTo('/search')"
          >
            کشف کسب‌وکارهای دیگر
          </WqButton>
        </div>
      </div>

      <!-- Not found -->
      <div v-else class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-foreground-muted" />
        <p class="t-body text-foreground">اطلاعات رزرو یافت نشد.</p>
        <WqButton variant="secondary" @click="navigateTo('/')">
          بازگشت به خانه
        </WqButton>
      </div>
    </div>
  </div>
</template>
