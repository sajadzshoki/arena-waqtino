import type { BookingFlowDraft, BookingStep, DateAvailability } from '~/types/booking-flow'
import type { EntityId } from '~/types/common'
import type { BookableService } from '~/types/service'
import type { Employee } from '~/types/employee'
import type { TimeSlot } from '~/types/availability'
import type { Business, BusinessCategory } from '~/types/business'
import { toIsoDate, generateUpcomingDates, isToday, isTomorrow } from '~/utils/datetime'

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

  // Cached data
  const business = ref<Business | null>(null)
  const category = ref<BusinessCategory | null>(null)
  const businessServices = ref<BookableService[]>([])
  const employees = ref<Employee[]>([])
  const availableSlots = ref<TimeSlot[]>([])
  const dateAvailability = ref<DateAvailability[]>([])

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
      employees.value = emps.filter(e => e.isActive)

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
    }
    catch {
      error.value = 'خطا در دریافت اطلاعات کسب‌وکار.'
    }
    finally {
      loadingBusiness.value = false
    }
  }

  /** Load date availability for the next 14 days */
  async function loadDateAvailability() {
    loadingDates.value = true
    try {
      const upcomingDates = generateUpcomingDates(14)
      const availability: DateAvailability[] = []

      for (const date of upcomingDates) {
        const dateStr = toIsoDate(date)
        const slots = await services.availability.getSlots(
          draft.value.businessId!,
          dateStr,
          draft.value.employeeId ?? undefined
        )
        const hasAvailable = slots.some(s => s.isAvailable)
        const day = date.getDay()
        const persianDay = (day + 1) % 7

        availability.push({
          dateStr,
          hasAvailableSlots: hasAvailable,
          isToday: isToday(date),
          isTomorrow: isTomorrow(date),
          isFriday: persianDay === 6
        })
      }

      dateAvailability.value = availability
    }
    catch {
      error.value = 'خطا در دریافت تاریخ‌های آزاد.'
    }
    finally {
      loadingDates.value = false
    }
  }

  /** Load time slots for a specific date */
  async function loadTimeSlots(date: string) {
    loadingSlots.value = true
    availableSlots.value = []
    try {
      availableSlots.value = await services.availability.getSlots(
        draft.value.businessId!,
        date,
        draft.value.employeeId ?? undefined
      )
    }
    catch {
      error.value = 'خطا در دریافت زمان‌های آزاد.'
    }
    finally {
      loadingSlots.value = false
    }
  }

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

    // If employee was selected, check if still valid for new service
    if (draft.value.employeeId) {
      const service = currentService.value
      if (service && service.employeeIds && service.employeeIds.length > 0) {
        if (!service.employeeIds.includes(draft.value.employeeId)) {
          draft.value.employeeId = undefined
        }
      }
    }

    // Invalidate downstream
    draft.value.timeSlot = null
  }

  /** Set employee */
  function setEmployee(employeeId: EntityId | null) {
    draft.value.employeeId = employeeId
    // Invalidate downstream
    draft.value.timeSlot = null
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

  /** آیا employee selection لازم است؟ */
  const requiresEmployee = computed(() => {
    if (!currentService.value) return false
    const service = currentService.value
    if (service.employeeIds && service.employeeIds.length > 0) return true
    return employees.value.length > 0
  })

  /** آیا employee selection optional است؟ */
  const employeeOptional = computed(() => {
    if (!currentService.value) return false
    const service = currentService.value
    return (!service.employeeIds || service.employeeIds.length === 0) && employees.value.length > 0
  })

  /** کارمندان eligible برای service انتخاب شده */
  const eligibleEmployees = computed(() => {
    if (!currentService.value) return []
    const service = currentService.value
    if (service.employeeIds && service.employeeIds.length > 0) {
      return employees.value.filter(e => service.employeeIds!.includes(e.id))
    }
    return employees.value
  })

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

    // Computed
    currentService,
    currentEmployee,
    requiresEmployee,
    employeeOptional,
    eligibleEmployees,
    isDraftComplete,
    noSlotsAvailable,

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
    validateStep,
    setWarnings: (w: Array<{ code: string; message: string; type: string }>) => { warnings.value = w }
  }
}
