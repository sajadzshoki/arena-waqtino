import type { MaybeRef } from 'vue'
import type { EntityId } from '~/types/common'
import type { ManagedEmployee } from '~/types/employee'

/**
 * اکشن‌های چرخهٔ حیات یک پرسنل (فعال/غیرفعال، حذف با سیاست) — چیزی که صفحهٔ
 * فهرست و صفحهٔ جزئیات *بین خودشان مشترک است*.
 *
 * چرا در یک کامپوزبل؟ چون «حذف» فقط یک تابع نیست: باید تأیید بخواهد، نتیجهٔ
 * سیاست را توضیح دهد، در حالت بلوکه پیشنهاد «غیرفعال‌کردن» بدهد، حین کار
 * loading نشان دهد و بعد از موفقیت بازخورد بدهد. این رفتار را در دو صفحه کپی
 * نکن، وگرنه فردا یکی‌شان با بک‌اند واقعی فرق می‌کند.
 *
 * کامپوننت‌ها فقط props/emit می‌گیرند و هیچ‌کدام مستقیم به سرویس یا mock دست
 * نمی‌زند (لایه‌ها جابه‌جا نمی‌شوند).
 */
export function useEmployeeActions(businessId: MaybeRef<EntityId | null>) {
  const employees = useBusinessEmployees(businessId)
  const toast = useAppToast()

  /** شناسه را نگه می‌داریم، نه رکورد — تا داده همیشه از کش تازه خوانده شود. */
  const targetId = ref<EntityId | null>(null)
  const sheetOpen = ref(false)
  const removeOpen = ref(false)
  /** شیت «اختصاص سرویس» را همین کامپوزبل باز نمی‌کند: آن state و نوشتنِ خودش را
   * دارد (`useEmployeeAssignment`)؛ این‌جا فقط *درخواست* باز شدن را رویداد می‌کنیم. */

  const target = computed<ManagedEmployee | null>(() => employees.find(targetId.value))

  /** سیاست حذف، نتیجه را از لایهٔ سرویس آمده نمایش می‌دهد (نه حدس UI). */
  const removeMode = computed<'confirm' | 'blocked'>(() =>
    target.value?.removePolicy.canRemove === false ? 'blocked' : 'confirm'
  )

  const busy = computed(() => (targetId.value ? employees.busyFor(targetId.value) : null))
  const removing = computed(() => busy.value === 'deleting')
  const toggling = computed(() => busy.value === 'status')

  function openActions(employee: ManagedEmployee): void {
    targetId.value = employee.id
    sheetOpen.value = true
  }

  function closeActions(): void {
    sheetOpen.value = false
  }

  /** «حذف» از شیت — در حالت بلوکه همان دیالوگ با توضیح باز می‌شود. */
  function requestRemove(employee: ManagedEmployee): void {
    targetId.value = employee.id
    sheetOpen.value = false
    removeOpen.value = true
  }

  function closeRemove(): void {
    removeOpen.value = false
  }

  /**
   * سوییچ وضعیت — بی‌تأیید مزاحم (عمل برگشت‌پذیر است) با بازخورد متنی.
   * متن پیام از نگاشت متمرکزٔ وضعیت می‌آید، نه از رشتهٔ تازه‌ساختهٔ صفحه.
   */
  async function toggleStatus(employee: ManagedEmployee): Promise<boolean> {
    const meta = employeeStatusMeta(employee.status)
    const next = meta.toggle
    if (!next) {
      toast.info('برای این وضعیت اکشنی تعریف نشده است.')
      return false
    }
    sheetOpen.value = false
    const result = await employees.setStatus(employee.id, next.to)
    if (result.ok) {
      const label = employeeStatusLabel(next.to)
      toast.success(
        next.to === 'inactive'
          ? `«${employee.displayName}» غیرفعال شد؛ برای رزرو تازه قابل انتخاب نیست.`
          : `«${employee.displayName}» ${label} شد و در انتخاب پرسنلِ رزرو قرار گرفت.`,
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
  async function confirmPrimaryAction(): Promise<'removed' | 'deactivated' | 'failed'> {
    const employee = target.value
    if (!employee) return 'failed'

    if (removeMode.value === 'blocked') {
      const ok = (await employees.setStatus(employee.id, 'inactive')).ok
      if (ok) {
        toast.success(`«${employee.displayName}» غیرفعال شد.`, 'i-lucide-eye-off')
        removeOpen.value = false
        return 'deactivated'
      }
      toast.error(employees.actionErrorFor(employee.id) ?? 'نتوانستیم این نفر را غیرفعال کنیم.')
      return 'failed'
    }

    const result = await employees.remove(employee.id)
    if (result.ok) {
      toast.success(`«${employee.displayName}» از این کسب‌وکار حذف شد.`, 'i-lucide-user-minus')
      removeOpen.value = false
      targetId.value = null
      return 'removed'
    }
    toast.error(result.message ?? 'حذف پرسنل انجام نشد.')
    return 'failed'
  }

  return {
    target,
    sheetOpen,
    removeOpen,
    removeMode,
    removing,
    toggling,
    openActions,
    closeActions,
    requestRemove,
    closeRemove,
    toggleStatus,
    confirmPrimaryAction
  }
}
