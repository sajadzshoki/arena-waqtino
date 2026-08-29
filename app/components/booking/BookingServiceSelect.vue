<script setup lang="ts">
/**
 * انتخاب خدمت — مرحلهٔ اول رزرو.
 */
import type { BookableService } from '~/types/service'

defineProps<{
  services: BookableService[]
  selectedId: string | null
  loading?: boolean
}>()

defineEmits<{
  select: [serviceId: string]
}>()
</script>

<template>
  <div>
    <!-- بارگذاری -->
    <div v-if="loading" class="flex flex-col gap-3">
      <USkeleton v-for="n in 3" :key="n" class="h-20 rounded-xl" />
    </div>

    <!-- حالت خالی -->
    <div v-else-if="services.length === 0" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <UIcon name="i-lucide-construction" class="size-8 text-foreground-muted" />
      <p class="t-body-sm text-foreground-secondary">این کسب‌وکار هنوز خدمتی ثبت نکرده است.</p>
    </div>

    <!-- فهرست -->
    <div v-else class="flex flex-col gap-3">
      <button
        v-for="service in services"
        :key="service.id"
        type="button"
        class="pressable flex w-full flex-col gap-2 rounded-xl border bg-surface p-4 text-start"
        :class="selectedId === service.id
          ? 'border-primary-border bg-primary-soft'
          : 'border-line hover:border-line-strong'"
        @click="$emit('select', service.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h3
              class="t-body-sm font-semibold text-foreground"
              :class="selectedId === service.id ? 'text-primary' : ''"
            >
              {{ service.name }}
            </h3>
            <p v-if="service.description" class="t-caption mt-1 line-clamp-2 text-foreground-secondary">
              {{ service.description }}
            </p>
          </div>
          <!-- نشانگر انتخاب -->
          <span v-if="selectedId === service.id" class="shrink-0">
            <UIcon name="i-lucide-check-circle-2" class="size-5 text-primary" />
          </span>
        </div>
        <div class="flex items-center gap-3">
          <WqDuration :minutes="service.durationMinutes" />
          <WqPrice :amount="service.price" size="sm" />
        </div>
      </button>
    </div>
  </div>
</template>
