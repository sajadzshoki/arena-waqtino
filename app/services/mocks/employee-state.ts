import type { EntityId } from '~/types/common'
import type { BookingEmployeeSnapshot } from '~/types/booking'
import { type Employee, employeeDisplayName, type EmployeeStatus } from '~/types/employee'
import { MOCK_EMPLOYEES } from './businesses'

/**
 * «حالت پرسنل» — تنها جایی که فهرست پرسنل یک کسب‌وکار در حالت mock نوشته و
 * خوانده می‌شود (کوکی `wq_business_employees`).
 *
 * آینهٔ `service-state.ts` است، با همان سه دلیل:
 *   ۱) منبع‌واحد‌حقیقت: نمای مدیر (همهٔ وضعیت‌ها) و نمای مشتری/رزرو (فقط active،
 *      و فقط برای سرویسی که به آن نفر اختصاص یافته) از *یک* فهرست می‌خوانند؛
 *      نقش‌ها فقط فیلتر/توضیح فرق دارند. دو دادهٔ موازی = سنک مزمن.
 *   ۲) دلتا، نه کپی: کوکی ~۴KB جا دارد، پس فقط patch رکوردهای seed، رکورد
 *      تازه‌های مدیر و شناسهٔ حذف‌شده‌ها نوشته می‌شود.
 *   ۳) رابطهٔ پرسنل↔سرویس همین‌جا ذخیره می‌شود (`serviceIds` روی رکورد پرسنل).
 *      `BookableService.employeeIds` فقط نمای مشتق‌شده است
 *      (`assignedEmployeeIds`) — تا یک طرف نتواند بی‌طرف دیگر عوض شود.
 *
 * قاعدهٔ SSR: `useCookie` به context نیاز دارد؛ خواندن با `canUseCookie()`
 * محافظت می‌شود تا اگر جایی پس از `await` صدا زده شد، صفحه خطا نگیرد و دادهٔ
 * پایه را ببیند.
 */

/** گورِ پرسنل حذف‌شده — تاریخچهٔ نوبت نباید بی‌نام بماند. */
interface EmployeeTombstone {
  businessId: EntityId
  name: string
  title?: string
  removedAt: string
}

interface BusinessEmployeesDelta {
  /** تغییرات پرسنل seed (کلید = employeeId) */
  patches?: Record<EntityId, Partial<Employee>>
  /** پرسنلی که مدیر ساخته است */
  created?: Employee[]
}

export interface MockEmployeesState {
  businesses?: Record<EntityId, BusinessEmployeesDelta>
  removed?: Record<EntityId, EmployeeTombstone>
}

const EMPLOYEES_STATE_COOKIE = 'wq_business_employees'

function cookie() {
  return useCookie<MockEmployeesState | null>(EMPLOYEES_STATE_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    // ماندگارتر از نشست: دادهٔ development نباید با یک logout پاک شود
    maxAge: 365 * 24 * 60 * 60
  })
}

function canUseCookie(): boolean {
  return tryUseNuxtApp() !== undefined
}

function readState(): MockEmployeesState {
  if (!canUseCookie()) return {}
  return cookie().value ?? {}
}

function writeState(state: MockEmployeesState): void {
  cookie().value = state
}

/** رکورد seed آن پرسنل (اگر از دادهٔ پایهٔ فاز ۴ باشد). */
function seedOf(employeeId: EntityId): Employee | undefined {
  return MOCK_EMPLOYEES.find(e => e.id === employeeId)
}

/**
 * فهرست فعلی پرسنل یک کسب‌وکار (seed + تغییرات مدیر − حذف‌شده‌ها).
 * ترتیب: همان ترتیب seed، بعد پرسنل تازهٔ مدیر — تا ویرایش، جای ردیف‌ها را عوض
 * نکند (ترتیب نمایش با `localeCompare('fa')` در لایهٔ سرویس ساخته می‌شود).
 */
export function resolveBusinessEmployees(businessId: EntityId): Employee[] {
  const state = readState()
  const delta = state.businesses?.[businessId]
  const removed = state.removed ?? {}
  const live = <T extends { id: EntityId }>(items: T[]): T[] =>
    items.filter(item => !(item.id in removed))

  const seed = live(
    MOCK_EMPLOYEES.filter(e => e.businessId === businessId).map(e =>
      delta?.patches?.[e.id] ? { ...e, ...delta.patches[e.id] } : e
    )
  )
  const created = live((delta?.created ?? []).filter(e => e.businessId === businessId))
  return [...seed, ...created]
}

/** یک پرسنل (بدون توجه به وضعیتش) — `null` یعنی نیست یا حذف شده است. */
export function resolveEmployee(employeeId: EntityId): Employee | null {
  const state = readState()
  if (employeeId in (state.removed ?? {})) return null
  const seeded = seedOf(employeeId)
  const businessId = seeded?.businessId
    ?? Object.values(state.businesses ?? {})
      .flatMap(delta => delta.created ?? [])
      .find(e => e.id === employeeId)?.businessId
  if (!businessId) return null
  return resolveBusinessEmployees(businessId).find(e => e.id === employeeId) ?? null
}

