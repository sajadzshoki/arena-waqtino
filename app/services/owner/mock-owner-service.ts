import type { Booking } from '~/types/booking'
import type { OwnedBusiness, OwnerBookingItem, OwnerBusinessMetrics, OwnerDashboard } from '~/types/owner'
import type { Business, BusinessCategory } from '~/types/business'
import type { EntityId } from '~/types/common'
import type { AuthService } from '~/services/auth/auth-service'
import {
  MOCK_BUSINESSES,
  MOCK_CATEGORIES,
  MOCK_EMPLOYEES
} from '~/services/mocks/businesses'
import { resolveBookingServiceSnapshot, resolveBusinessServices } from '~/services/mocks/service-state'
import { allMockBookings } from '~/services/mocks/bookings'
import { mockCustomerName } from '~/services/mocks/customers'
import { ServiceError } from '~/utils/errors'
import { requireOwnerUserId, resolveOwnedBusiness } from './owner-access'
import type { OwnerService } from './owner-service'

/**
 * پیاده‌سازی mock فضای کاری صاحب کسب‌وکار.
 *
 * سه تصمیم مهم:
 *   ۱) مالکیت از رکورد کسب‌وکار خوانده می‌شود (`ownerUserId === userId`)، نه از
 *      آنچه UI فرض می‌کند. همین‌جا جایی است که «هر شناسه‌ای مال من نیست»
 *      معنی پیدا می‌کند؛ در حالت api سرور همان بررسی را می‌کند و ۴۰۳ می‌دهد.
 *   ۲) شمارش‌ها و حل‌کردن نام‌ها (سرویس/مشتری/کارمند/دسته) این‌جا انجام می‌شود
 *      تا صفحه و کامپوننت‌ها فقط نمایش دهند.
 *   ۳) دادهٔ زمینه‌ای (رزروها) از همان منبع‌واحد‌حقیقت فاز ۶ می‌آید؛ فهرست
 *      تکراری برای «نمای مدیر» ساخته نشده است.
 */
export class MockOwnerService implements OwnerService {
  constructor(private readonly auth: AuthService) {}

  /** کاربر جاری — از همان کمکی مشترک مالکیت (یک قاعدهٔ نشست، همه‌جا). */
  private async requireUserId(): Promise<EntityId> {
    return requireOwnerUserId(this.auth)
  }

  /** روز جاری (محل سرویس) — از نیمه‌شب تا نیمه‌شب بعد. */
  private dayBounds(now = new Date()): { from: number; to: number } {
    const from = new Date(now)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    return { from: from.getTime(), to: to.getTime() }
  }

  private bookingsOf(businessId: EntityId): Booking[] {
    return allMockBookings().filter(b => b.businessId === businessId)
  }

  /** رزروهای زندهٔ امروز: امروز شروع می‌شوند، لغو/عدم‌حضور نیستند و تمام نشده‌اند. */
  private liveToday(businessId: EntityId, now: Date): Booking[] {
    const { from, to } = this.dayBounds(now)
    const nowMs = now.getTime()
    return this.bookingsOf(businessId)
      .filter((b) => {
        const start = new Date(b.start).getTime()
        if (start < from || start >= to) return false
        if (b.status === 'cancelled' || b.status === 'no_show') return false
        // نوبتی که دیروز تمام شده امروز نیست؛ نوبتی که هنوز تمام نشده می‌ماند
        return new Date(b.end).getTime() > nowMs
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  private upcoming(businessId: EntityId, now: Date): Booking[] {
    const nowMs = now.getTime()
    return this.bookingsOf(businessId)
      .filter(b => new Date(b.start).getTime() >= nowMs && (b.status === 'pending' || b.status === 'confirmed'))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  private metricsOf(businessId: EntityId, now: Date): OwnerBusinessMetrics {
    const upcoming = this.upcoming(businessId, now)
    return {
      todayCount: this.liveToday(businessId, now).length,
      upcomingCount: upcoming.length,
      pendingCount: upcoming.filter(b => b.status === 'pending').length,
      // همان منبع‌واحد‌حقیقت فاز ۹: شماری که بعد از ساخت/غیرفعال‌کردن سرویس درست می‌ماند
      serviceCount: resolveBusinessServices(businessId).filter(s => s.status === 'active').length,
      employeeCount: MOCK_EMPLOYEES.filter(e => e.businessId === businessId && e.isActive).length
    }
  }

  private summaryOf(business: Business, now: Date): OwnedBusiness {
    return {
      business,
      category: MOCK_CATEGORIES.find(c => c.id === business.categoryId) ?? null,
      metrics: this.metricsOf(business.id, now)
    }
  }

  private toItem(booking: Booking): OwnerBookingItem {
    // تاریخچه با اسنپ‌شات خودش خوانده می‌شود؛ تغییر نام یا حذف سرویس، رزرو قبلی را خراب نمی‌کند
    const snapshot = resolveBookingServiceSnapshot(booking)
    const employee = booking.employeeId
      ? MOCK_EMPLOYEES.find(e => e.id === booking.employeeId)
      : undefined
    return {
      id: booking.id,
      start: booking.start,
      end: booking.end,
      status: booking.status,
      customerName: mockCustomerName(booking.customerId),
      serviceName: snapshot?.name ?? 'سرویس حذف‌شده',
      employeeName: employee?.name ?? null,
      price: booking.price,
      notes: booking.notes
    }
  }

  /**
   * مالکیت + وجود — از همان کمکی مشترک فاز ۹ (مدیریت سرویس‌ها هم همین را
   * صدا می‌زند، پس دو قاعدهٔ مالکیتی در اپ نداریم).
   */
  private async resolveOwned(businessId: EntityId): Promise<Business> {
    return resolveOwnedBusiness(this.auth, businessId)
  }

  async listOwnedBusinesses(): Promise<OwnedBusiness[]> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const userId = await this.requireUserId()

    // forceEmpty فقط روی «فهرست» معنا دارد (سناریوی «کسب‌وکاری ندارم»)،
    // چون واکشی یک کسب‌وکار مشخص باید مثل api همان ۴۰۳/۴۰۴ را بدهد.
    if (flags.enabled.value && flags.forceEmpty.value) return []

    return MOCK_BUSINESSES
      .filter(b => b.ownerUserId === userId)
      .map(b => this.summaryOf(b, new Date()))
      .sort((a, b) => a.business.name.localeCompare(b.business.name, 'fa'))
  }

  async getOwnedBusiness(businessId: EntityId): Promise<OwnedBusiness> {
    const flags = useMockFlags()
    await delay(200)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    return this.summaryOf(await this.resolveOwned(businessId), new Date())
  }

  async getDashboard(businessId: EntityId): Promise<OwnerDashboard> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const now = new Date()
    const business = await this.resolveOwned(businessId)
    const category: BusinessCategory | null =
      MOCK_CATEGORIES.find(c => c.id === business.categoryId) ?? null
    const upcoming = this.upcoming(businessId, now)

    return {
      businessId,
      business,
      category,
      metrics: this.metricsOf(businessId, now),
      today: this.liveToday(businessId, now).map(b => this.toItem(b)),
      next: upcoming[0] ? this.toItem(upcoming[0]) : null,
      generatedAt: now.toISOString()
    }
  }
}
