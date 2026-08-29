import type { Booking, BookingCancelledBy, BookingStatus } from '~/types/booking'
import type { EntityId } from '~/types/common'

/**
 * «حالت نوبت‌ها» — تنها جایی که نوبت‌ها در حالت mock نوشته/خوانده می‌شوند
 * (کوکی `wq_business_bookings`).
 *
 * چرا این فایل اضافه شد (فاز ۱۲)؟ تا پیش از این، `create` روی آرایهٔ seed
 * `push` می‌کرد و `cancel`/`reschedule` فیلدهای همان رکورد را جابه‌جا می‌کردند.
 * دو مشکل: (۱) seed آرایه‌ای است که همهٔ مصرف‌کننده‌ها *به‌اشتراک* می‌خوانند و
 * قوانین پروژه «هیچ نوشتن روی دادهٔ mock» است، (۲) هر نوشتنی با refresh
 * می‌پرید — یعنی نوبتِ لغوشدهٔ دیروز، امروز دوباره در «نوبت‌های پیش‌رو» بود.
 *
 * همان سه قاعدهٔ `service-state.ts`:
 *   ۱) **دلتا، نه کپی**: فقط `patches` (نوبت‌های seed که وضعیت/زمانشان عوض شده)
 *      و `created` (نوبت‌هایی که همین کاربر ساخته) نوشته می‌شوند.
 *   ۲) **کلید، خودِ `bookingId` است**: نوبت نقطهٔ تلاقی مشتری و کسب‌وکار است؛
 *      کلیدکردنش زیر `businessId` یا `userId` یکی از دو طرف را می‌شکست. رکورد
 *      نوبت خودش `businessId` و `customerId` را دارد، پس جداسازی همان‌جا است.
 *   ۳) **خواندن کپی می‌دهد**: `applyBookingDelta(...)` آبجکت‌های تازه می‌سازد تا هیچ
 *      مصرف‌کننده‌ای (حتی از روی اشتباه) seed را mutate نکند. خودِ seed را هم
 *      همین‌جا import نمی‌کنیم: `bookings.ts` ردیف‌های پایه را تزریق می‌کند، تا
 *      وابستگی یک‌طرفه بماند (mock → state) و هیچ چرخه‌ای ساخته نشود.
 *
 * قاعدهٔ SSR: خواندن با `canUseCookie()` محافظت می‌شود (بعد از `await` در SSR
 * ممکن است context نباشد)؛ نوشتن فقط از اکشن کاربر رخ می‌دهد — هیچ domain
 * نوشتنی در SSR انجام نمی‌شود.
 */

interface BookingPatch {
  status?: BookingStatus
  /** جابه‌جایی نوبت: start/end با هم عوض می‌شوند */
  start?: ISODateTime
  end?: ISODateTime
  cancelledBy?: BookingCancelledBy
  cancelReason?: string
}

export interface MockBookingState {
  patches?: Record<EntityId, BookingPatch>
  created?: Booking[]
}

/**
 * سقف بی‌خطرِ کوکی. مرورگرها ~۴KB برای هر نام جا می‌دهند و *بیش از آن بی‌صدا
 * دور ریخته می‌شود* — یعنی کل تاریخچهٔ نوبت‌های کاربر می‌پرید. پس اگر نوشتن از
 * سقف گذشت، کم‌ارزش‌ترین داده می‌رود: قدیمی‌ترین نوبت‌های *گذشته*.
 * این فقط محدودیتِ حالت mock است، نه مدل داده.
 */
const COOKIE_NAME = 'wq_business_bookings'
const COOKIE_BUDGET = 3600

function cookie() {
  return useCookie<MockBookingState | null>(COOKIE_NAME, {
    default: () => null,
    sameSite: 'lax',
    // مثل بقیهٔ دادهٔ development: ماندگارتر از نشست (با logout پاک نمی‌شود)
    maxAge: 365 * 24 * 60 * 60
  })
}

function canUseCookie(): boolean {
  return tryUseNuxtApp() !== undefined
}

function readState(): MockBookingState {
  if (!canUseCookie()) return {}
  return cookie().value ?? {}
}

