import type { MaybeRef } from 'vue'
import type { EntityId } from '~/types/common'
import type { ManagedService } from '~/types/service'

/**
 * اکشن‌های چرخهٔ حیات یک سرویس (فعال/غیرفعال، حذف با سیاست) — چیزی که
 * صفحهٔ فهرست و صفحهٔ جزئیات *بین خودشان مشترک است*.
 *
 * چرا در یک کامپوزبل؟ چون «حذف» فقط یک تابع نیست: باید تأیید بخواهد، نتیجهٔ
 * سیاست را توضیح دهد، در حالت بلوکه پیشنهاد «غیرفعال‌کردن» بدهد، حین کار
 * loading نشان دهد و بعد از موفقیت بازخورد بدهد. این رفتار را در دو صفحه
 * کپی نکن، وگرنه فردا یکی‌شان با بک‌اند واقعی فرق می‌کند.
 *
 * کامپوننت‌ها فقط props/emit می‌گیرند و هیچ‌کدام مستقیم به سرویس یا mock دست
 * نمی‌زند (لایه‌ها جابه‌جا نمی‌شوند).
 */
export function useServiceActions(businessId: MaybeRef<EntityId | null>) {
  const services = useBusinessServices(businessId)
  const toast = useAppToast()

  /** شناسه را نگه می‌داریم، نه رکورد — تا داده همیشه از کش تازه خوانده شود. */
  const targetId = ref<EntityId | null>(null)
  const sheetOpen = ref(false)
  const deleteOpen = ref(false)

  const target = computed<ManagedService | null>(() => services.find(targetId.value))

  /** سیاست حذف، نتیجه را از لایهٔ سرویس آمده نمایش می‌دهد (نه حدس UI). */
  const deleteMode = computed<'confirm' | 'blocked'>(() =>
    target.value?.deletePolicy.canDelete === false ? 'blocked' : 'confirm'
  )

  const busy = computed(() => (targetId.value ? services.busyFor(targetId.value) : null))
  const deleting = computed(() => busy.value === 'deleting')
  const toggling = computed(() => busy.value === 'status')

  function openActions(service: ManagedService): void {
    targetId.value = service.id
    sheetOpen.value = true
  }

  function closeActions(): void {
    sheetOpen.value = false
  }

  /** «حذف» از شیت — در حالت بلوکه همان دیالوگ با توضیح باز می‌شود. */
  function requestDelete(service: ManagedService): void {
    targetId.value = service.id
    sheetOpen.value = false
    deleteOpen.value = true
  }

  function closeDelete(): void {
    deleteOpen.value = false
  }

  /**
   * سوییچ وضعیت — بی‌تأیید مزاحم (عمل برگشت‌پذیر است) با بازخورد متنی.
   * متن پیام از نگاشت متمرکز وضعیت می‌آید، نه از رشتهٔ تازه‌ساختهٔ صفحه.
   */
  async function toggleStatus(service: ManagedService): Promise<boolean> {
    const meta = serviceStatusMeta(service.status)
    const next = meta.toggle
    if (!next) {
      toast.info('برای این وضعیت اکشنی تعریف نشده است.')
      return false
    }
    sheetOpen.value = false
    const result = await services.setStatus(service.id, next.to)
    if (result.ok) {
      const label = serviceStatusLabel(next.to)
      toast.success(
        next.to === 'inactive'
          ? `«${service.name}» غیرفعال شد؛ برای رزرو تازه باز نمی‌ماند.`
          : `«${service.name}» ${label} شد و در رزرو مشتری قرار گرفت.`,
        next.to === 'inactive' ? 'i-lucide-eye-off' : 'i-lucide-circle-check'
      )
      return true
    }
    if (result.message) toast.error(result.message)
    return false
  }

  /**
   * دکمهٔ اصلی دیالوگ حذف:
   *   • حالت عادی → حذف قطعی
   *   • حالت بلوکه → همان کاری که سیاست پیشنهاد می‌کند (غیرفعال‌کردن)
   * تا کاربر هیچ‌وقت به بن‌بست نرسد.
   */
  async function confirmPrimaryAction(): Promise<'deleted' | 'deactivated' | 'failed'> {
    const service = target.value
    if (!service) return 'failed'

    if (deleteMode.value === 'blocked') {
      const ok = (await services.setStatus(service.id, 'inactive')).ok
      if (ok) {
        toast.success(`«${service.name}» غیرفعال شد.`, 'i-lucide-eye-off')
        deleteOpen.value = false
        return 'deactivated'
      }
      toast.error(services.actionErrorFor(service.id) ?? 'نتوانستیم سرویس را غیرفعال کنیم.')
      return 'failed'
    }

    const result = await services.remove(service.id)
    if (result.ok) {
      toast.success(`«${service.name}» حذف شد.`, 'i-lucide-trash-2')
      deleteOpen.value = false
      targetId.value = null
      return 'deleted'
    }
    toast.error(result.message ?? 'حذف سرویس انجام نشد.')
    return 'failed'
  }

  return {
    target,
    sheetOpen,
    deleteOpen,
    deleteMode,
    deleting,
    toggling,
    openActions,
    closeActions,
    requestDelete,
    closeDelete,
    toggleStatus,
    confirmPrimaryAction
  }
}
