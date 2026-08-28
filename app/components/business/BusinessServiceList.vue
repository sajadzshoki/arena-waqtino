<script setup lang="ts">
/**
 * لیست خدمات کسب‌وکار — با دکمه رزرو.
 */
import type { BookableService } from '~/types/service'

defineProps<{
  services: BookableService[]
  businessId: string
}>()

const emit = defineEmits<{
  book: [serviceId: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="service in services"
      :key="service.id"
      class="flex items-start gap-3 rounded-xl border border-line bg-surface p-4"
    >
      <div class="min-w-0 flex-1">
        <h3 class="t-h3 text-foreground">{{ service.name }}</h3>
        <p v-if="service.description" class="t-body-sm mt-1 text-foreground-secondary">
          {{ service.description }}
        </p>
        <div class="mt-2 flex items-center gap-3">
          <WqDuration :minutes="service.durationMinutes" />
          <WqPrice :amount="service.price" size="sm" />
        </div>
      </div>
      <WqButton
        variant="secondary"
        size="sm"
        class="shrink-0"
        @click="emit('book', service.id)"
      >
        رزرو
      </WqButton>
    </div>
  </div>
</template>
