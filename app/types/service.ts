/** سرویس قابل‌رزروی که یک کسب‌وکار ارائه می‌دهد. */
export interface BookableService {
  id: EntityId
  businessId: EntityId
  name: string
  description?: string
  /** به تومان */
  price: Toman
  /** مدت انجام خدمت به دقیقه */
  durationMinutes: number
  /** اگر فقط برخی کارمندان این سرویس را انجام می‌دهند */
  employeeIds?: EntityId[]
  isActive: boolean
}
