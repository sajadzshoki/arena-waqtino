import type { Favorite } from '~/types/review'

/**
 * «حالت کاربری mock» — تنها مکانیزم ماندگاری دادهٔ کاربر-محور در حالت mock.
 *
 * چرا کوکی؟
 *   - داده باید در SSR هم خوانده شود تا مقدار اولیهٔ client/server یکی باشد
 *     (هیچ mismatch هیدریشنی در صفحهٔ پروفایل/نشان‌شده‌ها ایجاد نشود).
 *   - نشست (`wq_session`) و حالت (`wq_mode`) هم از قبل کوکی‌اند؛ برای هر فیچر
 *     یک مکانیزم ذخیرهٔ تازه اختراع نمی‌کنیم.
 *
 * ساختار: `Record<userId, MockUserState>` — دادهٔ هر کاربر کنار کاربر دیگر
 * نمی‌آید؛ همان مفهوم «دادهٔ متعلق به کاربر واردشده» که بک‌اند AdonisJS بعداً
 * از خود نشست می‌فهمد.
 *
 * مهم: این فایل فقط زیرمجموعهٔ `services/mocks` است. در `apiMode='api'` هرگز
 * خوانده/نوشته نمی‌شود (سرویس‌های Api* منبع‌حقیقت بک‌اند را دارند).
 */

/** تغییرات پروفایل که در mock کنار نشست نگه داشته می‌شوند. */
export interface MockProfilePatch {
  firstName?: string
  lastName?: string
  /** `null` = حذف آواتار (بازگشت به حروف اول نام) */
  avatarUrl?: string | null
  /** زمان آخرین ویرایش — برای نمایش در «اطلاعات حساب» */
  updatedAt?: ISODateTime
}

export interface MockUserState {
  favorites?: Favorite[]
  profile?: MockProfilePatch
}

const USER_STATE_COOKIE = 'wq_user_data'

type UserStateMap = Record<string, MockUserState>

function cookie() {
  return useCookie<UserStateMap | null>(USER_STATE_COOKIE, {
    default: () => null,
    sameSite: 'lax',
    // ماندگارتر از نشست: دادهٔ development نباید با یک logout پاک شود
    maxAge: 365 * 24 * 60 * 60
  })
}

function read(): UserStateMap {
  return cookie().value ?? {}
}

function write(map: UserStateMap): void {
  cookie().value = map
}

/** حالت ذخیره‌شدهٔ یک کاربر (null = هنوز چیزی ثبت نشده است). */
export function readMockUserState(userId: string | null): MockUserState | null {
  if (!userId) return null
  return read()[userId] ?? null
}

/** ادغام patch در حالت کاربر — نوشتن فقط وقتی واقعاً تغییری رخ داده است. */
export function patchMockUserState(
  userId: string | null,
  patch: Partial<MockUserState>
): MockUserState | null {
  if (!userId) return null

  const map = read()
  const previous = map[userId] ?? {}
  const next: MockUserState = { ...previous }

  if (patch.favorites !== undefined) next.favorites = patch.favorites
  if (patch.profile !== undefined) next.profile = { ...previous.profile, ...patch.profile }

  if (JSON.stringify(previous) === JSON.stringify(next)) return previous
  write({ ...map, [userId]: next })
  return next
}

/** پاک‌کردن کامل دادهٔ mock یک کاربر (فقط برای ابزار توسعه). */
export function clearMockUserState(userId: string | null): void {
  if (!userId) return
  const map = read()
  if (!(userId in map)) return
  // بدون `delete` روی کلید پویا — بازسازی نگاشت تمیزتر و type-safe است
  const next: UserStateMap = {}
  for (const [key, value] of Object.entries(map)) {
    if (key !== userId) next[key] = value
  }
  write(next)
}
