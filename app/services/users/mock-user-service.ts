import type { AuthService } from '~/services/auth/auth-service'
import type { AvatarService } from '~/services/avatars/avatar-service'
import type { AppUser } from '~/types/user'
import { requireMockSession } from '~/services/mocks/session'
import { patchMockUserState, readMockUserState } from '~/services/mocks/user-state'
import { ServiceError } from '~/utils/errors'
import { normalizeName, validateNamePart } from '~/utils/validation'
import type { ProfileUpdateResult, UpdateProfileInput, UserService } from './user-service'

/**
 * مخزن پروفایل کاربر در حالت mock.
 *
 * منبع‌حقیقت نمایش = snapshot کاربر داخل نشست (`wq_session`)؛ آنچه کاربر ویرایش
 * می‌کند در state کاربر (`wq_user_data`) ماندگار می‌شود و هنگام خواندن روی
 * نشست سوار می‌گردد. پس:
 *   - «یکجا ویرایش، همه‌جا به‌روز» (هدر، پروفایل، …) — چون همه از useAuth می‌خوانند
 *   - پس از refresh هم مقدار می‌ماند (کوکی، SSR-safe، بدون hydration mismatch)
 *
 * اعتبارسنجی دوباره در همین‌جا انجام می‌شود (دفاع دوم)؛ قواعد در
 * `app/utils/validation.ts` تعریف شده‌اند تا UI و سرویس یک زبان داشته باشند.
 */
export class MockUserService implements UserService {
  constructor(
    private readonly auth: AuthService,
    private readonly avatars: AvatarService
  ) {}

  /** پروفایل پایه (از نشست) + تغییرات ماندگار کاربر + آواتار مؤثر. */
  private compose(user: AppUser): AppUser {
    const patch = readMockUserState(user.id)?.profile ?? {}
    const merged: AppUser = { ...user, ...patch }
    return {
      ...merged,
      avatarUrl: this.avatars.displayUrl(user.id, merged.avatarUrl ?? null)
    }
  }

  async getProfile(): Promise<AppUser> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()
    const session = await requireMockSession(this.auth)
    return this.compose(session.user)
  }

  async updateProfile(input: UpdateProfileInput): Promise<ProfileUpdateResult> {
    const flags = useMockFlags()
    await delay()
    if (flags.enabled.value && flags.forceError.value) throw ServiceError.network()
    const session = await requireMockSession(this.auth)
    const userId = session.user.id

    // ── دفاع دوم: قواعد مشترک با UI ──
    const errors: string[] = []
    if (input.firstName !== undefined) {
      const error = validateNamePart(input.firstName, 'نام')
      if (error) errors.push(error)
    }
    if (input.lastName !== undefined) {
      const error = validateNamePart(input.lastName, 'نام خانوادگی')
      if (error) errors.push(error)
    }
    if (errors.length > 0) {
      throw ServiceError.validation(errors[0] ?? 'اطلاعات واردشده معتبر نیست.')
    }

    // ── تصمیم استراتژی آواتار: ماندگار یا فقط پیش‌نمایش همین نشست ──
    let avatarPersisted = true
    let persistedAvatar: string | null | undefined
    if (input.avatarUrl !== undefined) {
      const result = await this.avatars.persist(userId, input.avatarUrl)
      persistedAvatar = result.url
      avatarPersisted = result.persisted
    }

    const patch = {
      ...(input.firstName !== undefined ? { firstName: normalizeName(input.firstName) } : {}),
      ...(input.lastName !== undefined ? { lastName: normalizeName(input.lastName) } : {}),
      ...(persistedAvatar !== undefined ? { avatarUrl: persistedAvatar } : {})
    }

    patchMockUserState(userId, { profile: patch })

    const updated = this.compose({ ...session.user, ...patch })
    await this.auth.replaceSessionUser(updated)
    return { user: updated, avatarPersisted }
  }
}
