import { pushSystemBackListener } from '~/services/native/system-back'

/**
 * «وقتی این چیز باز است، دکمهٔ بازگشت اول آن را ببندد.»
 *
 * روی `ref<boolean>` (باز/بسته) می‌نشیند، پس هر شیت/دیالوگی که از `WqSheet` یا
 * `WqConfirm` استفاده می‌کند، رایگان همین رفتار را می‌گیرد — یعنی استراتژی
 * بازگشت Android در *یک* نقطه پیاده شده، نه در ۲۰ صفحه (§۱۰).
 */
export function useSystemBackHandler(open: Ref<boolean>, onClose?: () => void): void {
  let dispose: (() => void) | null = null

  function attach(): void {
    if (dispose) return
    dispose = pushSystemBackListener(() => {
      if (onClose) onClose()
      else open.value = false
    })
  }

  function detach(): void {
    dispose?.()
    dispose = null
  }

  watch(open, (value) => {
    if (value) attach()
    else detach()
  })

  onMounted(() => {
    if (open.value) attach()
  })

  onScopeDispose(detach)
}
