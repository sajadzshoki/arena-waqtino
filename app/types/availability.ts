import type { EntityId, ISODateTime } from '~/types/common'
import type { EmployeeStatus } from '~/types/employee'

/**
 * دامنهٔ «دسترس‌پذیری» (فاز ۱۱) — ساعت کاری هفتگی کسب‌وکار و پرسنل.
 *
 * سه تصمیم، کل این فاز را می‌سازد:
 *   ۱) دسترس‌پذیری **پنجرهٔ کاری** است، نه فهرست اسلات‌ها. «۰۹:۰۰–۱۳:۰۰ و
 *      ۱۴:۰۰–۱۸:۰۰» یعنی در این بازه‌ها پذیرش داریم؛ تبدیل پنجره به
 *      اسلات‌های قابل‌رزرو کار موتور رزرو است (مدت سرویس + قوانین + نوبت‌های
 *      موجود). پس هیچ اسلات تولیدشده‌ای ذخیره نمی‌شود.
 *   ۲) برنامهٔ *پرسنل* می‌تواند «مطابق کسب‌وکار» باشد — یعنی هیچ رکورد
 *      تکراری برای هر نفر نمی‌سازیم و تغییر ساعت کسب‌وکار، بازنویسی انبوه
 *      پرسنل را لازم ندارد.
 *   ۳) هفته و ساعت در دامنه نرمال‌شده‌اند: روز با نام (`saturday`…`friday`) و
 *      ساعت با `HH:mm` بی‌قلم. برچسب فارسی و قالب نمایش، لایهٔ نمایش‌اند؛ پس اگر
 *      فردا زبان دیگری آمد، داده دست‌نخورده می‌ماند.
 *
 * فازهای بعد (تعطیلات، مرخصی، استثنائات روز‌مختص، overrideها) روی همین شکل سوار
 * می‌شوند: یک لایهٔ `exceptions` با کلید تاریخ، در کنار همین `days` — پس نه
 * «روز» را به فهرست تاریخ تبدیل کرده‌ایم، نه ساعت را به شمارهٔ دقیق.
 */

/** روز هفته — مقدار دامنه، نه برچسب. ترتیب: اول هفتهٔ ایرانی (شنبه). */
export type Weekday =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'

/** بازهٔ کاری — «HH:mm» نرمال‌شده؛ `start < end` و بدون شب‌خواب (فاز ۱۱). */
export interface AvailabilityInterval {
  start: string
  end: string
}

export interface AvailabilityDay {
  weekday: Weekday
  /** `false` = تعطیل. بازه‌های قبلی *پاک نمی‌شوند* تا روشن‌کردن دوباره جای خالی نگذارد. */
  enabled: boolean
  intervals: AvailabilityInterval[]
}

/** منبع برنامهٔ پرسنل — همین دو مقدار، «تکرار برنامهٔ کسب‌وکار» را غیرممکن می‌کند. */
export type ScheduleSource = 'business-default' | 'custom'

/**
 * یک برنامهٔ هفتگی. `employeeId` فقط وقتی می‌آید که برنامه *اختصاصیِ* یک نفر
 * باشد؛ برنامهٔ کسب‌وکار هیچ `employeeId` ندارد.
 */
export interface AvailabilitySchedule {
  businessId: EntityId
  employeeId?: EntityId
  /** IANA — از همان منبع مرکزی وقت اپ (`config/timezone.ts`)؛ در UI تبدیل نمی‌کنیم. */
  timezone: string
  days: AvailabilityDay[]
  source: ScheduleSource
  /** فقط وقتی واقعاً ذخیره شده — برای «آخرین تغییر» صادق در صفحهٔ مدیر */
  updatedAt?: ISODateTime
}

/** ورودی ذخیرهٔ برنامه (فرم همین را می‌فرستد؛ `source` برای پرسنل تعیین‌کننده است). */
export interface ScheduleInput {
  source: ScheduleSource
  /** وقتی `source === 'custom'` لازم است؛ برای کسب‌وکار همیشه می‌آید. */
  days?: AvailabilityDay[]
}

/* ─────────────────────────── نمای‌های خواندنی ─────────────────────────── */

/** خط آمادهٔ نمایش: «شنبه تا چهارشنبه | ۰۹:۰۰ — ۱۸:۰۰». از خود داده ساخته می‌شود. */
export interface ScheduleSummaryLine {
  label: string
  value: string
  /** تعطیل/غیرفعال — کم‌رنگ‌تر، ولی همچنان با متن (نه فقط رنگ) */
  muted?: boolean
}

