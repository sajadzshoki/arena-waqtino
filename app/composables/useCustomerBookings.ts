import type { Booking, BookingWithDetails } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { CancelBookingResponse, CancelBookingErrorResponse, RescheduleBookingResponse, RescheduleBookingErrorResponse } from '~/services/bookings/booking-service'

/**
 * Composable for managing customer bookings
 * Handles fetching, cancellation, and rescheduling with enriched data
 */
export function useCustomerBookings() {
  const services = useServices()
  const toast = useAppToast()

  const upcomingBookings = ref<BookingWithDetails[]>([])
  const pastBookings = ref<BookingWithDetails[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Enrich a booking with business, service, and employee details
   */
  async function enrichBooking(booking: Booking): Promise<BookingWithDetails> {
    // نام/مدت از «تاریخچهٔ خود رزرو» خوانده می‌شود (اسنپ‌شات، وگرنه سرویس زنده یا
    // گورِ سرویس) — نه از فهرست قابل‌رزرو؛ وگرنه غیرفعال‌کردن یک سرویس، رزروهای
    // قبلی مشتری را بی‌نام می‌کرد.
    const [business, employees, categories, history] = await Promise.all([
      services.businesses.getById(booking.businessId),
      services.businesses.listEmployees(booking.businessId),
      services.businesses.listCategories(),
      booking.serviceSnapshot
        ? Promise.resolve(booking.serviceSnapshot)
        : services.businesses.getServiceForHistory(booking.serviceId)
    ])

    const employee = booking.employeeId ? employees.find(e => e.id === booking.employeeId) : null
    const category = business ? categories.find(c => c.id === business.categoryId) : null

    return {
      ...booking,
      businessName: business?.name ?? 'کسب‌وکار نامشخص',
      serviceName: history?.name ?? 'سرویس حذف‌شده',
      employeeName: employee?.name,
      businessCategoryName: category?.name,
      // مدت: اسنپ‌شات، وگرنه بازهٔ خود رزرو (هیچ‌وقت عدد ساختگی نه)
      serviceDuration: history?.durationMinutes
        ?? Math.max(0, Math.round((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / 60_000))
    }
  }

  /**
   * Fetch all bookings (upcoming and past) with enriched details
   */
  async function fetchBookings() {
    loading.value = true
    error.value = null

    try {
      const [upcoming, past] = await Promise.all([
        services.bookings.listMine('upcoming'),
        services.bookings.listMine('past')
      ])

      const [enrichedUpcoming, enrichedPast] = await Promise.all([
        Promise.all(upcoming.map(enrichBooking)),
        Promise.all(past.map(enrichBooking))
      ])

      upcomingBookings.value = enrichedUpcoming
      pastBookings.value = enrichedPast
    }
    catch (err) {
      error.value = 'خطا در دریافت رزروها'
      console.error('Failed to fetch bookings:', err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Cancel a booking
   */
  async function cancelBooking(bookingId: EntityId, reason?: string): Promise<CancelBookingResponse | CancelBookingErrorResponse> {
    loading.value = true
    error.value = null

    try {
      const result = await services.bookings.cancel({
        bookingId,
        reason
      })

      if (result.success) {
        toast.success('رزرو با موفقیت لغو شد')
        await fetchBookings()
        return { success: true, message: 'رزرو با موفقیت لغو شد' }
      }
      else {
        toast.error(result.error.message)
        return result
      }
    }
    catch (err) {
      error.value = 'خطا در لغو رزرو'
      toast.error('خطا در لغو رزرو')
      console.error('Failed to cancel booking:', err)
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'خطای سرور' }
      }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Reschedule a booking
   */
  async function rescheduleBooking(
    bookingId: EntityId,
    newStart: string,
    newEnd: string
  ): Promise<RescheduleBookingResponse | RescheduleBookingErrorResponse> {
    loading.value = true
    error.value = null

    try {
      const result = await services.bookings.reschedule({
        bookingId,
        newStart,
        newEnd
      })

      if (result.success) {
        toast.success('زمان رزرو با موفقیت تغییر کرد')
        await fetchBookings()
        const enrichedBooking = await enrichBooking(result.booking)
        return { success: true, booking: enrichedBooking }
      }
      else {
        toast.error(result.error.message)
        return result
      }
    }
    catch (err) {
      error.value = 'خطا در تغییر زمان رزرو'
      toast.error('خطا در تغییر زمان رزرو')
      console.error('Failed to reschedule booking:', err)
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'خطای سرور' }
      }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get a single booking by ID with enriched details
   */
  async function getBookingById(bookingId: EntityId): Promise<BookingWithDetails | null> {
    try {
      const booking = await services.bookings.getById(bookingId)
      if (!booking) return null
      return await enrichBooking(booking)
    }
    catch (err) {
      console.error('Failed to fetch booking:', err)
      return null
    }
  }

  /**
   * Check if a booking can be cancelled
   */
  function canCancelBooking(booking: BookingWithDetails): boolean {
    // Can't cancel if already cancelled
    if (booking.status === 'cancelled') return false

    // Can't cancel if past
    if (new Date(booking.start).getTime() < Date.now()) return false

    // Can't cancel within 2 hours of appointment
    const hoursUntilBooking = (new Date(booking.start).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntilBooking < 2) return false

    return true
  }

  /**
   * Check if a booking can be rescheduled
   */
  function canRescheduleBooking(booking: BookingWithDetails): boolean {
    // Can only reschedule pending or confirmed bookings
    if (booking.status !== 'pending' && booking.status !== 'confirmed') return false

    // Can't reschedule if past
    if (new Date(booking.start).getTime() < Date.now()) return false

    return true
  }

  return {
    upcomingBookings: readonly(upcomingBookings),
    pastBookings: readonly(pastBookings),
    loading: readonly(loading),
    error: readonly(error),
    fetchBookings,
    cancelBooking,
    rescheduleBooking,
    getBookingById,
    canCancelBooking,
    canRescheduleBooking
  }
}
