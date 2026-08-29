import type { MaybeRef } from 'vue'
import type { EntityId } from '~/types/common'
import type { EmployeeStatus, ManagedEmployee } from '~/types/employee'
import type { EmployeeFormErrors, EmployeeFormInput } from '~/utils/validation'

/**
 * فرم مشترک «افزودن پرسنل» و «ویرایش پرسنل».
 *
 * چرا یک فرم برای هر دو؟ تا قواعد، چیدمان فیلدها و رفتار خطا یکی بماند (ساخت و
 * ویرایش دو نسخه از یک چیز نیستند). تفاوت فقط در «مقدار اولیه» و «متد ذخیره» است.
 *
 * تعهدهایی که عمداً پیاده شده‌اند:
 *   • نام در دو جزء (نام / نام خانوادگی) نگه داشته می‌شود و *نام نمایشی مشتق
 *     می‌شود* — فیلد سومِ ذخیره‌شده نداریم تا دو منبع با هم اختلاف نکنند.
 *   • شمارهٔ موبایل اختیاری است و هیچوقت معنی «حساب کاربری» نمی‌دهد؛ شمارهٔ
 *     واردشده نرمال می‌شود (ارقام فارسی/جداکننده) ولی رشتهٔ محلی‌سازی‌شده
 *     هرگز مقدار دامنه نمی‌شود.
 *   • اختصاص سرویس هم بخشی از همین فرم است (ساخت با اختصاص، ویرایش با تغییر
 *     اختصاص) و قاعدهٔ «سرویس باید مال همین کسب‌وکار باشد» در لایهٔ سرویس
 *     بررسی می‌شود، نه در UI.
 *   • اعتبارسنجی از `validateEmployeeForm` (متمرکز) می‌آید؛ قاعده‌ای در
 *     کامپوننت تکرار نمی‌شود.
 *   • ذخیره صریح است (نه autosave) و دوباره‌ارسال با `saving` قفل می‌شود.
 *   • تغییرات ذخیره‌نشده بیرونی‌اند: صفحه با `useUnsavedChangesGuard(dirty)`
 *     نگهبان می‌گذارد.
 */

export type EmployeeFormMode = 'create' | 'edit'
export type EmployeeFormResult = 'saved' | 'invalid' | 'error' | 'busy' | 'missing-context'

const EMPTY_FORM: EmployeeFormInput = {
  firstName: '',
  lastName: '',
  title: '',
  phone: '',
  avatarUrl: null,
  status: 'active',
  serviceIds: []
}

