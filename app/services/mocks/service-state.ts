import type { BookableService, ServiceStatus } from '~/types/service'
import type { EntityId } from '~/types/common'
import type { BookingServiceSnapshot } from '~/types/booking'
import { MOCK_SERVICES } from './businesses'

/**
 * «حالت سرویس‌ها» — تنها جایی که فهرست سرویس‌های یک کسب‌وکار در حالت mock
 * نوشته و خوانده می‌شود (کوکی `wq_business_services`).
 *
 * چرا یک فایل، نه فهرست جدا برای مدیر و مشتری؟
 *   چون «سرویس» یک موجودیت است: اگر نمای مدیر و نمای مشتری دو دادهٔ موازی
 *   داشته باشند، هم‌رسانی‌شان به فاجعهٔ سنک مزمن تبدیل می‌شود. این‌جا
 *   منبع‌واحد‌حقیقت است و *نقش‌ها* فقط متفاوت فیلتر/توضیح می‌دهند:
 *     - مشتری/جریان رزرو: `resolveBusinessServices(...).filter(bookable)`
 *     - مدیر: همان فهرست با هر دو وضعیت + شمارش نوبت‌ها
 *
 * چرا «دلتا» و نه کپی کل فهرست؟
 *   کوکی ~۴KB جا دارد؛ کپی کامل ۸ سرویسِ یک کسب‌وکار نزدیک سقف است و نوشتن
 *   بیش از سقف بی‌صدا دور ریخته می‌شود (دادهٔ کاربر گم می‌شود!). پس فقط
 *   تغییرات نگه داشته می‌شود: patch روی رکوردهای seed، رکورد تازه‌های مدیر،
 *   و شناسهٔ حذف‌شده‌ها.
 *
 * قاعدهٔ SSR: `useCookie` به context نیاز دارد. خواندن را همین‌جا با
 * `canUseCookie()` محافظت کرده‌ایم تا اگر جایی پس از `await` صدا زده شد،
 * صفحه «خطا» نگیرد و فقط دادهٔ پایه را ببیند (نوشتن فقط از اکشن‌های client
 * رخ می‌دهد و نباید بی‌صدا خطا را ببلعد).
 */

/** گورِ سرویس حذف‌شده — تاریخچه نباید بی‌نام بماند. */
interface ServiceTombstone extends BookingServiceSnapshot {
  businessId: EntityId
  name: string
  removedAt: ISODateTime
}

interface BusinessServicesDelta {
  /** تغییرات سرویس‌های seed (کلید = serviceId) */
  patches?: Record<EntityId, Partial<BookableService>>
  /** سرویس‌هایی که مدیر ساخته است */
  created?: BookableService[]
}

export interface MockServicesState {
  businesses?: Record<EntityId, BusinessServicesDelta>
  removed?: Record<EntityId, ServiceTombstone>
}

const SERVICES_STATE_COOKIE = 'wq_business_services'

function cookie() {
  return useCookie<MockServicesState | null>(SERVICES_STATE_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    // مثل بقیهٔ دادهٔ development: ماندگارتر از نشست (با logout پاک نمی‌شود)
    maxAge: 365 * 24 * 60 * 60
  })
}

function canUseCookie(): boolean {
  return tryUseNuxtApp() !== undefined
}

function readState(): MockServicesState {
  if (!canUseCookie()) return {}
  return cookie().value ?? {}
}

function writeState(state: MockServicesState): void {
  cookie().value = state
}

/** رکورد seed آن سرویس (اگر از دادهٔ پایهٔ فاز ۳/۴ باشد). */
function seedOf(serviceId: EntityId): BookableService | undefined {
  return MOCK_SERVICES.find(s => s.id === serviceId)
}

/**
 * فهرست فعلی سرویس‌های یک کسب‌وکار (seed + تغییرات مدیر − حذف‌شده‌ها).
 * ترتیب: همان ترتیب seed، بعد سرویس‌های تازهٔ مدیر — تا ویرایش، جای
 * سرویس‌ها را در فهرست عوض نکند.
 */
export function resolveBusinessServices(businessId: EntityId): BookableService[] {
  const state = readState()
  const delta = state.businesses?.[businessId]
  const removed = state.removed ?? {}
  const live = <T extends { id: EntityId }>(items: T[]): T[] =>
    items.filter(item => !(item.id in removed))

  const seed = live(
    MOCK_SERVICES.filter(s => s.businessId === businessId).map(s =>
      delta?.patches?.[s.id] ? { ...s, ...delta.patches[s.id] } : s
    )
  )
  const created = live((delta?.created ?? []).filter(s => s.businessId === businessId))
  return [...seed, ...created]
}

