import { ServiceError } from '~/utils/errors'
import type { AuthSession } from '~/types/user'
import type { Booking } from '~/types/booking'
import type { EntityId } from '~/types/common'
import type { CreateBookingRequest, CreateBookingResponse, CreateBookingErrorResponse, BookingValidationResult } from '~/types/booking-flow'
import { MOCK_BOOKINGS } from '~/services/mocks/bookings'
import { MOCK_BOOKED_SLOTS } from '~/services/mocks/extras'
import { MOCK_SERVICES } from '~/services/mocks/businesses'
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

  async validateDraft(request: CreateBookingRequest): Promise<BookingValidationResult> {
    await delay(400)

    const errors: BookingValidationResult['errors'] = []
    const warnings: BookingValidationResult['warnings'] = []

    // Validation 1: Business exists
    // (در mock همه‌چیز وجود دارد مگر اینکه forceError فعال باشد)
    const flags = useMockFlags()
    if (flags.forceError.value) {
      errors.push({
        code: 'NETWORK_ERROR',
        message: 'اتصال برقرار نشد.'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 2: Service exists and is active
    const service = MOCK_SERVICES.find(s => s.id === request.serviceId && s.isActive)
    if (!service) {
      errors.push({
        code: 'SERVICE_UNAVAILABLE',
        message: 'این خدمت دیگر در دسترس نیست.',
        field: 'service'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 3: Service price matches
    if (service.price !== request.price) {
      warnings.push({
        code: 'PRICE_CHANGED',
        message: `قیمت این خدمت تغییر کرده است. قیمت جدید: ${formatToman(service.price)}`,
        type: 'price_change'
      })
    }

    // Validation 4: Slot availability
    const slotKey = this.slotKey(request)
    if (MOCK_BOOKED_SLOTS.has(slotKey)) {
      errors.push({
        code: 'SLOT_UNAVAILABLE',
        message: 'این زمان دیگر در دسترس نیست. لطفاً زمان دیگری انتخاب کنید.',
        field: 'timeSlot'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 5: Date not in past
    const startTime = new Date(request.start).getTime()
    if (startTime < Date.now()) {
      errors.push({
        code: 'DATE_IN_PAST',
        message: 'تاریخ انتخاب‌شده در گذشته است.',
        field: 'date'
      })
      return { valid: false, errors, warnings }
    }

    // Validation 6: Duration matches service
    const duration = (new Date(request.end).getTime() - startTime) / 60000
    if (Math.abs(duration - service.durationMinutes) > 5) {
      errors.push({
        code: 'DURATION_MISMATCH',
        message: 'مدت زمان رزرو با مدت خدمت همخوانی ندارد.'
      })
      return { valid: false, errors, warnings }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  async create(request: CreateBookingRequest): Promise<CreateBookingResponse | CreateBookingErrorResponse> {
    await delay(600)

    const userId = this.userId
    if (!userId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ابتدا وارد حساب خود شوید.'
        }
      }
    }

    // Validate
    const validation = await this.validateDraft(request)
    if (!validation.valid) {
      const firstError = validation.errors[0]
      if (!firstError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR' as const,
            message: 'خطا در اعتبارسنجی رزرو.'
          }
        }
      }
      return {
        success: false,
        error: {
          code: this.mapErrorCode(firstError.code),
          message: firstError.message
        }
      }
    }

    // Check for warnings (price change)
    const priceWarning = validation.warnings.find(w => w.type === 'price_change')
    if (priceWarning) {
      const service = MOCK_SERVICES.find(s => s.id === request.serviceId)
      return {
        success: false,
        error: {
          code: 'PRICE_CHANGED',
          message: priceWarning.message,
          suggestedPrice: service?.price
        }
      }
    }

    // Create booking
    const bookingId = `bok_${Date.now()}`
    const newBooking: Booking = {
      id: bookingId,
      customerId: userId,
      businessId: request.businessId,
      serviceId: request.serviceId,
      employeeId: request.employeeId ?? undefined,
      start: request.start,
      end: request.end,
      status: 'pending',
      price: request.price,
      notes: request.notes,
      createdAt: new Date().toISOString()
    }

    MOCK_BOOKINGS.push(newBooking)

    // Mark slot as booked
    const slotKey = this.slotKey(request)
    MOCK_BOOKED_SLOTS.add(slotKey)

    return { success: true, bookingId }
  }

  private slotKey(request: CreateBookingRequest): string {
    const start = new Date(request.start)
    const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const timeStr = `${String(start.getHours()).padStart(2, '0')}${String(start.getMinutes()).padStart(2, '0')}`
    return `${request.businessId}:${dateStr}:${timeStr}`
  }

  private mapErrorCode(code: string): CreateBookingErrorResponse['error']['code'] {
    switch (code) {
      case 'SLOT_UNAVAILABLE': return 'SLOT_UNAVAILABLE'
      case 'SERVICE_UNAVAILABLE': return 'VALIDATION_ERROR'
      case 'DATE_IN_PAST': return 'VALIDATION_ERROR'
      case 'DURATION_MISMATCH': return 'VALIDATION_ERROR'
      default: return 'SERVER_ERROR'
    }
  }
}
