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
  notes?: string
  cancelledBy?: BookingCancelledBy
  cancelReason?: string
  createdAt: ISODateTime
}
