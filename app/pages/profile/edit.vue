<script setup lang="ts">
/**
 * ویرایش پروفایل — فرم عمدی با «ذخیره» صریح (بدون autosave هر کلید).
 *
 *   AppBackHeader → آواتار → نام/نام خانوادگی → تلفن (فقط‌خواندنی) → AppStickyAction
 *
 * چهار چیزی که این فرم را «محصولی» می‌کند:
 *   ۱) قواعد از app/utils/validation.ts (متمرکز) — پیام‌های فارسی، همان‌جا تعریف‌شده
 *   ۲) حالت loading / save-loading / save-error از لایهٔ سرویس می‌آید
 *   ۳) تغییرات ذخیره‌نشده با نگهبان مسیر + beforeunload محافظت می‌شود
 *   ۴) ذخیره از useUserProfile → مخزن کاربر می‌رود و state مرکزی نشست را
 *      به‌روز می‌کند؛ هدر و صفحهٔ پروفایل بدون reload تازه می‌شوند.
 */
definePageMeta({ access: 'auth', tabbar: false })
useHead({ title: 'ویرایش پروفایل' })

const toast = useAppToast()
const {
  profile,
  firstName,
  lastName,
  avatarUrl,
  dirty,
  canSave,
  isValid,
  saving,
  saveError,
  loading,
  loadError,
  nameMaxLength,
  errorFor,
  markTouched,
  initialize,
  submit,
  discard
} = useProfileForm()

/* ─────────────── بازگشت با تغییرات ذخیره‌نشده ─────────────── */
const leaveConfirmOpen = ref(false)
let resolveLeave: ((proceed: boolean) => void) | null = null

function askLeave(): Promise<boolean> {
  return new Promise((resolve) => {
    resolveLeave = resolve
    leaveConfirmOpen.value = true
  })
}

function settleLeave(proceed: boolean): void {
  leaveConfirmOpen.value = false
  resolveLeave?.(proceed)
  resolveLeave = null
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  return askLeave()
})

/** بستن/تازه‌سازی تب مرورگر هم تغییرات را بی‌صدا دور نمی‌ریزد. */
function onBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault()
  event.returnValue = ''
}

watch(dirty, (next) => {
  if (!import.meta.client) return
  if (next) window.addEventListener('beforeunload', onBeforeUnload)
  else window.removeEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('beforeunload', onBeforeUnload)
})

/* ─────────────── چرخهٔ حیات ─────────────── */
onMounted(() => {
  void initialize()
})

/* ─────────────── ذخیره ─────────────── */
async function onSave(): Promise<void> {
  if (!isValid.value) {
    toast.error('هنوز چند مورد از فرم کامل نشده است.')
    return
  }

  const result = await submit()
  if (!result) {
    if (saveError.value) toast.error(saveError.value)
    return
  }

  toast.success('پروفایل به‌روز شد.')
  if (!result.avatarPersisted) {
    toast.info('تصویر انتخابی فقط تا پایان همین نشست نگه داشته می‌شود.', {
      description: 'بارگذاری واقعی تصویر به فاز اتصال بک‌اند موکول است.'
    })
  }
  await navigateTo('/profile', { replace: true })
}

function onDiscard(): void {
  discard()
  toast.neutral('تغییرات برگردانده شد.', 'i-lucide-rotate-ccw')
}

const displayName = computed(() => `${firstName.value} ${lastName.value}`.trim())
</script>