export function useEmployeeForm(options: {
  mode: EmployeeFormMode
  businessId: MaybeRef<EntityId | null>
  employeeId?: MaybeRef<EntityId | null>
}) {
  const employees = useBusinessEmployees(options.businessId)
  const businessId = computed(() => toValue(options.businessId))
  const employeeId = computed(() => toValue(options.employeeId) ?? null)

  const values = ref<EmployeeFormInput>({ ...EMPTY_FORM })
  /** آخرین مقدار ذخیره‌شده/بارگذاری‌شده — مبنای «dirty» (نه حافظهٔ مبهم) */
  const baseline = ref<EmployeeFormInput | null>(null)
  const touched = ref<Partial<Record<keyof EmployeeFormInput, boolean>>>({})

  const loading = ref(false)
  const loadError = ref<string | null>(null)
  /** `true` = پرسنل نیست یا مال این کسب‌وکار نیست → صفحه Not Found می‌سازد */
  const notFound = ref(false)
  const savedEmployee = ref<ManagedEmployee | null>(null)

  /* ——— فیلدها (v-model) ——— */
  const firstName = computed({ get: () => values.value.firstName, set: (v: string) => { values.value.firstName = v } })
  const lastName = computed({ get: () => values.value.lastName, set: (v: string) => { values.value.lastName = v } })
  const title = computed({ get: () => values.value.title, set: (v: string) => { values.value.title = v } })
  const phone = computed({ get: () => values.value.phone, set: (v: string) => { values.value.phone = v } })
  const avatarUrl = computed({ get: () => values.value.avatarUrl, set: (v: string | null) => { values.value.avatarUrl = v } })
  const status = computed({ get: () => values.value.status, set: (v: EmployeeStatus) => { values.value.status = v } })
  const serviceIds = computed({
    get: () => values.value.serviceIds,
    set: (v: EntityId[]) => { values.value.serviceIds = [...new Set(v)] }
  })

  const submitAttempted = ref(false)
  const busy = ref(false)
  const submitError = ref<string | null>(null)

  function isFreshFormEmpty(form: EmployeeFormInput): boolean {
    return (
      form.firstName === ''
      && form.lastName === ''
      && form.title === ''
      && form.phone === ''
      && form.serviceIds.length === 0
    )
  }

  /* ——— اعتبارسنجی (منبع واحد) ——— */
  const validation = computed(() => validateEmployeeForm(values.value))
  const isValid = computed(() => validation.value.valid)
  const errors = computed<EmployeeFormErrors>(() => validation.value.errors)

  function errorFor(field: keyof EmployeeFormErrors): string | undefined {
    // خطا پیش از آن‌که کاربر فیلد را لمس کند نشان داده نمی‌شود، مگر بعد از
    // تلاش برای ذخیره (markTouched همه‌چیز را باز می‌کند).
    if (!touched.value[field] && !submitAttempted.value) return undefined
    return errors.value[field]
  }

  function markTouched(field: keyof EmployeeFormInput): void {
    touched.value = { ...touched.value, [field]: true }
  }

  /* ——— کثیفی ——— */
  function sameForm(a: EmployeeFormInput, b: EmployeeFormInput): boolean {
    return (
      a.firstName === b.firstName
      && a.lastName === b.lastName
      && a.title === b.title
      && a.phone === b.phone
      && (a.avatarUrl ?? '') === (b.avatarUrl ?? '')
      && a.status === b.status
      && a.serviceIds.length === b.serviceIds.length
      && a.serviceIds.every((id, i) => id === b.serviceIds[i])
    )
  }

  const dirty = computed(() => {
    const base = baseline.value
    if (!base) return !isFreshFormEmpty(values.value)
    return !sameForm(base, values.value)
  })

  /**
   * «افزودن» به‌محض معتبرشدن فرم فعال می‌شود؛ «ویرایش» فقط با تغییر واقعی
   * (ذخیرهٔ بی‌تغییر، نوشتن بی‌معنی است).
   */
  const canSave = computed(
    () => isValid.value && !busy.value && (options.mode === 'create' || dirty.value)
  )
  /** چند قلم هنوز مشکل دارد؟ (برای «۲ مورد از فرم کامل نشده») */
  const errorCount = computed(() => Object.keys(errors.value).length)

  /* ——— نمایش‌های زندهٔ همان ورودی ——— */
  /** نام نمایشی که از دو جزء ساخته می‌شود — همان چیزی که مشتری می‌بیند. */
  const displayNamePreview = computed(() => employeeDisplayName(values.value))
  /** پیش‌نمایش شماره با ارقام فارسی (نمایش است، مقدار دامنه نه) */
  const phonePreview = computed(() => {
    const digits = normalizeDigits(values.value.phone ?? '').replace(/\D/g, '')
    return digits.length === 11 ? formatPhoneFa(digits) : null
  })
  const selectedServiceCount = computed(() => values.value.serviceIds.length)

  function toggleService(serviceId: EntityId): void {
    const current = values.value.serviceIds
    values.value.serviceIds = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId]
    markTouched('serviceIds')
  }

  function clearServices(): void {
    values.value.serviceIds = []
    markTouched('serviceIds')
  }

  /** نرمال‌سازی شماره در لحظهٔ ترک فیلد (ارقام فارسی → ASCII؛ جداکننده‌ها پاک). */
  function commitPhone(): void {
    const digits = normalizeDigits(values.value.phone ?? '').replace(/\D/g, '')
    if (digits) values.value.phone = digits
  }

  function hydrate(form: EmployeeFormInput): void {
    values.value = { ...form, serviceIds: [...form.serviceIds] }
    baseline.value = { ...form, serviceIds: [...form.serviceIds] }
    touched.value = {}
    submitAttempted.value = false
    submitError.value = null
  }

  /** مقدار رکورد دامنه → فرم. */
  function fillFromEmployee(employee: ManagedEmployee): void {
    hydrate({
      firstName: employee.firstName,
      lastName: employee.lastName,
      title: employee.title ?? '',
      phone: employee.phone ?? '',
      avatarUrl: employee.avatarUrl ?? null,
      status: employee.status,
      serviceIds: [...employee.serviceIds]
    })
  }

  /** بارگذاری رکورد برای حالت ویرایش (deep link و refresh هم از همین‌جا). */
  async function boot(): Promise<void> {
    if (options.mode === 'create') {
      hydrate({ ...EMPTY_FORM, serviceIds: [] })
      return
    }
    const eid = employeeId.value
    if (!businessId.value || !eid) {
      notFound.value = true
      return
    }
    loading.value = true
    loadError.value = null
    notFound.value = false
    const result = await employees.loadOne(eid)
    if (result.employee) {
      savedEmployee.value = result.employee
      fillFromEmployee(result.employee)
    }
    else {
      // پیام فارسی از لایهٔ سرویس می‌آید؛ Not Found فقط «نیست / مال این
      // کسب‌وکار نیست» است، نه هر خطایی.
      notFound.value = result.missing
      loadError.value = result.message
    }
    loading.value = false
  }

  async function submit(): Promise<EmployeeFormResult> {
    if (busy.value) return 'busy'
    submitAttempted.value = true
    if (!isValid.value) return 'invalid'

    const id = businessId.value
    if (!id) return 'missing-context'
    const input = validation.value.value
    if (!input) return 'invalid'

    busy.value = true
    submitError.value = null
    // نوشتن از مخزن پرسنل می‌رود (نه مستقیم از رازپوری) تا کش فهرست، جزئیات و
    // شمارش داشبورد همان لحظه هم‌راستا بمانند — «ذخیره کن و برگرد» بدون reload.
    const result = options.mode === 'create'
      ? await employees.create(input)
      : await employees.update(employeeId.value as EntityId, input)

    busy.value = false
    if (result.ok && result.employee) {
      savedEmployee.value = result.employee
      // مبنای تازه = مقدار ذخیره‌شده؛ تا «dirty» بی‌درنگ خاموش شود و نگهبان
      // خروج، بازگشت به فهرست را بی‌دلیل بلاک نکند.
      fillFromEmployee(result.employee)
      submitAttempted.value = false
      return 'saved'
    }
    submitError.value = result.message ?? 'ذخیرهٔ پرسنل انجام نشد.'
    return 'error'
  }

  return {
    mode: options.mode,
    businessId,
    employeeId,

    // دادهٔ بارگذاری‌شده (برای هدر/متای صفحهٔ ویرایش)
    employee: savedEmployee,
    loading: computed(() => loading.value),
    loadError,
    notFound: computed(() => notFound.value),
    boot,

    // فیلدها
    firstName,
    lastName,
    title,
    phone,
    avatarUrl,
    status,
    serviceIds,

    // اعتبارسنجی و وضعیت‌ها
    isValid,
    errorCount,
    dirty,
    canSave,
    errorFor,
    markTouched,
    submitAttempted: computed(() => submitAttempted.value),

    // کمکی‌های ورودی
    displayNamePreview,
    phonePreview,
    selectedServiceCount,
    toggleService,
    clearServices,
    commitPhone,

    // ذخیره
    saving: readonly(busy),
    submitError,
    submit
  }
}
