import type { Booking, BookingWithDetails } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { BookingCancelBlock, BookingRescheduleBlock } from '~/config/booking-policy'
import type { CancelBookingResult, RescheduleBookingResult } from '~/services/bookings/booking-service'
import { bookingCancelBlock, bookingRescheduleBlock } from '~/config/booking-policy'

/**
 * نوبت‌های مشتری — فهرست، جزئیات، لغو و جابه‌جایی.
 *
 * سه چیزی که در فاز ۱۲ درست شد:
 *  ۱) **یک استراتژی خطا**: هیچ `console.*` و هیچ پیام hardcode‌شده‌ای نیست؛ هر
 *     شکست به `ServiceError` تبدیل می‌شود و پیام فارسی همان است (§۲۴). تفاوت
 *     «شبکه/سرور» و «نوبت پیدا نشد» هم حفظ می‌شود — پیش از این هر دو null
 *     برمی‌گرداندند و صفحه می‌گفت «نوبتی وجود ندارد».
 *  ۲) **busy تفکیکی**: فهرست، لغو و جابه‌جایی هر کدام بار خود را دارند؛ یک
 *     `loading` مشترک باعث می‌شد بازکردن شیتِ لغو، کل فهرست را اسکلت کند.
 *  ۳) **سیاست از config**: «قابل لغو است؟ و اگر نه چرا؟» را این لایه از
 *     `bookingCancelBlock` می‌گیرد — همان تابعی که سرویس هم استفاده می‌کند.
 *
 * داده فقط از `useServices()` خوانده می‌شود؛ صفحه هیچ‌وقت مستقیم به mock نمی‌زند.
 */
