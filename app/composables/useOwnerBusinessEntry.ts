import type { MaybeRef } from 'vue'
import type { BusinessAccess } from '~/types/owner'

/**
 * «ورود به یک کسب‌وکار» — نقطهٔ مشترک صفحه‌های فضای کاری
 * (داشبورد / اطلاعات / مدیریت).
 *
 * چرا یک کامپوزابل؟ چون بررسی مالکیت و «زمینه» باید در *یک* جا تصمیم گرفته
 * شود وگرنه هر صفحه نسخهٔ خودش را می‌سازد. صفحه‌ها فقط `phase` را می‌خوانند:
 *   'loading'   هنوز معلوم نیست (اسکلت)
 *   'ok'        زمینه همین کسب‌وکار است؛ داده‌ها قابل نمایش‌اند
 *   'forbidden' کسب‌وکار هست، اما مال این حساب نیست
 *   'not_found' چنین کسب‌وکاری وجود ندارد
 *   'error'     خطای شبکه/سرویس (پیام فارسی در accessMessage)
 */
export type OwnerEntryPhase = 'loading' | 'ok' | BusinessAccess

export function useOwnerBusinessEntry(source: MaybeRef<EntityId | null>) {
  const context = useBusinessContext()
  const businessId = computed(() => toValue(source))
  const phase = ref<OwnerEntryPhase>('loading')

  async function boot(): Promise<void> {
    const id = businessId.value
    if (!id) {
      phase.value = 'not_found'
      return
    }
    phase.value = 'loading'
    // silentIfCurrent: اگر همین حالا زمینه همین است، درخواست تکراری نمی‌زنیم
    const result = await context.enter(id, { silentIfCurrent: true })
    // نشست رفته بیرون؛ مسیر مرکزی احراز هویت در جریان است → حالت خطا نسازیم
    if (!result.ok && result.redirecting) return
    phase.value = result.ok ? 'ok' : result.access
  }

  return {
    businessId,
    /** idِ زمینهٔ فعلی — برای صفحه‌هایی که باید URL و زمینه را جفت ببینند */
    contextBusinessId: context.currentBusinessId,
    phase: readonly(phase),
    boot,
    business: context.business,
    category: context.category,
    summary: context.summary,
    metrics: context.metrics,
    access: context.access,
    accessMessage: context.accessMessage,
    switching: context.switching
  }
}
