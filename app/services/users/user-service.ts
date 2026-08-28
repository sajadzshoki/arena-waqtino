import type { AppUser } from '~/types/user'

/** قرارداد سرویس پروفایل کاربر. */
export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
}

export interface UserService {
  getProfile(): Promise<AppUser>
  updateProfile(input: UpdateProfileInput): Promise<AppUser>
}
