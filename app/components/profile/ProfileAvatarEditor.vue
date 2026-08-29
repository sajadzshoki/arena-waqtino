<script setup lang="ts">
/**
 * ProfileAvatarEditor — کانون ویرایش آواتار در فرم پروفایل.
 *
 * معماری (بدون فرضیهٔ بک‌اند):
 *   این کامپوننت → useProfileAvatar() → services.avatars (استراتژی mock)
 *
 * دو مسیر، هر دو واقعی:
 *   ۱) آواتارهای آماده (mock asset) → قابل‌ذخیره
 *   ۲) فایل محلی → پیش‌نمایش همین نشست؛ صادقانه برچسب می‌خورد چون آپلود
 *      واقعی به فاز اتصال بک‌اند موکول است (endpoint جعلی ساخته نشده).
 *
 * پیش‌نمایش / جایگزینی / حذف / loading / خطا همین‌جا پوشش داده شده‌اند —
 * بدون هیچ ویرایشگر تصویری اضافه.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string | null
    /** برای alt و fallback حروف اول */
    name: string
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const {
  presets,
  presetsLoading,
  presetsError,
  working,
  operationError,
  isLocalPreview,
  loadPresets,
  previewFile,
  clearError
} = useProfileAvatar()

const sheetOpen = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const hasAvatar = computed(() => !!props.modelValue)
const isPreview = computed(() => isLocalPreview(props.modelValue))

async function openSheet(): Promise<void> {
  clearError()
  sheetOpen.value = true
  await loadPresets()
}

function selectPreset(url: string): void {
  emit('update:modelValue', url)
  sheetOpen.value = false
}

function removeAvatar(): void {
  clearError()
  emit('update:modelValue', null)
}

async function onPickFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const preview = await previewFile(file)
  if (preview) emit('update:modelValue', preview.url)
  // اجازهٔ انتخاب دوبارهٔ همان فایل
  input.value = ''
}
</script>

<template>
  <div class="rounded-xl border border-line bg-surface p-4">
    <div class="flex items-center gap-4">
      <div class="relative shrink-0">
        <WqAvatar :name="name" :src="modelValue" size="xl" />
        <span
          v-if="working"
          class="absolute inset-0 flex items-center justify-center rounded-full bg-surface-inverse/55"
          role="status"
          aria-label="در حال پردازش تصویر"
        >
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-inverse" />
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <p class="t-label text-foreground-strong">تصویر پروفایل</p>
        <p class="t-caption mt-0.5">
          یک آواتار آماده بردارید یا تصویر خودتان را انتخاب کنید.
        </p>

        <div class="mt-2.5 flex flex-wrap gap-2">
          <WqButton
            variant="secondary"
            size="sm"
            icon="i-lucide-image-plus"
            :disabled="disabled || working"
            @click="openSheet"
          >
            {{ hasAvatar ? 'تغییر تصویر' : 'انتخاب تصویر' }}
          </WqButton>
          <WqButton
            v-if="hasAvatar"
            variant="tertiary"
            size="sm"
            icon="i-lucide-user-round-x"
            :disabled="disabled || working"
            @click="removeAvatar"
          >
            برداشتن تصویر
          </WqButton>
        </div>
      </div>
    </div>

    <p v-if="operationError" class="t-body-sm mt-3 flex items-start gap-1.5 text-error" role="alert">
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{{ operationError }}</span>
    </p>

    <p v-else-if="isPreview" class="t-caption mt-3 flex items-start gap-1.5">
      <UIcon name="i-lucide-info" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        این تصویر فقط پیش‌نمایش همین نشست است؛ در حالت توسعه جایی بارگذاری نمی‌شود.
      </span>
    </p>

    <!-- انتخاب‌گر آواتار — شیت پایین (موبایل‌اول) -->
    <WqSheet v-model:open="sheetOpen" title="تصویر پروفایل" description="از لیست انتخاب کنید یا تصویر خودتان را بیاورید.">
      <div class="flex flex-col gap-4 pb-2">
        <!-- آواتارهای آماده -->
        <div>
          <p class="t-label mb-2.5 text-foreground-secondary">آواتارهای آماده</p>

          <div v-if="presetsLoading" class="grid grid-cols-4 gap-3" role="status" aria-live="polite">
            <USkeleton v-for="n in 8" :key="n" class="aspect-square rounded-full" />
          </div>

          <AppErrorState
            v-else-if="presetsError"
            title="آواتارها بارگذاری نشدند"
            :description="presetsError"
            retryable
            @retry="loadPresets"
          />

          <div v-else class="grid grid-cols-4 gap-3" role="radiogroup" aria-label="آواتارهای آماده">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              role="radio"
              class="pressable relative flex aspect-square items-center justify-center overflow-hidden rounded-full border-2"
              :class="modelValue === preset.url ? 'border-primary' : 'border-line hover:border-line-strong'"
              :aria-checked="modelValue === preset.url"
              :aria-label="`آواتار ${preset.label}`"
              @click="selectPreset(preset.url)"
            >
              <img :src="preset.url" :alt="''" class="size-full object-cover">
              <span
                v-if="modelValue === preset.url"
                class="absolute inset-0 flex items-center justify-center bg-surface-inverse/35"
              >
                <UIcon name="i-lucide-check" class="size-6 text-inverse" aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>

        <USeparator />

        <!-- فایل محلی -->
        <div class="flex flex-col gap-2">
          <p class="t-label text-foreground-secondary">تصویر از دستگاه شما</p>
          <WqButton
            variant="secondary"
            icon="i-lucide-upload"
            :loading="working"
            :disabled="disabled"
            block
            @click="fileInput?.click()"
          >
            انتخاب فایل
          </WqButton>
          <p class="t-caption">
            فرمت JPG/PNG/WEBP، حداکثر ۲ مگابایت. در حالت توسعه این تصویر
            بارگذاری نمی‌شود و فقط پیش‌نمایش است.
          </p>
          <input
            ref="fileInput"
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/avif"
            class="sr-only"
            aria-label="انتخاب فایل تصویر"
            tabindex="-1"
            @change="onPickFile"
          >
        </div>
      </div>
    </WqSheet>
  </div>
</template>
