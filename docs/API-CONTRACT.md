# قرارداد اتصال بک‌اند — انتظارات روشنِ فرانت‌اند (فاز ۱۲)

این سند **آرزونامه نیست**: هر سطرش چیزی است که کدِ امروزِ `app/` واقعاً می‌خواند یا
می‌فرستد. فاز ۱۲ هیچ endpoint تازه‌ای اختراع نکرد و هیچ مسیر تازه‌ای به UI اضافه
نکرد؛ فقط انتظارات پراکنده‌ای که در کامنت سرویس‌ها و state های mock زندگی
می‌کردند را یک‌جا و صریح نوشت تا روزِ اتصال AdonisJS، «حدس» ردیفی باقی نماند.

> قانون: اگر این سند و کد اختلاف داشتند، **کد** مرجع است و سند اصلاح می‌شود — نه
> برعکس. تنها نقطهٔ اتصال، `app/services/index.ts` است (`NUXT_PUBLIC_API_MODE`).

**ستون «نشانی پیشنهادی»** = همان نشانی که در docblock خودِ سرویس ثبت شده
(`app/services/**/*.ts`). هنوز با بک‌اند **تأیید نشده** است؛ در فرانت هیچ‌جا
hard-code نشده (فقط `config.public.apiBaseUrl` + مسیر نسبی). اگر بک‌اند مسیر
دیگری داشت، تنها جای تغییر، کلاس `ApiXService` است.

---

## ۱. قوانین مشترک (همهٔ دامنه‌ها)

| مفهوم | قرارداد فعلی فرانت |.note |
| --- | --- | --- |
| شناسه‌ها | `EntityId = string`، رشتهٔ پایدار و opaque. هیچ کلید عددی/دیتابیسی انتظار نمی‌رود | بک‌اند می‌تواند ULID/UUID بدهد؛ UI هرگز آن را تجزیه یا رتبه‌بندی نمی‌کند |
| مبلغ | `Toman = number` (عدد صحیح، تومان) | قالب‌بندی و «ریال/تومان» وظیفهٔ UI است، نه سرویس |
| زمان | `ISODateTime = string` — ISO‑8601 با offset | ساعت کاری و پنجرهٔ رزرو **به وقت محلی کسب‌وکار** محاسبه می‌شود؛ تبدیل بر عهدهٔ سرویس است نه UI |
| صفحه‌بندی | `Paginated<T> = { items, total, page, perPage }` | هر خواندنی که امروز آرایهٔ ساده برمی‌گرداند، در §۷ به‌عنوان شکاف ثبت شده |
| وضعیت بارگذاری | `LoadStatus = 'idle' \| 'loading' \| 'ready' \| 'error'` | سه‌تاییِ `pending/error/data` در کامپوننت‌ها از همین واژگان می‌آید |
| `null` | «رکورد نیست / پاک شد» — حالت خالی واقعی | UI آن را با `AppEmptyState` نشان می‌دهد، نه با اسکلت ابدی |
| `undefined` | «پاسخ داده نشد / دست‌نخورده بماند» | در ورودی نوشتن یعنی «این فیلد را عوض نکن» (`updateProfile.avatarUrl`) |
| خطای خواندن | `throw ServiceError({ statusCode, message, code? })` | پیام **فارسی و کاربرپسند** است؛ متن فنی/انگلیسی به UI نمی‌رسد |
| خطای نوشتن (رزرو) | `{ success: false, error: { code, message } }` | این اتحادیه عمداً `throw` نیست تا گام‌های فرم بتوانند روی `code` شاخه بزنند (برگشت به گام ساعت در `SLOT_UNAVAILABLE`) |

> ⚠️ **یکسان‌سازی پیشنهادی برای بک‌اند:** دو سبک خطا (throw برای خواندن / union برای
> نوشتن) عمدی است ولی هزینهٔ ترجمه دارد. اگر بک‌اند برای همه‌چیز بدنهٔ
> `{ error: { code, message, field? } }` با status code برگرداند، فرانت فقط در
> لایهٔ `Api*Service` ترجمه می‌کند و UI دست‌نخورده می‌ماند.

---

## ۲. وضعیت HTTP → رفتار فرانت (یک استراتژی، یک مجموعه UI)

