<script setup lang="ts">
/**
 * لیست کارمندان کسب‌وکار.
 */
import type { Employee } from '~/types/employee'

defineProps<{
  employees: Employee[]
}>()
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <div
      v-for="emp in employees"
      :key="emp.id"
      class="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
    >
      <WqAvatar :name="emp.name" :src="emp.avatarUrl" size="md" />
      <div class="min-w-0">
        <h3 class="t-body-sm truncate font-medium text-foreground">{{ emp.name }}</h3>
        <p v-if="emp.title" class="t-caption truncate">{{ emp.title }}</p>
      </div>
    </div>
  </div>
</template>
