<script setup lang="ts">
/**
 * ردیف فشردهٔ سرویس در فهرست مدیر — سؤالی که این سطر باید جواب دهد:
 * «این کسب‌وکار چه می‌فروشد، چند دقیقه است، چقدر، و الان قابل رزرو است؟»
 *
 * سلسله‌مراتب عمدی: نام ← وضعیت ← قیمت ← مدت (توضیح ثانویه است). ردیف
 * عمداً کارتِ بزرگ نشده تا در موبایل ده سرویس خوانا جا شود؛ اکشن‌ها در شیت
 * خودِ سطراند (نه هاور، که روی موبایل وجود ندارد).
 *
 * سرویس غیرفعال کم‌رنگ/خط‌چین می‌شود ولی *حذف نمی‌شود*: مدیر باید بداند هست،
 * فقط برای رزرو تازه باز نیست.
 */
import type { ManagedService } from '~/types/service'

const props = defineProps<{ service: ManagedService }>()

const emit = defineEmits<{
  open: [service: ManagedService]
  actions: [service: ManagedService]
}>()

const meta = computed(() => serviceStatusMeta(props.service.status))
const inactive = computed(() => !meta.value.bookable)
</script>

<template>
  <li>
    <div
      class="flex items-start gap-1 rounded-xl border bg-surface p-3"
      :class="inactive ? 'border-dashed border-line-strong' : 'border-line'"
    >
      <button
        type="button"
        class="pressable min-w-0 flex-1 text-start"
        :aria-label="`جزئیات سرویس ${service.name}`"
        @click="emit('open', service)"
      >
        <div class="flex items-start gap-2">
          <p class="t-body-sm min-w-0 flex-1 truncate font-semibold text-foreground">
            {{ service.name }}
          </p>
          <OwnerServiceStatusBadge class="shrink-0" :status="service.status" />
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <WqPrice :amount="service.price" size="sm" />
          <WqDuration :minutes="service.durationMinutes" />
          <span v-if="service.liveBookingCount > 0" class="t-caption inline-flex items-center gap-1">
            <UIcon name="i-lucide-calendar-clock" class="size-3.5" />
            {{ toFaDigits(service.liveBookingCount) }} نوبت پیش‌رو
          </span>
        </div>

        <p v-if="service.description" class="t-caption mt-1.5 line-clamp-2 text-foreground-secondary">
          {{ service.description }}
        </p>
        <p v-else class="t-caption mt-1.5 text-foreground-muted">
          {{ meta.hint }}
        </p>
      </button>

      <WqIconButton
        icon="i-lucide-ellipsis"
        :label="`اکشن‌های ${service.name}`"
        @click="emit('actions', service)"
      />
    </div>
  </li>
</template>