| وضعیت | بدنهٔ مورد انتظار | کاری که فرانت می‌کند | کامپوننت |
| --- | --- | --- | --- |
| `2xx` | payload سند‌شده در §۳ | رندر داده | — |
| `400` / `422` | `{ error: { code: 'VALIDATION_ERROR', message, field? } }` | پیام زیر همان فیلد؛ اگر `field` بود، کاربر به گام/فیلد مربوط می‌رود | `WqInput` / `WqTextarea` hint، `AppErrorState` برای موارد کلی |
| `401` | — | پاک‌سازی **مرکزی** نشست (`clearLocalSession`) + هدایت به `/login` با پیام واحد؛ هیچ صفحه‌ای خودش کوکی را پاک نمی‌کند | `useAuthRecovery` |
| `403` | `{ error: { code: 'FORBIDDEN', message } }` | «دسترسی ندارید» + بازگشت به خانهٔ همین حالت — نه فهرست خالی (فرق «نداری» و «نباید ببینی» باید بماند) | `OwnerAccessState` |
| `404` روی شناسهٔ مسیر | — | `app/error.vue` با متن «پیدا نشد» (۴۰۴ ≠ ۵۰۰) | `app/error.vue` |
| `404`/`null` روی رکورد درخواستی | `null` | حالت خالیِ همان صفحه با مقصد بعدی | `AppEmptyState` |
| `409` | `{ error: { code: 'SLOT_UNAVAILABLE' \| 'PRICE_CHANGED', ... } }` | بازگشت به گامِ تصمیم + توضیح در همان گام (نه فقط toast) | `booking/index.vue` |
| `429` | `{ error: { retryAfter?: number } }` | «کمی صبر کنید» + غیرفعال‌کردن دکمه تا `retryAfter` (امروز: فقط پیام عمومی) | `useAsyncAction` |
| `5xx` | دلخواه | `AppErrorState` با «تلاش مجدد»؛ فرم‌های باز **پاک نمی‌شوند** | `AppErrorState` |
| timeout / آفلاین | — | تشخیص با `useNetworkStatus` → `AppOfflineBanner` سراسری و `AppOfflineState` در صفحه؛ دادهٔ قبلی روی صفحه می‌ماند و کاربر «دادهٔ کهنه» را از «خطا» تشخیص می‌دهد | `states/*` |

---

## ۳. قراردادهای دامنه‌به‌دامنه

### ۳.۱ `auth` — `AuthService`

| متد | ورودی | خروجی | خطاها/نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `requestOtp` | `phone: string` | `{ requestId, expiresIn, devCode? }` | `expiresIn` سوای تایمر صفحه است؛ `devCode` **فقط mock** و باید در حالت api حذف شود (بک‌اند هیچ‌وقت کد را به کلاینت نمی‌دهد) | `POST /auth/request-otp` |
| `verifyOtp` | `{ phone, code, requestId }` | `AuthSession` | کد اشتباه → `400` با پیام واحد؛ نشست شامل `accessToken` است که UI آن را **نمی‌خواند** (فقط عبور می‌دهد) | `POST /auth/verify-otp` |
| `getCurrentSession` | — | `AuthSession \| null` | `null` = «وارد نشده» (حالت عادی)، خطا = `401`. تفکیک این دو برای `useAuthRecovery` حیاتی است | `GET /auth/me` |
| `logout` | — | `void` | سمت بک‌اند هم توکن را باطل کند؛ فرانت کوکی/state را پاک می‌کند | `POST /auth/logout` |
| `clearLocalSession` | — | `void` | بدون تماس شبکه؛ پاسخ `401` از هر سرویس کاربر-محور همین را صدا می‌زند | — |
| `replaceSessionUser` | `AppUser` | `void` | بعد از ویرایش پروفایل، snapshot نشست تازه می‌شود؛ در api کافی است `GET /auth/me` را به‌روز نگه دارید | — |

### ۳.۲ `users` — `UserService`

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `getProfile` | — | `AppUser` | بدون نشست → `401`. شماره تلفن در UI **فقط‌خواندنی** است (تغییر شماره جریان امنیتی جدا دارد) | `GET /auth/me` |
| `updateProfile` | `{ firstName?, lastName?, avatarUrl? }` | `{ user, avatarPersisted }` | `avatarUrl: null` = حذف آواتار؛ `undefined` = دست‌نخورده. `avatarPersisted: false` امروز یعنی «فقط پیش‌نمایش همین نشست» و UI صادقانه می‌گوید؛ با آپلود واقعی همیشه `true` شود | `PATCH /auth/me` |

