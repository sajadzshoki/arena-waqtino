/**
 * هفتهٔ ایرانی از شنبه شروع می‌شود: شنبه = ۰ … جمعه = ۶
 */
export type PersianWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface TimeRange {
  /** «HH:mm» ساعت محلی کسب‌وکار */
  start: string
  end: string
}

export interface WorkingHours {
  day: PersianWeekday
  isOpen: boolean
  ranges: TimeRange[]
}

/** اسلات قابل‌رزرو برای یک تاریخ مشخص */
export interface TimeSlot {
  start: ISODateTime
  end: ISODateTime
  employeeId?: EntityId
  isAvailable: boolean
}
