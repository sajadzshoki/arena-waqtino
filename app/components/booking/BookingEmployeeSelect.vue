<script setup lang="ts">
/**
 * انتخاب کارمند — مرحلهٔ دوم رزرو (در صورت نیاز).
 */
import type { BookableEmployee } from '~/types/employee'

defineProps<{
  /** نمای مشتری پرسنل (فقط active، از لایهٔ سرویس) — نام نمایشی از قبل ساخته شده. */
  employees: BookableEmployee[]
  selectedId: string | null | undefined // undefined = not yet selected, null = "no preference"
  optional?: boolean
  loading?: boolean
}>()

defineEmits<{
  select: [employeeId: string | null]
}>()
</script>

<template>
  <div>
    <!-- بارگذاری -->
    <div v-if="loading" class="flex flex-col gap-3">
      <USkeleton v-for="n in 3" :key="n" class="h-16 rounded-xl" />
    </div>

    <!-- حالت خالی -->
    <div v-else-if="employees.length === 0" class="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <UIcon name="i-lucide-users" class="size-8 text-foreground-muted" />
      <p class="t-body-sm text-foreground-secondary">کارمندی برای این خدمت یافت نشد.</p>
    </div>

    <!-- فهرست -->
    <div v-else class="flex flex-col gap-3">
      <!-- گزینهٔ «بدون ترجیح» (اگر اختیاری است) -->
      <button
        v-if="optional"
        type="button"
        class="pressable flex w-full items-center gap-3 rounded-xl border bg-surface p-4 text-start"
        :class="selectedId === null
          ? 'border-primary-border bg-primary-soft'
          : 'border-line hover:border-line-strong'"
        @click="$emit('select', null)"
      >
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full" :class="selectedId === null ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-foreground-secondary'">
          <UIcon name="i-lucide-shuffle" class="size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="t-body-sm font-semibold" :class="selectedId === null ? 'text-primary' : 'text-foreground'">
            فرقی نمی‌کند
          </p>
          <p class="t-caption text-foreground-secondary">اولین متخصص آزاد</p>
        </div>
        <UIcon
          v-if="selectedId === null"
          name="i-lucide-check-circle-2"
          class="size-5 shrink-0 text-primary"
        />
      </button>

      <!-- پرسنل -->
      <button
        v-for="emp in employees"
        :key="emp.id"
        type="button"
        class="pressable flex w-full items-center gap-3 rounded-xl border bg-surface p-4 text-start"
        :class="selectedId === emp.id
          ? 'border-primary-border bg-primary-soft'
          : 'border-line hover:border-line-strong'"
        @click="$emit('select', emp.id)"
      >
        <WqAvatar
          :name="emp.displayName"
          :src="emp.avatarUrl"
          size="md"
        />
        <div class="min-w-0 flex-1">
          <p class="t-body-sm font-semibold" :class="selectedId === emp.id ? 'text-primary' : 'text-foreground'">
            {{ emp.displayName }}
          </p>
          <p v-if="emp.title" class="t-caption text-foreground-secondary">
            {{ emp.title }}
          </p>
        </div>
        <UIcon
          v-if="selectedId === emp.id"
          name="i-lucide-check-circle-2"
          class="size-5 shrink-0 text-primary"
        />
      </button>
    </div>
  </div>
</template>
