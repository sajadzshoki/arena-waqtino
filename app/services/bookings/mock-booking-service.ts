import { ServiceError } from '~/utils/errors'
import type { AuthSession } from '~/types/user'
import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import { MOCK_BOOKINGS } from '~/services/mocks/bookings'
import type { BookingScope, BookingService } from './booking-service'

export class MockBookingService implements BookingService {
  private get userId(): string | null {
    return useCookie<AuthSession | null>('wq_session').value?.user.id ?? null
  }

  async listMine(scope: BookingScope = 'upcoming'): Promise<Booking[]> {
    await delay()
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    if (flags.forceEmpty.value) return []

    const userId = this.userId
    if (!userId) return []

    const now = Date.now()
    const isUpcoming = (b: Booking) =>
      new Date(b.start).getTime() >= now && (b.status === 'pending' || b.status === 'confirmed')

    const items = MOCK_BOOKINGS.filter(
      b => b.customerId === userId && (scope === 'upcoming' ? isUpcoming(b) : !isUpcoming(b))
    )

    return items.sort((a, b) =>
      scope === 'upcoming'
        ? new Date(a.start).getTime() - new Date(b.start).getTime()
        : new Date(b.start).getTime() - new Date(a.start).getTime()
    )
  }

  async getById(id: EntityId): Promise<Booking | null> {
    await delay(200)
    return MOCK_BOOKINGS.find(b => b.id === id) ?? null
  }
}
