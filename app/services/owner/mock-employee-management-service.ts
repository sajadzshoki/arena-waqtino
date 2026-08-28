import type { AuthService } from '~/services/auth/auth-service'
import type { EntityId } from '~/types/common'
import type { Booking } from '~/types/booking'
import type {
  Employee,
  EmployeeInput,
  EmployeeRemovePolicy,
  EmployeeStatus,
  ManagedEmployee
} from '~/types/employee'
import type { BookableService } from '~/types/service'
import { allMockBookings } from '~/services/mocks/bookings'
import {
  clearMockEmployeesState,
  persistBusinessEmployee,
  persistBusinessEmployeeRemoval,
  persistBusinessEmployeeStatus,
  resolveBusinessEmployees
} from '~/services/mocks/employee-state'
import { resolveBusinessServices } from '~/services/mocks/service-state'
import { DEV_USERS } from '~/services/mocks/users'
import { ServiceError } from '~/utils/errors'
import { employeeDisplayName } from '~/types/employee'
import { employeeInputError } from '~/utils/validation'
import { resolveOwnedBusiness } from './owner-access'
import type { EmployeeManagementService } from './employee-management-service'

/**
 * مدیریت پرسنل در حالت mock — چرخهٔ کامل ساخت / ویرایش / اختصاص سرویس /
 * فعال‌سازی / غیرفعال‌کردن / حذف، روی همان داده‌ای که خواندن مشتری و جریان رزرو
 * هم می‌خوانند (منبع‌واحد‌حقیقت: «اختصاص بدهم و انتخاب پرسنلِ رزرو همان لحظه
 * عوض شود» از همین‌جا در می‌آید، نه از refetch جداگانه در هر صفحه).
 *
 * چهار تعهد معماری:
 *   ۱) مالکیت کسب‌وکار و رابطهٔ پرسنل↔کسب‌وکار همین‌جا بررسی می‌شود؛ پرسنلی که
 *      به کسب‌وکار دیگری تعلق دارد عمداً `NOT_FOUND` می‌گیرد (نه ۴۰۳) تا وجودش
 *      به مدیر دیگری لو نرود.
 *   ۲) قاعدهٔ «سرویس باید مال همین کسب‌وکار باشد» هم همین‌جا اجرا می‌شود —
 *      شناسه‌های انتخاب‌شده در UI قابل اعتماد نیستند.
 *   ۳) قواعد فرم دوباره همین‌جا اجرا می‌شوند (دفاع دوم، آینهٔ اعتبارسنجی سرور).
 *   ۴) هیچ آرایهٔ mock ای mutate نمی‌شود؛ تغییرات به‌صورت delta در کوکی نوشته
 *      می‌شوند تا refresh و reload داده را از دست ندهند.
 */
export class MockEmployeeManagementService implements EmployeeManagementService {
  constructor(private readonly auth: AuthService) {}

  /** نوبت‌های این نفر: کل تاریخچه و زیرمجموعهٔ زنده‌اش. */
  private bookingsOf(businessId: EntityId, employeeId: EntityId): { all: Booking[]; live: Booking[] } {
    const now = Date.now()
    const all = allMockBookings().filter(b => b.businessId === businessId && b.employeeId === employeeId)
    const live = all.filter(b =>
      (b.status === 'pending' || b.status === 'confirmed') && new Date(b.start).getTime() >= now
    )
    return { all, live }
  }

  /** سرویس‌های این کسب‌وکار (با هر وضعیتی) — مبنای هر اعتبارسنجی رابطه. */
  private servicesOf(businessId: EntityId): BookableService[] {
    return resolveBusinessServices(businessId)
  }

  /**
   * فهرست شناسه‌های درخواستی → شناسه‌های معتبر همان کسب‌وکار.
   * «نیست» و «مال این کسب‌وکار نیست» هر دو همان Not Found سرویس‌ها را می‌گیرند،
   * پس نمی‌شود با حدس‌زدن شناسه، سرویس کسب‌وکار دیگری را به پرسنل خودی چسباند.
   */
  private resolveServiceIds(businessId: EntityId, serviceIds: EntityId[]): EntityId[] {
    const known = this.servicesOf(businessId)
    const unique = [...new Set(serviceIds)]
    for (const id of unique) {
      if (!known.some(s => s.id === id)) {
        throw ServiceError.notFound('چنین سرویسی در این کسب‌وکار ثبت نشده است.')
      }
    }
    // ترتیب canonical: ترتیب فهرست سرویس‌ها — تا یک رابطه، دو شکل ذخیره نشود
    return known.filter(s => unique.includes(s.id)).map(s => s.id)
  }

