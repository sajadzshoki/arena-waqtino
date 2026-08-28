/**
 * دامنهٔ «پرسنل کسب‌وکار» — سومین موجودیت مرکزی وقتینو (بعد از کسب‌وکار و سرویس).
 *
 * سه قاعده‌ای که این فاز را از «لیست کارمندان یک ادمین‌پنل» جدا می‌کند:
 *   • پرسنل یک *رابطه با کسب‌وکار* است، نه یک حساب کاربری. `userId` اختیاری است،
 *     پس مدیر می‌تواند پرسنلی را ثبت کند که هنوز حساب وقتینو ندارد (و یک نفر
 *     می‌تواند در چند کسب‌وکار پرسنل باشد — رابطه یکتای سراسری نیست).
 *   • رابطهٔ پرسنل↔سرویس *همین‌جا* ذخیره می‌شود (`serviceIds`)؛
 *     `BookableService.employeeIds` فقط نمای مشتق‌شدهٔ همان رابطه است
 *     (منبع‌واحد‌حقیقت؛ وگرنه دو طرف می‌توانند اختلاف کنند).
 *   • `status` چرخهٔ حیات است، نه حذف: «غیرفعال» یعنی بی‌روشنی برای رزرو تازه،
 *     ولی باقی‌مانده در مدیریت و در تاریخچهٔ نوبت‌ها.
 *
 * `title` عمداً مانده: عنوان شغلی چیزی است که *مشتری* در کارت پرسنل می‌بیند، نه
 * فیلد اداری. فیلدهای HR (حقوق، قرارداد، مرخصی…) عمداً نیامده‌اند — وقتینو
 * سامانهٔ رزرو است.
 */

/** وضعیت چرخهٔ حیات پرسنل — «غیرفعال» یعنی پنهان از رزرو تازه، نه حذف‌شده. */
export type EmployeeStatus = 'active' | 'inactive'

/** رکورد دامنهٔ پرسنل (چیزی که مخزن نگه می‌دارد؛ همان چیزی که مشتری هم می‌خواند). */
export interface Employee {
  id: EntityId
  businessId: EntityId
  /** اتصال *اختیاری* به حساب کاربری — نبودش یعنی «هنوز حساب ندارد» */
  userId?: EntityId
  firstName: string
  lastName: string
  /** عنوان شغلی نمایشی («آرایشگر مو و رنگ») */
  title?: string
  /** اختیاری؛ هیچوقت به‌تنهایی «حساب کاربری» معنی نمی‌شود */
  phone?: string | null
  avatarUrl?: string | null
  status: EmployeeStatus
  /** سرویس‌هایی که همین نفر انجام می‌دهد — همه از همان کسب‌وکار */
  serviceIds: EntityId[]
  /** فقط وقتی واقعاً ثبت شده — برای «افزوده شد» در صفحهٔ مدیر */
  createdAt?: ISODateTime
  updatedAt?: ISODateTime
}

/** ورودی مشترک فرم «افزودن پرسنل» و «ویرایش پرسنل» (مقدار نرمال‌شدهٔ دامنه). */
export interface EmployeeInput {
  firstName: string
  lastName: string
  title: string
  phone: string
  avatarUrl: string | null
  status: EmployeeStatus
  serviceIds: EntityId[]
}

/** نتیجهٔ سیاست حذف (mock: قانون ساده، api: پاسخ سرور) — UI تصمیم نمی‌سازد. */
export type EmployeeRemoveBlocker = 'has_live_bookings' | null

export interface EmployeeRemovePolicy {
  canRemove: boolean
  blocker: EmployeeRemoveBlocker
  /** دلیل فارسی/راهنمای جایگزین، از همان لایهٔ سرویس */
  hint: string | null
}

/** وضعیت اتصال به حساب کاربری — برای آمادگی «حالت پرسنل»، بدون ادعای جعلی. */
export interface EmployeeAccountLink {
  state: 'linked' | 'none'
  /** آیا حساب متصل واقعاً می‌تواند وارد شود؟ (presence در جدول کاربران) */
  accountActive: boolean
}

/** نمای مدیر: رکورد دامنه + آنچه تصمیم مدیر را می‌سازد. */
export interface ManagedEmployee extends Employee {
  /** نام نمایشیِ مشتق‌شده (ذخیره نمی‌شود تا دادهٔ موازی نسازیم) */
  displayName: string
  /** چند سرویسِ *فعال* این کسب‌وکار را انجام می‌دهد (شمارشی که مشتری می‌بیند) */
  activeServiceCount: number
  /** نام سرویس‌هایی که اگر این نفر حذف شود، بدون پرسنل می‌مانند */
  orphanedServiceNames: string[]
  /** نوبت‌های زنده (در انتظار/تأییدشدهٔ پیش‌رو) — توضیح «چرا حذف نشد» */
  liveBookingCount: number
  /** همهٔ نوبت‌هایی که این نفر را دارند (تاریخچه هم حساب می‌شود) */
  bookingCount: number
  removePolicy: EmployeeRemovePolicy
  linkedAccount: EmployeeAccountLink
}

/* اسنپ‌شات تاریخچه (`BookingEmployeeSnapshot`) در `types/booking.ts` است —
 * همان‌جا که `Booking` و `BookingServiceSnapshot` زندگی می‌کنند، تا یک نام
 * دونسخه‌ای نشود. */

/**
 * نمای «قابل رزرو» پرسنل — آینهٔ `BookableService` در سمت مشتری.
 *
 * چرا یک نمای جدا و نه خودِ `Employee`؟ چون خواندن مشتری دو چیز را نباید ببرد:
 *   • `phone` — شمارهٔ تماس پرسنل، اطلاعات تماسِ *مدیریت* است، نه چیزی که
 *     مشتریِ در حال انتخاب پرسنل به آن نیاز داشته باشد؛
 *   • `userId` — شناسهٔ داخلی حساب کاربری (سیاست فاز: هیچ شناسهٔ داخلی به
 *     کلاینت لو نمی‌رود) و همین‌طور `removePolicy`/شمارش نوبت‌ها که نمای مدیر است.
 * `displayName` در همین‌جا محاسبه می‌شود تا مصرف‌کنندهٔ مشتری مجبور نباشد
 * `firstName`/`lastName` را ببیند (رکورد دامنه در لایهٔ داده می‌ماند).
 */
export interface BookableEmployee {
  id: EntityId
  businessId: EntityId
  displayName: string
  title?: string
  avatarUrl?: string | null
  status: EmployeeStatus
  serviceIds: EntityId[]
}

/** رکورد دامنه → نمای مشتری (فیلد اضافه‌ای عبور نمی‌کند؛ نه امروز، نه فردا). */
export function toBookableEmployee(employee: Employee): BookableEmployee {
  return {
    id: employee.id,
    businessId: employee.businessId,
    displayName: employeeDisplayName(employee),
    ...(employee.title ? { title: employee.title } : {}),
    avatarUrl: employee.avatarUrl ?? null,
    status: employee.status,
    serviceIds: [...employee.serviceIds]
  }
}

/**
 * نام نمایشی از خود رکورد ساخته می‌شود — نه یک فیلد سومِ ذخیره‌شده که بعداً با
 * نام‌ها اختلاف کند. عمداً بی‌وابستگی است (هیچ import دیگری در این فایل نیست) تا
 * از هر لایه‌ای — و حتی بیرون از transform ناکس — یکسان کار کند.
 */
export function employeeDisplayName(employee: Pick<Employee, 'firstName' | 'lastName'>): string {
  return [employee.firstName, employee.lastName]
    .map(part => (part ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
}
