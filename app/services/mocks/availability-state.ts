import type { EntityId } from '~/types/common'
import type { AvailabilityDay, AvailabilitySchedule, ScheduleSource } from '~/types/availability'
import { MOCK_SCHEDULES } from './businesses'
import { resolveBusinessEmployees } from './employee-state'

/**
 * «حالت ساعات کاری» — تنها جایی که برنامهٔ هفتگی در حالت mock نوشته/خوانده
 * می‌شود (کوکی `wq_business_availability`).
 *
 * همان سه قاعدهٔ `employee-state.ts`، به‌علاوهٔ یک تصمیم مهم:
 *   ۱) دلتا، نه کپی: کوکی ~۴KB است، پس فقط *روزهایی* که عوض شده‌اند نوشته
 *      می‌شوند (`days`ِ کاملِ برنامهٔ ویرایش‌شده، ولی نه کپی کل رکوردهای seed).
 *   ۲) برنامهٔ پرسنل **زیرِ کلید کسب‌وکار** می‌نشیند، نه در یک فهرست جهانی —
 *      پس انزوای چندکسب‌وکاری ساختاری است: برای دیدن ساعت کاری پرسنل الف باید
 *      `businessId` همان‌ها را بدانید، و آن ساعت در کسب‌وکار دیگر اصلاً وجود
 *      ندارد.
 *   ۳) `source` تک‌نقطهٔ حقیقت «مطابق کسب‌وکار / اختصاصی» است. «مطابق» یعنی
 *      *هیچ رکوردی نداریم* — نه یک کپی هم‌روزِ برنامهٔ کسب‌وکار. برای همین
 *      تغییر ساعت کسب‌وکار، هشت سطر پرسنل را بازنویسی نمی‌کند.
 *
 * روزهای تعطیل هم patch می‌شوند (`enabled: false`) و بازه‌هایشان *پاک نمی‌شود*؛
 * اگر owner روزی را دوباره روشن کرد، ساعت‌های قبلی‌اش همان‌جا هستند.
 *
 * قاعدهٔ SSR: خواندن با `canUseCookie()` محافظت می‌شود (بعد از `await` در SSR
 * ممکن است context نباشد)؛ نوشتن فقط از اکشن کاربر رخ می‌دهد — هیچ domain
 * نوشتنی در SSR انجام نمی‌شود.
 */

interface BusinessAvailabilityDelta {
  /** برنامهٔ کسب‌وکار؛ `null` = صریح «تنظیم‌نشده» (حذف برنامهٔ seed) */
  business?: AvailabilityDay[] | null
  /** برنامهٔ اختصاصی پرسنل (کلید = employeeId) */
  employees?: Record<EntityId, EmployeeScheduleDelta>
}

interface EmployeeScheduleDelta {
  source: ScheduleSource
  /** فقط وقتی `source === 'custom'` معنا دارد */
  days?: AvailabilityDay[]
  updatedAt?: string
}

export interface MockAvailabilityState {
  businesses?: Record<EntityId, BusinessAvailabilityDelta>
}

/** آنچه مخزن برای هر برنامه لازم دارد: منبع + روزها (یا `null` وقتی تنظیم نشده). */
export interface ResolvedSchedule {
  source: ScheduleSource
  days: AvailabilityDay[] | null
  updatedAt?: string
}

const AVAILABILITY_STATE_COOKIE = 'wq_business_availability'

function cookie() {
  return useCookie<MockAvailabilityState | null>(AVAILABILITY_STATE_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60
  })
}

function canUseCookie(): boolean {
  return tryUseNuxtApp() !== undefined
}

function readState(): MockAvailabilityState {
  if (!canUseCookie()) return {}
  return cookie().value ?? {}
}

function writeState(state: MockAvailabilityState): void {
  cookie().value = state
}

function cloneDays(days: AvailabilityDay[]): AvailabilityDay[] {
  return days.map(day => ({
    weekday: day.weekday,
    enabled: day.enabled,
    intervals: day.intervals.map(interval => ({ ...interval }))
  }))
}

function seedSchedule(businessId: EntityId, employeeId?: EntityId): AvailabilitySchedule | undefined {
  return MOCK_SCHEDULES.find(
    s => s.businessId === businessId && (employeeId ? s.employeeId === employeeId : !s.employeeId)
  )
}

