<script setup lang="ts">
/**
 * ProfileIdentity — بخش هویت صفحهٔ پروفایل.
 *
 * «فضای شخصی کاربر» است، نه کارت آماری: آواتار، نام، شمارهٔ موبایل و
 * دعوت به تکمیل پروفایل. اطلاعات غایب صفحه را نمی‌شکنند:
 *   نام خالی      → راهنمایی «نامت را ثبت کن» + CTA ویرایش
 *   آواتار خالی   → حروف اول نام (WqAvatar)
 *   تصویر ناکام   → همان fallback، بدون broken image
 */
import type { AppUser } from '~/types/user'
import { formatFullName, isProfileIncomplete } from '~/utils/validation'

const props = withDefaults(
  defineProps<{
    user: AppUser | null
    loading?: boolean
  }>(),
  { loading: false }
)

const fullName = computed(() => formatFullName(props.user?.firstName, props.user?.lastName))
const needsName = computed(() => !props.user || isProfileIncomplete(props.user))
</script>

<template>
  <section class="rounded-xl border border-line bg-surface p-4">
    <!-- بارگذاری -->
    <div v-if="loading" class="flex items-center gap-3" role="status" aria-live="polite">
      <USkeleton class="size-20 rounded-full" />
      <div class="flex-1 space-y-2">
        <USkeleton class="h-5 w-32 rounded" />
        <USkeleton class="h-3.5 w-24 rounded" />
      </div>
    </div>

    <div v-else class="flex items-center gap-3.5">
      <WqAvatar
        :name="fullName"
        :src="user?.avatarUrl ?? null"
        size="xl"
      />

      <div class="min-w-0 flex-1">
        <p v-if="fullName" class="t-h2 truncate text-foreground-strong">
          {{ fullName }}
        </p>
        <p v-else class="t-h2 text-foreground-muted">
          نام شما ثبت نشده
        </p>

        <p v-if="user?.phone" class="t-body-sm t-num mt-1 flex items-center gap-1.5 text-foreground-secondary">
          <UIcon name="i-lucide-smartphone" class="size-3.5 shrink-0" aria-hidden="true" />
          <span dir="ltr">{{ formatPhoneFa(user.phone) }}</span>
        </p>
      </div>

      <WqButton
        to="/profile/edit"
        variant="tertiary"
        size="sm"
        icon="i-lucide-pencil-line"
        class="shrink-0 self-start"
        aria-label="ویرایش پروفایل"
      >
        ویرایش
      </WqButton>
    </div>

    <!-- راهنمای تکمیل — فقط وقتی واقعاً لازم است -->
    <p
      v-if="!loading && needsName"
      class="t-body-sm mt-3 flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2 text-primary"
    >
      <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>با یک بار ثبت نام، رزروها و گفتگوها شخصی‌تر و سریع‌تر می‌شوند.</span>
    </p>
  </section>
</template>