function writeState(state: MockBookingState): void {
  if (!canUseCookie()) return
  const serialized = JSON.stringify(state)
  if (serialized.length > COOKIE_BUDGET && state.created?.length) {
    // نوبت‌های *گذشته* از جدیدترین به قدیمی‌ترین، پیش‌روها در ابتدا؛ پس `pop()`
    // همیشه قدیمی‌ترین گذشته را می‌برد و تا گذشته‌ای هست، نوبتِ زنده پاک نمی‌شود.
    const now = Date.now()
    const isPast = (b: Booking) => new Date(b.start).getTime() < now
    const upcoming = state.created
      .filter(b => !isPast(b))
      .sort((a, b) => a.start.localeCompare(b.start))
    const past = state.created
      .filter(isPast)
      .sort((a, b) => b.start.localeCompare(a.start))
    const keep = [...upcoming, ...past]
    while (JSON.stringify({ ...state, created: keep }).length > COOKIE_BUDGET && keep.length > 0) {
      keep.pop()
    }
    state = { ...state, created: keep.sort((a, b) => a.start.localeCompare(b.start)) }
  }
  cookie().value = state
}

/* ─────────────────────────── خواندن ─────────────────────────── */

function merge(row: Booking, patch: BookingPatch | undefined): Booking {
  if (!patch) return { ...row }
  return {
    ...row,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.start ? { start: patch.start } : {}),
    ...(patch.end ? { end: patch.end } : {}),
    ...(patch.cancelledBy ? { cancelledBy: patch.cancelledBy } : {}),
    ...(patch.cancelReason ? { cancelReason: patch.cancelReason } : {})
  }
}

/**
 * ردیف‌های seed (یا هر فهرست پایه) + ساخته‌های این مرورگر + دلتا.
 * ورودی را دست نمی‌زند و خروجی کپی است — پس «نوشتن روی mock» ساختاراً ممکن نیست.
 */
export function applyBookingDelta(base: readonly Booking[]): Booking[] {
  const state = readState()
  const patches = state.patches ?? {}
  return [...base, ...(state.created ?? [])].map(row => merge(row, patches[row.id]))
}

/** یک نوبت (seed یا ساخته‌شده) با دلتای اعمال‌شده. */
export function findBookingWithDelta(base: readonly Booking[], id: EntityId): Booking | null {
  const state = readState()
  const row = base.find(b => b.id === id) ?? (state.created ?? []).find(b => b.id === id)
  if (!row) return null
  return merge(row, state.patches?.[id])
}

/** ساخته‌های خامِ این مرورگر (بدون دلتا) — برای شمارش/تست. */
export function readCreatedBookings(): Booking[] {
  return (readState().created ?? []).map(b => ({ ...b }))
}

/* ─────────────────────────── نوشتن ─────────────────────────── */

/** نوبتی که کاربر همین‌جا ساخته (کپی؛ رکورد seed هرگز push نمی‌شود). */
export function persistCreatedBooking(booking: Booking): void {
  const state = readState()
  writeState({ ...state, created: [...(state.created ?? []), { ...booking }] })
}

/**
 * تغییر وضعیت/زمان یک نوبت — روی *patch*، پس نوبت‌های seed دست‌نخورده‌اند و
 * نوبت‌های ساخته‌شده هم با همان یک مسیر به‌روز می‌شوند.
 */
export function persistBookingPatch(id: EntityId, patch: BookingPatch): void {
  const state = readState()
  const previous = state.patches?.[id] ?? {}
  const created = (state.created ?? []).map(row => (row.id === id ? { ...row, ...patch } : row))
  writeState({
    ...state,
    patches: { ...state.patches, [id]: { ...previous, ...patch } },
    ...(state.created ? { created } : {})
  })
}

/** فقط ابزار توسعه (دکمهٔ «بازگشت دادهٔ موک»). */
export function clearMockBookingState(): void {
  if (!canUseCookie()) return
  cookie().value = null
}

/** برای تست/ابزار: چند بایت از این دامنه در کوکی نشسته است؟ */
export function mockBookingStateSize(): number {
  if (!canUseCookie()) return 0
  return JSON.stringify(cookie().value ?? {}).length
}
