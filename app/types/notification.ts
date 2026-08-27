export type NotificationType = 'booking' | 'review' | 'chat' | 'system'

export interface AppNotification {
  id: EntityId
  userId: EntityId
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  actionUrl?: string
  createdAt: ISODateTime
}