اعتبار ورودی: `firstName`/`lastName` از `app/utils/validation.ts` (حداقل ۲، حداکثر
`nameMaxLength`، بدون رقم/کاراکتر عجیب). **اعتبارسنجی فرانت UX است، نه امنیتی** —
بک‌اند باید همان قواعد را مستقل اعمال کند (§۸).

### ۳.۳ `businesses` — `BusinessService` (کشف و جزئیات)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `list` | `{ search?, categoryId?, page?, perPage? }` | `Paginated<Business>` | **`sort` ندارد**: مرتب‌سازی امروز سمت کلاینت روی همان صفحه انجام می‌شود (§۷-۲). `search` روی نام و دسته‌بندی معنا دارد | `GET /businesses` |
| `getById` | `EntityId` | `Business \| null` | `null` → حالت «پیدا نشد» با لینک کشف، نه صفحهٔ سفید | `GET /businesses/:id` |
| `listCategories` | — | `BusinessCategory[]` | `{ id, slug, name, icon }` — `icon` نام آیکون lucide است؛ اگر بک‌اند نام دیگری می‌دهد، لایهٔ سرویس نگاشت کند | `GET /categories` |
| `listFeatured` / `listPopular` | — | `Business[]` | انتخاب «ویژه/محبوب» سیاست بک‌اند است؛ امروز seed ثابت است | `GET /businesses/featured` · `/businesses/popular` |
| `listNearby` | — | `BusinessWithDistance[]` | `distanceKm` محاسبه‌شده؛ با لوکیشن واقعی، مختصات کاربر باید از مجوز دستگاه بیاید (§۷-۶) | `GET /businesses/nearby` |
| `listServices` | `businessId` | `BookableService[]` | فقط خدمات **فعال**؛ فیلتر وضعیت وظیفهٔ سرویس است نه UI | `GET /businesses/:id/services` |
| `getServiceForHistory` | `serviceId` | `BookingServiceSnapshot \| null` | برخلاف بالاتر، بدون فیلتر «فعال» — رسیدِ مشتری نباید بعد از حذف سرویس بی‌نام شود | `GET /services/:id/history-snapshot` |
| `listEmployees` | `businessId` | `BookableEmployee[]` | نمای **قابل‌رزرو**: `phone` و `userId` عملاً در پاسخ نباشد (امروز در نمای UI هم نیست) | `GET /businesses/:id/employees` |
| `getEmployeeForHistory` | `employeeId` | `BookingEmployeeSnapshot \| null` | مثل `getServiceForHistory` برای پرسنل حذف‌شده/غیرفعال | `GET /employees/:id/history-snapshot` |

### ۳.۴ `availability` — `AvailabilityService` (خواندن دسترس‌پذیری)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `getDayAvailability` | `AvailabilityQuery { businessId, date, employeeId?, serviceId? }` | `DayAvailability { date, status, slots, window, message }` | `slots` فقط اسلات‌های **قابل‌رزرو**؛ «چرا نیست» در `status` است (۶ مقدار، §۴) و `message` متن فارسی آمادهٔ حالت خالی است. `window` برای جملهٔ صادقانهٔ «۰۹:۰۰ تا ۱۸:۰۰ باز است» | `GET /businesses/:id/availability?date=YYYY-MM-DD&serviceId=&employeeId=` |
| `getDateAvailability` | `businessId, dates[], { serviceId?, employeeId? }` | `DateAvailabilityEntry[]` | یک درخواست دسته‌ای برای کل نوار ۱۴ روزه — از بک‌اند هم **batch** می‌خواهیم تا ۱۴ request نزند | `GET /businesses/:id/availability/range?from=&to=` |
| `getSlots` | `businessId, date, employeeId?, serviceId?` | `TimeSlot[]` | متد سطح‌پایین؛ صفحه‌ها از `getDayAvailability` استفاده می‌کنند (پاسخ‌های `isAvailable: false` را UI فیلتر نمی‌کند) | `GET /businesses/:id/slots` |

قاعدهٔ مهم: **اعتبار نهایی ساعت، موقع ثبت است** (`bookings.validateDraft` +
`create`). `status: 'available'` در لحظهٔ نمایش، رزرو را تضمین نمی‌کند؛ بک‌اند باید
در `POST /bookings` دوباره بسنجد و در صورت رقابت، `SLOT_UNAVAILABLE` بدهد.

