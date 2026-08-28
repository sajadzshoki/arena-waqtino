<script setup lang="ts">
/**
 * BusinessSaveToggle — تنها «دکمهٔ نشان‌کردن» کل اپ (حذف تکرار فاز ۴).
 *
 * همه‌جا یک رفتار، یک پیام، یک state:
 *   Home · Search · Category results · Business Details · Saved
 *        ↓
 *   useSavedBusinesses() (منبع‌واحد‌حقیقت) → services.favorites
 *
 * دسترس‌پذیری: وضعیت فقط با رنگ منتقل نمی‌شود —
 *   `aria-pressed` + تغییر آیکون (line ↔ filled) + متن «نشان‌شده» در حالت با‌برچسب.
 */
import type { Business } from '~/types/business'
import type { EntityId } from '~/types/common'

const props = withDefaults(
  defineProps<{
    businessId: EntityId
    /** برای پیام‌های دقیق‌تر و به‌روز‌کردن همان لحظهٔ فهرست نشان‌شده‌ها */
    business?: Business | null
    /** برچسب متنی کنار آیکون (هدر صفحهٔ جزئیات) */
    withLabel?: boolean
    /** رفتار «حذف» برای صفحهٔ نشان‌شده‌ها (آیکون × و متن مناسب) */
    mode?: 'toggle' | 'remove'
    /** اگر صفحه خودش پیام می‌دهد */
    silent?: boolean
  }>(),
  { business: null, withLabel: false, mode: 'toggle', silent: false }
)

const emit = defineEmits<{ changed: [saved: boolean] }>()

const toast = useAppToast()
const route = useRoute()
const { isSaved, isBusy, toggle, undoRemove } = useSavedBusinesses()
const { isAuthenticated } = useAuth()

const saved = computed(() => isSaved(props.businessId))
const busy = computed(() => isBusy(props.businessId))

const label = computed(() => {
  if (props.mode === 'remove') return `حذف ${props.business?.name ?? 'این کسب‌وکار'} از نشان‌شده‌ها`
  return saved.value ? 'حذف از کسب‌وکارهای نشان‌شده' : 'افزودن به کسب‌وکارهای نشان‌شده'
})

const icon = computed(() => {
  if (props.mode === 'remove') return 'i-lucide-bookmark-x'
  return saved.value ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'
})

async function onClick(event: MouseEvent): Promise<void> {
  // داخل کارت، دکمه روی لینک نشسته‌است: ناوبری نباید انجام شود.
  event.preventDefault()
  event.stopPropagation()
  if (busy.value) return

  if (!isAuthenticated.value) {
    if (props.silent) return
    toast.info('برای نشان‌کردن کسب‌وکار، ابتدا وارد حساب شوید.', {
      action: {
        label: 'ورود',
        onClick: () => navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      }
    })
    return
  }

  const result = await toggle(props.businessId, props.business ?? undefined)
  emit('changed', result.saved)
  if (props.silent) return

  if (!result.ok) {
    toast.error(result.message ?? 'انتخاب کسب‌وکار انجام نشد. دوباره تلاش کنید.')
    return
  }

  if (result.saved) {
    toast.success('به نشان‌شده‌ها اضافه شد.', props.business?.name)
    return
  }
  // حذف بدون دیالوگ تأیید — اما با راه بازگشت
  toast.undoable(
    'از نشان‌شده‌ها حذف شد.',
    {
      label: 'بازگردانی',
      onClick: async () => {
        if (await undoRemove()) toast.success('به نشان‌شده‌ها بازگشت.')
      }
    },
    props.business?.name
  )
}
</script>

<template>
  <button
    type="button"
    class="pressable inline-flex shrink-0 items-center justify-center rounded-full border"
    :class="[
      withLabel ? 'h-10 gap-1.5 px-3' : 'size-10',
      saved
        ? 'border-primary-border bg-primary-soft text-primary'
        : 'border-line bg-surface text-foreground-secondary hover:border-line-strong hover:text-foreground',
      mode === 'remove' && saved
        ? 'hover:border-error-border hover:bg-error-soft hover:text-error'
        : '',
      busy && 'opacity-70'
    ]"
    :aria-label="label"
    :aria-pressed="mode === 'remove' ? undefined : saved"
    :aria-busy="busy"
    :title="label"
    :disabled="busy"
    @click="onClick"
  >
    <UIcon
      v-if="busy"
      name="i-lucide-loader-circle"
      class="size-5 animate-spin"
      aria-hidden="true"
    />
    <UIcon v-else :name="icon" class="size-5" aria-hidden="true" />
    <span v-if="withLabel" class="t-label">
      {{ mode === 'remove' ? 'حذف' : saved ? 'نشان‌شده' : 'نشان‌کردن' }}
    </span>
  </button>
</template>
