<script setup lang="ts">
/**
 * صفحه نوبت‌های مشتری
 * نمایش رزروهای آینده و گذشته با امکان مدیریت
 */
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'نوبت‌های من'
})

const { 
  upcomingBookings, 
  pastBookings, 
  loading, 
  error, 
  fetchBookings 
} = useCustomerBookings()

// بارگذاری اولیه
onMounted(() => {
  fetchBookings()
})

// Tab فعال
const activeTab = ref<'upcoming' | 'past'>('upcoming')
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <AppHeader title="نوبت‌های من" />

    <!-- Content -->
    <div class="container mx-auto px-4 py-6">
      <!-- Tabs -->
      <div class="mb-6 flex gap-2 border-b border-line">
        <button
          class="relative px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'upcoming' ? 'text-primary' : 'text-foreground-secondary hover:text-foreground'"
          @click="activeTab = 'upcoming'"
        >
          نوبت‌های آینده
          <span 
            v-if="upcomingBookings.length > 0"
            class="ms-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
          >
            {{ upcomingBookings.length }}
          </span>
          <span 
            v-if="activeTab === 'upcoming'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          />
        </button>
        <button
          class="relative px-4 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'past' ? 'text-primary' : 'text-foreground-secondary hover:text-foreground'"
          @click="activeTab = 'past'"
        >
          نوبت‌های گذشته
          <span 
            v-if="pastBookings.length > 0"
            class="ms-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
          >
            {{ pastBookings.length }}
          </span>
          <span 
            v-if="activeTab === 'past'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="animate-pulse rounded-2xl border border-line bg-surface p-4">
          <div class="h-4 w-3/4 rounded bg-line" />
          <div class="mt-3 h-3 w-1/2 rounded bg-line" />
          <div class="mt-2 h-3 w-2/3 rounded bg-line" />
        </div>
      </div>

      <!-- Error State -->
      <AppErrorState
        v-else-if="error"
        title="خطا در دریافت نوبت‌ها"
        :description="error"
        icon="i-lucide-alert-circle"
      >
        <template #actions>
          <WqButton @click="fetchBookings">
            تلاش مجدد
          </WqButton>
        </template>
      </AppErrorState>

      <!-- Upcoming Bookings -->
      <div v-else-if="activeTab === 'upcoming'">
        <AppEmptyState
          v-if="upcomingBookings.length === 0"
          title="هنوز نوبتی ندارید"
          description="اولین نوبت خود را رزرو کنید"
          icon="i-lucide-calendar"
        >
          <template #actions>
            <WqButton to="/search">
              جستجوی کسب‌وکارها
            </WqButton>
          </template>
        </AppEmptyState>

        <div v-else class="space-y-4">
          <BookingsBookingCardUpcoming
            v-for="booking in upcomingBookings"
            :key="booking.id"
            :booking="booking"
          />
        </div>
      </div>

      <!-- Past Bookings -->
      <div v-else-if="activeTab === 'past'">
        <AppEmptyState
          v-if="pastBookings.length === 0"
          title="نوبت گذشته‌ای ندارید"
          description="نوبت‌های لغو شده، انجام شده و عدم مراجعه در اینجا نمایش داده می‌شوند"
          icon="i-lucide-history"
        />

        <div v-else class="space-y-4">
          <div
            v-for="booking in pastBookings"
            :key="booking.id"
            class="rounded-2xl border border-line bg-surface p-4"
          >
            <NuxtLink :to="`/bookings/${booking.id}`" class="block">
              <!-- Business Name -->
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-store" class="size-4 text-foreground-secondary" />
                <h3 class="truncate font-semibold text-foreground">{{ booking.businessName }}</h3>
              </div>

              <!-- Service Name -->
              <div class="mt-2 flex items-center gap-2">
                <UIcon name="i-lucide-concierge-bell" class="size-4 text-foreground-secondary" />
                <p class="truncate text-sm text-foreground-secondary">{{ booking.serviceName }}</p>
              </div>

              <!-- Date and Time -->
              <div class="mt-2 flex items-center gap-2">
                <UIcon name="i-lucide-calendar" class="size-4 text-foreground-secondary" />
                <span class="text-sm text-foreground">
                  {{ formatDateLabel(new Date(booking.start)) }} • {{ formatFaTime(new Date(booking.start)) }}
                </span>
              </div>

              <!-- Status Badge -->
              <div class="mt-3">
                <div
                  v-if="booking.status === 'completed'"
                  class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1"
                >
                  <UIcon name="i-lucide-check-circle" class="size-3.5 text-success" />
                  <span class="text-xs font-medium text-success">انجام شده</span>
                </div>
                <div
                  v-else-if="booking.status === 'cancelled'"
                  class="inline-flex items-center gap-1 rounded-full bg-error/10 px-2.5 py-1"
                >
                  <UIcon name="i-lucide-x-circle" class="size-3.5 text-error" />
                  <span class="text-xs font-medium text-error">لغو شده</span>
                </div>
                <div
                  v-else-if="booking.status === 'no_show'"
                  class="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1"
                >
                  <UIcon name="i-lucide-alert-circle" class="size-3.5 text-warning" />
                  <span class="text-xs font-medium text-warning">عدم مراجعه</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