### ۳.۵ `bookings` — `BookingService` (رسمی‌ترین دامنه)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `listMine` | `scope?: 'upcoming' \| 'past'` | `Booking[]` | `upcoming` نزدیک‌ترین‌اول، `past` جدیدترین‌اول. آرایه صفحه‌بندی‌نشده است (§۷-۱). «غنی‌سازی نام‌ها» امروز در `useCustomerBookings` با نگاشت مشترک انجام می‌شود؛ اگر بک‌اند `BookingWithDetails` برگرداند، همان‌جا حذف می‌شود | `GET /bookings/mine?scope=` |
| `getById` | `EntityId` | `Booking \| null` | **مالکیت در سرویس**: نوبتِ حسابِ دیگر → `null` (نه `403`)؛ UI همان حالت خالی را نشان می‌دهد | `GET /bookings/:id` |
| `validateDraft` | `CreateBookingRequest` | `{ valid, errors[], warnings[] }` | هشدارها قبل از تأیید نمایش داده می‌شوند (تغییر قیمت، پر شدن ساعت، عوض‌شدن پرسنل)؛ `errors[].field ∈ business\|service\|employee\|date\|timeSlot` شاخهٔ بازگشت به گام را می‌سازد | `POST /bookings/validate` |
| `create` | `CreateBookingRequest` | `{ success: true, bookingId }` \| `{ success: false, error: { code: SLOT_UNAVAILABLE \| PRICE_CHANGED \| VALIDATION_ERROR \| SERVER_ERROR, message, suggestedPrice? } }` | `suggestedPrice` به کاربر پیشنهاد می‌شود و **تصمیم با کاربر** است (امضای قدیمی `price` در درخواست، نسخهٔ دوم را می‌سازد) | `POST /bookings` |
| `cancel` | `{ bookingId, reason? }` | `{ success: true, message }` \| `{ success: false, error: { code: BOOKING_NOT_FOUND \| ALREADY_CANCELLED \| PAST_BOOKING \| POLICY_VIOLATION \| SERVER_ERROR, message } }` | `reason` اختیاری است (متن آزاد یا یکی از ۵ برچسب، §۴). سیاست زمانی از `app/config/booking-policy.ts` (`cancelMinMinutesBeforeStart = 120`) می‌آید و **بک‌اند هم باید همان را اعمال کند**؛ اگر سیاست هر کسب‌کار متفاوت است، پاسخ از `GET /businesses/:id` یا `GET /bookings/:id/policy` بیاید (§۷-۳) | `POST /bookings/:id/cancel` |
| `reschedule` | `{ bookingId, newStart, newEnd }` | `{ success: true, booking }` \| `{ success: false, error: { code: BOOKING_NOT_FOUND \| NOT_RESCHEDULABLE \| SLOT_UNAVAILABLE \| TIME_IN_PAST \| SERVER_ERROR, message } }` | **درجا** جابه‌جا می‌شود: «لغوِ نوبتِ کهنه + ساخت نوبتِ تازه» قبول نیست و بازگشت `booking` تازه لازم است تا UI بدون reload به‌روز شود. افق جابه‌جایی امروز ۱۴ روز است (`rescheduleHorizonDays`) | `POST /bookings/:id/reschedule` |
| `resetLocalChanges` | — | `void` | **فقط ابزار dev** (پاک‌کردن کوکی delta). در حالت api معنا ندارد و در `ApiBookingService` پیاده نمی‌شود — اگر لازم شد، همین متد را از `AppServices` بیرون بکشید (§۷-۹) | — |

### ۳.۶ `favorites` — `FavoriteService`

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `listMine` | — | `SavedBusiness[]` | `{ business, savedAt }`؛ مرتب‌سازی جدیدترین‌اول وظیفهٔ سرویس است. صفحه‌بندی ندارد (§۷-۱) | `GET /favorites` |
| `toggle` | `businessId` | `boolean` (اکنون نشان‌شده؟) | عملیات باید **idempotent** باشد (دابل‌تپ/تازه‌سازی). کسب‌وکار حذف‌شده در فهرست بماند یا نه؟ سیاست پیشنهادی: حذف نرم + برچسب «غیرفعال» | `POST /favorites/:businessId` · `DELETE /favorites/:businessId` |
| `isSaved` | `businessId` | `boolean` | کارت‌های فهرست نباید برای هر ردیف یک درخواست بزنند؛ `listMine` یا فیلد `isFavorite` روی `Business` ارجح است (§۷-۴) | `GET /favorites/:businessId` |

