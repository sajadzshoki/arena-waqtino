import type { Business } from '~/types/business'
import type { EntityId } from '~/types/common'
import type { BusinessAccess, OwnedBusiness } from '~/types/owner'

/**
 * «زمینهٔ کسب‌وکار» — تنها پاسخ به این پرسش: الان کدام کسب‌وکار را مدیریت می‌کنم؟
 *
 *   ┌ URL (owner/business/<id>) ─┐
 *   ├ انتخاب ذخیره‌شدهٔ کاربر ────┤ → currentBusinessId → داشبورد/مدیریت/اطلاعات
 *   └ اولین کسب‌وکار (fallback) ─┘
 *
 * قواعد:
 *   - یکجا نگه داشته می‌شود (useState)؛ هیچ کامپوننتی «id کسب‌وکار» را در
 *     state خودش تکرار نمی‌کند.
 *   - ماندگار است، ولی «موقتی» نیست: در کوکی `wq_owner_business` به‌ازای
 *     هر userId ذخیره می‌شود تا refresh همان کسب‌وکار را برگرداند و
 *     دو حساب روی هم نیفتند. (در حالت api همین کوکی فقط «ترجیح کاربر» است؛
 *     مالکیت را سرور دوباره بررسی می‌کند.)
 *   - URL authority: اگر مسیری id داشت، همان مرجع است و اعتبارش با سرویس
 *     سنجیده می‌شود (۴۰۳/۴۰۴) — بی‌اعتبار را بی‌صدا «اولی» نمی‌کنم.
 */
const SELECTION_COOKIE = 'wq_owner_business'

/**
 * تصمیم ورود به فضای کاری (`/owner`) — عمداً «حدس» نمی‌زنیم:
 * اگر صاحب چند کسب‌وکار باشد و هنوز انتخاب نکرده باشد، باید خودش انتخاب کند.
 */
export type OwnerEntryDecision =
  | { kind: 'open'; businessId: EntityId }
  | { kind: 'choose' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }

/** نتیجهٔ ورود به یک کسب‌وکار خاص (مسیر عمیق). */
export type BusinessEntryResult =
  | { ok: true; businessId: EntityId }
  | { ok: false; access: BusinessAccess; message: string; redirecting?: boolean }

