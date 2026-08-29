<script setup lang="ts">
/**
 * ردیف فشردهٔ پرسنل در فهرست مدیر — سؤالی که این سطر باید جواب دهد:
 * «این نفر کیست، الان قابل رزرو است، و چه سرویس‌هایی انجام می‌دهد؟»
 *
 * سلسله‌مراتب عمدی: هویت (آواتار + نام) ← وضعیت ← خلاصهٔ سرویس‌ها؛ شمارهٔ
 * موبایل و وضعیت اتصال حساب در سطح دوم می‌مانند. ردیف عمداً کارتِ بزرگ نشده
 * تا در موبایل چند نفر خوانا جا شود؛ اکشن‌ها در شیتِ خودِ سطراند (نه هاور، که
 * روی موبایل وجود ندارد).
 *
 * پرسنل غیرفعال کم‌رنگ/خط‌چین می‌شود ولی *حذف نمی‌شود*: مدیر باید بداند هست،
 * فقط برای رزرو تازه قابل انتخاب نیست.
 */
import type { ManagedEmployee } from '~/types/employee'

const props = defineProps<{
  employee: ManagedEmployee
  /** نام سرویس‌ها — از کش سرویس‌های همان کسب‌وکار (فهرست id نه) */
  serviceNames?: string[]
}>()

const emit = defineEmits<{
  open: [employee: ManagedEmployee]
  actions: [employee: ManagedEmployee]
}>()

const meta = computed(() => employeeStatusMeta(props.employee.status))
const inactive = computed(() => !meta.value.bookable)

/** حداکثر دو نام در سطر؛ بقیه به‌صورت «+۲» تا ردیف قد نکشد. */
const visibleNames = computed(() => (props.serviceNames ?? []).slice(0, 2))
const hiddenCount = computed(() => Math.max(0, (props.serviceNames ?? []).length - 2))
</script>

<template>
  <li>
    <div
      class="flex items-start gap-1 rounded-xl border bg-surface p-3"
      :class="inactive ? 'border-dashed border-line-strong' : 'border-line'"
    >
      <button
        type="button"
        class="pressable flex min-w-0 flex-1 items-start gap-2.5 text-start"
        :aria-label="`جزئیات پرسنل ${employee.displayName}`"
        @click="emit('open', employee)"
      >
        <span class="relative shrink-0">
          <WqAvatar :name="employee.displayName" :src="employee.avatarUrl" size="md" />
          <span
            v-if="inactive"
            class="absolute -bottom-0.5 -left-0.5 flex size-4 items-center justify-center rounded-full border border-surface bg-surface-muted"
            :title="meta.label"
          >
            <UIcon :name="meta.icon" class="size-2.5 text-foreground-secondary" aria-hidden="true" />
          </span>
        </span>

        <span class="min-w-0 flex-1">
          <span class="flex items-start gap-2">
            <span class="t-body-sm min-w-0 flex-1 truncate font-semibold text-foreground">
              {{ employee.displayName }}
            </span>
            <OwnerEmployeeStatusBadge class="shrink-0" :status="employee.status" />
          </span>

          <span class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span v-if="visibleNames.length" class="t-caption min-w-0 truncate text-foreground-secondary">
              {{ visibleNames.join('، ') }}
              <span v-if="hiddenCount > 0" class="t-num text-foreground-muted">
                +{{ toFaDigits(hiddenCount) }}
              </span>
            </span>
            <span v-else class="t-caption inline-flex items-center gap-1 text-foreground-muted">
              <UIcon name="i-lucide-tags" class="size-3.5 shrink-0" aria-hidden="true" />
              بدون سرویس اختصاصی
            </span>
            <span
              v-if="employee.liveBookingCount > 0"
              class="t-caption inline-flex items-center gap-1 text-foreground-secondary"
            >
              <UIcon name="i-lucide-calendar-clock" class="size-3.5 shrink-0" aria-hidden="true" />
              {{ toFaDigits(employee.liveBookingCount) }} نوبت پیش‌رو
            </span>
          </span>

          <span class="mt-1 block truncate t-caption text-foreground-muted">
            {{ employee.title || meta.hint }}
          </span>
        </span>
      </button>

      <WqIconButton
        icon="i-lucide-ellipsis"
        :label="`اکشن‌های ${employee.displayName}`"
        @click="emit('actions', employee)"
      />
    </div>
  </li>
</template>