### ۳.۷ `notifications` — `NotificationService`

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `listMine` | — | `AppNotification[]` | `{ id, type, title, body, isRead, actionUrl?, createdAt }`؛ `actionUrl` مسیر **داخلی** فرانت است، نه لینک مطلق | `GET /notifications` |
| `unreadCount` | — | `number` | امروز جدا از فهرست خوانده می‌شود؛ با یک فیلد `unreadCount` روی همان پاسخ، یک request کم می‌شود (§۷-۵) | `GET /notifications/unread-count` |
| `markRead` | `id` | `void` | idempotent؛ «خواندن همه» هم اگر لازم شد به همین interface اضافه می‌شود | `POST /notifications/:id/read` |

### ۳.۸ `reviews` و `chat` (فقط‌خواندنی، هنوز UI کامل ندارند)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `reviews.listForBusiness` | `businessId` | `Review[]` | `rating: 1..5` عدد صحیح؛ `text?` اختیاری؛ `reply?` پاسخ کسب‌وکار. ثبت نظر در فرانت **رشته نشده** است، پس بک‌اند فعلاً فقط `GET` را لازم دارد | `GET /businesses/:id/reviews` |
| `chat.listConversations` | — | `ChatConversation[]` | `{ businessId, customerId, bookingId?, unreadCount, lastMessageAt? }` | `GET /chat/conversations` |
| `chat.listMessages` | `conversationId` | `ChatMessage[]` | `status: 'sent' \| 'delivered' \| 'read'`؛ نوشتن پیام هنوز در UI نیست | `GET /chat/conversations/:id/messages` |

### ۳.۹ `avatars` — `AvatarService` (استراتژی، نه ذخیره‌سازی)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `listPresets` | — | `AvatarPreset[]` | آواتارهای آمادهٔ mock؛ با بک‌اند احتمالاً حذف می‌شود | — |
| `previewFile` | `File` | `{ url, fileName, persistable }` | امروز `dataURL` محلی؛ `persistable: false` همان چیزی است که UI را صادق نگه می‌دارد | — |
| `persist` | `userId, url \| null` | `{ url, persisted }` | جای واقعی‌اش **`multipart/form-data` با کلید `avatar`** است: فرانت `File` را به `updateProfile` نمی‌فرستد؛ یک `POST /users/me/avatar` + برگرداندن `url` پایدار لازم است (§۷-۷) | `POST /users/me/avatar` |
| `displayUrl` | `userId, storedUrl \| null` | `string \| null` (همگام) | تنها جای «اگر URL شکست، چه نشان دهیم»؛ `WqAvatar` هم `onerror` دارد (§۳۰) | — |

### ۳.۱۰ `owner` — فضای کاری مدیر

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `listOwnedBusinesses` | — | `OwnedBusiness[]` | منبع واحد «کسب‌وکارهای من»؛ اگر کاربر هیچ کسب‌وکاری نداشت، `OwnerNoBusinessState` (حالت خالی، نه خطا) | `GET /owner/businesses` |
| `getOwnedBusiness` | `businessId` | `OwnedBusiness` (throw اگر دسترسی نبود) | **۴۰۳ و ۴۰۴ را جدا نگه دارید**؛ فرانت اولی را «دسترسی ندارید» و دومی را «پیدا نشد» نشان می‌دهد | `GET /owner/businesses/:id` |
| `getDashboard` | `businessId` | `OwnerDashboard` | شامل شمارش‌های امروز/فردا/تأییدمنتظر/امتیاز و لیست کوتاه نوبت‌ها | `GET /owner/businesses/:id/dashboard` |

### ۳.۱۱ `serviceManagement` / `employeeManagement` (چرخهٔ حیات، فاز ۹ و ۱۰)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `list` | `businessId` | `ManagedService[]` / `ManagedEmployee[]` | نمای مدیریتی شامل `liveBookingCount`، `bookingCount`، `deletePolicy` — **بک‌اند باید این سه را در همان پاسخ بدهد**، وگرنه حذف‌کردن در UI غیرقابل‌اعتماد است | `GET /owner/businesses/:id/services` (· `/employees`) |
| `get` | `businessId, id` | رکورد یا `throw 404/403` | — | `GET .../:id` |
| `create` | `ServiceInput` / `EmployeeInput` | رکورد تازه | قواعد از `app/utils/validation.ts`؛ `durationMinutes` مضرب ۱۵ و `price ≥ 0`؛ بک‌اند دوباره بسنجد | `POST ...` |
| `update` | `id, input` | رکورد تازه | `input` کامل است (PUT معنایی، نه PATCH جزئی) | `PATCH .../:id` |
| `setStatus` | `id, 'active' \| 'inactive'` | رکورد تازه | غیرفعال‌کردن ≠ حذف: از فهرست مشتری می‌رود و در تاریخچه می‌ماند | `PATCH .../:id/status` |
| `remove` | `id` | `void` (throw اگر مسدود) | اگر `deletePolicy.canDelete` false است، UI دکمه را با توضیح غیرفعال می‌کند؛ در صورت رقابت (نوبت تازه‌شده) `409` با `message` فارسی | `DELETE .../:id` |
| `employee.assignServices` | `employeeId, serviceIds[]` | رکورد تازه | **جای‌گزینی کامل** مجموعه (نه add/remove) | `PUT .../:id/services` |
| `resetLocalChanges` | — | `void` | فقط dev (§۳.۵) | — |

