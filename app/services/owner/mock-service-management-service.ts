import type { AuthService } from '~/services/auth/auth-service'
import type { BookableService, ManagedService, ServiceDeletePolicy, ServiceInput, ServiceStatus } from '~/types/service'
import type { EntityId } from '~/types/common'
import { allMockBookings } from '~/services/mocks/bookings'
import {
  clearMockServicesState,
  persistBusinessService,
  persistBusinessServiceRemoval,
  persistBusinessServiceStatus,
  resolveBusinessServices
} from '~/services/mocks/service-state'
import { ServiceError } from '~/utils/errors'
import { serviceInputError } from '~/utils/validation'
import { resolveOwnedBusiness } from './owner-access'
import type { ServiceManagementService } from './service-management-service'

/**
 * مدیریت سرویس‌ها در حالت mock — چرخهٔ کامل ساخت / ویرایش / فعال‌سازی /
 * غیرفعال‌کردن / حذف، روی همان حالتی که خواندن مشتری هم می‌خواند
 * (منبع‌واحد‌حقیقت: «ویرایش کنم و فهرست و صفحهٔ مشتری هم‌زمان شوند» از همین‌جا
 * در می‌آید، نه از refetch جداگانه در هر صفحه).
 *
 * سه تعهد معماری:
 *   ۱) مالکیت کسب‌وکار و رابطهٔ سرویس↔کسب‌وکار همین‌جا بررسی می‌شود. سرویسی
 *      که به کسب‌وکار دیگری تعلق دارد عمداً `NOT_FOUND` می‌گیرد (نه ۴۰۳) تا
 *      وجودش به مدیر دیگری لو نرود.
 *   ۲) قواعد فرم دوباره همین‌جا اجرا می‌شوند (دفاع دوم، آینهٔ اعتبارسنجی سرور).
 *   ۳) هیچ آرایهٔ mock ای mutate نمی‌شود؛ تغییرات به‌صورت delta در کوکی
 *      نوشته می‌شوند تا refresh و reload داده را از دست ندهند.
 */
export class MockServiceManagementService implements ServiceManagementService {
  constructor(private readonly auth: AuthService) {}

  /** نوبت‌های این سرویس: کل تاریخچه و زیرمجموعهٔ زنده‌اش. */
  private bookingsOf(businessId: EntityId, serviceId: EntityId) {
    const now = Date.now()
    const all = allMockBookings().filter(b => b.businessId === businessId && b.serviceId === serviceId)
    const live = all.filter(b =>
      (b.status === 'pending' || b.status === 'confirmed') && new Date(b.start).getTime() >= now
    )
    return { all, live }
  }

  /** نتیجهٔ سیاست حذف روی این سرویس (config در app/config/service-policy.ts). */
  private policyFor(
    businessId: EntityId,
    service: BookableService,
    counts: { all: number; live: number }
  ): ServiceDeletePolicy {
    if (SERVICE_DELETION_POLICY.blockWhenLiveBookings && counts.live > 0) {
      return {
        canDelete: false,
        blocker: 'has_live_bookings',
        hint: `این سرویس ${toFaDigits(counts.live)} نوبت پیش‌رو دارد و حذف نمی‌شود. تا تکلیف آن نوبت‌ها روشن شود، «غیرفعال‌کردن» همان کاری را می‌کند که می‌خواهید.`
      }
    }
    if (counts.all > 0) {
      return {
        canDelete: SERVICE_DELETION_POLICY.allowWhenHistoryOnly,
        blocker: null,
        hint: `${toFaDigits(counts.all)} نوبتِ گذشته به این سرویس اشاره می‌کند؛ آن رکوردها در تاریخچه با نام و مدت همین سرویس می‌مانند.`
      }
    }
    return { canDelete: true, blocker: null, hint: null }
  }

  private view(businessId: EntityId, service: BookableService): ManagedService {
    const { all, live } = this.bookingsOf(businessId, service.id)
    return {
      ...service,
      liveBookingCount: live.length,
      bookingCount: all.length,
      deletePolicy: this.policyFor(businessId, service, { all: all.length, live: live.length })
    }
  }

