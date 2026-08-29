/**
 * کلیدهای شبیه‌سازی mock — فقط وقتی apiMode='mock' معنا دارد.
 * امکان تست حالت‌های loading/success/empty/error بدون بک‌اند واقعی.
 * (به‌مرور می‌توان از محیط هم تغذیه شود؛ فعلاً از UI توسعه کنترل می‌شود.)
 */
export function useMockFlags() {
  const config = useRuntimeConfig()
  const enabled = computed(() => config.public.apiMode === 'mock')

  /** همهٔ خواندن‌ها با خطای شبکه جواب داده شوند */
  const forceError = useState<boolean>('mock:force-error', () => false)
  /** همهٔ خواندن‌ها نتیجهٔ خالی برگردانند */
  const forceEmpty = useState<boolean>('mock:force-empty', () => false)
  /**
   * همهٔ درخواست‌های کاربر-محور پاسخ ۴۰۱ بگیرند — برای آزمایش مسیر
   * «نشست نامعتبر → پاک‌سازی مرکزی نشست → هدایت به ورود» (بدون تایمر جعلی).
   */
  const forceUnauthorized = useState<boolean>('mock:force-unauthorized', () => false)

  return { enabled, forceError, forceEmpty, forceUnauthorized }
}