function mutate(
  businessId: EntityId,
  fn: (delta: BusinessAvailabilityDelta) => BusinessAvailabilityDelta
): void {
  const state = readState()
  writeState({
    ...state,
    businesses: { ...state.businesses, [businessId]: fn(state.businesses?.[businessId] ?? {}) }
  })
}

/* ─────────────────────────── خواندن ─────────────────────────── */

/**
 * برنامهٔ کسب‌وکار: seed + دلتا. `null` یعنی «هنوز تنظیم نشده» — حالت خالیِ
 * واقعی، نه «هفت روز تعطیل».
 */
export function resolveBusinessSchedule(businessId: EntityId): ResolvedSchedule {
  const delta = readState().businesses?.[businessId]
  if (delta && 'business' in delta) {
    return delta.business
      ? { source: 'business-default', days: cloneDays(delta.business) }
      : { source: 'business-default', days: null }
  }
  const seed = seedSchedule(businessId)
  return seed
    ? { source: 'business-default', days: cloneDays(seed.days), updatedAt: seed.updatedAt }
    : { source: 'business-default', days: null }
}

/**
 * برنامهٔ یک پرسنل. `null` یعنی «چنین پرسنلی در این کسب‌وکار نیست» — همان چیزی
 * که لایهٔ سرویس به «یافت نشد» ترجمه می‌کند؛ `source: 'business-default'` یعنی
 * رکورد اختصاصی ندارد و از ساعت پیش‌فرض کسب‌وکار پیروی می‌کند.
 */
export function resolveEmployeeSchedule(businessId: EntityId, employeeId: EntityId): ResolvedSchedule | null {
  const exists = resolveBusinessEmployees(businessId).some(e => e.id === employeeId)
  if (!exists) return null
  const delta = readState().businesses?.[businessId]?.employees?.[employeeId]
  if (delta) {
    return {
      source: delta.source,
      days: delta.source === 'custom' && delta.days ? cloneDays(delta.days) : null,
      updatedAt: delta.updatedAt
    }
  }
  const seed = seedSchedule(businessId, employeeId)
  if (!seed) return { source: 'business-default', days: null }
  return { source: seed.source, days: cloneDays(seed.days), updatedAt: seed.updatedAt }
}

/** همهٔ پرسنل یک کسب‌وکار + منبع برنامه‌شان (فهرست صفحهٔ ساعات کاری). */
export function resolveBusinessEmployeeSchedules(businessId: EntityId): Array<{
  employeeId: EntityId
  source: ScheduleSource
  days: AvailabilityDay[] | null
}> {
  return resolveBusinessEmployees(businessId).map(employee => {
    const resolved = resolveEmployeeSchedule(businessId, employee.id)
    return {
      employeeId: employee.id,
      source: resolved?.source ?? 'business-default',
      days: resolved?.days ?? null
    }
  })
}

/* ─────────────────────────── نوشتن ─────────────────────────── */

export function persistBusinessSchedule(businessId: EntityId, days: AvailabilityDay[]): void {
  mutate(businessId, delta => ({ ...delta, business: cloneDays(days) }))
}

/**
 * ثبت برنامهٔ پرسنل. `source: 'business-default'` یعنی «انصراف از برنامهٔ
 * اختصاصی» — ردیف custom *حذف* می‌شود (نه خالی‌شدن با آرایهٔ تهی)، تا «مطابق
 * کسب‌وکار» واقعاً یعنی «برنامه‌ای مستقل نداریم».
 */
export function persistEmployeeSchedule(
  businessId: EntityId,
  employeeId: EntityId,
  source: ScheduleSource,
  days?: AvailabilityDay[]
): void {
  mutate(businessId, (delta) => {
    const rest = Object.fromEntries(
      Object.entries(delta.employees ?? {}).filter(([id]) => id !== employeeId)
    )
    if (source === 'business-default') {
      // «انصراف از برنامهٔ اختصاصی» = نبودِ رکورد، نه رکوردِ خالی
      return { ...delta, employees: rest }
    }
    return {
      ...delta,
      employees: {
        ...rest,
        [employeeId]: {
          source: 'custom',
          days: days ? cloneDays(days) : [],
          updatedAt: new Date().toISOString()
        }
      }
    }
  })
}

/** پاک‌سازی کامل (فقط ابزار توسعهٔ «بازگشت دادهٔ موک»). */
export function clearMockAvailabilityState(): void {
  if (!canUseCookie()) return
  writeState({})
}
