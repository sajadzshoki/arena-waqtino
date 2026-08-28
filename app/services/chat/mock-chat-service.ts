import type { EntityId } from '~/types/common'
import type { ChatConversation, ChatMessage } from '~/types/chat'
import type { AuthSession } from '~/types/user'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '~/services/mocks/extras'
import type { ChatService } from './chat-service'

export class MockChatService implements ChatService {
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  async listConversations(): Promise<ChatConversation[]> {
    await delay()
    const userId = this.userId
    if (!userId) return []
    return MOCK_CONVERSATIONS.filter(c => c.customerId === userId).sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? b.createdAt).getTime() -
        new Date(a.lastMessageAt ?? a.createdAt).getTime()
    )
  }

  async listMessages(conversationId: EntityId): Promise<ChatMessage[]> {
    await delay(250)
    return MOCK_MESSAGES.filter(m => m.conversationId === conversationId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }
}
