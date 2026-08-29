/**
 * نگهبان «تغییرات ذخیره‌نشده» — یک مکانیزم برای همهٔ فرم‌های ویرایشی.
 *
 * سه راه خروج را می‌پوشاند:
 *   ۱) بازگشت داخل‌اپ و دکمهٔ back مرورگر/موبایل → هر دو از router می‌گذرند،
 *      پس نگهبان مسیر (`onBeforeRouteLeave`) جلوی‌شان را می‌گیرد.
 *   ۲) بستن/تازه‌سازی تب → `beforeunload` (مرورگر مسئول دیالوگ خودش است؛ ما
 *      فقط اجازه نمی‌دهیم بی‌صدا برود).
 *   ۳) تأیید/انصراف با دیالوگ خود اپ (`WqConfirm`) — هرگز `window.confirm`.
 *
 * مسیر تا پاسخ کاربر معلق می‌ماند (`Promise<boolean>`)؛ اگر «ماند» را زد،
 * هیچ ناوبری‌ای انجام نمی‌شود و فرم همان‌جا می‌ماند.
 */
export function useUnsavedChangesGuard(isDirty: () => boolean) {
  const confirmOpen = ref(false)
  let resolveLeave: ((proceed: boolean) => void) | null = null
  /** بعد از ذخیرهٔ موفق، خروج دیگر نباید سؤال بپرسد (dirty=false می‌شود، ولی
   *  ناوبری ممکن است پیش از آن flag اجرا شود — صریح‌تر و بی‌رقابت‌تر). */
  const released = ref(false)

  function askLeave(): Promise<boolean> {
    return new Promise((resolve) => {
      resolveLeave = resolve
      confirmOpen.value = true
    })
  }

  /** خروج از صفحه را بی‌سؤال‌وجواب ممکن می‌کند (مثلاً بلافاصله پس از ذخیره). */
  function release(): void {
    released.value = true
    confirmOpen.value = false
    resolveLeave?.(true)
    resolveLeave = null
  }

  /** پاسخ کاربر به دیالوگ: `true` = خروج، `false` = ماندن. */
  function settleLeave(proceed: boolean): void {
    confirmOpen.value = false
    resolveLeave?.(proceed)
    resolveLeave = null
  }

  onBeforeRouteLeave(async () => {
    if (released.value || !isDirty()) return true
    return askLeave()
  })

  function onBeforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault()
    event.returnValue = ''
  }

  watch(isDirty, (next) => {
    if (!import.meta.client) return
    if (next && !released.value) window.addEventListener('beforeunload', onBeforeUnload)
    else window.removeEventListener('beforeunload', onBeforeUnload)
  })

  onMounted(() => {
    if (import.meta.client && isDirty()) window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() => {
    if (import.meta.client) window.removeEventListener('beforeunload', onBeforeUnload)
  })

  return { confirmOpen, settleLeave, release }
}