export function useCustomerBookings() {
  const services = useServices()
  const toast = useAppToast()

  const upcoming = ref<BookingWithDetails[]>([])
  const past = ref<BookingWithDetails[]>([])

  const listPending = ref(false)
  const listError = ref<string | null>(null)
  /**
   * «حداقل یک بار تلاش شده» — برای این است که نقاشیِ نخستِ صفحه (SSR و لحظهٔ
   * قبل از `onMounted`) حالت خالی/خطا نباشد: تا اولین خواندن تمام نشده،
   * صفحه اسکلت نشان می‌دهد. روی `true` رفتن فقط در موفقیت، خطای اول را ابدی
   * می‌کرد (صفحه روی اسکلت گیر می‌کرد).
   */
  const loaded = ref(false)

  const detail = ref<BookingWithDetails | null>(null)
  const detailPending = ref(false)
  const detailLoaded = ref(false)
  const loadError = ref<string | null>(null)

  const cancelPending = ref(false)
  const reschedulePending = ref(false)
  /** خطای اکشن، برای نمایش *در جای خودش* (داخل شیت/نوار پایین) — toast هم همان را می‌گوید */
  const actionError = ref<string | null>(null)

  /**
   * نام/مدت از «تاریخچهٔ خودِ نوبت» خوانده می‌شود (اسنپ‌شات، وگرنه سرویس زنده یا
   * گورِ سرویس) — نه از فهرست قابل‌رزرو؛ وگرنه غیرفعال‌کردن یک سرویس، نوبت‌های
   * قبلی مشتری را بی‌نام می‌کرد.
   */
  async function enrich(booking: Booking): Promise<BookingWithDetails> {
    const [business, categories, serviceHistory, employeeHistory] = await Promise.all([
      services.businesses.getById(booking.businessId),
      services.businesses.listCategories(),
      booking.serviceSnapshot
        ? Promise.resolve(booking.serviceSnapshot)
        : services.businesses.getServiceForHistory(booking.serviceId),
      // نام پرسنل هم «تاریخچه» است: غیرفعال یا حذف‌شدن او از سمت مدیر، نباید
      // نوبت ثبت‌شدهٔ مشتری را بی‌نام کند (فاز ۱۰).
      booking.employeeId
        ? (booking.employeeSnapshot ?? services.businesses.getEmployeeForHistory(booking.employeeId))
        : Promise.resolve(null)
    ])

    const category = business ? categories.find(c => c.id === business.categoryId) : null

    return {
      ...booking,
      businessName: business?.name ?? 'کسب‌وکار نامشخص',
      serviceName: serviceHistory?.name ?? 'سرویس حذف‌شده',
      employeeName: booking.employeeId ? (employeeHistory?.name ?? 'پرسنل حذف‌شده') : undefined,
      businessCategoryName: category?.name,
      // مدت: اسنپ‌شات، وگرنه بازهٔ خودِ نوبت (هیچ‌وقت عدد ساختگی نه)
      serviceDuration: serviceHistory?.durationMinutes
        ?? Math.max(
          0,
          Math.round((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / 60_000)
        )
    }
  }

  async function fetchBookings(): Promise<void> {
    listPending.value = true
    listError.value = null
    try {
      const [upcomingRows, pastRows] = await Promise.all([
        services.bookings.listMine('upcoming'),
        services.bookings.listMine('past')
      ])
      const [enrichedUpcoming, enrichedPast] = await Promise.all([
        Promise.all(upcomingRows.map(enrich)),
        Promise.all(pastRows.map(enrich))
      ])
      upcoming.value = enrichedUpcoming
      past.value = enrichedPast
    }
    catch (error) {
      // پیام سرویس (فارسی) تنها چیزی است که کاربر می‌بیند؛ جزئیات فنی نمی‌آید
      listError.value = toServiceError(error).message
    }
    finally {
      loaded.value = true
      listPending.value = false
    }
  }

  /** یک‌بار بارگذاری در mount؛ بازگشت به صفحه با `fetchBookings` تازه می‌شود. */
  async function ensure(): Promise<void> {
    if (loaded.value || listPending.value) return
    await fetchBookings()
  }

  async function loadBookingById(id: EntityId): Promise<void> {
    detailPending.value = true
    loadError.value = null
    try {
      const booking = await services.bookings.getById(id)
      // `null` از سرویس یعنی «نوبتی با این شناسه برای شما نیست» → حالت خالی، نه خطا
      detail.value = booking ? await enrich(booking) : null
    }
    catch (error) {
      loadError.value = toServiceError(error).message
      detail.value = null
    }
    finally {
      detailLoaded.value = true
      detailPending.value = false
    }
  }

  /** `true` یعنی نوبت لغو شد؛ پیام خطا (در صورت وجود) در `actionError` است. */
  async function cancelBooking(bookingId: EntityId, reason?: string): Promise<boolean> {
    return runAction(bookingId, () => services.bookings.cancel({ bookingId, ...(reason ? { reason } : {}) }), 'cancel')
  }

  async function rescheduleBooking(bookingId: EntityId, newStart: string, newEnd: string): Promise<boolean> {
    return runAction(bookingId, () => services.bookings.reschedule({ bookingId, newStart, newEnd }), 'reschedule')
  }

  /**
   * مسیر مشترک لغو/جابه‌جایی: pending → فراخوانی → در صورت موفقیت خواندن دوباره
   * (هیچ state دستی «تغییر داده نمی‌شود» که از واقعیت سرویس واگرا شود) → در صورت
   * خطا، پیام همان‌جا در شیت + toast.
   */
  async function runAction(
    bookingId: EntityId,
    call: () => Promise<CancelBookingResult | RescheduleBookingResult>,
    kind: 'cancel' | 'reschedule'
  ): Promise<boolean> {
    const pending = kind === 'cancel' ? cancelPending : reschedulePending
    pending.value = true
    actionError.value = null
    try {
      const result = await call()
      if (result.success) {
        await Promise.all([
          fetchBookings(),
          detail.value?.id === bookingId ? loadBookingById(bookingId) : Promise.resolve()
        ])
        toast.success(kind === 'cancel' ? 'نوبت لغو شد.' : 'زمان نوبت به‌روز شد.')
        return true
      }
      // کد خطا برای لایهٔ بالاتر معنا ندارد؛ پیام فارسیِ سرویس همان چیزی است که می‌ماند
      actionError.value = result.error.message
      toast.error(result.error.message)
      return false
    }
    catch (error) {
      const serviceError = toServiceError(error)
      actionError.value = serviceError.message
      toast.error(serviceError.message)
      return false
    }
    finally {
      pending.value = false
    }
  }

  /** سیاست مشترک UI/سرویس (config/booking-policy) — صفحه خودش قاعده نمی‌سازد. */
  function cancelBlock(booking: Pick<Booking, 'status' | 'start'>): BookingCancelBlock {
    return bookingCancelBlock(booking)
  }

  function rescheduleBlock(booking: Pick<Booking, 'status' | 'start'>): BookingRescheduleBlock {
    return bookingRescheduleBlock(booking)
  }

  return {
    // فهرست
    upcoming: readonly(upcoming),
    past: readonly(past),
    listPending: readonly(listPending),
    listError: readonly(listError),
    loaded: readonly(loaded),
    fetchBookings,
    ensure,
    // جزئیات
    detail: readonly(detail),
    detailPending: readonly(detailPending),
    detailLoaded: readonly(detailLoaded),
    loadError: readonly(loadError),
    loadBookingById,
    // اکشن‌ها
    cancelBooking,
    rescheduleBooking,
    cancelPending: readonly(cancelPending),
    reschedulePending: readonly(reschedulePending),
    actionError: readonly(actionError),
    // سیاست
    cancelBlock,
    rescheduleBlock
  }
}
