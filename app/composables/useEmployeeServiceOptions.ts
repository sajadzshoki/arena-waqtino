import type { MaybeRef } from 'vue'
import type { EntityId } from '~/types/common'
import type { AssignmentRow } from '~/composables/useEmployeeAssignment'

/**
 * گزینه‌های «اختصاص سرویس» — پلِ بین کش سرویس‌ها (فاز ۹) و انتخابگر پرسنل.
 *
 * چرا یک کامپوزبل جدا؟ چون سه‌جا به یک قاعده نیاز داریم (فرم افزودن، فرم
 * ویرایش، شیت اختصاص در صفحهٔ جزئیات) و آن قاعده این است:
 *   • گزینه‌ها فقط از همان کش per-businessId سرویس‌ها خوانده می‌شوند (نه
 *     درخواست دوم، نه فهرست جدا برای پرسنل)،
 *   • سرویس غیرفعال قابل *افزودن* نیست ولی اگر انتخاب شده باشد قابل نگاه‌داشتن
 *     و حذف است،
 *   • ردیف‌ها بی‌داده‌اند؛ نوشتن با لایهٔ پرسنل است.
 */
export function useEmployeeServiceOptions(businessId: MaybeRef<EntityId | null>) {
  const { items, ensure, find, isReady } = useBusinessServices(businessId)

  /** کش سرویس‌ها اگر هنوز پر نشده بود یک بار خوانده می‌شود (وگرنه در حافظه). */
  async function load(): Promise<void> {
    if (!isReady.value) await ensure()
  }

  function rowsFor(selectedIds: EntityId[]): AssignmentRow[] {
    const selected = new Set(selectedIds)
    return items.value.map(service => ({
      id: service.id,
      name: service.name,
      status: service.status,
      selectable: service.status === 'active' || selected.has(service.id),
      selected: selected.has(service.id)
    }))
  }

  function nameOf(serviceId: EntityId): string {
    // سرویسِ حذف‌شده در فهرست نیست؛ برچسب صادقانه، نه شناسهٔ خام
    return find(serviceId)?.name ?? 'سرویس حذف‌شده'
  }

  return { items, load, rowsFor, nameOf, ensure }
}
