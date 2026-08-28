import type { BookingFlowDraft, BookingStep, DateAvailability } from '~/types/booking-flow'
import type { EntityId } from '~/types/common'
import type { BookableService } from '~/types/service'
import type { BookableEmployee } from '~/types/employee'
import type { DayAvailability, TimeSlot } from '~/types/availability'
import type { Business, BusinessCategory } from '~/types/business'
import { toServiceError } from '~/utils/errors'
import { AVAILABILITY_HORIZON_DAYS } from '~/config/timezone'
import { isTomorrowKey, todayKey, upcomingDateKeys } from '~/utils/schedule-time'

/**
 * مدیریت کامل فرآیند رزرو — state، navigation، و data loading.
 */
export function useBookingFlow() {
  const services = useServices()

  // Draft state
  const draft = useState<BookingFlowDraft>('booking:draft', () => ({
    businessId: null,
    serviceId: null,
    employeeId: undefined,
    date: null,
    timeSlot: null
  }))

  // Current step
  const currentStep = useState<BookingStep>('booking:step', () => 'service')

  // Warnings from validation
  const warnings = useState<Array<{ code: string; message: string; type: string }>>('booking:warnings', () => [])

  // Loading states
  const loadingBusiness = ref(false)
  const loadingSlots = ref(false)
  const loadingDates = ref(false)

  // Errors
  const error = ref<string | null>(null)

  /**
   * «Draft کهنه»: سرویسی که از پیش انتخاب شده (deep link یا ادامهٔ رزرو) دیگر در
   * فهرست قابل‌رزرو نیست، چون مدیرش آن را غیرفعال کرده است. به‌جای اینکه کاربر
   * در مرحلهٔ آخر یک خطای بی‌دلیل بگیرد، انتخاب پاک می‌شود و همین توضیح را
   * بالای فهرست سرویس‌ها می‌بیند تا سرویس دیگری انتخاب کند.
   */
  const staleServiceNotice = useState<string | null>('booking:stale-service', () => null)

  /**
   * حالت دومِ «Draft کهنه» (فاز ۱۰): پرسنلی که انتخاب شده بود دیگر برای این
   * سرویس قابل رزرو نیست — چون مدیرش غیرفعالش کرده، از این کسب‌وکار حذفش کرده،
   * یا آن سرویس را از اختصاص‌هایش برداشته است. مثل سرویس: انتخاب پاک می‌شود و
   * توضیح فارسی همان‌جا نشان داده می‌شود که کاربر تصمیم می‌گیرد.
   */
  const staleEmployeeNotice = useState<string | null>('booking:stale-employee', () => null)

  // Cached data
  const business = ref<Business | null>(null)
  const category = ref<BusinessCategory | null>(null)
  const businessServices = ref<BookableService[]>([])
  const employees = ref<BookableEmployee[]>([])
  const availableSlots = ref<TimeSlot[]>([])
  const dateAvailability = ref<DateAvailability[]>([])
  /**
   * نتیجهٔ پرس‌وجوی دسترس‌پذیری همان روزِ انتخاب‌شده (فاز ۱۱).
   * UI به‌جای حدس‌زدن از «فهرست خالی»، می‌فهمد چرا ساعتی نیست: تعطیل، پر،
   * تنظیم‌نشده یا گذشته — و پنجرهٔ کاری همان روز را برای توضیح دارد.
   */
  const dayAvailability = ref<DayAvailability | null>(null)
  const availabilityError = ref<string | null>(null)

  /** Initialize draft with businessId and optional serviceId */
  async function initDraft(businessId: EntityId, serviceId?: EntityId) {
    draft.value = {
      businessId,
      serviceId: serviceId ?? null,
      employeeId: undefined,
      date: null,
      timeSlot: null
    }
    error.value = null
    warnings.value = []
    currentStep.value = serviceId ? 'employee' : 'service'

    await loadBusinessData(businessId)

    // If service preselected, skip to employee step
    if (serviceId) {
      validateStep('service')
    }
  }

  /** Load business data (services, employees) */
  async function loadBusinessData(businessId: EntityId) {
    loadingBusiness.value = true
    try {
      const [biz, categories, svcs, emps] = await Promise.all([
        services.businesses.getById(businessId),
        services.businesses.listCategories(),
        services.businesses.listServices(businessId),
        services.businesses.listEmployees(businessId)
      ])

      if (!biz) {
        error.value = 'کسب‌وکار یافت نشد.'
        return
      }

      business.value = biz
      category.value = categories.find(c => c.id === biz.categoryId) ?? null
      // `listServices` خودش فقط سرویس‌های active را می‌دهد (تصمیم status در لایهٔ
      // سرویس است)؛ اینجا فقط بررسی می‌کنیم انتخاب قبلی هنوز قابل رزرو باشد.
      businessServices.value = svcs
      // `listEmployees` خودش فقط پرسنل active را می‌دهد (تصمیم وضعیت در لایهٔ
      // سرویس است، فاز ۱۰)؛ اینجا فقط رابطه بررسی می‌شود.
      employees.value = emps

      if (draft.value.serviceId && !svcs.some(s => s.id === draft.value.serviceId)) {
        staleServiceNotice.value
          = 'سرویسی که انتخاب کرده بودید دیگر برای رزرو تازه باز نیست. یک سرویس فعال را انتخاب کنید.'
        draft.value.serviceId = null
        draft.value.employeeId = undefined
        draft.value.date = null
        draft.value.timeSlot = null
        currentStep.value = 'service'
      }
      else {
        staleServiceNotice.value = null
      }

      // پرسنل انتخابی باید فعال باشد *و* سرویس انتخابی را انجام دهد. اگر سرویسی
      // انتخاب نشده، مرحلهٔ پرسنل معنی ندارد و انتخاب قبلی بی‌ضرر می‌ماند.
      if (draft.value.employeeId && draft.value.serviceId) {
        const picked = employees.value.find(e => e.id === draft.value.employeeId)
        const stillValid = !!picked && picked.status === 'active'
          && picked.serviceIds.includes(draft.value.serviceId)
        if (!stillValid) {
          staleEmployeeNotice.value
            = 'پرسنلی که انتخاب کرده بودید دیگر این سرویس را برای رزرو تازه انجام نمی‌دهد؛ ممکن است غیرفعال شده باشد یا اختصاصش تغییر کرده باشد. یک پرسنل دیگر را انتخاب کنید.'
          draft.value.employeeId = undefined
          draft.value.timeSlot = null
          currentStep.value = 'employee'
        }
        else {
          staleEmployeeNotice.value = null
        }
      }
      else {
        staleEmployeeNotice.value = null
      }
    }
    catch {
      error.value = 'خطا در دریافت اطلاعات کسب‌وکار.'
    }
    finally {
      loadingBusiness.value = false
    }
  }

  /**
   * نوار تاریخ رزرو — یک پرس‌وجوی *دسته‌ای* برای همهٔ روزها (فاز ۱۱).
   *
   * پیش از این، برای هر روز یک `getSlots` جدا صدا زده می‌شد (۱۴ درخواست
   * سریالی) و «جمعه» به‌صورت ثابت تعطیل فرض می‌شد. حالا روزها از همان
   * «برنامهٔ هفتهٔ کسب‌وکار + برنامهٔ نفر + مدت سرویس + نوبت‌ها» می‌آیند، پس
   * تغییر ساعت کاری بی‌تغییری در این لایه‌ها به نوار تاریخ سرایت می‌کند.
   */
  async function loadDateAvailability() {
    if (!draft.value.businessId) return
    loadingDates.value = true
    availabilityError.value = null
    try {
      const dates = upcomingDateKeys(AVAILABILITY_HORIZON_DAYS)
      const entries = await services.availability.getDateAvailability(draft.value.businessId, dates, {
        serviceId: draft.value.serviceId,
        employeeId: draft.value.employeeId
      })
      const today = todayKey()
      dateAvailability.value = entries.map(entry => ({
        dateStr: entry.date,
        hasAvailableSlots: entry.hasAvailableSlots,
        isToday: entry.date === today,
        isTomorrow: isTomorrowKey(entry.date),
        status: entry.status
      }))
    }
    catch (e) {
      // پیام فارسی از لایهٔ سرویس؛ خطای فنی خام در UI نمی‌آید
      availabilityError.value = toServiceError(e).message
    }
    finally {
      loadingDates.value = false
    }
  }

  /** Load time slots for a specific date */
  async function loadTimeSlots(date: string) {
    if (!draft.value.businessId) return
    loadingSlots.value = true
    availableSlots.value = []
    dayAvailability.value = null
    try {
      const day = await services.availability.getDayAvailability({
        businessId: draft.value.businessId,
        date,
        serviceId: draft.value.serviceId,
        employeeId: draft.value.employeeId
      })
      dayAvailability.value = day
      availableSlots.value = day.slots
    }
    catch (e) {
      availabilityError.value = toServiceError(e).message
    }
    finally {
      loadingSlots.value = false
    }
  }

  /**
   * تازه‌سازی دسترس‌پذیری بعد از عوض‌شدن سرویس/پرسنل: گام تاریخ و گام ساعت
   * هر دو از همان پرس‌وجو می‌خورند، پس یک «دوباره بخوان» کافی است — نه
   * پاک‌کردن state و refetch در هر صفحه.
   */
  function refreshAvailability() {
    if (currentStep.value === 'date' || currentStep.value === 'time') {
      void loadDateAvailability()
    }
    if (draft.value.date && (currentStep.value === 'time' || currentStep.value === 'review')) {
      void loadTimeSlots(draft.value.date)
    }
  }

  /** چرا ساعتی نشان نمی‌دهیم؟ («تعطیل» ≠ «پر» ≠ «تنظیم‌نشده») */
  const dayStatus = computed(() => dayAvailability.value?.status ?? null)
  const dayMessage = computed(() => dayAvailability.value?.message ?? null)
  const dayWindow = computed(() => dayAvailability.value?.window ?? [])
  const dayClosed = computed(
    () => dayStatus.value === 'closed' || dayStatus.value === 'not-configured'
  )
  const dayFullyBooked = computed(() => dayStatus.value === 'fully-booked' || dayStatus.value === 'past')

  /** Validate current step and proceed */
  function validateStep(step: BookingStep): boolean {
    switch (step) {
      case 'service':
        return draft.value.serviceId !== null

      case 'employee':
        // If requiresEmployee, must have selected
        if (requiresEmployee.value) {
          return draft.value.employeeId !== undefined && draft.value.employeeId !== null
        }
        return true

      case 'date':
        return draft.value.date !== null

      case 'time':
        return draft.value.timeSlot !== null

      case 'review':
        return true

      default:
        return false
    }
  }

  /** Go to next step */
  function nextStep() {
    if (!validateStep(currentStep.value)) return

    const stepOrder: BookingStep[] = ['service', 'employee', 'date', 'time', 'review']
    const currentIdx = stepOrder.indexOf(currentStep.value)

    // Skip employee step if not required
    if (currentStep.value === 'service' && !requiresEmployee.value) {
      currentStep.value = 'date'
      loadDateAvailability()
      return
    }

    if (currentIdx < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIdx + 1]
      if (nextStep) {
        currentStep.value = nextStep

        // Load data for the new step
        if (currentStep.value === 'date') {
          loadDateAvailability()
        }
        else if (currentStep.value === 'time' && draft.value.date) {
          loadTimeSlots(draft.value.date)
        }
      }
    }
  }

  /** Go to previous step */
  function prevStep() {
    const stepOrder: BookingStep[] = ['service', 'employee', 'date', 'time', 'review']
    const currentIdx = stepOrder.indexOf(currentStep.value)

    if (currentIdx > 0) {
      const prevStepKey = stepOrder[currentIdx - 1]

      if (!prevStepKey) return

      // Skip employee step if not required
      if (prevStepKey === 'employee' && !requiresEmployee.value) {
        currentStep.value = 'service'
      }
      else {
        currentStep.value = prevStepKey
      }
    }
  }

  /** Set service */
  function setService(serviceId: EntityId) {
    draft.value.serviceId = serviceId
    staleServiceNotice.value = null

    // پرسنل انتخابی باید سرویس *تازه* را هم انجام بدهد؛ وگرنه انتخابش بی‌معنی
    // است (رابطه از رکورد پرسنل خوانده می‌شود، نه از فهرست کهنهٔ سرویس).
    if (draft.value.employeeId) {
      const picked = employees.value.find(e => e.id === draft.value.employeeId)
      const stillOk = !!picked && picked.serviceIds.includes(serviceId)
      if (!stillOk) {
        draft.value.employeeId = undefined
        staleEmployeeNotice.value = null
      }
    }

    // Invalidate downstream
    draft.value.timeSlot = null
    // دسترس‌پذیری تابعِ سرویس است (مدت + پرسنل مجاز) → همان لحظه تازه می‌شود
    refreshAvailability()
  }

  /** Set employee */
  function setEmployee(employeeId: EntityId | null) {
    draft.value.employeeId = employeeId
    staleEmployeeNotice.value = null
    // Invalidate downstream
    draft.value.timeSlot = null
    // ساعت کاری *نفر* هم پنجرهٔ رزرو را عوض می‌کند (فاز ۱۱)
    refreshAvailability()
  }

  /** Set date */
  function setDate(date: string) {
    draft.value.date = date
    // Load slots for this date
    loadTimeSlots(date)
    // Invalidate timeSlot
    draft.value.timeSlot = null
  }

  /** Set time slot */
  function setTimeSlot(slot: TimeSlot) {
    draft.value.timeSlot = slot
  }

  /** Clear draft */
  function clearDraft() {
    draft.value = {
      businessId: null,
      serviceId: null,
      employeeId: undefined,
      date: null,
      timeSlot: null
    }
    currentStep.value = 'service'
    warnings.value = []
    error.value = null
    // یادداشت‌های «draft کهنه» هم با پیش‌نویس می‌روند (وگرنه رزرو بعدی با
    // هشدار بی‌ربطِ رزرو قبلی شروع می‌شود).
    staleServiceNotice.value = null
    staleEmployeeNotice.value = null
  }

  // Computed values
  const currentService = computed(() => {
    if (!draft.value.serviceId) return null
    return businessServices.value.find(s => s.id === draft.value.serviceId) ?? null
  })

  const currentEmployee = computed(() => {
    if (draft.value.employeeId === undefined) return undefined
    if (draft.value.employeeId === null) return null
    return employees.value.find(e => e.id === draft.value.employeeId) ?? null
  })

  /**
   * پرسنلِ قابل‌رزرو برای سرویس انتخابی — قاعدهٔ واحد، فیلترشده در لایهٔ سرویس
   * (فقط active) و این‌جا فقط با رابطه: «همین سرویس را انجام می‌دهد؟».
   * هیچ «همهٔ پرسنل، حتی بی‌ربط» دیگر فهرست نمی‌شود (فاز ۱۰).
   */
  const serviceEmployees = computed(() => {
    const serviceId = draft.value.serviceId
    if (!serviceId) return []
    return employees.value.filter(e => e.status === 'active' && e.serviceIds.includes(serviceId))
  })

  /** لازم است؟ وقتی *کسی* این سرویس را انجام می‌دهد، انتخابش هم لازم است. */
  const requiresEmployee = computed(() => serviceEmployees.value.length > 0)

  /**
   * اختیاری؟ وقتی کسب‌وکار پرسنل فعال دارد ولی هیچ‌کدام این سرویس را انجام
   * نمی‌دهد، کاربر نباید مجبور به انتخاب شود (مرحله هم نمایش داده نمی‌شود).
   */
  const employeeOptional = computed(
    () => !requiresEmployee.value && employees.value.length > 0
  )

  /** کارمندان eligible برای service انتخاب شده */
  const eligibleEmployees = computed(() => serviceEmployees.value)

  /** Is draft complete for confirmation? */
  const isDraftComplete = computed(() => {
    return draft.value.businessId !== null
      && draft.value.serviceId !== null
      && draft.value.date !== null
      && draft.value.timeSlot !== null
      && (draft.value.employeeId !== undefined)
  })

  /** No available slots for selected date */
  const noSlotsAvailable = computed(() => {
    return !loadingSlots.value && availableSlots.value.length === 0 && draft.value.date !== null
  })

  return {
    // State
    draft: draft,
    currentStep: currentStep,
    warnings: warnings,
    staleServiceNotice,
    staleEmployeeNotice,
    loadingBusiness: loadingBusiness,
    loadingSlots: loadingSlots,
    loadingDates: loadingDates,
    error: error,

    // Data
    business: business,
    category: category,
    businessServices: businessServices,
    employees: employees,
    availableSlots: availableSlots,
    dateAvailability: dateAvailability,
    dayAvailability,
    availabilityError,

    // Computed
    currentService,
    currentEmployee,
    requiresEmployee,
    employeeOptional,
    eligibleEmployees,
    serviceEmployees,
    isDraftComplete,
    noSlotsAvailable,
    dayStatus,
    dayMessage,
    dayWindow,
    dayClosed,
    dayFullyBooked,

    // Actions
    initDraft,
    setService,
    setEmployee,
    setDate,
    setTimeSlot,
    nextStep,
    prevStep,
    clearDraft,
    loadDateAvailability,
    loadTimeSlots,
    refreshAvailability,
    validateStep,
    setWarnings: (w: Array<{ code: string; message: string; type: string }>) => { warnings.value = w }
  }
}
