<script setup lang="ts">
/**
 * شیت «اختصاص سرویس‌ها» — ویرایش رابطه از صفحهٔ جزئیات پرسنل، بدون رفتن به
 * صفحهٔ دیگری (روی موبایل الگوی طبیعی همین است؛ روی دسکتاپ به‌صورت
 * کشوی پایین باز می‌شود، همان‌طور که بقیهٔ شیت‌های اپ).
 *
 * کامپوننت فقط نمایش می‌دهد: ردیف‌ها، خطا و شلوغی از `useEmployeeAssignment`
 * (لایهٔ سرویس) می‌آیند. «ذخیره» صریح است — autosave نداریم — و تا تغییر
 * واقعی ایجاد نشده دکمه فعال نیست.
 */
import type { AssignmentRow } from '~/composables/useEmployeeAssignment'

withDefaults(
  defineProps<{
    employeeName?: string
    rows: AssignmentRow[]
    selectedCount: number
    danglingCount?: number
    dirty?: boolean
    saving?: boolean
    error?: string | null
  }>(),
  { employeeName: undefined, danglingCount: 0, dirty: false, saving: false, error: null }
)

const emit = defineEmits<{
  toggle: [serviceId: string]
  save: []
  close: []
  'select-active': []
  'clear-all': []
}>()

const open = defineModel<boolean>('open', { default: false })

function onToggleOpen(value: boolean): void {
  open.value = value
  if (!value) emit('close')
}
</script>

<template>
  <WqSheet
    :open="open"
    title="اختصاص سرویس‌ها"
    :description="employeeName"
    @update:open="onToggleOpen"
  >
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <WqButton
          size="sm"
          variant="tertiary"
          icon="i-lucide-list-checks"
          :disabled="saving"
          @click="emit('select-active')"
        >
          همهٔ سرویس‌های فعال
        </WqButton>
        <WqButton
          size="sm"
          variant="tertiary"
          icon="i-lucide-eraser"
          :disabled="saving || selectedCount === 0"
          @click="emit('clear-all')"
        >
          هیچ‌کدام
        </WqButton>
      </div>

      <OwnerEmployeeServicePicker
        :rows="rows"
        :selected-count="selectedCount"
        :dangling-count="danglingCount"
        :disabled="saving"
        @toggle="emit('toggle', $event)"
      />

      <p
        v-if="error"
        class="t-body-sm flex items-start gap-2 rounded-lg bg-error-soft px-3 py-2.5 text-error"
        role="alert"
      >
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>
    </div>

    <template #footer>
      <WqButton
        block
        class="min-h-12"
        :loading="saving"
        :disabled="!dirty"
        @click="emit('save')"
      >
        {{ dirty ? 'ذخیرهٔ اختصاص‌ها' : 'تغییری ایجاد نشده' }}
      </WqButton>
      <p class="t-caption mt-2 text-center text-foreground-muted">
        با ذخیره، همین لحظه در انتخاب پرسنلِ رزرو و در فهرست پرسنل اعمال می‌شود.
      </p>
    </template>
  </WqSheet>
</template>
