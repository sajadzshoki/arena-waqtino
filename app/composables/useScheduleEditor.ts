import type { MaybeRef, Ref } from 'vue'
import type { EntityId } from '~/types/common'
import type {
  AvailabilityDay,
  AvailabilityInterval,
  BusinessScheduleView,
  EmployeeScheduleView,
  ScheduleSource,
  Weekday
} from '~/types/availability'
import { AVAILABILITY_POLICY, WEEKDAY_ORDER, starterScheduleDays, weekdayLabel } from '~/config/availability'
import { minutesToTime, normalizeTime, timeToMinutes } from '~/utils/schedule-time'
import { emptyDay, sortIntervals } from '~/utils/schedule'
import { toFaDigits } from '~/utils/digits'
import { validateSchedule } from '~/utils/validation'
import { buildScheduleSummary } from '~/utils/schedule-summary'

/**
 * ماشین ویرایش «برنامهٔ هفته» — یک پیاده‌سازی برای کسب‌وکار و پرسنل (فاز ۱۱).
 *
 *   Page → useScheduleEditor → useBusinessAvailability → services.availabilityManagement
 *
 * چهار تصمیم که باعث می‌شود این کامپوزبل باشد و نه یک `ref<days[]>` در هر صفحه:
 *   ۱) **پیش‌نویس جدا از دادهٔ ذخیره‌شده**: هر کلید keystroke به مخزن نمی‌نویسد؛
 *      `days` کپیِ draft است و `persisted` فقط با ذخیره جابه‌جا می‌شود. برای
 *      همین «لغو/بازگشت» و «دیسکارت» معنی واقعی دارد.
 *   ۲) قاعدهٔ «هرگز روز روشنِ بدون بازه» در همین‌جا نگه داشته می‌شود:
 *      روشن‌کردن روزِ خالی یک بازهٔ منطقی می‌سازد، و برداشتن *آخرین* بازه روز را
 *      تعطیل می‌کند (`AVAILABILITY_POLICY.disableDayWhenLastIntervalRemoved`).
 *      `validateSchedule` همان قاعده را روی payload هم می‌گیرد (دفاع دوم).
 *   ۳) ترتیب: نمایش و ذخیره هر دو مرتب‌اند — بعد از هر ویرایشِ *معتبر* بازه‌ها
 *      دوباره چیده می‌شوند؛ ویرایش نامعتبر جابه‌جا نمی‌کند تا خطا زیر انگشت
 *      کاربر نپرد.
 *   ۴) برنامهٔ پرسنل وقتی `source` روی «مطابق کسب‌وکار» است قفل است: نه
 *      ادیت، نه ذخیرهٔ بی‌مصرف — و توضیح می‌گیرد که باید از کجا بازش کند.
 *
 * کامپوننت‌ها هیچ‌کدام از این قاعده‌ها را نمی‌دانند؛ props/emit خالی
 * (لایه‌ها جابه‌جا نمی‌شوند).
 */

export type ScheduleScope = 'business' | 'employee'
export type ScheduleSaveResult = 'saved' | 'unchanged' | 'invalid' | 'failed'

interface PersistedSchedule {
  source: ScheduleSource
  /** `null` یعنی «برنامه‌ای ذخیره نشده» (کسب‌وکار تنظیم‌نشده یا پرسنلِ پیش‌فرض) */
  days: AvailabilityDay[] | null
}

function cloneDays(days: AvailabilityDay[]): AvailabilityDay[] {
  return days.map(day => ({
    weekday: day.weekday,
    enabled: day.enabled,
    intervals: day.intervals.map(interval => ({ ...interval }))
  }))
}

function fingerprint(schedule: PersistedSchedule | null): string {
  // «برنامه‌ای ذخیره نشده» با «هفته‌ای که همهٔ روزهایش خاموش است» یکی است،
  // وگرنه صفحهٔ کسب‌وکارِ تنظیم‌نشده از همان باز شدن «تغییر ذخیره‌نشده» می‌گوید
  const days = semanticDays(schedule?.days ?? [])
  return JSON.stringify({ source: schedule?.source ?? 'business-default', days })
}