  /**
   * اگر این نفر حذف/غیرفعال شود، کدام سرویس‌های فعال *بدون پرسنل* می‌مانند؟
   * (فقط هشدار صادقانه است، نه بلوکه‌کردن — رزرو آن سرویس‌ها همان‌طور که
   * امروز بعضی سرویس‌ها کار می‌کنند، بدون انتخاب پرسنل ادامه می‌یابد.)
   */
  private orphanedServices(businessId: EntityId, employeeId: EntityId): string[] {
    const employees = resolveBusinessEmployees(businessId)
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return []
    return this.servicesOf(businessId)
      .filter(s => s.status === 'active')
      .filter(s => employee?.serviceIds.includes(s.id))
      .filter((s) => {
        const others = employees.filter(e => e.id !== employeeId && e.status === 'active')
        const covered = others.some(e => e.serviceIds.includes(s.id))
        return !covered
      })
      .map(s => s.name)
  }

  /** نتیجهٔ سیاست حذف روی این نفر (config در app/config/employee-policy.ts). */
  private policyFor(
    employee: Employee,
    counts: { all: number; live: number },
    linked: boolean
  ): EmployeeRemovePolicy {
    if (EMPLOYEE_REMOVAL_POLICY.blockWhenLiveBookings && counts.live > 0) {
      return {
        canRemove: false,
        blocker: 'has_live_bookings',
        hint: `این نفر ${toFaDigits(counts.live)} نوبت پیش‌رو دارد و حذف نمی‌شود. تا تکلیف آن نوبت‌ها روشن شود، «غیرفعال‌کردن» همان کاری را می‌کند که می‌خواهید.`
      }
    }
    if (EMPLOYEE_REMOVAL_POLICY.blockWhenAccountLinked && linked) {
      return {
        canRemove: false,
        blocker: null,
        hint: 'این پرسنل به یک حساب کاربری متصل است؛ اول اتصال باید از لایهٔ کاربران مدیریت شود.'
      }
    }
    if (counts.all > 0) {
      return {
        canRemove: EMPLOYEE_REMOVAL_POLICY.allowWhenHistoryOnly,
        blocker: null,
        hint: `${toFaDigits(counts.all)} نوبتِ گذشته به این نفر اشاره می‌کند؛ آن رکوردها در تاریخچه با نام خودش می‌مانند.`
      }
    }
    return { canRemove: true, blocker: null, hint: null }
  }

  private linkOf(employee: Employee): ManagedEmployee['linkedAccount'] {
    if (!employee.userId) return { state: 'none', accountActive: false }
    const accountActive = Object.values(DEV_USERS).some(u => u.id === employee.userId)
    return { state: 'linked', accountActive }
  }

  private view(businessId: EntityId, employee: Employee): ManagedEmployee {
    const { all, live } = this.bookingsOf(businessId, employee.id)
    const services = this.servicesOf(businessId)
    const assigned = services.filter(s => employee.serviceIds.includes(s.id))
    const link = this.linkOf(employee)
    return {
      ...employee,
      displayName: employeeDisplayName(employee),
      activeServiceCount: assigned.filter(s => s.status === 'active').length,
      orphanedServiceNames: this.orphanedServices(businessId, employee.id),
      liveBookingCount: live.length,
      bookingCount: all.length,
      removePolicy: this.policyFor(employee, { all: all.length, live: live.length }, link.state === 'linked'),
      linkedAccount: link
    }
  }

  /**
   * پرسنل را از دید همان کسب‌وکار می‌خواند؛ «نیست» و «مال این کسب‌وکار نیست» هر
   * دو یک Not Found می‌گیرند (دفاع در عمق: UI هم نباید فرقشان بگذارد).
   */
  private findEmployee(businessId: EntityId, employeeId: EntityId): Employee {
    const employee = resolveBusinessEmployees(businessId).find(e => e.id === employeeId)
    if (!employee) {
      throw ServiceError.notFound('چنین پرسنلی در این کسب‌وکار ثبت نشده است.')
    }
    return employee
  }