/** یک سرویس (بدون توجه به وضعیتش) — `null` یعنی نیست یا حذف شده است. */
export function resolveService(serviceId: EntityId): BookableService | null {
  const state = readState()
  if (serviceId in (state.removed ?? {})) return null
  const businessIdOfSeed = seedOf(serviceId)?.businessId
  // رکوردی که مدیر ساخته: کسب‌وکارش از همان delta خوانده می‌شود
  const entry = businessIdOfSeed
    ? state.businesses?.[businessIdOfSeed]
    : Object.values(state.businesses ?? {}).find(d => d.created?.some(s => s.id === serviceId))
  const businessId = businessIdOfSeed ?? entry?.created?.find(s => s.id === serviceId)?.businessId
  if (!businessId) return null
  return resolveBusinessServices(businessId).find(s => s.id === serviceId) ?? null
}

/**
 * آنچه تاریخچهٔ رزرو باید دربارهٔ سرویس نشان دهد — با اولویت
 *   ۱) اسنپ‌شات ثبت‌شده روی خود رزرو (واقعهٔ گذشته، بی‌تغییر)
 *   ۲) رکورد زندهٔ سرویس (رزروهای قدیمی‌تر که اسنپ‌شات ندارند)
 *   ۳) گورِ سرویسِ حذف‌شده
 * `null` یعنی هیچ‌کدام — مسئولیت برچسب جایگزین با فراخوان است. هیچ‌کدام از
 * این سه، «بازنویسی» تاریخچه نیست: تغییر نام/مدت/وضعیت سرویس، متن رزروهای
 * قبلی را عوض نمی‌کند.
 */
export function resolveBookingServiceSnapshot(booking: {
  serviceId: EntityId
  serviceSnapshot?: BookingServiceSnapshot
}): BookingServiceSnapshot | null {
  if (booking.serviceSnapshot) return { ...booking.serviceSnapshot }
  const live = resolveService(booking.serviceId)
  if (live) return { name: live.name, durationMinutes: live.durationMinutes }
  const tombstone = readState().removed?.[booking.serviceId]
  return tombstone
    ? { name: tombstone.name, durationMinutes: tombstone.durationMinutes }
    : null
}

// ─────────────────────────── نوشتن (از لایهٔ سرویس مدیر) ───────────────────────────

function mutate(businessId: EntityId, fn: (delta: BusinessServicesDelta) => BusinessServicesDelta): void {
  const state = readState()
  const next: MockServicesState = {
    ...state,
    businesses: { ...state.businesses, [businessId]: fn(state.businesses?.[businessId] ?? {}) }
  }
  writeState(next)
}

/**
 * ثبت یک سرویس: اگر از رکوردهای seed است فقط patch نوشته می‌شود (کوکی کوچک
 * بماند)، وگرنه در `created` می‌نشیند.
 */
export function persistBusinessService(businessId: EntityId, service: BookableService): void {
  const isSeed = seedOf(service.id)?.businessId === businessId
  mutate(businessId, (delta) => {
    if (isSeed) {
      return { ...delta, patches: { ...delta.patches, [service.id]: service } }
    }
    const rest = (delta.created ?? []).filter(s => s.id !== service.id)
    return { ...delta, created: [...rest, service] }
  })
}

/** تغییر وضعیت (اکثرِ موارد — تا patch کامل نوشته نشود). */
export function persistBusinessServiceStatus(
  businessId: EntityId,
  serviceId: EntityId,
  status: ServiceStatus
): void {
  const isSeed = seedOf(serviceId)?.businessId === businessId
  mutate(businessId, (delta) => {
    if (isSeed) {
      return { ...delta, patches: { ...delta.patches, [serviceId]: { ...seedOf(serviceId), status } } }
    }
    const created = (delta.created ?? []).map(s => (s.id === serviceId ? { ...s, status } : s))
    return { ...delta, created }
  })
}

/**
 * حذف: شناسه در `removed` می‌نشیند (تا اگر رکورد seed بود patch‌اش هم بی‌اثر
 * شود) و اسنپ‌شاتش برای تاریخچه نگه داشته می‌شود.
 */
export function persistBusinessServiceRemoval(
  businessId: EntityId,
  service: BookableService
): void {
  const state = readState()
  const businesses = { ...state.businesses }
  const delta = businesses[businessId]
  if (delta) {
    businesses[businessId] = {
      ...delta,
      created: (delta.created ?? []).filter(s => s.id !== service.id)
    }
  }
  writeState({
    businesses,
    removed: {
      ...state.removed,
      [service.id]: {
        businessId,
        name: service.name,
        durationMinutes: service.durationMinutes,
        removedAt: new Date().toISOString()
      }
    }
  })
}

/** پاک‌سازی کامل (فقط ابزار توسعه: «بازگشت دادهٔ موک»). */
export function clearMockServicesState(): void {
  if (!canUseCookie()) return
  writeState({})
}
