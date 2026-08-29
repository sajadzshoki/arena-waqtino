import type { MaybeRef } from 'vue'
import type { EntityId } from '~/types/common'

/**
 * «اختصاص سرویس» به یک پرسنل — ویرایشگر جدا از فرم هویت، چون تصمیم دیگری است:
 * «این نفر چه کارهایی می‌کند» نه «این نفر کیست».
 *
 * سه قاعده‌ای که عمداً این‌جا نشسته‌اند (نه در کامپوننت):
 *   ۱) فقط پرسنل همان کسب‌وکار و فقط سرویس همان کسب‌وکار — فهرست گزینه‌ها از
 *      کش همان `businessId` می‌آید و لایهٔ سرویس هم موقع نوشتن دوباره همان را
 *      بررسی می‌کند (شناسهٔ دست‌کاری‌شده در URL رد می‌شود).
 *   ۲) سرویس *غیرفعال* قابل افزودن جدید نیست، ولی اگر از قبل اختصاص یافته
 *      نگه داشته می‌شود و قابل حذف است — چون آن اختصاص بخشی از تاریخچهٔ
 *      تیم است و بی‌صدا پاک‌کردنش یعنی از دست دادن اطلاعات.
 *   ۳) شناسه‌ای که سرویسش حذف شده («mعلق») موقع ذخیره پاک می‌شود و همین‌جا
 *      صادقانه گفته می‌شود؛ تاریخچهٔ نوبت‌ها به آن شناسه وابسته نیست (اسنپ‌شات
 *      دارد)، پس پاک‌کردنش بی‌خطر است.
 *
 * نوشتن از `useBusinessEmployees.assign` می‌رود، پس کش فهرست/جزئیات و فهرست
 * رزرو مشتری همه هم‌زمان تازه می‌شوند — بدون reload.
 */

export interface AssignmentRow {
  id: EntityId
  name: string
  status: string
  /** قابل انتخاب برای اختصاص تازه؟ (سرویس فعال، یا از قبل اختصاص‌یافته) */
  selectable: boolean
  selected: boolean
}

export function useEmployeeAssignment(
  businessId: MaybeRef<EntityId | null>,
  employeeId: MaybeRef<EntityId | null>
) {
  const employees = useBusinessEmployees(businessId)
  const options = useEmployeeServiceOptions(businessId)

  const open = ref(false)
  const selectedIds = ref<EntityId[]>([])

  const employee = computed(() => employees.find(toValue(employeeId)))
  const known = computed(() => options.items.value)

  /** شناسه‌های اختصاص‌یافته‌ای که سرویسشان دیگر در این کسب‌وکار نیست. */
  const danglingIds = computed(() => {
    const ids = new Set(known.value.map(s => s.id))
    return (employee.value?.serviceIds ?? []).filter(id => !ids.has(id))
  })

  /** ردیف‌ها از همان سازندهٔ مشترک (فرم ساخت/ویرایش و این شیت یک قاعده دارند). */
  const rows = computed<AssignmentRow[]>(() => options.rowsFor(selectedIds.value))

  const selectedCount = computed(() => selectedIds.value.length)
  const saving = computed(() => {
    const id = toValue(employeeId)
    return !!id && employees.busyFor(id) === 'assigning'
  })
  const error = computed(() => {
    const id = toValue(employeeId)
    return id ? employees.actionErrorFor(id) : null
  })

  /** گزینه‌ها از همان منبع سرویس‌ها خوانده می‌شوند؛ اگر کش خالی بود، یک بار بارگذاری. */
  async function start(): Promise<void> {
    selectedIds.value = [...(employee.value?.serviceIds ?? [])]
    open.value = true
    await options.load()
  }

  function close(): void {
    open.value = false
  }

  function toggle(serviceId: EntityId): void {
    const row = rows.value.find(r => r.id === serviceId)
    if (row && !row.selectable) return
    selectedIds.value = selectedIds.value.includes(serviceId)
      ? selectedIds.value.filter(id => id !== serviceId)
      : [...selectedIds.value, serviceId]
  }

  function selectAllActive(): void {
    selectedIds.value = known.value.filter(s => s.status === 'active').map(s => s.id)
  }

  function clearAll(): void {
    selectedIds.value = []
  }

  /** تغییر واقعی داده شده؟ (مجموعهٔ شناسه‌ها، بی‌اهمیت ترتیب) */
  const dirty = computed(() => {
    const current = new Set(employee.value?.serviceIds ?? [])
    const next = new Set(selectedIds.value)
    if (current.size !== next.size) return true
    return [...next].some(id => !current.has(id))
  })

  /**
   * ذخیره: شناسه‌های معلق حذف می‌شوند (سرویسشان دیگر نیست) و بقیه عیناً
   * می‌روند؛ ترتیب canonical را لایهٔ سرویس می‌سازد.
   */
  async function save(): Promise<'saved' | 'unchanged' | 'failed'> {
    const id = toValue(employeeId)
    const biz = toValue(businessId)
    if (!id || !biz) return 'failed'
    if (!dirty.value) {
      open.value = false
      return 'unchanged'
    }
    const knownIds = new Set(known.value.map(s => s.id))
    const out = await employees.assign(id, selectedIds.value.filter(sid => knownIds.has(sid)))
    if (out.ok) {
      open.value = false
      return 'saved'
    }
    return 'failed'
  }

  return {
    open,
    employee,
    rows,
    selectedCount,
    danglingCount: computed(() => danglingIds.value.length),
    activeServiceCount: computed(() => known.value.filter(s => s.status === 'active').length),
    dirty,
    saving,
    error,
    start,
    close,
    toggle,
    selectAllActive,
    clearAll,
    save
  }
}
