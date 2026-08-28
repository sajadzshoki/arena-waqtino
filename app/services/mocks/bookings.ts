import type { Booking } from '~/types/booking'
import { MOCK_OWNER_BOOKINGS } from './owner-scenarios'

/**
 * نوبت‌های mock برای کاربر توسعهٔ اصلی (usr_dev_sara) — پوشش همهٔ وضعیت‌ها.
 * تاریخ‌ها نسبت به «امروز» ساخته می‌شوند تا همیشه معنادار بمانند.
 */

function isoIn(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function endOf(startIso: string, minutes: number): string {
  return new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString()
}

function makeBooking(partial: Omit<Booking, 'end'> & { duration: number }): Booking {
  const { duration, ...rest } = partial
  return { ...rest, end: endOf(rest.start, duration) }
}

/** مشتری: usr_dev_sara (و قابل‌استفاده برای سایر سناریوها در فازهای بعد) */
export const MOCK_BOOKINGS: Booking[] = [
  makeBooking({
    id: 'bok_ghel_01',
    customerId: 'usr_dev_sara',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_skin',
    employeeId: 'emp_omid_narenj',
    start: isoIn(2, 14, 30),
    duration: 60,
    status: 'confirmed',
    price: 890_000,
    notes: 'پوست حساس دارم؛ لطفاً محصول ملایم استفاده شود.',
    createdAt: isoIn(-1, 18, 5)
  }),
  makeBooking({
    id: 'bok_ghel_02',
    customerId: 'usr_dev_sara',
    businessId: 'biz_ruyesh',
    serviceId: 'srv_ruyesh_level',
    start: isoIn(4, 11, 0),
    duration: 30,
    status: 'pending',
    price: 0,
    createdAt: isoIn(0, 9, 12)
  }),
  makeBooking({
    id: 'bok_ghel_03',
    customerId: 'usr_dev_sara',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_color',
    employeeId: 'emp_mina_narenj',
    start: isoIn(-12, 17, 0),
    duration: 180,
    status: 'completed',
    price: 3_200_000,
    createdAt: isoIn(-15, 20, 41)
  }),
  makeBooking({
    id: 'bok_ghel_04',
    customerId: 'usr_dev_sara',
    businessId: 'biz_energy',
    serviceId: 'srv_energy_consult',
    start: isoIn(-5, 19, 0),
    duration: 45,
    status: 'cancelled',
    price: 350_000,
    cancelledBy: 'customer',
    cancelReason: 'با برنامهٔ کاری‌ام تداخل پیدا کرد.',
    createdAt: isoIn(-8, 15, 2)
  }),
  makeBooking({
    id: 'bok_ghel_05',
    customerId: 'usr_dev_sara',
    businessId: 'biz_pars',
    serviceId: 'srv_pars_visit',
    start: isoIn(-21, 10, 0),
    duration: 30,
    status: 'no_show',
    price: 450_000,
    createdAt: isoIn(-24, 13, 30)
  })
]

/**
 * منبع‌واحد‌حقیقت رزروها برای همهٔ نماها (مشتری و صاحب کسب‌وکار).
 *
 * تابع است نه آرایهٔ ثابت، چون `MockBookingService` رزرو تازه را در
 * `MOCK_BOOKINGS` push می‌کند؛ پس هر خواندن باید ترکیب تازه را ببیند.
 */
export function allMockBookings(): Booking[] {
  return [...MOCK_BOOKINGS, ...MOCK_OWNER_BOOKINGS]
}
