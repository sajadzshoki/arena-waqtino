import type { ProfileUpdateResult } from '~/services/users/user-service'
import { PROFILE_NAME_MAX, normalizeName, validateNamePart } from '~/utils/validation'

/**
 * منطق فرم «ویرایش پروفایل» — جدا از template تا صفحه نازک بماند و
 * قواعد/state فرم در یک جا باشد:
 *
 *   مقدار فرم ↔ مقدار ذخیره‌شده (savedValues) → dirty
 *   قواعد      ← app/utils/validation.ts (متمرکز و قابل‌استفادهٔ دوباره)
 *   ذخیره     ← useUserProfile().save (اکشن عمدی، نه autosave هر کلید)
 *   جدا شدن    ← نگهبان تغییر مسیر + تأیید «تغییرات ذخیره‌نشده» (در صفحه)
 */
export type ProfileFieldKey = 'firstName' | 'lastName'

interface ProfileFormValues {
  firstName: string
  lastName: string
  /** `null` = حذف آواتار (برای تمایز از «دست‌نخورده» در لحظهٔ ذخیره) */
  avatarUrl: string | null
}

export function useProfileForm() {
  const { profile, load, loading, error: loadError, save, saving, saveError } = useUserProfile()

  const values = ref<ProfileFormValues>({ firstName: '', lastName: '', avatarUrl: null })
  const savedValues = ref<ProfileFormValues>({ firstName: '', lastName: '', avatarUrl: null })
  const touched = ref<Record<ProfileFieldKey, boolean>>({ firstName: false, lastName: false })
  const submitAttempted = ref(false)

  // ───────────────── بارگذاری و مقداردهی اولیه ─────────────────
  function hydrate(): void {
    const next: ProfileFormValues = {
      firstName: profile.value?.firstName ?? '',
      lastName: profile.value?.lastName ?? '',
      avatarUrl: profile.value?.avatarUrl ?? null
    }
    savedValues.value = next
    values.value = { ...next }
    touched.value = { firstName: false, lastName: false }
    submitAttempted.value = false
  }

  /** باز کردن فرم: واکشی تازه از سرویس + پر کردن مقدارها. */
  async function initialize(): Promise<void> {
    await load()
    hydrate()
  }

  // ───────────────── اعتبارسنجی ─────────────────
  const fieldErrors = computed<Partial<Record<ProfileFieldKey, string>>>(() => {
    const errors: Partial<Record<ProfileFieldKey, string>> = {}
    const first = validateNamePart(values.value.firstName, 'نام')
    if (first) errors.firstName = first
    const last = validateNamePart(values.value.lastName, 'نام خانوادگی')
    if (last) errors.lastName = last
    return errors
  })
  const isValid = computed(() => Object.keys(fieldErrors.value).length === 0)

  /** خطا فقط وقتی معنا دارد نمایش داده می‌شود: پس از blur یا تلاش برای ذخیره. */
  function errorFor(field: ProfileFieldKey): string | undefined {
    if (!submitAttempted.value && !touched.value[field]) return undefined
    return fieldErrors.value[field]
  }

  function markTouched(field: ProfileFieldKey): void {
    touched.value[field] = true
  }

  // ───────────────── دسترسی‌های دوطرفه (v-model) ─────────────────
  const firstName = computed({
    get: () => values.value.firstName,
    set: (value: string) => {
      values.value = { ...values.value, firstName: value }
    }
  })
  const lastName = computed({
    get: () => values.value.lastName,
    set: (value: string) => {
      values.value = { ...values.value, lastName: value }
    }
  })
  const avatarUrl = computed({
    get: () => values.value.avatarUrl,
    set: (value: string | null) => {
      values.value = { ...values.value, avatarUrl: value }
    }
  })

  // ───────────────── تغییرات ─────────────────
  const dirty = computed(() => {
    const next = values.value
    const base = savedValues.value
    return (
      normalizeName(next.firstName) !== base.firstName ||
      normalizeName(next.lastName) !== base.lastName ||
      next.avatarUrl !== base.avatarUrl
    )
  })

  const canSave = computed(() => dirty.value && isValid.value && !saving.value)

  /** بازگرداندن فرم به آخرین مقدار ذخیره‌شده. */
  function discard(): void {
    values.value = { ...savedValues.value }
    submitAttempted.value = false
    touched.value = { firstName: false, lastName: false }
  }

  // ───────────────── ذخیره ─────────────────
  async function submit(): Promise<ProfileUpdateResult | null> {
    submitAttempted.value = true
    if (!isValid.value || !dirty.value) return null

    const avatarChanged = values.value.avatarUrl !== savedValues.value.avatarUrl
    const result = await save({
      firstName: normalizeName(values.value.firstName),
      lastName: normalizeName(values.value.lastName),
      // آواتار فقط وقتی دست‌خورده است ارسال می‌شود (وگرنه `undefined` = بدون تغییر)
      ...(avatarChanged ? { avatarUrl: values.value.avatarUrl } : {})
    })
    if (result) savedValues.value = { ...values.value }
    return result
  }

  return {
    // state
    profile,
    firstName,
    lastName,
    avatarUrl,
    fieldErrors,
    isValid,
    dirty,
    canSave,
    saving,
    saveError,
    loading,
    loadError,
    nameMaxLength: PROFILE_NAME_MAX,
    // actions
    initialize,
    hydrate,
    markTouched,
    errorFor,
    discard,
    submit
  }
}
