/** شبیه‌سازی تأخیر شبکه برای پیاده‌سازی‌های mock — فقط در لایهٔ سرویس. */
export function delay(ms = 380): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