<template>
  <div class="pb-28">
    <AppBackHeader title="ویرایش پروفایل" to="/profile">
      <template #actions>
        <WqButton
          v-if="dirty"
          variant="tertiary"
          size="sm"
          icon="i-lucide-rotate-ccw"
          @click="onDiscard"
        >
          بازگردانی
        </WqButton>
      </template>
    </AppBackHeader>

    <!-- بارگذاری اولیه -->
    <div v-if="loading" class="flex flex-col gap-4" role="status" aria-live="polite">
      <USkeleton class="h-28 w-full rounded-xl" />
      <USkeleton class="h-14 w-full rounded-xl" />
      <USkeleton class="h-24 w-full rounded-xl" />
    </div>

    <!-- خطای بارگذاری -->
    <AppErrorState
      v-else-if="loadError"
      title="اطلاعات پروفایل باز نشد"
      :description="loadError"
      retryable
      @retry="initialize()"
    />

    <form v-else class="flex flex-col gap-4" @submit.prevent="onSave">
      <!-- آواتار -->
      <ProfileAvatarEditor
        v-model="avatarUrl"
        :name="displayName"
        :disabled="saving"
      />

      <!-- نام -->
      <div class="rounded-xl border border-line bg-surface p-4">
        <div class="flex flex-col gap-4">
          <WqInput
            v-model="firstName"
            label="نام"
            required
            autocomplete="given-name"
            placeholder="مثلاً سارا"
            :maxlength="nameMaxLength"
            :error="errorFor('firstName')"
            @focusout="markTouched('firstName')"
          />
          <WqInput
            v-model="lastName"
            label="نام خانوادگی"
            required
            autocomplete="family-name"
            placeholder="مثلاً محمدی"
            :maxlength="nameMaxLength"
            :error="errorFor('lastName')"
            @focusout="markTouched('lastName')"
          />
        </div>
        <p class="t-caption mt-3">
          نام را همان‌طور که در وقتینو دیده می‌شود بنویسید — در رزروها و
          گفتگوها همین نام نمایش داده می‌شود.
        </p>
      </div>

      <!-- تلفن: عمداً فقط‌خواندنی (کلید ورود است و به تأیید پیامکی وصل) -->
      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="t-label mb-2 text-foreground-secondary">
          شمارهٔ موبایل
        </p>
        <div class="flex items-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2.5">
          <UIcon name="i-lucide-smartphone" class="size-4.5 shrink-0 text-foreground-muted" aria-hidden="true" />
          <span class="t-body t-num min-w-0 flex-1 truncate text-foreground-secondary" dir="ltr">
            {{ profile ? formatPhoneFa(profile.phone) : '—' }}
          </span>
          <UIcon name="i-lucide-lock" class="size-4 shrink-0 text-foreground-muted" aria-hidden="true" />
        </div>
        <p class="t-caption mt-2">
          این شمارهٔ ورود شماست؛ تغییرش به تأیید پیامکی نیاز دارد و در فاز
          بعدی فعال می‌شود — فعلاً عمداً قفل است.
        </p>
      </div>

      <!-- خطای ذخیره -->
      <p
        v-if="saveError"
        class="t-body-sm flex items-start gap-2 rounded-lg bg-error-soft px-3 py-2.5 text-error"
        role="alert"
      >
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{{ saveError }}</span>
      </p>
    </form>

    <!-- اکشن چسبیده -->
    <AppStickyAction v-if="!loading && !loadError">
      <WqButton
        type="button"
        :loading="saving"
        :disabled="!canSave"
        block
        @click="onSave"
      >
        {{ dirty ? 'ذخیرهٔ تغییرات' : 'تغییری برای ذخیره نیست' }}
      </WqButton>
      <p v-if="dirty" class="t-caption mt-1.5 text-center">
        تغییرات هنوز ذخیره نشده‌اند.
      </p>
    </AppStickyAction>

    <!-- تأیید خروج با کار نیمه‌تمام -->
    <WqConfirm
      v-model:open="leaveConfirmOpen"
      title="خروج با تغییرات ذخیره‌نشده؟"
      description="اگر از این صفحه بروید، تغییراتی که ذخیره نکرده‌اید از بین می‌رود."
      confirm-label="خروج"
      cancel-label="می‌مانم"
      icon="i-lucide-circle-alert"
      @confirm="settleLeave(true)"
      @cancel="settleLeave(false)"
    />
  </div>
</template>
