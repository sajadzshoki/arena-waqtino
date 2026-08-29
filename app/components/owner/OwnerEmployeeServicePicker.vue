<script setup lang="ts">
/**
 * انتخابگر «چه سرویس‌هایی را این نفر انجام می‌دهد» — فهرست چندانتخابی،
 * موبایل‌محور (ردیف‌های تمام‌عرض، هدف ۴۸px، بدون جدول چک‌باکس دسکتاپی).
 *
 * کامپوننت احمق است: فهرست گزینه‌ها را از صفحه می‌گیرد، هیچ قاعده‌ای را خودش
 * تصمیم نمی‌گیرد و به سرویس/mock دست نمی‌زند. دو حالتی که *باید* افتراق ببینند:
 *   • سرویس غیرفعال: قابل افزودنِ تازه نیست، ولی اگر از قبل اختصاص یافته
 *     نگه داشته و قابل حذف می‌ماند (تاریخچهٔ تیم پاک نمی‌شود).
 *   • اختصاص معلق: شناسه‌ای که سرویسش حذف شده — در همین صفحه قابل نمایش نیست،
 *     پس صفحه با شمارشش خبر می‌دهد و موقع ذخیره پاک می‌شود.
 */
import type { AssignmentRow } from '~/composables/useEmployeeAssignment'

withDefaults(
  defineProps<{
    rows: AssignmentRow[]
    selectedCount: number
    /** اختصاص‌های معلق (سرویس حذف‌شده) — فقط برای توضیح */
    danglingCount?: number
    disabled?: boolean
    /** متن کمکی بالای فهرست (در شیت و در فرم فرق می‌کند) */
    hint?: string
  }>(),
  { danglingCount: 0, disabled: false, hint: undefined }
)

const emit = defineEmits<{ toggle: [serviceId: string] }>()

function describe(row: AssignmentRow): string {
  const meta = serviceStatusMeta(row.status)
  if (row.selectable && row.status !== 'active') return `${meta.label} — اختصاص قبلی نگه داشته می‌شود`
  if (!row.selectable) return `${meta.label} — برای افزودن تازه قابل انتخاب نیست`
  return meta.hint
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="hint" class="t-body-sm text-foreground-secondary">{{ hint }}</p>

    <p
      v-if="danglingCount > 0"
      class="t-caption flex items-start gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-warning"
      role="status"
    >
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        {{ toFaDigits(danglingCount) }} اختصاص به سرویسی اشاره می‌کند که دیگر در فهرست نیست؛
        با ذخیره، همان‌ها پاک می‌شوند.
      </span>
    </p>

    <div
      v-if="rows.length > 0"
      class="flex flex-col gap-2"
      role="group"
      :aria-label="`سرویس‌های قابل اختصاص — ${toFaDigits(selectedCount)} انتخاب شده`"
    >
      <WqSelectCard
        v-for="row in rows"
        :key="row.id"
        role="checkbox"
        :title="row.name"
        :description="describe(row)"
        :icon="row.selected ? 'i-lucide-circle-check' : 'i-lucide-tags'"
        :selected="row.selected"
        :disabled="disabled || !row.selectable"
        @select="emit('toggle', row.id)"
      />
    </div>

    <p v-else class="t-body-sm rounded-xl border border-dashed border-line-strong bg-surface p-3 text-foreground-secondary">
      این کسب‌وکار هنوز سرویسی ندارد، پس چیزی برای اختصاص دادن هم نیست.
    </p>
  </div>
</template>