export interface ScheduleSummary {
  lines: ScheduleSummaryLine[]
  /** روزهای فعال */
  openDays: number
  intervalCount: number
  /** برچسب یک‌خطی برای فهرست‌ها: «۵ روز · ۰۹:۰۰–۱۸:۰۰» */
  headline: string
  timezone: string
}

/** کارت خلاصهٔ ساعات کاری کسب‌وکار در صفحهٔ مدیر. */
export interface BusinessScheduleView {
  businessId: EntityId
  /** `null` = هنوز تنظیم نشده (حالت خالی، نه صفر ساختگی) */
  schedule: AvailabilitySchedule | null
  summary: ScheduleSummary | null
  timezone: string
}

/** ردیف پرسنل در صفحهٔ ساعات کاری: منبع برنامه + خلاصه، بدون JSON خام. */
export interface EmployeeScheduleSummary {
  employeeId: EntityId
  displayName: string
  status: EmployeeStatus
  source: ScheduleSource
  /** «مطابق ساعات کسب‌وکار» یا خلاصهٔ برنامهٔ اختصاصی */
  headline: string
  summary: ScheduleSummary | null
  /** روزهای فعالِ این نفر که بیرون از ساعات کسب‌وکارند (بعد از تغییر ساعت کسب‌وکار) */
  conflictDays: Weekday[]
  /** `true` یعنی برنامه‌اش بی‌مصرف است: سرویسی ندارد یا غیرفعال است */
  bookable: boolean
  note: string | null
}

/** جزئیات برنامهٔ یک پرسنل برای صفحهٔ ویرایش. */
export interface EmployeeScheduleView extends EmployeeScheduleSummary {
  businessId: EntityId
  /** برنامهٔ کسب‌وکار — مبنای محدودیت و «پیش‌فرض» */
  business: BusinessScheduleView
  /** فقط وقتی `source === 'custom'` مقدار دارد */
  schedule: AvailabilitySchedule | null
  /** توضیح تناقض با ساعت کسب‌وکار (بعد از تغییر ساعت کسب‌وکار ممکن می‌شود) */
  conflictMessage: string | null
  /** آنچه عملاً در رزرو اعمال می‌شود: اشتراک برنامهٔ نفر با کسب‌وکار */
  effective: AvailabilityDay[] | null
}

/* ─────────────────────── پرس‌وجوی دسترس‌پذیری (مشتری) ─────────────────────── */

/** اسلات قابل‌رزرو — همان چیزی که گام «ساعت» رزرو نمایش می‌دهد. */
export interface TimeSlot {
  start: ISODateTime
  end: ISODateTime
  employeeId?: EntityId
  isAvailable: boolean
}

/**
 * چرا اسلاتی نیست؟ «تعطیل» و «پر شده» دو چیزند و UI باید فرقشان را بگوید
 * (حالت خالیِ بی‌توضیح، همان چیزی است که نمی‌خواهیم).
 */
export type DayAvailabilityStatus =
  /** دست‌کم یک اسلات آزاد */
  | 'available'
  /** پنجرهٔ کاری دارد، ولی همه‌اش رزرو شده */
  | 'fully-booked'
  /** کسب‌وکار (یا پرسنل انتخابی) در این روز تعطیل است */
  | 'closed'
  /** هنوز ساعات کاری این کسب‌وکار تنظیم نشده */
  | 'not-configured'
  /** امروز است و پنجرهٔ کاری گذشته */
  | 'past'
  /** سرویس/پرسنل غیرفعال یا بی‌رابطه — اصلاً رزرو تازه‌ای ساخته نمی‌شود */
  | 'unavailable'

export interface AvailabilityQuery {
  businessId: EntityId
  /** تاریخ محلی کسب‌وکار: `YYYY-MM-DD` */
  date: string
  employeeId?: EntityId | null
  serviceId?: EntityId | null
}

export interface DayAvailability {
  date: string
  status: DayAvailabilityStatus
  /** فقط اسلات‌های قابل‌رزرو — UI «پر شدن» را با `status` می‌فهمد، نه با فیلتر دستی */
  slots: TimeSlot[]
  /** پنجرهٔ کاری همان روز (برای توضیح صادقانه: «۰۹:۰۰ تا ۱۸:۰۰ باز است») */
  window: AvailabilityInterval[]
  /** توضیح فارسی آماده برای حالت‌های غیرِ available */
  message: string | null
}

/** پاسخ دسته‌ای گام «تاریخ» — یک درخواست برای کل نوار ۱۴ روزه. */
export interface DateAvailabilityEntry {
  date: string
  status: DayAvailabilityStatus
  hasAvailableSlots: boolean
}
