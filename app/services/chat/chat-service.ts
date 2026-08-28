import type { EntityId } from '~/types/common'
import type { ChatConversation, ChatMessage } from '~/types/chat'

/** قرارداد سرویس گفتگو با کسب‌وکار (بعد از رزرو). */
export interface ChatService {
  listConversations(): Promise<ChatConversation[]>
  listMessages(conversationId: EntityId): Promise<ChatMessage[]>
}