export function useBusinessContext() {
  const services = useServices()
  const { user } = useAuth()
  const owned = useOwnerBusinesses()
  const authRecovery = useAuthRecovery()

  const selections = useCookie<Record<EntityId, EntityId>>(SELECTION_COOKIE, {
    default: () => ({}),
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60
  })

  const currentBusinessId = useState<EntityId | null>('owner:context:id', () => null)
  /** خطای دسترسی/شبکهٔ آخرین تلاش برای ورود — صفحه با آن حالت را نشان می‌دهد. */
  const access = useState<BusinessAccess | null>('owner:context:access', () => null)
  const accessMessage = useState<string | null>('owner:context:access-message', () => null)
  const switching = useState<boolean>('owner:context:switching', () => false)

  const storedId = computed<EntityId | null>(() => {
    const userId = user.value?.id
    if (!userId) return null
    return selections.value?.[userId] ?? null
  })

  const business = computed<Business | null>(() => owned.summaryOf(currentBusinessId.value)?.business ?? null)
  const summary = computed<OwnedBusiness | null>(() => owned.summaryOf(currentBusinessId.value))
  const isResolved = computed(() => currentBusinessId.value !== null)

  /** آیا همین کسب‌وکار، زمینهٔ فعلی است؟ (برای تیک «در حال مدیریت» در فهرست) */
  function isCurrent(businessId: EntityId | null | undefined): boolean {
    return !!businessId && businessId === currentBusinessId.value
  }

  function persist(id: EntityId): void {
    const userId = user.value?.id
    if (!userId) return
    const next = { ...(selections.value ?? {}) }
    if (next[userId] === id) return
    next[userId] = id
    selections.value = next
  }

  function apply(id: EntityId): void {
    currentBusinessId.value = id
    access.value = null
    accessMessage.value = null
    persist(id)
  }

  /**
   * ورود به یک کسب‌وکار مشخص با بررسی مالکیت در لایهٔ سرویس.
 * `redirecting` یعنی نشست نامعتبر بود و مسیر مرکزی احراز هویت در جریان است؛
 * صفحه در این حالت هیچ «حالت خطا»ای نشان نمی‌دهد (اسکلت تا رفتن به ورود).
   * `silentIfCurrent` → اگر همین حالا زمینه همین است، درخواست تکراری زده نمی‌شود.
   */
  async function enter(
    businessId: EntityId,
    options: { silentIfCurrent?: boolean } = {}
  ): Promise<BusinessEntryResult> {
    if (options.silentIfCurrent && isCurrent(businessId) && owned.owns(businessId)) {
      return { ok: true, businessId }
    }
    switching.value = true
    access.value = null
    accessMessage.value = null
    try {
      // مرجع مالکیت = سرویس (همان‌جا که api پاسخ ۴۰۳/۴۰۴ می‌دهد)
      const fresh = await services.owner.getOwnedBusiness(businessId)
      // کش فهرست را با پاسخ تازه هم‌راستا کن تا شمارش‌ها یکی بمانند
      owned.syncOne(fresh)
      apply(businessId)
      return { ok: true, businessId }
    }
    catch (e) {
      const err = toServiceError(e)
      if (await authRecovery.recover(e)) {
        return { ok: false, access: 'error', message: '', redirecting: true }
      }
      const kind: BusinessAccess = err.code === 'FORBIDDEN'
        ? 'forbidden'
        : err.code === 'NOT_FOUND'
          ? 'not_found'
          : 'error'
      access.value = kind
      accessMessage.value = err.message
      return { ok: false, access: kind, message: err.message }
    }
    finally {
      switching.value = false
    }
  }

  /**
   * ورود به فضای کاری (مسیر `/owner`) — تصمیم زمینه را قطعی می‌کند:
   *   - id در URL و مالِ کاربر → همان (`open`)
   *   - یک کسب‌وکار → همان، بدون اضافه‌کاری (`open`)
   *   - انتخاب ذخیره‌شدهٔ معتبر → همان (`open`)
   *   - چند کسب‌وکار بدون انتخاب → `choose` (صفحهٔ فهرست/انتخاب)
   *   - هیچ کسب‌وکاری → `empty` (حالت خالی عمدی، نه خطا)
   */
  async function resolve(routeBusinessId?: EntityId | null): Promise<OwnerEntryDecision> {
    await owned.ensureLoaded()
    if (owned.error.value) return { kind: 'error', message: owned.error.value }

    const ids = owned.items.value.map(o => o.business.id)
    if (ids.length === 0) {
      currentBusinessId.value = null
      return { kind: 'empty' }
    }

    const wanted = routeBusinessId ?? storedId.value
    if (wanted && ids.includes(wanted)) {
      apply(wanted)
      return { kind: 'open', businessId: wanted }
    }
    if (ids.length === 1) {
      const only = ids[0]!
      apply(only)
      return { kind: 'open', businessId: only }
    }
    // چند کسب‌وکار و انتخاب نامعتبر/نداشته → کاربر خودش انتخاب می‌کند
    return { kind: 'choose' }
  }

  /** پاک‌سازی state گذرای زمینه (خروج / تغییر حساب). */
  function reset(): void {
    currentBusinessId.value = null
    access.value = null
    accessMessage.value = null
    switching.value = false
  }

  return {
    currentBusinessId: readonly(currentBusinessId),
    // تایپ دامنه دست مصرف‌کننده برسد (readonly() عمیق، props کارت‌ها را می‌شکند)
    business,
    summary,
    category: computed(() => summary.value?.category ?? null),
    metrics: computed(() => summary.value?.metrics ?? null),
    isResolved,
    initializing: computed(() => owned.initializing.value && !isResolved.value),
    switching: readonly(switching),
    access: readonly(access),
    accessMessage: readonly(accessMessage),
    storedId,
    isCurrent,
    enter,
    resolve,
    /** تغییر زمینه از سوییچر/کارت — فقط state؛ ناوبری تصمیم صفحه است. */
    select: (id: EntityId): void => apply(id),
    reset
  }
}
