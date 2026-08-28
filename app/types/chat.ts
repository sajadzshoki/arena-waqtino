/** گفتگو بین مشتری و کسب‌وکار — پس از ثبت رزرو فعال می‌شود. */
export interface ChatConversation {
  id: EntityId
  businessId: EntityId
  customerId: EntityId
  /** رزروی که گفتگو بر اساس آن باز شده */
  bookingId?: EntityId
  unreadCount: number
  lastMessageAt?: ISODateTime
  createdAt: ISODateTime
}

export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface ChatMessage {
  id: EntityId
  conversationId: EntityId
  senderId: EntityId
  text: string
  status: MessageStatus
  createdAt: ISODateTime
}
