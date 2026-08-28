export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type BookingCancelledBy = 'customer' | 'business' | 'employee'

export interface Booking {
  id: EntityId
  customerId: EntityId
  businessId: EntityId
  serviceId: EntityId
  employeeId?: EntityId
  start: ISODateTime
  end: ISODateTime
  status: BookingStatus
  /** قیمت لحظهٔ ثبت رزرو (تومان) — از تغییر بعدی قیمت سرویس مستقل است */
  price: Toman
  /**
   * اسنپ‌شات نام/مدت سرویس در لحظهٔ ثبت (فاز ۹) — تا «سرویس بعداً نامش عوض شد یا حذف
   * شد» تاریخچهٔ رزرو را خراب نکند. رزروهای قدیمی‌تر ممکن است نداشته باشند؛
   * خواننده باید از سرویس زنده/گورِ سرویس پرشان کند.
   */
  serviceSnapshot?: BookingServiceSnapshot
  /**
   * اسنپ‌شات نام پرسنل در لحظهٔ ثبت (فاز ۱۰) — «این نفر بعداً نامش عوض شد یا از
   * این کسب‌وکار حذف شد» نباید تاریخچهٔ نوبت را بی‌نام یا گمراه کند. رزروهای
   * قدیمی‌تر ممکن است نداشته باشند؛ خواننده از رکورد زنده/گورِ پرسنل پرش می‌کند.
   */
  employeeSnapshot?: BookingEmployeeSnapshot
  notes?: string
  cancelledBy?: BookingCancelledBy
  cancelReason?: string
  createdAt: ISODateTime
}

/**
 * Booking with resolved names for display purposes
 * This is what the UI uses after enriching the base Booking data
 */
/** چیزی که رزرو «بود»، نه لزوماً چیزی که سرویس «هست». */
export interface BookingServiceSnapshot {
  name: string
  durationMinutes: number
}

/** نام پرسنلی که نوبت را انجام می‌دهد/داده — همان لحظهٔ ثبت. */
export interface BookingEmployeeSnapshot {
  name: string
}

export interface BookingWithDetails extends Booking {
  businessName: string
  serviceName: string
  employeeName?: string
  businessCategoryName?: string
  serviceDuration: number // in minutes
}
