import type { AuthService } from '~/services/auth/auth-service'
import type { EntityId } from '~/types/common'
import type { Employee } from '~/types/employee'
import type {
  AvailabilityDay,
  BusinessScheduleView,
  Weekday,
  EmployeeScheduleView,
  EmployeeScheduleSummary,
  ScheduleInput,
  ScheduleSource
} from '~/types/availability'
import {
  clearMockAvailabilityState,
  persistBusinessSchedule,
  persistEmployeeSchedule,
  resolveBusinessEmployeeSchedules,
  resolveBusinessSchedule,
  resolveEmployeeSchedule
} from '~/services/mocks/availability-state'
import { resolveBusinessEmployees } from '~/services/mocks/employee-state'
import { ServiceError } from '~/utils/errors'
import { employeeDisplayName } from '~/types/employee'
import {
  employeeScheduleConflictDays,
  employeeScheduleConflictMessage,
  validateSchedule
} from '~/utils/validation'
import { buildScheduleSummary } from '~/utils/schedule-summary'
import { intersectDays, sortScheduleDays } from '~/utils/schedule'
import { weekdayLabel } from '~/config/availability'
import { APP_TIMEZONE } from '~/config/timezone'
import { resolveOwnedBusiness } from './owner-access'
import type { AvailabilityManagementService } from './availability-management-service'

/** «شنبه، یک‌شنبه و جمعه» — فهرست فارسیِ کوتاه برای متن‌های توضیحی. */
function listFa(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return `«${items[0]}»`
  return `${items.slice(0, -1).map(i => `«${i}»`).join('، ')} و «${items[items.length - 1]}»`
}

/**
 * ساعات کاری در حالت mock (فاز ۱۱).
 *
 * پنج تعهد معماری:
 *   ۱) مالکیت: هر خواندن/نوشتن از `resolveOwnedBusiness` می‌گذرد؛ پرسنلِ کسب‌وکار
 *      دیگر `NOT_FOUND` می‌گیرد (نه ۴۰۳) تا وجودش لو نرود — همان قرارداد فاز ۱۰.
 *   ۲) اعتبارسنجی متمرکز: `validateSchedule` (قاعدهٔ یک‌روز-یک-ساعت، بدون
 *      هم‌پوشانی، start < end) و `employeeScheduleConflictMessage` (پرسنل ⊆
 *      کسب‌وکار). همان توابعی که فرم برای نمایش خطا استفاده می‌کند؛ پس «فرم
 *      می‌پذیرد، سرور رد می‌کند» ممکن نیست.
 *   ۳) ذخیرهٔ *برنامه*، نه اسلات: چیزی که می‌نویسیم روزها و بازه‌هاست.
 *   ۴) بازگشت‌ناپذیرنکردن داده: غیرفعال‌شدن پرسنل برنامه‌اش را پاک نمی‌کند، و
 *      تغییر ساعت کسب‌وکار برنامهٔ اختصاصی نفر را بازنویسی نمی‌کند — جای آن،
 *      «اشتراک» هنگام خواندن گرفته می‌شود و تناقض اعلام می‌شود.
 *   ۵) no mutation روی آرایه‌های mock؛ همه‌چیز از دلتای کوکی.
 */
export class MockAvailabilityManagementService implements AvailabilityManagementService {
  constructor(private readonly auth: AuthService) {}

  /* ─────────────────────────── نمای‌سازی ─────────────────────────── */

  private businessView(businessId: EntityId): BusinessScheduleView {
    const resolved = resolveBusinessSchedule(businessId)
    const days = resolved.days
    return {
      businessId,
      schedule: days
        ? {
            businessId,
            timezone: APP_TIMEZONE,
            days: sortScheduleDays(days),
            source: 'business-default',
            updatedAt: resolved.updatedAt
          }
        : null,
      summary: days ? buildScheduleSummary(days) : null,
      timezone: APP_TIMEZONE
    }
  }

