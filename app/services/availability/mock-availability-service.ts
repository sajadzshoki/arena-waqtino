import type { EntityId } from '~/types/common'
import type { TimeSlot } from '~/types/availability'
import { MOCK_WORKING_HOURS, MOCK_BOOKED_SLOTS } from '~/services/mocks/extras'
import type { AvailabilityService } from './availability-service'

const SLOT_MINUTES = 45

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * تولید قطعی (deterministic) اسلات‌ها از روی ساعت کاری —
 * «شلوغی» بعضی اسلات‌ها با الگوی ثابت شبیه‌سازی می‌شود تا تست‌ها پایدار بمانند.
 */
export class MockAvailabilityService implements AvailabilityService {
  async getSlots(businessId: EntityId, date: string, employeeId?: EntityId): Promise<TimeSlot[]> {
    await delay(300)

    const weekly = MOCK_WORKING_HOURS[businessId]
    if (!weekly) return []

    const day = new Date(date + 'T00:00:00')
    /** هفتهٔ ایرانی: شنبه=۰ … JS getDay شنبه=۶ → تبدیل */
    const persianDay = ((day.getDay() + 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const working = weekly.find(w => w.day === persianDay)
    if (!working || !working.isOpen) return []

    // اگر امروز است، اسلات‌های گذشته را حذف کن
    const now = new Date()
    const isToday = toDateStr(now) === date

    const slots: TimeSlot[] = []
    for (const range of working.ranges) {
      for (let start = toMinutes(range.start); start + SLOT_MINUTES <= toMinutes(range.end); start += SLOT_MINUTES) {
        const slotStart = new Date(day)
        slotStart.setHours(Math.floor(start / 60), start % 60, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60_000)

        // اسلات‌های گذشته در امروز
        if (isToday && slotStart.getTime() <= now.getTime()) continue

        // الگوی قطعی شلوغی: هر سومین اسلات شلوغ است
        const index = slots.length
        const isBusy = (index + persianDay) % 3 === 0

        // بررسی slot conflict (اسلات‌های از پیش رزرو شده)
        const slotKey = `${businessId}:${date}:${String(start).padStart(4, '0')}`
        const isBooked = MOCK_BOOKED_SLOTS.has(slotKey)

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          employeeId,
          isAvailable: !isBusy && !isBooked
        })
      }
    }
    return slots
  }
}
