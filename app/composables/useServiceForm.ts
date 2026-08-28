import type { MaybeRef } from 'vue'
import type { EntityId } from '~/types/common'
import type { ManagedService, ServiceStatus } from '~/types/service'
import type { ServiceFormErrors, ServiceFormInput } from '~/utils/validation'

/**
 * فرم مشترک «افزودن سرویس» و «ویرایش سرویس».
 *
 * چرا یک فرم برای هر دو؟ تا قواعد، چیدمان فیلدها و رفتار خطا یکی بماند
 * (ساخت و ویرایش دو نسخه از یک چیز نیستند). تفاوت فقط در «ابتدای مقدار» و
 * «کدام متد سرویس صدا زده شود» است.
 *
 * چند تعهد مهم:
 *   • ورودی‌های عددی به‌صورت رشتهٔ خام نگه داشته می‌شوند (تایپ نصفه‌نیمه
 *     نباید داده را خراب کند) و فقط در لحظهٔ ذخیره به عدد نرمال‌شده تبدیل
 *     می‌شوند — رشتهٔ محلی‌سازی‌شده هیچ‌وقت مقدار دامنه نمی‌شود.
 *   • اعتبارسنجی از `validateServiceForm` (متمرکز) می‌آید؛ قاعده‌ای در
 *     کامپوننت تکرار نمی‌شود.
 *   • ذخیره صریح است (نه autosave) و دوباره‌ارسال با `saving` قفل می‌شود.
 *   • تغییرات ذخیره‌نشده بیرونی‌اند: صفحه با `useUnsavedChangesGuard(dirty)`
 *     نگهبان می‌گذارد.
 */

export type ServiceFormMode = 'create' | 'edit'
export type ServiceFormResult = 'saved' | 'invalid' | 'error' | 'busy' | 'missing-context'

const EMPTY_FORM: ServiceFormInput = {
  name: '',
  description: '',
  duration: '',
  price: '',
  status: 'active'
}