### ۳.۱۲ `availabilityManagement` (برنامهٔ هفته، فاز ۱۱)

| متد | ورودی | خروجی | نکات | نشانی پیشنهادی |
| --- | --- | --- | --- | --- |
| `getBusiness` | `businessId` | `BusinessScheduleView` | `days[]` هفت‌شنبه‌محور (`saturday → friday`)، با `enabled` و `intervals[]` | `GET /owner/businesses/:id/availability` |
| `saveBusiness` | `businessId, days[]` | `BusinessScheduleView` | **کل هفته یکجا** نوشته می‌شود (ذخیرهٔ اتمی، نه روزبه‌روز). بازه‌ها `HH:mm`، `start < end`، بدون هم‌پوشانی، بدون عبور از نیمه‌شب | `PUT /owner/businesses/:id/availability` |
| `listEmployees` | `businessId` | `EmployeeScheduleSummary[]` | شامل `source: 'business-default' \| 'custom'` و خلاصهٔ قابل‌خواندن | `GET .../availability/employees` |
| `getEmployee` | `businessId, employeeId` | `EmployeeScheduleView` | — | `GET .../availability/employees/:id` |
| `saveEmployee` | `businessId, employeeId, ScheduleInput` | `EmployeeScheduleView` | `source` مشخص می‌کند برنامه از کسب‌وکار میراث است یا دستی | `PUT .../availability/employees/:id` |
| `resetEmployeeToBusinessDefault` | `businessId, employeeId` | `EmployeeScheduleView` | «بازگشت به برنامهٔ کسب‌وکار»؛ پاک‌کردن `custom`، نه کپی کردن بازه‌ها | `DELETE .../availability/employees/:id/override` |

---

## ۴. دیکشنری واژگان وضعیت (یک‌دانه در کل سامانه)

| واژه | مقدارها | که مصرفش می‌کند |
| --- | --- | --- |
| `BookingStatus` | `pending` · `confirmed` · `completed` · `cancelled` · `no_show` | نگاشت مرکزی `utils/booking-status.ts` → برچسب فارسی + آیکون + رنگ توکنی. `no_show` را **بک‌اند** ثبت می‌کند؛ فرانت هیچ‌وقت خودش به آن نمی‌رساند |
| «نوبت زنده» | `isLiveBooking()` = `pending \| confirmed` | دکمه‌های لغو/جابه‌جایی و `deletePolicy` از همین تابع می‌آیند — نه از مقایسهٔ رشته در کامپوننت |
| `BookingCancelledBy` | `customer` · `business` · `employee` | چه کسی لغو کرد؛ در جزئیات نوبت با متن فارسی نمایش داده می‌شود |
| دلیل لغو | `late` · `changed-mind` · `found-elsewhere` · `emergency` · `other` | `BOOKING_CANCEL_REASONS`؛ روی سیم `reason?: string` است (متن آزاد هم قبول است) |
| `ServiceStatus` / `EmployeeStatus` | `active` · `inactive` | فیلتر «قابل‌رزرو» در سرویس، نه در UI |
| `DayAvailabilityStatus` | `available` · `fully-booked` · `closed` · `not-configured` · `past` · `unavailable` | «تعطیل» و «پر» دو چیزند؛ هر کدام متن و آیکون خودش را در `BookingDateSelect`/`BookingTimeSelect` دارد |
| `Weekday` | `saturday … friday` | تقویم هفت‌شنبه‌محور؛ تبدیل نام فارسی در `utils/fa-calendar.ts` |
| `ScheduleSource` | `business-default` · `custom` | همین دو مقدار، «کپی‌شدن تصادفی برنامهٔ کسب‌وکار» را غیرممکن می‌کند |
| `UserMode` | `customer` · `business` · `employee` | **حالت، نه نقشِ ثابت**: از `capabilities` کاربر ساخته می‌شود؛ `role=customer` هیچ‌جا حقیقت نیست |
| `UserCapability` | `{ kind: 'customer' }` · `{ kind: 'owner', businessId }` · `{ kind: 'employee', businessId, employeeId }` | یک کاربر، چند قابلیت؛ مالکیت و دسترسی از همین‌جا سنجیده می‌شود |
| `NotificationType` / `MessageStatus` | `booking_*`… / `sent · delivered · read` | آیکون و رنگ از نگاشت مرکزی |
| `BookingValidationError.field` | `business · service · employee · date · timeSlot` | تنها چیزی که فرانت برای «برگشت به گام درست» لازم دارد |

