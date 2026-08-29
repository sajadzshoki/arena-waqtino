/**
 * «دکمهٔ بازگشت سیستم» — تنها پلی که به پلتفرم native دارد (§۱۰/§۵۳).
 *
 * قاعدهٔ یکپارچهٔ اپ:
 *   شیت/دیالوگ باز است → همان بسته می‌شود (نه خروج از صفحه)
 *   چند لایه باز است     → لایهٔ بالا (LIFO) بسته می‌شود
 *   لایه‌ای نیست         → ناوبری به صفحهٔ قبل (history.back)
 *   تاریخچه‌ای نیست       → اپ دست‌نخورده می‌ماند (خروجِ بی‌دلیل نداریم؛
 *                          روی وب هم مرورگر خودش همین کار را می‌کند)
 *
 * چرا یک آرایهٔ ماژول-سطحی و نه useState؟ چون «اولویتِ لایه‌ها» یک واقعیت
 * *کاملاً کلاینتی و لحظه‌ای* است: در SSR شیتی باز نیست. `useState` هم برای این
 * کار اضافه بود (و روی سرور بین درخواست‌ها شایع نمی‌شود، پس بی‌معناست).
 *
 * هیچ وابستگی native در این پروژه نصب نیست و نباید بشود: `@capacitor/app` در
 * زمان *بیلد* resolve نمی‌شود، پس با `@vite-ignore` و یک شناسهٔ متغیر import
 * می‌شود و اگر نبود، بی‌صدا «وب» فرض می‌شود. همان‌جا که ظرف‌ساز پروژه
 * Capacitor را اضافه کند، این فایل بدون تغییر باقی می‌ماند.
 */
export type SystemBackListener = () => void

const stack: SystemBackListener[] = []
let unsubscribeFromPlatform: (() => void) | null = null

function isNativeShell(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return cap?.isNativePlatform?.() === true
}

function handleBack(): void {
  const top = stack[stack.length - 1]
  if (top) {
    top()
    return
  }
  // هیچ لایه‌ای باز نیست → صفحهٔ قبل. روی وب این حالت بی‌معناست (مرورگر خودش
  // back را مدیریت می‌کند)؛ فقط در webview که سیستم «خروج» را می‌دهد لازم است.
  if (isNativeShell() && window.history.length > 1) window.history.back()
}

async function attachToPlatform(): Promise<void> {
  if (unsubscribeFromPlatform || !import.meta.client) return
  try {
    const specifier = '@capacitor/app'
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      App?: { addListener?: (event: 'backButton', cb: () => void) => Promise<{ remove: () => void }> }
    }
    const listener = await mod.App?.addListener?.('backButton', handleBack)
    if (listener) unsubscribeFromPlatform = () => void listener.remove()
  }
  catch {
    // پلاگین نصب نشده = محیط وب/توسعه؛ استک همچنان برای تست منطق باز می‌شود
    unsubscribeFromPlatform = null
  }
}

/**
 * ثبت یک شنوندهٔ «بازگشت». ترتیب = LIFO: هر چه تازه‌تر باز شده، زودتر بسته می‌شود.
 * برگشتی برای پاک‌سازی می‌دهد (کامپوننت در unmount صدا می‌زند).
 */
export function pushSystemBackListener(listener: SystemBackListener): () => void {
  stack.push(listener)
  void attachToPlatform()
  let removed = false
  return () => {
    if (removed) return
    removed = true
    const index = stack.lastIndexOf(listener)
    if (index >= 0) stack.splice(index, 1)
  }
}

/** برای تست: چند لایه الان فعال است؟ */
export function systemBackDepth(): number {
  return stack.length
}