  /** ورودی فرم → فیلدهای دامنه، با اعتبارسنجی مجدد (دفاع دوم). */
  private toFields(input: EmployeeInput, businessId: EntityId) {
    const message = employeeInputError(input)
    if (message) throw ServiceError.validation(message)
    return {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      title: input.title?.trim() || undefined,
      phone: input.phone?.trim() || null,
      avatarUrl: input.avatarUrl ?? null,
      status: input.status,
      serviceIds: this.resolveServiceIds(businessId, input.serviceIds)
    }
  }

  async list(businessId: EntityId): Promise<ManagedEmployee[]> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    // forceEmpty = «این کسب‌وکار هنوز پرسنلی ندارد» — سناریوی حالت خالی
    if (flags.enabled.value && flags.forceEmpty.value) return []

    return resolveBusinessEmployees(business.id)
      .map(e => this.view(business.id, e))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fa'))
  }

  async get(businessId: EntityId, employeeId: EntityId): Promise<ManagedEmployee> {
    const flags = useMockFlags()
    await delay(200)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    return this.view(business.id, this.findEmployee(business.id, employeeId))
  }

  async create(businessId: EntityId, input: EmployeeInput): Promise<ManagedEmployee> {
    const flags = useMockFlags()
    await delay(400)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const fields = this.toFields(input, business.id)
    const now = new Date().toISOString()
    const employee: Employee = {
      // شناسه را خودمان می‌سازیم؛ در حالت api سرور مقدار می‌دهد و همان حفظ می‌شود
      id: `emp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      businessId: business.id,
      ...fields,
      createdAt: now,
      updatedAt: now
    }
    persistBusinessEmployee(business.id, employee)
    return this.view(business.id, employee)
  }

  async update(
    businessId: EntityId,
    employeeId: EntityId,
    input: EmployeeInput
  ): Promise<ManagedEmployee> {
    const flags = useMockFlags()
    await delay(400)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const current = this.findEmployee(business.id, employeeId)
    const next: Employee = {
      ...current,
      ...this.toFields(input, business.id),
      updatedAt: new Date().toISOString()
    }
    persistBusinessEmployee(business.id, next)
    return this.view(business.id, next)
  }

  async setStatus(
    businessId: EntityId,
    employeeId: EntityId,
    status: EmployeeStatus
  ): Promise<ManagedEmployee> {
    const flags = useMockFlags()
    await delay(300)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const current = this.findEmployee(business.id, employeeId)
    if (current.status !== status) {
      persistBusinessEmployeeStatus(business.id, employeeId, status)
    }
    // idempotent: همان وضعیت درخواست شود چیزی نوشته نمی‌شود، ولی نتیجه درست است
    return this.view(business.id, { ...current, status })
  }

  async assignServices(
    businessId: EntityId,
    employeeId: EntityId,
    serviceIds: EntityId[]
  ): Promise<ManagedEmployee> {
    const flags = useMockFlags()
    await delay(350)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const current = this.findEmployee(business.id, employeeId)
    const next: Employee = {
      ...current,
      serviceIds: this.resolveServiceIds(business.id, serviceIds),
      // وضعیت دست نمی‌خورد؛ رابطه و وضعیت دو تصمیم جداوند
      updatedAt: new Date().toISOString()
    }
    persistBusinessEmployee(business.id, next)
    return this.view(business.id, next)
  }

  async remove(businessId: EntityId, employeeId: EntityId): Promise<void> {
    const flags = useMockFlags()
    await delay(500)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const employee = this.findEmployee(business.id, employeeId)
    const { all, live } = this.bookingsOf(business.id, employeeId)
    const policy = this.policyFor(employee, { all: all.length, live: live.length }, employee.userId != null)
    // سیاست دوباره همین‌جا بررسی می‌شود، نه فقط در UI — تا فهرست کهنه کسی را که
    // «الان» نوبت زنده‌اش اضافه شده حذف نکند.
    if (!policy.canRemove) {
      throw ServiceError.conflict(policy.hint ?? 'این نفر فعلاً قابل حذف نیست.')
    }
    persistBusinessEmployeeRemoval(business.id, employee)
  }

  async resetLocalChanges(): Promise<void> {
    await delay(200)
    // در حالت mock فقط یک کار منطقی است: پاک‌سازی کل delta محلی؛ دادهٔ پایهٔ
    // MOCK_EMPLOYEES همیشه دست‌نخورده می‌ماند (هیچ نوشتن روی آن انجام نمی‌شود).
    clearMockEmployeesState()
  }
}