---

## ۵. کارهایی که mock امروز «درمی‌کشد» و بک‌اند باید جاروب کند

| # | رفتار mock | چه‌جاست | روز اتصال |
| --- | --- | --- | --- |
| ۱ | نشست = کوکی `wq_session` با `accessToken` جعلی | `services/mocks/session.ts` | `HttpOnly` cookie یا `Authorization: Bearer`؛ فرانت دیگر توکن را در JS نمی‌خواند (§۴۹) |
| ۲ | کد OTP ثابت `1234` + برگرداندن `devCode` | `runtimeConfig.public.mockOtpCode`, `MockAuthService` | حذف کامل مسیر `devCode`؛ پیام واقعی؛ محدودیت تعداد درخواست → `429` |
| ۳ | نوشتن در کوکی delta: `wq_business_services`, `wq_business_employees`, `wq_business_availability`, `wq_business_bookings` (+ `wq_user_data` برای نشان‌شده‌ها/پروفایل) | `services/mocks/*-state.ts` | هر چهارتا حذف؛ کش محلی با `useState`/Query cache جایگزین می‌شود، نه نوشتن در کوکی |
| ۴ | `delay()` تصادفی برای حس شبکه | `services/mocks/delay.ts` | حذف؛ زمان واقعی پاسخ، اسکلت‌ها را می‌سنجد |
| ۵ | seed های ثابت `services/mocks/*` (`SEED_BOOKINGS`, `MOCK_BUSINESSES`, …) | `services/mocks/` | fixtureهای dev می‌مانند برای `dev/design` ولی از مسیر تولید بیرون‌اند |
| ۶ | آواتار = `dataURL` محلی با `persistable: false` | `MockAvatarService` | `multipart` واقعی + URL پایدار؛ `avatarPersisted` همیشه `true` |
| ۷ | فاصلهٔ «نزدیک من» عدد ساختگی است | `listNearby` | مختصات کاربر + فاصلهٔ مسیر/خط مستقیم، طبق مجوز دستگاه |
| ۸ | سیاست لغو عدد ثابت است (۱۲۰ دقیقه، افق ۱۴ روز) | `config/booking-policy.ts` | عدد از کسب‌وکار بیاید؛ فایل config فقط fallback باشد (§۷-۳) |
| ۹ | `resetLocalChanges()` روی چهار سرویس | `AppServices` | حذف از interface (فقط ابزار dev) |

هیچ‌کدام از این‌ها در UI نشت نکرده‌اند؛ پس «غیرفعال‌کردن mock» یک تصمیم در
`createServices()` است، نه جست‌وجو در ۶۰ فایل (§۵۴).

---

## ۶. آنچه **عمداً** ساخته نشده (که اتصال، UI نمی‌سازد)

- هیچ `useFetch`/`$fetch` در صفحه‌ها نیست؛ همه‌چیز از `useServices()` می‌آید (§۱۸).
- لایهٔ `Api*Service` وجود ندارد: `NUXT_PUBLIC_API_MODE=api` عمداً خطای راهنما دارد
  تا کسی فکر نکند «حالت api کار می‌کند».
- صفحهٔ «مصرف‌کنندهٔ نوبت‌ها» برای پرسنل (`employee/*`) placeholder است — فاز ۱۲
  ساخت اپ پرسنلی نبود.
- نظرسنجی/چت فقط خواندن سرویس دارند؛ فرم ثبت نظر و فرستادن پیام هنوز در UI نیست.
- کش آفلاین و صفِ ارسال، ساخته نشده (کاربرد خواسته‌شده نبود؛ فقط «شفافیت وضعیت
  اتصال» پیاده شد).

---

## ۷. دوازده موردی که باید **قبل از اتصال** روشن/تصمیم شود

