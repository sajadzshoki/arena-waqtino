import type { AppNotification } from '~/types/notification'
import type { AuthSession } from '~/types/user'
import { MOCK_NOTIFICATIONS } from '~/services/mocks/extras'
import type { NotificationService } from './notification-service'

export class MockNotificationService implements NotificationService {
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  private mine(): AppNotification[] {
    const id = this.userId
    return MOCK_NOTIFICATIONS.filter(n => n.userId === id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async listMine(): Promise<AppNotification[]> {
    await delay()
    return this.mine()
  }

  async unreadCount(): Promise<number> {
    await delay(120)
    return this.mine().filter(n => !n.isRead).length
  }

  async markRead(id: string): Promise<void> {
    await delay(100)
    const item = MOCK_NOTIFICATIONS.find(n => n.id === id)
    if (item) item.isRead = true
  }
}
