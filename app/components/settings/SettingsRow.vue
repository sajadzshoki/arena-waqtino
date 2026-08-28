<script setup lang="ts">
/**
 * SettingsRow — ردیف استاندارد تنظیمات/پروفایل.
 *
 * روی `WqListRow` سوار است (تکرار استایل نداریم) و معناهای مخصوص تنظیمات را
 * اضافه می‌کند: مقدار پشتیبان (value)، برچسب وضعیت (badge: «به‌زودی»)،
 * slot کنترل (سوئیچ/…) و حالت غیرفعال.
 *
 * قانون: ردیف‌های «فقط اطلاعات» (مثل شمارهٔ موبایل) از `WqMetaRow` استفاده
 * می‌کنند؛ این کامپوننت مخصوص ناوبری و اکشن است.
 */
const props = withDefaults(
  defineProps<{
    title: string
    /** توضیح کوتاه زیر عنوان */
    subtitle?: string
    icon?: string
    /** مقدار پشتیبان سمت چپ (مثلاً ترجیح تم فعلی) */
    value?: string
    /** برچسب وضعیت — «به‌زودی»، «۳ مورد» و… */
    badge?: string
    /** مسیر ناوبری؛ اگر نباشد ردیف یک دکمهٔ اکشن است */
    to?: string
    /** اکشن‌های حساس/مخرب */
    destructive?: boolean
    disabled?: boolean
    /** نمایش فلش ناوبری */
    chevron?: boolean
  }>(),
  {
    subtitle: undefined,
    icon: undefined,
    value: undefined,
    badge: undefined,
    to: undefined,
    destructive: false,
    disabled: false,
    chevron: true
  }
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

function onClick(event: MouseEvent): void {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <WqListRow
    :title="title"
    :subtitle="subtitle"
    :icon="icon"
    :to="disabled ? undefined : to"
    :destructive="destructive"
    :chevron="false"
    class="min-h-14 py-3"
    :class="disabled ? 'pointer-events-none opacity-55' : ''"
    @click="onClick"
  >
    <template #trailing>
      <span class="flex min-w-0 shrink-0 items-center gap-2">
        <span v-if="value" class="t-body-sm max-w-40 truncate text-foreground-secondary">
          {{ value }}
        </span>
        <UBadge
          v-if="badge"
          :color="destructive ? 'error' : 'neutral'"
          variant="soft"
          size="sm"
        >
          {{ badge }}
        </UBadge>
        <slot name="trailing" />
        <UIcon
          v-if="chevron && to && !disabled"
          name="i-lucide-chevron-left"
          class="size-4.5 shrink-0 text-foreground-muted"
          aria-hidden="true"
        />
      </span>
    </template>
  </WqListRow>
</template>