1. **صفحه‌بندی فهرست‌های کاربر-محور** — `bookings.listMine`, `favorites.listMine`,
   `notifications.listMine`, `reviews.listForBusiness` آرایهٔ بدون `total` برمی‌گردانند؛
   با دادهٔ واقعی به `Paginated<T>` تبدیل شوند (قرارداد §۳۱).
2. **مرتب‌سازی سمت سرویس** — `BusinessListQuery` عمداً `sort` ندارد و `useSearch`
   روی همان صفحهٔ ۵۰تایی مرتب می‌کند؛ نتیجه: «محبوب‌ترین» می‌تواند در صفحهٔ ۲ جا
   بماند. یا `sort` به سرویس اضافه شود یا UI فقط «مرتب‌سازی همین نتایج» بگوید.
3. **منبع سیاست لغو/جابه‌جایی** — امروز `app/config/booking-policy.ts` عدد ثابت دارد
   و همه‌چیز (UI، سرویس، شیت) از همان می‌خواند. سؤال: سراسری است یا هر
   کسب‌وکار جدا؟ اگر جدا، `GET /businesses/:id/booking-policy` لازم است.
4. **`isSaved` ردیف‌به‌ردیف** — یا `isFavorite` روی `Business` بیاید یا `listMine`
   منبع تنها بماند (درخواست N+1 ندهیم).
5. **`unreadCount` جدا** — با فیلد روی `GET /notifications`، یک رفت‌وبرگشت کم می‌شود.
6. **موقعیت جغرافیایی** — `listNearby` امروز بی‌مجوز کار می‌کند؛ با مرورگر/اندروید،
   درخواست مجوز و مسیر «بدون مجوز چه نشان دهیم» باید تعریف شود.
7. **آپلود آواتار** — محدودیت نوع/حجم و محل برش تصویر؛ پاسخ باید URL پایدار بدهد.
8. **رقابت روی ساعت (double booking)** — منبع حقیقت `POST /bookings` است؛ کد
   `SLOT_UNAVAILABLE` باید با `alternativeSlots?` هم غنی شود تا UI بتواند پیشنهاد
   بدهد (فعلاً فقط به گام ساعت برمی‌گردیم).
9. **`resetLocalChanges`** — از `AppServices` بیرون برود تا ابزار dev با قرارداد
   تولید قاطی نشود.
10. **۴۰۱ در برابر ۴۰۳ در `getById` نوبت** — امروز «نوبتِ دیگری» → `null`
    (حالت خالی). اگر بک‌اند ۴۰۳ داد، لایهٔ سرویس باید همان را به `null` برگرداند تا
    UI عدد اطلاعاتی لو ندهد.
11. **زمان/منطقهٔ زمانی** — همه‌چیز ISO با offset است و UI به وقت تهران نمایش می‌دهد؛
    بک‌اند باید «تاریخ محلی کسب‌وکار» (برای روز تعطیل و پنجرهٔ کاری) را خودشان نگه
    دارند، نه اینکه فرانت حدس بزند.
12. **رویدادهای واقعی (web push / SSE)** — `notifications` امروز pull است؛ اگر
    اعلان لحظه‌ای خواسته شد، `NotificationService` به همان شکل می‌ماند و فقط منبع
    داده عوض می‌شود.

---

## ۸. مرز امنیت (تا روز اتصال، بدون استثنا)

- اعتبارسنجی فارسی در `app/utils/validation.ts` برای **تجربهٔ کاربر** است؛ هیچ قاعده‌ای
  را به آن واگذار نکنید: همان قواعد باید سمت بک‌اند اجرا شود (مدت سرویس، بازهٔ
  دسترس‌پذیری، مالکیت، سیاست لغو، «ساعت در گذشته»).
- توکن، شناسهٔ داخلی، شمارهٔ تماس پرسنل و `ownerUserId` هیچ‌وقت در نمای مشتری نمایش
  داده نمی‌شوند؛ `BookableEmployee` عمداً این‌ها را ندارد — بک‌اند هم در همان
  endpoint برندارد (نه اینکه UI سانسور کند).
- `mockOtpCode` فقط `public` است چون **dev** است؛ با بک‌اند واقعی، رمز دوم، OTP و
  کلیدهای API هرگز در `runtimeConfig.public` ننشینند.
- کد native (دکمهٔ بازگشت Android) پشت `app/services/native/system-back.ts` است و
  `@capacitor/app` را داخل `try` اختیاری بارگذاری می‌کند؛ هیچ وابستگی native در
  `package.json` نیست (§۵۱).
