import { ServiceError } from '~/utils/errors'
import type { AuthService } from '~/services/auth/auth-service'
import type { AppUser, AuthSession } from '~/types/user'
import type { UpdateProfileInput, UserService } from './user-service'

export class MockUserService implements UserService {
  constructor(private readonly auth: AuthService) {}

  private async requireSession(): Promise<AuthSession> {
    const session = await this.auth.getCurrentSession()
    if (!session) {
      throw new ServiceError('AUTH.REQUIRED', 'برای انجام این کار ابتدا وارد شوید.', 401)
    }
    return session
  }

  async getProfile(): Promise<AppUser> {
    await delay()
    return (await this.requireSession()).user
  }

  async updateProfile(input: UpdateProfileInput): Promise<AppUser> {
    await delay()
    const session = await this.requireSession()
    const updated: AppUser = { ...session.user, ...input }
    useCookie<AuthSession | null>('wq_session').value = { ...session, user: updated }
    return updated
  }
}