/**
 * نمای مشتق‌شدهٔ «چه کسانی این سرویس را انجام می‌دهند» — فقط پرسنل *فعال*، چون
 * مصرف‌کننده‌اش فهرست رزرو مشتری است. رابطه در رکورد پرسنل می‌ماند؛ این تابع
 * هیچ دادهٔ تازه‌ای نمی‌سازد.
 */
export function assignedEmployeeIds(businessId: EntityId, serviceId: EntityId): EntityId[] {
  return resolveBusinessEmployees(businessId)
    .filter(e => e.status === 'active' && e.serviceIds.includes(serviceId))
    .map(e => e.id)
}

/**
 * آنچه تاریخچهٔ رزرو باید دربارهٔ پرسنل نشان دهد — با اولویت
 *   ۱) اسنپ‌شات ثبت‌شده روی خود رزرو (واقعهٔ گذشته، بی‌تغییر)
 *   ۲) رکورد زندهٔ پرسنل (رزروهای قدیمی‌تر بدون اسنپ‌شات)
 *   ۳) گورِ پرسنل حذف‌شده
 * `null` یعنی هیچ‌کدام — مسئولیت برچسب جایگزین با فراخوان است.
 */
export function resolveBookingEmployeeSnapshot(booking: {
  employeeId?: EntityId | null
  employeeSnapshot?: BookingEmployeeSnapshot
}): BookingEmployeeSnapshot | null {
  if (!booking.employeeId && !booking.employeeSnapshot) return null
  if (booking.employeeSnapshot) return { ...booking.employeeSnapshot }
  const live = resolveEmployee(booking.employeeId as EntityId)
  if (live) return { name: employeeDisplayName(live) }
  const tombstone = readState().removed?.[booking.employeeId as EntityId]
  return tombstone ? { name: tombstone.name } : null
}

// ─────────────────────────── نوشتن (از لایهٔ سرویس مدیر) ───────────────────────────

function mutate(businessId: EntityId, fn: (delta: BusinessEmployeesDelta) => BusinessEmployeesDelta): void {
  const state = readState()
  const next: MockEmployeesState = {
    ...state,
    businesses: { ...state.businesses, [businessId]: fn(state.businesses?.[businessId] ?? {}) }
  }
  writeState(next)
}

/**
 * ثبت یک پرسنل: اگر از رکوردهای seed است فقط patch نوشته می‌شود (کوکی کوچک
 * بماند)، وگرنه در `created` می‌نشیند.
 */
export function persistBusinessEmployee(businessId: EntityId, employee: Employee): void {
  const isSeed = seedOf(employee.id)?.businessId === businessId
  mutate(businessId, (delta) => {
    if (isSeed) {
      return { ...delta, patches: { ...delta.patches, [employee.id]: employee } }
    }
    const rest = (delta.created ?? []).filter(e => e.id !== employee.id)
    return { ...delta, created: [...rest, employee] }
  })
}

/** تغییر وضعیت (اکثرِ موارد — تا patch کامل نوشته نشود). */
export function persistBusinessEmployeeStatus(
  businessId: EntityId,
  employeeId: EntityId,
  status: EmployeeStatus
): void {
  const isSeed = seedOf(employeeId)?.businessId === businessId
  mutate(businessId, (delta) => {
    if (isSeed) {
      return { ...delta, patches: { ...delta.patches, [employeeId]: { ...seedOf(employeeId), status } } }
    }
    const created = (delta.created ?? []).map(e => (e.id === employeeId ? { ...e, status } : e))
    return { ...delta, created }
  })
}

/**
 * حذف: شناسه در `removed` می‌نشیند (تا اگر رکورد seed بود patch‌اش هم بی‌اثر
 * شود) و نامش برای تاریخچه نگه داشته می‌شود.
 */
export function persistBusinessEmployeeRemoval(businessId: EntityId, employee: Employee): void {
  const state = readState()
  const businesses = { ...state.businesses }
  const delta = businesses[businessId]
  if (delta) {
    businesses[businessId] = {
      ...delta,
      created: (delta.created ?? []).filter(e => e.id !== employee.id)
    }
  }
  writeState({
    businesses,
    removed: {
      ...state.removed,
      [employee.id]: {
        businessId,
        name: employeeDisplayName(employee),
        title: employee.title,
        removedAt: new Date().toISOString()
      }
    }
  })
}

/**
 * پاک‌سازی کامل (فقط ابزار توسعه: «بازگشت دادهٔ موک»).
 * سرویس‌های حذف‌شده به این فهرست برنمی‌گردند — برای همان‌ها،
 * `clearMockServicesState()` صدا زده می‌شود؛ دو delta مستقل‌اند تا یک domain
 * نتواند بدون خواستن، domain دیگر را پاک کند.
 */
export function clearMockEmployeesState(): void {
  if (!canUseCookie()) return
  writeState({})
}
