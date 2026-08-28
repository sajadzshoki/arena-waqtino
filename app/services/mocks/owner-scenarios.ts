import type { Booking } from '~/types/booking'

/**
 * نوبت‌های سناریوی «صاحب کسب‌وکار» (فاز ۸).
 *
 * چرا جدا از MOCK_BOOKINGS؟ دو دلیل:
 *   ۱) فهرست مشتری (فاز ۶) بر اساس `customerId` فیلتر می‌کند؛ این رکوردها
 *      مشتری‌های گوناگون دارند و هیچ‌وقت در «نوبت‌های من» کاربر توسعه نمی‌آیند.
 *   ۲) داشبورد مدیر نیاز دارد «امروز» پرنوبت باشد و یک کسب‌وکار هم
 *      بدون هیچ فعالیتی بماند — این ترکیب در دادهٔ فاز ۶ نبود.
 *
 * هر دو فهرست با `allMockBookings()` (در `bookings.ts`) ادغام می‌شوند تا
 * منبع‌واحد‌حقیقت بماند: یک رزرو، مستقل از اینکه مشتری یا مدیر به آن نگاه
 * می‌کند.
 *
 * تاریخ‌ها نسبت به «امروز» ساخته می‌شوند تا داشبورد همیشه معنادار بماند.
 */

/**
 * «چند دقیقهٔ دیگر» — برای نوبت‌هایی که باید همیشه «امروزِ زنده» بمانند.
 * اگر فقط ساعتِ ثابت (مثلاً ۱۰:۰۰) می‌گذاشتیم، داشبورد در ساعات پایانی روز
 * خالی می‌شد و سناریوی «امروز پرنوبت است» قابل دیدن نبود.
 */
function inMinutes(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString()
}

function isoIn(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function make(partial: Omit<Booking, 'end'> & { duration: number }): Booking {
  const { duration, ...rest } = partial
  return { ...rest, end: new Date(new Date(rest.start).getTime() + duration * 60_000).toISOString() }
}

export const MOCK_OWNER_BOOKINGS: Booking[] = [
  // ── سالن نارنج (فعال، پرنوبت) ────────────────────────────────────────────
  make({
    id: 'bok_own_01',
    customerId: 'usr_cust_mahsa',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_haircut',
    employeeId: 'emp_mina_narenj',
    start: inMinutes(45),
    duration: 45,
    status: 'confirmed',
    price: 1_200_000,
    createdAt: isoIn(-2, 12, 10)
  }),
  make({
    id: 'bok_own_02',
    customerId: 'usr_cust_sahar',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_color',
    // بدون کارمند تخصیصی → داشبورد باید این را صادق بگوید
    start: inMinutes(180),
    duration: 120,
    status: 'pending',
    price: 2_400_000,
    notes: 'ریشتهٔ روشن می‌خواهم؛ حساسیت پوستی ندارم.',
    createdAt: isoIn(0, 8, 40)
  }),
  make({
    id: 'bok_own_03',
    customerId: 'usr_dev_negar',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_skin',
    employeeId: 'emp_omid_narenj',
    start: isoIn(0, 15, 0),
    duration: 60,
    status: 'confirmed',
    price: 890_000,
    createdAt: isoIn(-4, 20, 5)
  }),
  make({
    id: 'bok_own_04',
    customerId: 'usr_cust_rooya',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_bridal',
    employeeId: 'emp_mina_narenj',
    // لغوشدهٔ امروز → در فهرست «امروز» نباید حساب شود
    start: isoIn(0, 18, 30),
    duration: 180,
    status: 'cancelled',
    price: 6_800_000,
    cancelledBy: 'customer',
    cancelReason: 'تاریخ عروسی تغییر کرد.',
    createdAt: isoIn(-10, 14, 0)
  }),
  make({
    id: 'bok_own_05',
    customerId: 'usr_cust_nazanin',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_keratin',
    employeeId: 'emp_nike_narenj',
    start: isoIn(1, 9, 0),
    duration: 150,
    status: 'pending',
    price: 5_600_000,
    createdAt: isoIn(0, 9, 15)
  }),
  make({
    id: 'bok_own_06',
    customerId: 'usr_cust_alireza',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_haircut',
    employeeId: 'emp_omid_narenj',
    start: isoIn(3, 17, 0),
    duration: 45,
    status: 'confirmed',
    price: 1_200_000,
    createdAt: isoIn(-1, 11, 30)
  }),
  make({
    id: 'bok_own_07',
    customerId: 'usr_cust_mahsa',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_skin',
    employeeId: 'emp_omid_narenj',
    start: isoIn(-1, 16, 0),
    duration: 60,
    status: 'no_show',
    price: 890_000,
    createdAt: isoIn(-5, 9, 0)
  }),
  make({
    // فاز ۱۰: نوبتِ *گذشته* برای «سامین» — تنها پرسنلی که حذفش مجاز است،
    // تا دیالوگ حذف بتواند صادقانه بگوید «تاریخچه می‌ماند».
    id: 'bok_own_13',
    customerId: 'usr_cust_mahsa',
    businessId: 'biz_narenj',
    serviceId: 'srv_narenj_haircut',
    employeeId: 'emp_samin_narenj',
    start: isoIn(-6, 11, 0),
    duration: 45,
    status: 'completed',
    price: 700_000,
    createdAt: isoIn(-9, 10, 0)
  }),
  // ── باشگاه انرژی (صاحب: بهرام — سناریوی «یک کسب‌وکار») ──────────────────
  make({
    id: 'bok_own_10',
    customerId: 'usr_cust_kian',
    businessId: 'biz_energy',
    serviceId: 'srv_energy_personal',
    employeeId: 'emp_reza_energy',
    start: inMinutes(60),
    duration: 60,
    status: 'confirmed',
    price: 750_000,
    createdAt: isoIn(-3, 18, 0)
  }),
  make({
    id: 'bok_own_11',
    customerId: 'usr_cust_alireza',
    businessId: 'biz_energy',
    serviceId: 'srv_energy_crossfit',
    start: inMinutes(300),
    duration: 60,
    status: 'pending',
    price: 420_000,
    createdAt: isoIn(0, 7, 5)
  }),
  make({
    id: 'bok_own_12',
    customerId: 'usr_cust_sahar',
    businessId: 'biz_energy',
    serviceId: 'srv_energy_consult',
    employeeId: 'emp_ali_energy',
    start: isoIn(2, 19, 0),
    duration: 45,
    status: 'confirmed',
    price: 350_000,
    createdAt: isoIn(-1, 10, 25)
  })
  // «آینه» عمداً بدون هیچ رزروی است — سناریوی داشبورد بدون فعالیت.
]