  /** رکورد پرسنل از دید همین کسب‌وکار — نبود = Not Found (مالیت هم همین‌جا). */
  private findEmployee(businessId: EntityId, employeeId: EntityId): Employee {
    const employee = resolveBusinessEmployees(businessId).find(e => e.id === employeeId)
    if (!employee) {
      throw ServiceError.notFound('چنین پرسنلی در این کسب‌وکار ثبت نشده است.')
    }
    return employee
  }

  /**
   * توضیح‌های «این برنامه عملاً چه تاثیری دارد؟» — صادق، چون یک برنامهٔ بدون
   * سرویس یا یک نفر غیرفعال، ساعتِ درست دارد ولی رزرو نمی‌سازد.
   */
  private notes(employee: Employee, conflictDays: Weekday[]): string | null {
    const parts: string[] = []
    if (conflictDays.length > 0) {
      parts.push(
        `ساعت ${listFa(conflictDays.map(weekdayLabel))} او بیرون از ساعات کسب‌وکار است `
        + 'و تا ساعت کسب‌وکار عوض نشود، در رزرو اعمال نمی‌شود.'
      )
    }
    if (employee.status !== 'active') {
      parts.push('این نفر غیرفعال است؛ برنامهٔ ساعتش نگه داشته می‌شود ولی رزرو تازه‌ای از آن ساخته نمی‌شود.')
    }
    else if (employee.serviceIds.length === 0) {
      parts.push('سرویسی به او اختصاص نیافته؛ ساعت کاری‌اش قابل تنظیم است، تا سرویس بگیرد رزروی از آن ساخته نمی‌شود.')
    }
    return parts.length > 0 ? parts.join(' ') : null
  }

  private employeeView(businessId: EntityId, employee: Employee): EmployeeScheduleView {
    const business = this.businessView(businessId)
    const resolved = resolveEmployeeSchedule(businessId, employee.id)
    const source: ScheduleSource = resolved?.source ?? 'business-default'
    const customDays = source === 'custom' ? resolved?.days ?? null : null
    const businessDays = business.schedule?.days ?? null

    // برنامهٔ *معتبر* = اشتراک با کسب‌وکار؛ «پیش‌فرض» یعنی همان برنامهٔ کسب‌وکار
    const intended = customDays ?? businessDays
    const effective = intended && businessDays ? intersectDays(intended, businessDays) : null
    const conflictDays = scheduleConflictWeekdays(customDays, businessDays)
    const conflictMessage = conflictDays.length > 0
      ? employeeScheduleConflictMessage(customDays!, businessDays)
      : null

    const daysForSummary = customDays ?? businessDays
    return {
      employeeId: employee.id,
      displayName: employeeDisplayName(employee),
      status: employee.status,
      source,
      headline: source === 'custom'
        ? (daysForSummary ? buildScheduleSummary(daysForSummary).headline : 'برنامهٔ اختصاصی تنظیم نشده')
        : 'مطابق ساعات کاری کسب‌وکار',
      summary: daysForSummary ? buildScheduleSummary(daysForSummary) : null,
      conflictDays,
      bookable: employee.status === 'active' && employee.serviceIds.length > 0,
      note: this.notes(employee, conflictDays),
      businessId,
      business,
      conflictMessage,
      schedule: customDays
        ? {
            businessId,
            employeeId: employee.id,
            timezone: APP_TIMEZONE,
            days: sortScheduleDays(customDays),
            source: 'custom',
            updatedAt: resolved?.updatedAt
          }
        : null,
      effective
    }
  }

  /* ─────────────────────────── خواندن ─────────────────────────── */

  async getBusiness(businessId: EntityId): Promise<BusinessScheduleView> {
    const flags = useMockFlags()
    await delay(240)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    return this.businessView(business.id)
  }