export function useServiceForm(options: {
  mode: ServiceFormMode
  businessId: MaybeRef<EntityId | null>
  serviceId?: MaybeRef<EntityId | null>
}) {
  const services = useBusinessServices(options.businessId)
  const businessId = computed(() => toValue(options.businessId))
  const serviceId = computed(() => toValue(options.serviceId) ?? null)

  const values = ref<ServiceFormInput>({ ...EMPTY_FORM })
  /** آخرین مقدار ذخیره‌شده/بارگذاری‌شده — مبنای «dirty» (نه حافظهٔ مبهم) */
  const baseline = ref<ServiceFormInput | null>(null)
  const touched = ref<Partial<Record<keyof ServiceFormInput, boolean>>>({})

  const loading = ref(false)
  const loadError = ref<string | null>(null)
  /** `true` = سرویس نیست یا مال این کسب‌وکار نیست → صفحه Not Found می‌سازد */
  const notFound = ref(false)
  const savedService = ref<ManagedService | null>(null)

  /* ——— فیلدها (v-model) ——— */
  const name = computed({ get: () => values.value.name, set: (v: string) => { values.value.name = v } })
  const description = computed({ get: () => values.value.description, set: (v: string) => { values.value.description = v } })
  const duration = computed({ get: () => values.value.duration, set: (v: string) => { values.value.duration = v } })
  const price = computed({ get: () => values.value.price, set: (v: string) => { values.value.price = v } })
  const status = computed({ get: () => values.value.status, set: (v: ServiceStatus) => { values.value.status = v } })

  const submitAttempted = ref(false)
  const busy = ref(false)
  const submitError = ref<string | null>(null)

  function isFreshFormEmpty(form: ServiceFormInput): boolean {
    return form.name === '' && form.description === '' && form.duration === '' && form.price === ''
  }

  /* ——— اعتبارسنجی (منبع واحد) ——— */
  const validation = computed(() => validateServiceForm(values.value))
  const isValid = computed(() => validation.value.valid)
  const errors = computed<ServiceFormErrors>(() => validation.value.errors)

  function errorFor(field: keyof ServiceFormInput): string | undefined {
    // خطا پیش از آن‌که کاربر فیلد را لمس کند نشان داده نمی‌شود، مگر بعد از
    // تلاش برای ذخیره (markTouched همه‌چیز را باز می‌کند).
    if (!touched.value[field] && !submitAttempted.value) return undefined
    return errors.value[field]
  }

  function markTouched(field: keyof ServiceFormInput): void {
    touched.value = { ...touched.value, [field]: true }
  }

  /* ——— کثیفی ——— */
  const dirty = computed(() => {
    const base = baseline.value
    if (!base) return !isFreshFormEmpty(values.value)
    return (
      base.name !== values.value.name
      || base.description !== values.value.description
      || base.duration !== values.value.duration
      || base.price !== values.value.price
      || base.status !== values.value.status
    )
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

  /* ——— نمایش‌های زندهٔ همان ورودی (تومان/دقیقه) ——— */
  const pricePreview = computed(() => {
    const value = parseFaNumber(values.value.price)
    return value === null ? null : value
  })
  const durationPreview = computed(() => {
    const value = parseFaNumber(values.value.duration)
    return value === null ? null : formatDurationFa(value)
  })

  /** نرمال‌سازی ورودی عددی در لحظهٔ ترک فیلد (ارقام فارسی + جداکنندهٔ هزارگان). */
  function commitPrice(): void {
    const value = parseFaNumber(values.value.price)
    if (value !== null) values.value.price = groupFaNumber(value)
  }
  function commitDuration(): void {
    const value = parseFaNumber(values.value.duration)
    if (value !== null) values.value.duration = toFaDigits(value)
  }
  function chooseDuration(minutes: number): void {
    values.value.duration = toFaDigits(minutes)
    markTouched('duration')
  }

  function hydrate(form: ServiceFormInput): void {
    values.value = { ...form }
    baseline.value = { ...form }
    touched.value = {}
    submitAttempted.value = false
    submitError.value = null
  }

  /** مقدار رکورد دامنه → فرم (رشته‌ها برای تایپ، نه عددِ بی‌متن). */
  function fillFromService(service: ManagedService): void {
    hydrate({
      name: service.name,
      description: service.description ?? '',
      duration: String(service.durationMinutes),
      price: String(service.price),
      status: service.status
    })
  }

  /** بارگذاری رکورد برای حالت ویرایش (deep link و refresh هم از همین‌جا). */
  async function boot(): Promise<void> {
    if (options.mode === 'create') {
      hydrate({ ...EMPTY_FORM })
      return
    }
    const sid = serviceId.value
    if (!businessId.value || !sid) {
      notFound.value = true
      return
    }
    loading.value = true
    loadError.value = null
    notFound.value = false
    const result = await services.loadOne(sid)
    if (result.service) {
      savedService.value = result.service
      fillFromService(result.service)
    }
    else {
      // پیام فارسی از لایهٔ سرویس می‌آید؛ Not Found فقط «نیست / مال این
      // کسب‌وکار نیست» است، نه هر خطایی.
      notFound.value = result.missing
      loadError.value = result.message
    }
    loading.value = false
  }

  async function submit(): Promise<ServiceFormResult> {
    if (busy.value) return 'busy'
    submitAttempted.value = true
    if (!isValid.value) return 'invalid'

    const id = businessId.value
    if (!id) return 'missing-context'
    const input = validation.value.value
    if (!input) return 'invalid'

    busy.value = true
    submitError.value = null
    // نوشتن از مخزن سرویس‌ها می‌رود (نه مستقیم از رازپوری) تا کش فهرست و
    // داشبورد همان لحظه هم‌راستا بمانند — «ذخیره کن و برگرد» بدون reload.
    const result = options.mode === 'create'
      ? await services.create(input)
      : await services.update(serviceId.value as EntityId, input)

    busy.value = false
    if (result.ok && result.service) {
      savedService.value = result.service
      // مبنای تازه = مقدار ذخیره‌شده؛ تا «dirty» بی‌درنگ خاموش شود و نگهبان
      // خروج، بازگشت به فهرست را بی‌دلیل بلاک نکند.
      fillFromService(result.service)
      submitAttempted.value = false
      return 'saved'
    }
    submitError.value = result.message ?? 'ذخیرهٔ سرویس انجام نشد.'
    return 'error'
  }

  return {
    mode: options.mode,
    businessId,
    serviceId,

    // دادهٔ بارگذاری‌شده (برای هدر/متای صفحهٔ ویرایش)
    service: savedService,
    loading: computed(() => loading.value),
    loadError,
    notFound: computed(() => notFound.value),
    boot,

    // فیلدها
    name,
    description,
    duration,
    price,
    status,

    // اعتبارسنجی و وضعیت‌ها
    isValid,
    errorCount,
    dirty,
    canSave,
    errorFor,
    markTouched,
    submitAttempted: computed(() => submitAttempted.value),

    // کمکی‌های ورودی
    pricePreview,
    durationPreview,
    commitPrice,
    commitDuration,
    chooseDuration,

    // ذخیره
    saving: readonly(busy),
    submitError,
    submit
  }
}