/**
 * مقایسهٔ «معنادار»: روز تعطیل هر چه بازه‌ای برای روشن‌شدنِ بعدی نگه داشته باشد،
 * از بیرون یک حالت است — پس خاموش/روشن کردنِ یک روز و برگشتن، «تغییر نشده»
 * حساب می‌شود و دیالوگ «تغییرات ذخیره‌نشده؟» بی‌دلیل بالا نمی‌آید. ترتیب و
 * شکل ساعت‌ها هم سرنش نیست (همان بازه = همان برنامه).
 */
function semanticDays(days: AvailabilityDay[]): Array<{ weekday: Weekday, enabled: boolean, intervals: AvailabilityInterval[] }> {
  return WEEKDAY_ORDER.map((weekday) => {
    const day = days.find(d => d.weekday === weekday)
    return {
      weekday,
      enabled: day?.enabled === true,
      intervals: day && day.enabled ? sortIntervals(day.intervals) : []
    }
  })
}

export function useScheduleEditor(options: {
  businessId: MaybeRef<EntityId | null>
  employeeId?: MaybeRef<EntityId | null>
}) {
  const availability = useBusinessAvailability(options.businessId)
  const businessId = computed(() => toValue(options.businessId))
  const employeeId = computed<EntityId | null>(() => (options.employeeId ? toValue(options.employeeId) : null))
  const scope = computed<ScheduleScope>(() => (employeeId.value ? 'employee' : 'business'))

  const days = ref<AvailabilityDay[]>([])
  const source = ref<ScheduleSource>('business-default')
  const persisted = ref<PersistedSchedule | null>(null)
  const notice = ref<string | null>(null)
  const booting = ref(false)
  const loadError = ref<string | null>(null)
  /** `true` = پرسنل نیست یا به این کسب‌وکار تعلق ندارد → حالت Not Found عمدی */
  const notFound = ref(false)
  /** نمای کامل پرسنل (تناقض/پیش‌فرض) — از کش فهرست خوانده نمی‌شود */
  const employeeView = ref<EmployeeScheduleView | null>(null)
  const businessView = ref<BusinessScheduleView | null>(null)
  const busyKey = computed(() => (scope.value === 'business' ? 'business' : (employeeId.value ?? 'business')))
  const saving = computed(() => availability.isBusy(busyKey.value))
  const saveError = computed(() => availability.actionErrorFor(busyKey.value))

  function clearNotice(): void {
    notice.value = null
  }

  /* ─────────────────────────── منبع حقیقت ─────────────────────────── */

  const businessScheduleDays = computed<AvailabilityDay[] | null>(
    () => businessView.value?.schedule?.days ?? availability.business.value?.schedule?.days ?? null
  )
  const employeeSchedule = computed<AvailabilityDay[] | null>(
    () => employeeView.value?.schedule?.days ?? null
  )
  const currentSource = computed<ScheduleSource>(() => employeeView.value?.source ?? 'business-default')

  function persistedForScope(): PersistedSchedule | null {
    if (scope.value === 'business') {
      const days = businessScheduleDays.value
      return { source: 'business-default', days: days ? cloneDays(days) : null }
    }
    const sourceValue = currentSource.value
    if (sourceValue === 'business-default') return { source: 'business-default', days: null }
    return { source: 'custom', days: employeeSchedule.value ? cloneDays(employeeSchedule.value) : null }
  }

  /**
   * نقطهٔ شروع draft: برنامهٔ ذخیره‌شده؛ برای پرسنلِ «مطابق کسب‌وکار» همان
   * ساعت‌ها به‌صورت پیش‌نمایش فقط‌خواندنی. وقتی هیچ ساعتی ذخیره نشده، هفته
   * *خالی* باز می‌شود — الگو را owner باید صریح دعوت کند (`applyTemplate`)، تا
   * ساعتی از خودمان پشت سر کاربر نسازیم.
   */
  function draftFrom(schedule: PersistedSchedule | null): AvailabilityDay[] {
    if (schedule?.days) return cloneDays(schedule.days)
    if (schedule?.source === 'business-default' && businessScheduleDays.value) {
      return cloneDays(businessScheduleDays.value)
    }
    return WEEKDAY_ORDER.map(emptyDay)
  }

  function applyPersisted(schedule: PersistedSchedule | null): void {
    persisted.value = schedule
    source.value = schedule?.source ?? 'business-default'
    days.value = draftFrom(schedule)
    clearNotice()
  }

  /** «از یک نقطهٔ شروع ساده‌سازی‌شده»: فقط draft را پر می‌کند، ذخیره نمی‌کند. */
  function applyTemplate(): void {
    if (locked.value) return
    days.value = starterScheduleDays()
    clearNotice()
  }

  async function boot(): Promise<void> {
    if (!businessId.value) return
    booting.value = true
    loadError.value = null
    notFound.value = false
    try {
      await availability.ensure()
      if (scope.value === 'employee' && employeeId.value) {
        const result = await availability.loadOne(employeeId.value)
        if (result.missing) {
          notFound.value = true
          return
        }
        if (result.message && !result.view) {
          loadError.value = result.message
          return
        }
        employeeView.value = result.view
        businessView.value = result.view?.business ?? availability.business.value
      }
      else {
        businessView.value = availability.business.value
      }
      applyPersisted(persistedForScope())
    }
    finally {
      booting.value = false
    }
  }

  /** بعد از هر نوشتن، کش و view تازه می‌شوند → snapshot و draft را بازمی‌سازیم. */
  function syncFromStore(): void {
    if (scope.value === 'business') {
      businessView.value = availability.business.value
    }
    else if (employeeView.value) {
      const summary = availability.findEmployee(employeeView.value.employeeId)
      // `loadOne` نمای کامل را نگه می‌دارد؛ خلاصهٔ تازه فقط برای فهرست است
      employeeView.value = summary ? { ...employeeView.value, ...summary } : employeeView.value
    }
    applyPersisted(persistedForScope())
  }

  /* ─────────────────────────── ویرایش ─────────────────────────── */

  /** روزهای روشن، بدون بازهٔ نامعتبر — برای «الگو» و «کپی از روز قبل». */
  function templateInterval(weekday: Weekday): AvailabilityInterval {
    const index = WEEKDAY_ORDER.indexOf(weekday)
    for (let i = index - 1; i >= 0; i -= 1) {
      const previous = days.value.find(d => d.weekday === WEEKDAY_ORDER[i] && d.enabled)
      const first = previous?.intervals[0]
      if (first) return { ...first }
    }
    return { start: '09:00', end: '18:00' }
  }

  function updateDay(weekday: Weekday, fn: (day: AvailabilityDay) => AvailabilityDay): void {
    days.value = days.value.map(day => (day.weekday === weekday ? fn({ ...day }) : day))
    clearNotice()
  }

  const locked = computed(
    () => scope.value === 'employee' && source.value === 'business-default'
  )

  function toggleDay(weekday: Weekday): void {
    if (locked.value) {
      notice.value = 'برنامهٔ این نفر مطابق ساعات کسب‌وکار است؛ برای تغییر، «برنامهٔ اختصاصی» را انتخاب کنید.'
      return
    }
    updateDay(weekday, (day) => {
      if (day.enabled) return { ...day, enabled: false }
      const usable = day.intervals.filter(i => validInterval(i))
      return {
        ...day,
        enabled: true,
        // روزِ روشن بدون بازه باقی نمی‌ماند: یکی از روز قبل برداشته می‌شود
        intervals: usable.length > 0 ? day.intervals : [templateInterval(weekday)]
      }
    })
  }

  function validInterval(interval: AvailabilityInterval | undefined): boolean {
    if (!interval) return false
    const start = timeToMinutes(interval.start)
    const end = timeToMinutes(interval.end)
    if (start === null || end === null) return false
    return end - start >= AVAILABILITY_POLICY.minIntervalMinutes
  }

  function addInterval(weekday: Weekday): void {
    if (locked.value) return
    updateDay(weekday, (day) => {
      const usable = day.intervals.filter(validInterval)
      if (usable.length >= AVAILABILITY_POLICY.maxIntervalsPerDay) {
        notice.value = `در ${weekdayLabel(weekday)} بیش از ${toFaDigits(AVAILABILITY_POLICY.maxIntervalsPerDay)} بازه نمی‌توان داشت.`
        return day
      }
      const last = usable[usable.length - 1]
      const start = last ? (timeToMinutes(last.end) ?? 0) : (timeToMinutes(templateInterval(weekday).start) ?? 540)
      const end = Math.min(start + 180, 1439)
      if (end - start < AVAILABILITY_POLICY.minIntervalMinutes) {
        notice.value = `برای ${weekdayLabel(weekday)} وقت اضافه‌ای نمانده؛ اول یک بازه را کوتاه‌تر کنید.`
        return day
      }
      return { ...day, enabled: true, intervals: [...day.intervals, { start: minutesToTime(start), end: minutesToTime(end) }] }
    })
  }

  function removeInterval(weekday: Weekday, index: number): void {
    if (locked.value) return
    updateDay(weekday, (day) => {
      const next = day.intervals.filter((_, i) => i !== index)
      // آخرین بازه برداشته شود → روز تعطیل می‌شود (قاعدهٔ متمرکز فاز ۱۱)
      if (next.length === 0) return { ...day, enabled: false, intervals: [] }
      return { ...day, intervals: next }
    })
  }

  /** ویرایش یک بازه با ورودی خام (متن تایپ‌شده یا مقدار picker). */
  function setIntervalPart(weekday: Weekday, index: number, part: 'start' | 'end', raw: string): void {
    if (locked.value) return
    const normalized = normalizeTime(raw)
    if (!normalized) {
      notice.value = 'ساعت را کامل وارد کنید؛ نمونهٔ درست: ۰۹:۳۰'
      return
    }
    updateDay(weekday, (day) => {
      const intervals = day.intervals.map((interval, i) =>
        i === index ? { ...interval, [part]: normalized } : interval
      )
      const touched = intervals[index]
      // فقط وقتی مرتب می‌کنیم که بازه معنادار باشد — تا خطا زیر دست کاربر نپرد
      const ordered = touched && (timeToMinutes(touched.end) ?? 0) > (timeToMinutes(touched.start) ?? 0)
      return { ...day, intervals: ordered ? sortIntervals(intervals) : intervals }
    })
  }

  /** منبع برنامهٔ پرسنل: «مطابق کسب‌وکار» / «اختصاصی». */
  function selectSource(next: ScheduleSource): void {
    if (scope.value !== 'employee') return
    source.value = next
    clearNotice()
    if (next === 'business-default') {
      // پیش‌نمایشِ فقط‌خواندنی از ساعت کسب‌وکار (بدون کپی‌کردن در دادهٔ نفر)
      days.value = businessScheduleDays.value ? cloneDays(businessScheduleDays.value) : WEEKDAY_ORDER.map(emptyDay)
      return
    }
    const savedCustom = persisted.value?.source === 'custom' ? persisted.value.days : null
    days.value = savedCustom
      ? cloneDays(savedCustom)
      : businessScheduleDays.value
        ? cloneDays(businessScheduleDays.value)
        : starterScheduleDays()
  }

  /* ─────────────────────────── نتیجهٔ ویرایش ─────────────────────────── */

  const validation = computed(() => validateSchedule(days.value))
  const summary = computed(() => buildScheduleSummary(days.value))
  const dirty = computed(() => {
    const current: PersistedSchedule =
      scope.value === 'business'
        ? { source: 'business-default', days: cloneDays(days.value) }
        : { source: source.value, days: source.value === 'custom' ? cloneDays(days.value) : null }
    return fingerprint(current) !== fingerprint(persisted.value)
  })
  const canSave = computed(() => dirty.value && validation.value.ok && !saving.value)
  /** هفتهٔ draft هنوز هیچ روز بازی ندارد (حالت خالیِ ویرایشگر) */
  const emptyDraft = computed(() => summary.value.openDays === 0)
  const dayErrors = computed(() => validation.value.dayErrors)
  const intervalErrors = computed(() => validation.value.intervalErrors)
  /** توابع کمکی تا کامپوننت‌ها `Record` داخلی فرم را نبینند (props/emit ساده). */
  const dayError = (weekday: Weekday): string | undefined => dayErrors.value[weekday]
  const intervalError = (weekday: Weekday, index: number): string | undefined =>
    intervalErrors.value[`${weekday}:${index}`]
  const conflictMessage = computed(() => employeeView.value?.conflictMessage ?? null)
  const employeeNote = computed(() => employeeView.value?.note ?? null)
  /** `true` یعنی کسب‌وکار ساعت ندارد و برنامهٔ اختصاصی معنایی ندارد */
  const businessNotConfigured = computed(() => scope.value === 'employee' && !businessScheduleDays.value)

  async function save(): Promise<ScheduleSaveResult> {
    if (!businessId.value) return 'failed'
    if (!dirty.value) return 'unchanged'
    if (!validation.value.ok) {
      notice.value = validation.value.message ?? 'برنامهٔ هفته کامل نیست.'
      return 'invalid'
    }
    const normalized = validation.value.days
    const result = scope.value === 'business'
      ? await availability.saveBusiness(normalized)
      : await availability.saveEmployee(employeeId.value as EntityId, {
          source: source.value,
          days: source.value === 'custom' ? normalized : undefined
        })
    if (!result.ok) return 'failed'
    if (result.view) employeeView.value = result.view
    syncFromStore()
    return 'saved'
  }

  /** بازگشت به آخرین حالت ذخیره‌شده (دکمهٔ «انصراف» بعد از تأیید). */
  function revert(): void {
    applyPersisted(persisted.value)
  }

  async function resetToBusinessDefault(): Promise<'reset' | 'failed' | 'unchanged'> {
    if (!businessId.value || !employeeId.value) return 'failed'
    if (currentSource.value === 'business-default' && !dirty.value) return 'unchanged'
    const result = await availability.resetEmployee(employeeId.value)
    if (!result.ok) return 'failed'
    if (result.view) employeeView.value = result.view
    syncFromStore()
    return 'reset'
  }

  /** برای تست/ابزار: نمای خوانای draft */
  const draftDays = computed(() => days.value) as Ref<AvailabilityDay[]>

  return {
    scope,
    businessId,
    employeeId,
    days: draftDays,
    source,
    locked,
    saving,
    saveError,
    notice,
    booting,
    loadError,
    notFound,
    emptyDraft,
    businessNotConfigured,
    businessSummary: computed(() => availability.business.value?.summary ?? null),
    /** نمای کامل پرسنل (نام/وضعیت/منبع) — برای هدرِ صفحهٔ ویرایش ساعت نفر */
    employeeView,
    conflictMessage,
    employeeNote,

    validation,
    dayErrors,
    intervalErrors,
    dayError,
    intervalError,
    summary,
    dirty,
    canSave,

    boot,
    applyTemplate,
    toggleDay,
    addInterval,
    removeInterval,
    setIntervalPart,
    selectSource,
    save,
    revert,
    resetToBusinessDefault,
    clearNotice,
    clearActionError: () => availability.clearActionError(busyKey.value)
  }
}