  async listEmployees(businessId: EntityId): Promise<EmployeeScheduleSummary[]> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const known = new Set(resolveBusinessEmployeeSchedules(business.id).map(r => r.employeeId))
    return resolveBusinessEmployees(business.id)
      .filter(e => known.has(e.id))
      .map(e => this.employeeView(business.id, e))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fa'))
  }

  async getEmployee(businessId: EntityId, employeeId: EntityId): Promise<EmployeeScheduleView> {
    const flags = useMockFlags()
    await delay(200)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    return this.employeeView(business.id, this.findEmployee(business.id, employeeId))
  }

  /* ─────────────────────────── نوشتن ─────────────────────────── */

  /**
   * ذخیرهٔ برنامهٔ هفته: روزها *جایگزین* می‌شوند (PUT، نه PATCH) — چون «ویرایش
   * برنامه» یعنی همین. خروجی اعتبارسنجی، ترتیب canonical و ساعت‌های نرمال‌شده
   * را دارد، پس آنچه می‌خوانیم همان چیزی است که ذخیره شده.
   */
  async saveBusiness(businessId: EntityId, days: AvailabilityDay[]): Promise<BusinessScheduleView> {
    const flags = useMockFlags()
    await delay(420)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const result = validateSchedule(days)
    if (!result.ok) throw ServiceError.validation(result.message ?? 'برنامهٔ هفته معتبر نیست.')

    persistBusinessSchedule(business.id, result.days)
    return this.businessView(business.id)
  }

  async saveEmployee(
    businessId: EntityId,
    employeeId: EntityId,
    input: ScheduleInput
  ): Promise<EmployeeScheduleView> {
    const flags = useMockFlags()
    await delay(420)
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()

    const business = await resolveOwnedBusiness(this.auth, businessId)
    const employee = this.findEmployee(business.id, employeeId)

    if (input.source === 'business-default') {
      persistEmployeeSchedule(business.id, employee.id, 'business-default')
      return this.employeeView(business.id, employee)
    }

    const businessDays = this.businessView(business.id).schedule?.days ?? null
    if (!businessDays) {
      // «اول ساعت کسب‌وکار» — تا برنامهٔ نفر معلق نماند و بی‌صدا نامحدود نشود
      throw ServiceError.validation(
        'اول ساعات کاری کسب‌وکار را تنظیم کنید؛ برنامهٔ اختصاصی پرسنل باید داخل آن بگنجد.'
      )
    }

    const result = validateSchedule(input.days ?? [])
    if (!result.ok) throw ServiceError.validation(result.message ?? 'برنامهٔ هفته معتبر نیست.')

    const conflict = employeeScheduleConflictMessage(result.days, businessDays)
    if (conflict) throw ServiceError.validation(conflict)

    persistEmployeeSchedule(business.id, employee.id, 'custom', result.days)
    return this.employeeView(business.id, employee)
  }

  /**
   * بازگشت به پیش‌فرض: رکورد custom حذف می‌شود (نه «خالی»)، پس نفر دوباره
   * *زنده* از ساعت کسب‌وکار پیروی می‌کند — اگر فردا ساعت عوض شد، برنامهٔ او هم
   * عوض‌شده به‌نظر می‌رسد.
   */
  async resetEmployeeToBusinessDefault(
    businessId: EntityId,
    employeeId: EntityId
  ): Promise<EmployeeScheduleView> {
    return this.saveEmployee(businessId, employeeId, { source: 'business-default' })
  }

  async resetLocalChanges(): Promise<void> {
    clearMockAvailabilityState()
  }
}

/**
 * روزهای برنامهٔ پرسنل که *عملاً* بیرون از کسب‌وکارند (بعد از تغییر ساعت
 * کسب‌وکار ممکن می‌شود؛ موقع ذخیرهٔ تازه، همان قاعده جلوی ذخیره را می‌گیرد).
 */
export function scheduleConflictWeekdays(
  employeeDays: AvailabilityDay[] | null,
  businessDays: AvailabilityDay[] | null
): AvailabilityDay['weekday'][] {
  if (!employeeDays || !businessDays) return []
  // همان قاعدهٔ مرکزیِ موقع ذخیره («هر بازهٔ نفر در یکی از بازه‌های کسب‌وکار باشد»)،
  // پس «۰۹ تا ۱۹» روی کسب‌وکاری که ۱۱ تا ۱۵ باز است هم تناقض است، نه فقط روزهایی
  // که کاملاً بسته‌اند — وگرنه owner فکر می‌کند ساعت نفر اعمال می‌شود.
  return employeeScheduleConflictDays(employeeDays, businessDays)
}