  /**
   * سرویس را از دید همان کسب‌وکار می‌خواند؛ «نیست» و «مال این کسب‌وکار نیست»
   * هر دو یک Not Found می‌گیرند (دفاع در عمق: UI هم نباید فرقشان بگذارد).
   */
  private findService(businessId: EntityId, serviceId: EntityId): BookableService {
    const service = resolveBusinessServices(businessId).find(s => s.id === serviceId)
    if (!service) {
      throw ServiceError.notFound('چنین سرویسی در این کسب‌وکار ثبت نشده است.')
    }
    return service
  }

  /** ورودی فرم → فیلدهای دامنه، با اعتبارسنجی مجدد. */
  private toFields(input: ServiceInput) {
    const message = serviceInputError(input)
    if (message) throw ServiceError.validation(message)
    return {
      name: input.name.trim(),
      description: input.description.trim() || undefined,
      price: input.price,
      durationMinutes: input.durationMinutes,
      status: input.status
    }
  }

  async list(businessId: EntityId): Promise<ManagedService[]> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    // forceEmpty = «این کسب‌وکار هنوز سرویسی ندارد» — سناریوی حالت خالی
    if (flags.enabled.value && flags.forceEmpty.value) return []

    return resolveBusinessServices(business.id)
      .map(s => this.view(business.id, s))
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
  }

  async get(businessId: EntityId, serviceId: EntityId): Promise<ManagedService> {
    const flags = useMockFlags()
    await delay(200)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    return this.view(business.id, this.findService(business.id, serviceId))
  }

  async create(businessId: EntityId, input: ServiceInput): Promise<ManagedService> {
    const flags = useMockFlags()
    await delay(400)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const fields = this.toFields(input)
    const now = new Date().toISOString()
    const service: BookableService = {
      id: `srv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      businessId: business.id,
      ...fields,
      createdAt: now,
      updatedAt: now
    }
    persistBusinessService(business.id, service)
    return this.view(business.id, service)
  }

  async update(
    businessId: EntityId,
    serviceId: EntityId,
    input: ServiceInput
  ): Promise<ManagedService> {
    const flags = useMockFlags()
    await delay(400)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const current = this.findService(business.id, serviceId)
    const next: BookableService = {
      ...current,
      ...this.toFields(input),
      updatedAt: new Date().toISOString()
    }
    persistBusinessService(business.id, next)
    return this.view(business.id, next)
  }

  async setStatus(
    businessId: EntityId,
    serviceId: EntityId,
    status: ServiceStatus
  ): Promise<ManagedService> {
    const flags = useMockFlags()
    await delay(300)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const current = this.findService(business.id, serviceId)
    if (current.status !== status) {
      persistBusinessServiceStatus(business.id, serviceId, status)
    }
    // idempotent: همان وضعیت درخواست شود چیزی نوشته نمی‌شود، ولی نتیجه درست است
    return this.view(business.id, { ...current, status })
  }

  async remove(businessId: EntityId, serviceId: EntityId): Promise<void> {
    const flags = useMockFlags()
    await delay(500)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const service = this.findService(business.id, serviceId)
    const { all, live } = this.bookingsOf(business.id, serviceId)
    const policy = this.policyFor(business.id, service, { all: all.length, live: live.length })
    // سیاست دوباره همین‌جا بررسی می‌شود، نه فقط در UI — تا فهرست کهنه چیزی را
    // که «الان» نوبت زنده‌اش اضافه شده حذف نکند.
    if (!policy.canDelete) {
      throw ServiceError.conflict(policy.hint ?? 'این سرویس فعلاً قابل حذف نیست.')
    }
    persistBusinessServiceRemoval(business.id, service)
  }

  async resetLocalChanges(): Promise<void> {
    await delay(200)
    // در حالت mock فقط یک کار منطقی است: پاک‌سازی کل delta محلی؛ دادهٔ پایهٔ
    // MOCK_SERVICES همیشه دست‌نخورده می‌ماند (هیچ نوشتن روی آن انجام نمی‌شود).
    clearMockServicesState()
  }
}
