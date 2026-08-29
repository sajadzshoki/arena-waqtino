<script setup lang="ts">
/**
 * ردیف «ساعت کاری این نفر» در صفحهٔ دسترس‌پذیری (فاز ۱۱).
 *
 * چیزی که مدیر باید در یک نگاه بفهمد: منبع برنامه (پیش‌فرض یا اختصاصی)، ساعتِ
 * عملاً قابل رزرو، و اینکه چرا این برنامه *فعلاً* بی‌اثر است (غیرفعال، بدون
 * سرویس، یا بیرون از ساعت کسب‌وکار). هشدارها همان‌جا متن دارند، نه فقط رنگ — و
 * کاربر به صفحهٔ بی‌توضیح نمی‌رسد.
 */
import type { EmployeeScheduleSummary } from '~/types/availability'

defineProps<{
  item: EmployeeScheduleSummary
  to: string
}>()
</script>

<template>
  <li>
    <NuxtLink
      :to="to"
      class="pressable flex items-start gap-2.5 rounded-xl border bg-surface p-3"
      :class="item.conflictDays.length > 0 ? 'border-warning-border' : 'border-line'"
    >
      <WqAvatar :name="item.displayName" size="md" class="mt-0.5 shrink-0" />

      <span class="min-w-0 flex-1">
        <span class="flex items-start gap-2">
          <span class="t-body-sm min-w-0 flex-1 truncate font-semibold text-foreground">
            {{ item.displayName }}
          </span>
          <WqStatusBadge
            :color="item.source === 'custom' ? 'primary' : 'neutral'"
            :icon="item.source === 'custom' ? 'i-lucide-pencil-ruler' : 'i-lucide-building-2'"
            :label="item.source === 'custom' ? 'برنامهٔ اختصاصی' : 'مطابق کسب‌وکار'"
            class="shrink-0"
          />
        </span>

        <span class="t-body-sm mt-1 block truncate text-foreground-secondary">
          {{ item.headline }}
        </span>

        <span
          v-if="item.note"
          class="t-caption mt-1.5 flex items-start gap-1.5"
          :class="item.conflictDays.length > 0 ? 'text-warning' : 'text-foreground-muted'"
        >
          <UIcon
            :name="item.conflictDays.length > 0 ? 'i-lucide-triangle-alert' : 'i-lucide-info'"
            class="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{{ item.note }}</span>
        </span>
      </span>

      <UIcon name="i-lucide-chevron-left" class="mt-1.5 size-4.5 shrink-0 text-foreground-muted" aria-hidden="true" />
    </NuxtLink>
  </li>
</template>
