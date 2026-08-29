/**
 * «اتصال هست؟» — تنها منبع وضعیت شبکه در اپ (§۲۷).
 *
 * این یک سیستم offline-first نیست (داده‌ای کش یا صف‌بندی نمی‌شود)؛ فقط همین سه
 * کار را می‌کند: تشخیص، اطلاع صادقانه به کاربر، و فراهم‌کردن «تلاش مجدد».
 *
 * `navigator.onLine` تنها نشانه است و در webview گاهی «همیشه true» است، پس
 * درایهٔ خطای واقعی همان است که سرویس می‌دهد (خطای شبکه) و این composable فقط
 * *پیش‌نشانه* است: بنر، و انتخاب بین «تلاش مجدد» و «اتصال را بررسی کن».
 */
export function useNetworkStatus() {
  const online = ref(true)

  function sync(): void {
    if (!import.meta.client) return
    online.value = navigator.onLine !== false
  }

  function onOnline(): void {
    online.value = true
  }

  function onOffline(): void {
    online.value = false
  }

  onMounted(() => {
    sync()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  })

  onUnmounted(() => {
    if (!import.meta.client) return
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  })

  return { online: readonly(online) }
}
