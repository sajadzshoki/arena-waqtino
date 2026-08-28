import type { AppNotification } from '~/types/notification'

/** قرارداد سرویس اعلان‌ها. */
export interface NotificationService {
  /** اعلان‌های کاربر جاری — جدیدترین اول */
  listMine(): Promise<AppNotification[]>
  unreadCount(): Promise<number>
  markRead(id: string): Promise<void>
}
