<script setup lang="ts">
/**
 * صفحهٔ خطای سراسری اپ (`app/error.vue`) — تنها جایی که خطای *صفحه‌نشستن* را
 * نشان می‌دهد (خطای دادهٔ داخل صفحه، `AppErrorState` خودش است؛ §۲۴ یک مجموعه UI).
 *
 * دو چیز را از هم جدا می‌کند:
 *   • ۴۰۴ → «چیزی که می‌خواستید اینجا نیست» (مسیر اشتباه/لینک کهنه) — نه «خطا!».
 *   • ۵۰۰ و بقیه → «مشکلی پیش آمد» با راهِ بازگشت.
 * جزئیات فنی (stack, پیام raw) فقط در dev نشان داده می‌شود؛ در prod هیچ خطای
 * انگلیسی/فنی به کاربر نمی‌رسد (§۴۹/§۶۱). متن‌ها فارسی و با لحن رسمی‌اند.
 */
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)
const title = computed(() => (isNotFound.value ? 'صفحه پیدا نشد' : 'مشکلی پیش آمد'))
const message = computed(() =>
  isNotFound.value
    ? 'نشانی‌ای که باز کردید وجود ندارد یا جابه‌جا شده است.'
    : 'همین حالا نتوانستیم صفحه را باز کنیم. یک بار دیگر تلاش کنید.'
)

/** جزئیات فنی: فقط در dev، برای خودِ توسعه‌دهنده (§۴۹). */
const technical = computed(() => {
  if (!import.meta.dev || !props.error) return null
  const status = props.error.statusCode ? `وضعیت ${props.error.statusCode}` : null
  const text = String(props.error.message ?? '').trim() || null
  return [status, text].filter(Boolean).join(' — ')
})

const { currentMode } = useUserMode()
const homeTo = computed(() => MODE_LANDING[currentMode.value])

async function retry(): Promise<void> {
  await clearError({ redirect: homeTo.value })
}

useHead(() => ({ title: isNotFound.value ? 'صفحه پیدا نشد' : 'خطای غیرمنتظره' }))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background pt-safe">
    <div class="mx-auto flex w-full max-w-(--wq-content-max) flex-1 flex-col items-center justify-center px-4 py-10">
      <div class="flex w-full flex-col items-center gap-4 rounded-xl border border-line bg-surface p-6 text-center">
        <span
          class="flex size-16 items-center justify-center rounded-2xl"
          :class="isNotFound ? 'bg-surface-muted text-foreground-secondary' : 'bg-error-soft text-error'"
          aria-hidden="true"
        >
          <UIcon :name="isNotFound ? 'i-lucide-compass' : 'i-lucide-cloud-alert'" class="size-7" />
        </span>

        <h1 class="t-h2 text-foreground-strong">{{ title }}</h1>
        <p class="t-body-sm max-w-sm text-foreground-secondary">{{ message }}</p>

        <p v-if="technical" dir="ltr" class="t-caption w-full max-w-sm truncate rounded-lg bg-surface-muted px-2 py-1 text-foreground-muted">
          {{ technical }}
        </p>

        <div class="mt-1 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <WqButton icon="i-lucide-house" class="min-h-12 flex-1 sm:flex-none" @click="retry">
            بازگشت به خانه
          </WqButton>
          <WqButton variant="secondary" icon="i-lucide-compass" to="/search" class="min-h-12 flex-1 sm:flex-none">
            کشف کسب‌وکارها
          </WqButton>
        </div>
      </div>
    </div>
  </div>
</template>
