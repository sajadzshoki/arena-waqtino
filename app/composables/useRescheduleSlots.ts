import type { DayAvailability, DayAvailabilityStatus, TimeSlot } from '~/types/availability'
import type { DateAvailability } from '~/types/booking-flow'
import type { EntityId } from '~/types/common'
import { BOOKING_POLICY } from '~/config/booking-policy'

export interface RescheduleSource {
  businessId: EntityId | null
  serviceId: EntityId | null
  employeeId: EntityId | null
}

/**
 * «به چه ساعتی بروم؟» — موتور انتخاب اسلاتِ *جابه‌جایی* نوبت.
 *
 * عمداً جدا از `useBookingFlow` است: آن جریان یک draft چندگامی را نگه می‌دارد،
 * ولی اینجا نوبت از قبل «هست» و فقط زمانش عوض می‌شود. هر دو اما از **یک سرویس**
 * می‌خوانند (`services.availability`) و از **یک** نگاشت مشترک برای نوار تاریخ
 * (`toDateAvailabilityList`) — پس «پر/تعطیل/تنظیم‌نشده» در دو جای اپ دو جور
 * معنا نمی‌شود (بند ۲۱: زبان وضعیت واحد).
 *
 * نکتهٔ مهم: فهرست اسلات، *خودِ نوبتِ در حال جابه‌جایی* را از اشغال بیرون
 * نمی‌کند (قرارداد `AvailabilityQuery` این فیلد را ندارد). نتیجه‌اش فقط این است
 * که ساعت فعلی در انتخاب‌گر «گرفته» دیده می‌شود — وگرنه کاربر می‌تواند نوبت را
 * به همان ساعت قبلی «جابه‌جا» کند که بی‌معناست. اعتبارسنجی نهایی در سرویس است
 * و آن‌جا `excludeBookingId` اعمال می‌شود.
 */
export function useRescheduleSlots(source: () => RescheduleSource | null) {
  const services = useServices()

  const dates = ref<DateAvailability[]>([])
  const selectedDate = ref<string | null>(null)
  const day = ref<DayAvailability | null>(null)
  const selectedSlot = ref<TimeSlot | null>(null)

  const loadingDates = ref(false)
  const loadingDay = ref(false)
  const datesError = ref<string | null>(null)
  const dayError = ref<string | null>(null)

  const slots = computed<TimeSlot[]>(() => day.value?.slots ?? [])
  const dayStatus = computed<DayAvailabilityStatus | null>(() => day.value?.status ?? null)
  const dayMessage = computed(() => day.value?.message ?? null)
  const dayWindow = computed(() => day.value?.window ?? [])
  const noSlotsAvailable = computed(() => !loadingDay.value && slots.value.length === 0)

  function current(): RescheduleSource | null {
    const value = source()
    return value && value.businessId && value.serviceId ? value : null
  }

  async function loadDates(): Promise<void> {
    const src = current()
    if (!src?.businessId) return
    loadingDates.value = true
    datesError.value = null
    try {
      const entries = await services.availability.getDateAvailability(
        src.businessId,
        upcomingDateKeys(BOOKING_POLICY.rescheduleHorizonDays),
        { serviceId: src.serviceId, employeeId: src.employeeId }
      )
      dates.value = toDateAvailabilityList(entries)
      // اولین روزِ دارای وقت آزاد انتخاب می‌شود؛ اگر نبود، اول فهرست (تا پیام
      // «چرا نیست» از خود سرویس خوانده شود، نه از حدس UI)
      const first = dates.value.find(d => d.hasAvailableSlots) ?? dates.value[0]
      await selectDate(first?.dateStr ?? null)
    }
    catch (error) {
      datesError.value = toServiceError(error).message
      dates.value = []
    }
    finally {
      loadingDates.value = false
    }
  }

  async function selectDate(dateKey: string | null): Promise<void> {
    selectedDate.value = dateKey
    selectedSlot.value = null
    day.value = null
    const src = current()
    if (!src?.businessId || !dateKey) return
    loadingDay.value = true
    dayError.value = null
    try {
      day.value = await services.availability.getDayAvailability({
        businessId: src.businessId,
        date: dateKey,
        serviceId: src.serviceId,
        employeeId: src.employeeId
      })
    }
    catch (error) {
      dayError.value = toServiceError(error).message
    }
    finally {
      loadingDay.value = false
    }
  }

  function selectSlot(slot: TimeSlot | null): void {
    selectedSlot.value = slot
  }

  /** تلاش مجدد: همان روز را دوباره، یا اگر روزی انتخاب نشده کل پنجره را. */
  async function retry(): Promise<void> {
    if (selectedDate.value && datesError.value === null) await selectDate(selectedDate.value)
    else await loadDates()
  }

  return {
    dates,
    selectedDate,
    slots,
    selectedSlot: readonly(selectedSlot),
    dayStatus,
    dayMessage,
    dayWindow,
    noSlotsAvailable,
    loadingDates,
    loadingDay,
    datesError,
    dayError,
    loadDates,
    selectDate,
    selectSlot,
    retry
  }
}
