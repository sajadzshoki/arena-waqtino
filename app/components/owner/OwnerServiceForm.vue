<script setup lang="ts">
/**
 * فیلدهای مشترک «افزودن سرویس» و «ویرایش سرویس».
 *
 * کامپوننت احمق است: به سرویس‌ها یا mock دست نمی‌زند، هیچ قاعدهٔ اعتبارسنجی
 * در آن تکرار نمی‌شود و فقط مقدار/پیام خطا را از صفحه می‌گیرد (v-model) — پس
 * همان قواعد را صفحهٔ ساخت و صفحهٔ ویرایش و لایهٔ سرویس استفاده می‌کنند.
 *
 * دو نکتهٔ موبایل‌محور:
 *   • ورودی‌های عددی `inputmode="numeric"` و `dir="ltr"` هستند تا رقم‌ها و
 *     جداکنندهٔ هزارگان جابه‌جا نشوند؛ صفحه‌کلود عددی باز می‌شود.
 *   • قیمت و مدت «هنگام تایپ» خام می‌مانند و فقط در لحظهٔ ترک فیلد
 *     قالب‌بندی می‌شوند (cursor نمی‌پرد)؛ مقدار دامنه همیشه عدد است.
 */
import type { ServiceFormErrors } from '~/utils/validation'
import type { ServiceStatus } from '~/types/service'
import { SERVICE_DURATION_PRESETS, serviceStatusOptions } from '~/config/service-form'

const statusOptions = serviceStatusOptions()

defineProps<{
  name: string
  description: string
  duration: string
  price: string
  status: ServiceStatus
  /** پیام خطای هر قلم (یا `undefined`) — تصمیم «کِی» با `useServiceForm` است */
  errorFor: (field: keyof ServiceFormErrors) => string | undefined
  pricePreview: number | null
  durationPreview: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:duration': [value: string]
  'update:price': [value: string]
  'update:status': [value: ServiceStatus]
  'touch': [field: keyof ServiceFormErrors]
  'commit-price': []
  'commit-duration': []
}>()
</script>

<template>
  <div class="flex flex-col gap-5">
    <WqInput
      label="نام سرویس"
      :model-value="name"
      required
      :maxlength="60"
      placeholder="مثلاً کوتاهی مو و سشوار"
      :hint="`تا ${toFaDigits(60)} حرف — همان چیزی که مشتری در فهرست می‌بیند.`"
      :error="errorFor('name')"
      :disabled="disabled"
      @update:model-value="emit('update:name', $event)"
      @blur="emit('touch', 'name')"
    />

    <WqTextarea
      label="توضیح سرویس"
      :model-value="description"
      :maxlength="200"
      :rows="3"
      hint="اختیاری — یک جمله کافی است: چه چیزی شامل می‌شود یا برای چه کسی مناسب است."
      :error="errorFor('description')"
      :disabled="disabled"
      @update:model-value="emit('update:description', $event)"
      @blur="emit('touch', 'description')"
    />

    <!-- مدت: انتخاب سریع + عدد دلخواه (دامنهٔ واقعی همیشه دقیقه است) -->
    <div>
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <span class="t-label text-foreground">مدت سرویس</span>
        <span v-if="durationPreview" class="t-caption t-num text-foreground-secondary">
          نمایش: {{ durationPreview }}
        </span>
      </div>
      <div class="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <WqChip
          v-for="preset in SERVICE_DURATION_PRESETS"
          :key="preset"
          class="min-h-12 shrink-0"
          :selected="parseFaNumber(duration) === preset"
          :disabled="disabled"
          @toggle="emit('update:duration', toFaDigits(preset)); emit('touch', 'duration')"
        >
          {{ toFaDigits(preset) }} دقیقه
        </WqChip>
      </div>
      <WqInput
        :model-value="duration"
        inputmode="numeric"
        dir="ltr"
        placeholder="45"
        :error="errorFor('duration')"
        :disabled="disabled"
        aria-label="مدت سرویس به دقیقه"
        @update:model-value="emit('update:duration', $event)"
        @blur="emit('touch', 'duration'); emit('commit-duration')"
      />
      <p class="t-caption mt-1.5">
        عدد را به دقیقه بنویسید ({{ toFaDigits(SERVICE_DURATION_MIN) }} تا
        {{ toFaDigits(SERVICE_DURATION_MAX) }} دقیقه). «۹۰» همان «۱ ساعت و ۳۰ دقیقه» است.
      </p>
    </div>

    <WqInput
      label="قیمت"
      :model-value="price"
      inputmode="numeric"
      dir="ltr"
      placeholder="350000"
      hint="به تومان — بدون «تومان» و بدون صفرهای اضافه."
      :error="errorFor('price')"
      :disabled="disabled"
      @update:model-value="emit('update:price', $event)"
      @blur="emit('touch', 'price'); emit('commit-price')"
    >
      <template #trailing>
        <span class="pe-1 t-caption t-num text-foreground-muted">تومان</span>
      </template>
    </WqInput>
    <p v-if="pricePreview !== null" class="-mt-3 t-body-sm">
      <span class="text-foreground-muted">همین مبلغ در فهرست مشتری:</span>
      <WqPrice :amount="pricePreview" size="sm" class="ms-1" />
    </p>

    <!-- وضعیت: انتخاب آگاهانه، با پیامدش — نه یک سوئیچ بی‌متن -->
    <div>
      <span id="service-status-label" class="t-label mb-2 block text-foreground">وضعیت سرویس</span>
      <div class="flex flex-col gap-2" role="radiogroup" aria-labelledby="service-status-label">
        <WqSelectCard
          v-for="option in statusOptions"
          :key="option.value"
          :icon="option.icon"
          :title="option.label"
          :description="option.hint"
          :selected="status === option.value"
          :disabled="disabled"
          @select="emit('update:status', option.value)"
        />
      </div>
    </div>
  </div>
</template>
