# معماری وقتی‌نو — سند زیرساخت (فاز ۰)

این سند مرجع فازهای بعدی است. تصمیم‌های اینجا بدون دلیل قوی تغییر نمی‌کنند.

## ۱. لایه‌ها و جهت وابستگی

```
app/pages/*            صفحات (نازک؛ فقط ترکیب‌بندی)
   ↓
app/components/*       کامپوننت‌ها (UI) — بدون منطق داده
   ↓
app/composables/*      منطق feature + وضعیت مشترک
   ↓
app/services/*         قراردادها + پیاده‌سازی mock/api  «تنها دروازهٔ داده»
   ↓
(mock) ← فاز ۰ ... بعداً → بک‌اند AdonisJS
```

قوانین سخت:

- صفحات/کامپوننت‌ها **هرگز** مستقیم `$fetch` نمی‌زنند و به mock دسترسی ندارند.
- دسترسی به داده فقط با `useServices()` → `$services` (پلاگین `01.services.ts`).
- انتخاب mock یا API واقعی فقط در `app/services/index.ts` رخ می‌دهد
  (`NUXT_PUBLIC_API_MODE`). تعویض mock→api هیچ تغییری در UI نمی‌خواهد.
- خطاها به‌صورت `ServiceError` (با پیام فارسی) از سرویس بیرون می‌آیند؛ UI هیچ
  خطای فنی خام (`TypeError`، متن HTTP، کد وضعیت) نشان نمی‌دهد.
- `ServiceError` با `UNAUTHORIZED`/۴۰۱ فقط در یک نقطه مدیریت می‌شود:
  `useAuthRecovery.recover(error)` → پاک‌سازی نشست + اعلان فارسی +
  `/login?redirect=…`. صفحه‌ها تصمیم نمی‌گیرند «با ۴۰۱ چه کنم»؛ در حالت api هم
  همان مسیر کار می‌کند چون `Api*Service` پاسخ ۴۰۱ را به همین شکل نگاشت می‌کند.
- اعتبارسنجی فقط در `app/utils/validation.ts` تعریف می‌شود. فرم آن را برای
  نمایش پیام‌ها صدا می‌زند و سرویس‌ها برای «دفاع دوم» — پس UI و بک‌اند آینده
  یک قاعده دارند، نه دو قاعده.
- هیچ کامپوننت/صفحه‌ای شیء mock را mutate نمی‌کند؛ هر نوشتن از
  `services.*` می‌گذرد. برای نمایش، وضعیت‌های مشترک در `useState` نگه داشته
  می‌شوند (منبع‌واحد‌حقیقت)، نه آرایهٔ محلی هر صفحه.
- فایل واقعی کاربر جایی بارگذاری نمی‌شود: آواتار پشت `AvatarService` است
  (mock: پیش‌نمایش محلی + آواتارهای آماده). نقطهٔ اتصال بک‌اند همین قرارداد است.

### محافظت مسیر (از فاز ۲)

`app/middleware/guard.global.ts` مبتنی بر route meta است:

| meta | رفتار |
| --- | --- |
| `access: 'guest'` | ورود/OTP؛ کاربر واردشده به فرود حالت فعلی هدایت می‌شود |
| `access: 'auth'` | مهمان → `/login?redirect=…` |
| `capability: 'business'\|'employee'` | فاقد قابلیت → فرود حالت معتبر + toast |

مقصد فرود هر حالت: `MODE_LANDING` در `app/config/navigation.ts`.
قانون حالت پیش‌فرض: `resolveDefaultMode()` در `app/composables/useUserMode.ts`
(ذخیره‌شدهٔ معتبر → مشتری → اولین قابلیت → مهمان/مشتری).

## ۲. سیستم طراحی و تم

```
app/assets/css/tokens.css   ── منبع واحد رنگ/ابعاد (هگز فقط اینجا)
        ↓ @theme  →  کلاس‌های brand-* / warm-*
        ↓ متغیرهای --ui-*  →  بازتعریف تم Nuxt UI (light/.dark)
app/app.config.ts           ── alias رنگ‌های معنایی: primary='brand', neutral='warm', ...
```

- **تغییر رنگ اصلی برند = ویرایش بلوک `--color-brand-*`** — نقطهٔ واحد تغییر.
- در کامپوننت‌ها فقط کلاس‌های معنایی (`bg-default`, `text-muted`, `border-default`,
  `bg-primary`, …) مجاز است؛ رنگ هگز در `.vue` ممنوع.
- دارک‌مود دستی طراحی شده (بلوک `.dark` در tokens.css)؛ با سیستم کاربر همگام است
  و از هدر قابل تغییر است.
- مدیر تم یکی است: `useThemePreference()` (سه گزینه: سیستم/روشن/تیره) که روی
  `@nuxtjs/color-mode` نوشته شده و ترجیح را در `localStorage` با کلید
  `wq-color-mode` نگه می‌دارد. هیچ صفحه‌ای state تم خصوصی ندارد و مکانیزم تم
  تازه‌ای برای فیچر جدید اختراع نمی‌شود؛ اسکریپت همان ماژول قبل از رندر اجرا
  می‌شود پس فلاش روشن/تیره (FOUC) نداریم.
- حالت‌های تعامل (hover/active/focus/disabled) و رنگ‌های معنایی باید در هر دو تم
  درست باشند — تغییر رنگ برند در `tokens.css` تنها نقطهٔ لازم است.
- تایپوگرافی فارسی به‌صورت utility معنایی: `t-display`, `t-page-title`,
  `t-section`, `t-heading`, `t-body`, `t-body-sm`, `t-secondary`, `t-caption`,
  `t-label`, `t-num`.
- آیکون‌های جهت‌دار با `dir-flip` یا انتخاب صریح نسخهٔ RTL (chevron-left به‌جای
  chevron-right در مسیر «جلو») رفتار می‌کنند.

## ۳. کاربر واحد و حالت‌ها (Modes)

```
AppUser
 └── capabilities: Array<customer | owner{businessId} | employee{businessId, employeeId}>
```

- احراز هویت متعلق به **کاربر** است، نه نقش. یک session/unit cookie واحد.
- `useUserMode()` حالت فعلی را از capabilities استخراج می‌کند، در کوکی
  `wq_mode` ماندگار می‌کند و `AppModeSwitcher` بین آن‌ها سوییچ می‌کند.
- ناوبری پایین فقط از `app/config/navigation.ts` تغذیه می‌شود؛ برای فعال‌سازی
  یک بخش در فاز بعدی، فقط `enabled: true` + `to` آن آیتم را ست کنید.

## ۴. احراز هویت توسعه (OTP جعلی)

- جریان واقعی حفظ می‌شود: `requestOtp` → `verifyOtp` → session.
- `MockAuthService` کد را از `NUXT_PUBLIC_MOCK_OTP_CODE` (پیش‌فرض `1234`)
  می‌خواند و نشست را در کوکی `wq_session` نگه می‌دارد.
- در UI فاز ۰، دکمهٔ «ورود آزمایشی» همان جریان را end-to-end طی می‌کند.
- با `API_MODE=api` همین composableها به سرویس واقعی وصل می‌شوند (سطح interface).

## ۵. ساختار پوشه‌ها

```
app/
  assets/css/        tokens.css (منبع واحد توکن)، main.css (تایپوگرافی/UTILITYها)
  components/
    app/             کروم اپ: AppHeader، AppBottomNavigation، AppModeSwitcher،
                     AppLogo، AppThemeToggle، AppPageHeader، AppBackHeader، AppStickyAction
    ui/              Wq* — کامپوننت‌های سیستم طراحی (دکمه، فرم، اورلی، نمایش داده)
    states/          AppLoadingState، AppEmptyState، AppErrorState، AppOfflineState
    settings/        SettingsSection، SettingsRow، SettingsInfoRow (آجرهای صفحهٔ تنظیمات)
    profile/         ProfileIdentity، ProfileAvatarEditor
    customer/        BusinessCard*، BusinessSaveToggle، اسکلت‌ها
    owner/           فضای کاری مدیر: هدر زمینه، سوییچر، نوبت بعدی، فهرست امروز،
                     شاخص‌ها، اکشن‌های سریع، کارت کسب‌وکار، حالت دسترسی/خالی، اسکلت‌ها
    search/ bookings/ business/ employee/  (کامپوننت‌های دامنه‌ای)
  composables/       useAuth، useUserMode، useServices، useAppToast،
                     useSavedBusinesses (منبع‌واحد‌حقیقت نشان‌شده‌ها)، useUserProfile،
                     useProfileForm، useProfileAvatar، useThemePreference،
                     useAuthRecovery، useLogout، useMockFlags، useAsyncAction،
                     useOwnerBusinesses / useBusinessContext / useOwnerDashboard /
                     useOwnerBusinessEntry (زمینه و دادهٔ فضای کاری)
  config/            navigation.ts، booking-status.ts، business-status.ts
                     (پیکربندی دامنه، auto-import)
  layouts/           default.vue (پوستهٔ موبایل؛ meta.tabbar)
  pages/             index.vue، saved.vue، profile(/edit).vue، settings.vue،
                     notifications.vue، booking*، business/[id] (جزئیات مشتری)،
                     owner/{index,businesses,business/[businessId]{,/info,/manage}}،
                     employee*، dev/design.vue (شوکیس + کلیدهای شبیه‌سازی،
                     فقط-توسعه)
  plugins/           01.services.ts، 02.session.ts، 03-user-scope.client.ts
  services/          index.ts (registry) — auth/ users/ favorites/ avatars/
                     businesses/ bookings/ owner/ …
                     (هر دامنه: قرارداد + پیاده‌سازی mock)
    mocks/           داده‌های واقع‌گرایانهٔ فارسی (users، businesses، extras،
                     owner-scenarios، customers)،
                     session.ts (نگهبان نشست)، user-state.ts (کوکی `wq_user_data`)،
                     avatar-assets.ts
  types/             مدل دامنه (auto-import) + page-meta.ts + theme.ts + owner.ts
                     (OwnedBusiness / OwnerDashboard / BusinessAccess)
  utils/             digits، datetime، duration، delay، errors (ServiceError)،
                     validation.ts (قواعد مشترک فرم/سرویس)
docs/                ARCHITECTURE.md، DESIGN-SYSTEM.md، CONSTITUTION.md
```

کامپوننت‌ها با `pathPrefix: false` اسکن می‌شوند؛ نام فایل = نام تگ (یکتا نگه دارید).
مرز دامنه‌ها با رشد پروژه به `app/components/<domain>/` و
`app/composables/<domain>/` گسترش می‌یابد (مثل `components/bookings/`).
سیستم طراحی کامل و قوانین استفاده: `docs/DESIGN-SYSTEM.md`.

## ۶. استانداردهای کد

- TypeScript سخت ‏(`strict`)؛ `any` ممنوع.
- نام‌گذاری کامپوننت‌ها: `App*` برای کروم/زیرساخت، `Wq*` آیندهٔ احتمالی برای
  primitiveهای اختصاصی وقتینو.
- اعدادِ جادویی و رنگِ جادویی ممنوع؛ ابعاد ساختاری از `--wq-*` می‌آیند.
- تاریخ فارسی فقط از `app/utils/datetime.ts`: `Intl.DateTimeFormat('fa-IR')` را
  با `dateStyle` به‌همراه `hour/minute` صدا نزنید (ECMA-402 ترکیبشان را ممنوع می‌کند؛
  Node با `TypeError: Invalid option : option` می‌ترکاند). اجزا را صریح بدهید:
  `year/month/day/hour/minute`.
- سرویس‌های mock به composables (`useCookie`/`useState`/`useMockFlags`) تکیه
  دارند؛ آن‌ها را **قبل از اولین `await` متد** بخوانید — بعد از await، context
  ناکس در SSR تضمین‌شده نیست (در client مشکلی نیست چون instance سراسری است).
  عملی: همهٔ واکشی‌های کاربر-محور از `onMounted`/رویداد کاربر آغاز می‌شوند.
- خروجی لینت/تایپچک/بیلد در پایان هر فاز باید سبز باشد (`.github`-کمتر، حداقل
  `npm run check`).
- کامیت هر فاز: پیام conventional؛ push به ریموت پیش‌فرض.

## ۷. آمادگی Capacitor (بدون پیچیدگی زودرس)

- `viewport-fit=cover` + `env(safe-area-inset-*)` در هدر و تب‌بار.
- `min-h-dvh` برای صفحه؛ هدف لمسی ≥ ۴۸px در ناوبری و کنترل‌ها.
- آیکون‌ها محلی باندل می‌شوند (`@iconify-json/lucide`)؛ فونت self-host
  (Vazirmatn Variable) — بدون وابستگی شبکهٔ ثالث.
- هیچ دسترسی مستقیم به `window`/`document` بیرون از نگه‌بان `import.meta.client`.

## ۸. دامنهٔ داده و ماندگاری (از فاز ۷)

| داده | کلید | محل | عمر |
| --- | --- | --- | --- |
| نشست | `wq_session` | کوکی | ۳۰ روز |
| حالت فعال | `wq_mode` | کوکی | ۳۶۵ روز |
| نشان‌شده‌ها + پروفایل ویرایش‌شده | `wq_user_data` → `Record<userId, {favorites, profile}>` | کوکی | ۳۶۵ روز |
| کسب‌وکارِ زمینهٔ مدیر | `wq_owner_business` → `Record<userId, businessId>` | کوکی | ۳۶۵ روز |
| ترجیح تم | `wq-color-mode` | `localStorage` | همیشگی |
| تاریخچهٔ مشاهده / پیش‌نویس رزرو | `useState` | حافظهٔ همین بار اجرا | تا پایان نشست مرورگر |

- دادهٔ کاربر-محور **به `userId` قید می‌شود**؛ برای چنداکانتیسم چیز دیگری
  اختراع نکرده‌ایم — فقط اینکه دو حساب روی هم نوشته نشوند.
- `plugins/03-user-scope.client.ts` تنها جایی است که با تغییر/خروج کاربر،
  stateهای گذرا (`saved:*`, `profile:*`, `owner:*`, تاریخچهٔ مشاهده، پیش‌نویس
  رزرو) را reset می‌کند و در مقابل، دادهٔ دامنه را برای نشست تازه آماده
  می‌کند (`ensureLoaded` برای نشان‌شده‌ها و فهرست کسب‌وکارهای مدیر). منطق
  login/logout در صفحه‌ها پخش نمی‌شود.
- سوییچ **حالت** (مشتری↔صاحب↔کارمند) هیچ reset ای انجام نمی‌دهد: حالت فقط
  ناوبری و فرود را عوض می‌کند، نه مالکیت داده. بنابراین دادهٔ مشترک کاربر
  (نشست، پروفایل، نشان‌شده‌ها) و زمینهٔ مدیر هر دو سالم می‌مانند.
- عمداً ماندگار نمی‌شود: خطاهای فرم، متن موقت، باز/بسته‌بودن شیت‌ها،
  پیش‌نمایش آواتارِ فایلِ انتخابی (فقط `useState('avatar:local-previews')`).
  دلیل: دادهٔ کاربری نه، حالت UI است.
- در `apiMode='api'` این کوکی‌ها نوشته/خوانده نمی‌شوند؛ `Api*Service`ها
  منبع‌حقیقت را از بک‌اند می‌گیرند (کوکی‌ها متعلق به لایهٔ mock‌اند:
  `app/services/mocks/*`).

## ۹. فضای کاری صاحب کسب‌وکار (فاز ۸)

سه مفهوم، سه نقطهٔ مسئول — هیچ‌کدام در صفحه تکرار نمی‌شوند:

| مفهوم | صاحب | چه سؤالی را جواب می‌دهد |
| --- | --- | --- |
| دادهٔ کسب‌وکارِ مدیر | `OwnerService` (`app/services/owner/`) | چه چیزی را می‌توانم مدیریت کنم؟ + شمارش‌ها |
| زمینهٔ کاری | `useBusinessContext()` | الان کدام کسب‌وکار را مدیریت می‌کنم؟ |
| دادهٔ داشبورد هر کسب‌وکار | `useOwnerDashboard()` | امروز/نوبت بعدی/شاخص‌های همین کسب‌وکار |

```
app/pages/owner/**              صفحات نازک — فقط ترکیب‌بندی و «فاز نمایش»
   ↓
useOwnerBusinessEntry           ورود + ماشین فاز (مشترک داشبورد/اطلاعات/مدیریت)
useBusinessContext              زمینه + کوکی + تصمیم resolve (open / choose / empty / error)
useOwnerBusinesses              کش فهرست کسب‌وکارهای مدیر (ادغام درخواست‌های هم‌زمان)
useOwnerDashboard               داشبورد، کش‌شده به‌ازای businessId
   ↓
OwnerService (MockOwnerService)
   ↓
mocks/businesses.ts · mocks/owner-scenarios.ts · mocks/bookings.ts · mocks/customers.ts
```

- صفحه هیچ فیلتری روی رزروها انجام نمی‌دهد، آمار جمع نمی‌زند و وضعیت را
  ترجمه نمی‌کند: `getDashboard(businessId)` همان `OwnerDashboard` را می‌دهد
  (نوبت بعدی، امروز، `OwnerBusinessMetrics`). روزِ «امروز»، پنجرهٔ محلی سرویس
  است، نه `new Date()` داخل کامپوننت.
- `business-status.ts` مثل `booking-status.ts` تنها جای ترجمهٔ وضعیت چرخهٔ
  حیات است (`BUSINESS_STATUS_META` + `businessStatusMeta`)؛ وضعیتی که بک‌اند
  بعداً اضافه کند، فقط همان فایل را جابه‌جا می‌کند و `BusinessStatusBadge`
  برای مقدار ناشناخته هم نمی‌شکند (حالت خنثی با برچسب «نامشخص»).

### مالکیت: واقعی، در لایهٔ سرویس

- مرجع مالکیت، رکورد کسب‌وکار است: `business.ownerUserId === session.user.id`.
  `getOwnedBusiness(id)` اگر نبود `ServiceError.notFound` و اگر بود ولی مالِ
  کاربر نبود `ServiceError.forbidden` می‌دهد؛ صفحه فقط همان را به فاز
  `not_found` / `forbidden` نگاشت می‌کند (با `OwnerAccessState` و راه بازگشت).
- مخفی‌کردن لینک، دسترسی نیست: گارد `capability: 'business'` روی مسیر +
  اعتبارسنجی سرویس روی **هر** id. `/owner/business/biz_pars` برای سارا که آن‌جا
  کارمند است، عمداً رد می‌شود.
- در `apiMode='api'` همان دو پاسخ (۴۰۴/۴۰۳) از سرور می‌آیند؛ UI تغییری
  نمی‌خواهد — سرور مرجع باقی می‌ماند.

### انزوای داده بین چند کسب‌وکار

- کش داشبورد `Record<businessId, OwnerDashboard>` است و صفحه `data[currentId]`
  را می‌خواند؛ «نوبت‌های کسب‌وکار الف داخل کسب‌وکار ب» به‌خاطر شکل state
  ناممکن است، نه به‌خاطر نظم کدنویسی.
- با سوییچ، کلید عوض می‌شود → پیش از پاسخ تازه `initializing` است و صفحه
  اسکلت نشان می‌دهد: نه صفرهای بی‌معنی، نه نام و دادهٔ قبلی.
- بازگشت به کسب‌وکار قبلی از همان کش می‌آید (بدون واکشی اضافه) و
  `refresh()` همان یک کلید را تازه می‌کند؛ خطای یک کسب‌وکار، کشِ دیگری را
  نمی‌شکند.
- فهرست `useOwnerBusinesses` تنها منبع نام/تصویر/شمارش‌هاست و `enter()` آن را
  با پاسخ تازه هم‌راستا می‌کند (`syncOne`) تا هدر و کارت‌ها یک عدد را بگویند.

### تصمیم زمینه (URL first)

| وضعیت | رفتار |
| --- | --- |
| id در URL و مالِ کاربر | همان کسب‌وکار باز می‌شود (deep link بعد از refresh هم همین) |
| یک کسب‌وکار | بدون پرسش انتخاب می‌شود |
| انتخاب ذخیره‌شدهٔ معتبر | همان برگردانده می‌شود (`wq_owner_business`) |
| چند کسب‌وکار، بدون انتخاب | صفحهٔ `/owner` فهرست انتخاب را نشان می‌دهد (نه حدس) |
| هیچ کسب‌وکاری | حالت خالی عمدی در همان فضای کاری؛ کاربر به حالت مشتری پرتاب نمی‌شود |

### جای‌فاز بعدی

مدیریت نوبت‌ها، سرویس‌ها، پرسنل و دسترس‌پذیری در `/owner/business/[businessId]/manage`
با ردیف‌های قفل‌شده و برچسب صادقانهٔ «به‌زودی» معرفی شده‌اند. همان
`OwnerDashboard` و همان `OwnerService` آن‌ها را تغذیه می‌کنند؛ افزوده‌شدنشان
یعنی: یک route، یک متد روی سرویس، و فعال‌شدن یک ردیف — بدون تغییر معماری و
بدون state تازهٔ موازی.

## ۱۰. آنچه عمداً ساخته نشده (مقید به فاز ۰)

- صفحات واقعی مشتری/کسب‌وکار/کارمند، جریان رزرو، چت، اعلان‌ها.
- پنل ادمین (خارج از اسکوپ کل پروژه).
- فرم‌های کامل ثبت‌نام/ورود (پوستهٔ composable + سرویس آماده است).
- اتصال API واقعی (`apiMode==='api'` عمداً خطای راهنما می‌دهد).
- (فاز ۷) مرکز اعلان‌ها، پوش‌نوتیفیکیشن، چت، دیدگاه‌ها، حذف حساب، تغییر شمارهٔ
  موبایل با تأیید — صفحهٔ `/notifications` عمداً فقط حالت صادقانهٔ «فعلاً در
  دسترس نیست» است.
- (فاز ۸) هر نوع **نوشتن** در فضای کاری: ثبت/ویرایش کسب‌وکار، CRUD سرویس و
  پرسنل، پیکربندی دسترس‌پذیری، مدیریت کامل نوبت‌ها (تأیید/لغو/جابه‌جایی)،
  مدیریت مشتریان، تحلیل و نمودار، پرداخت، چت، حالت کارمند، و هر نوع ادمین.
  داشبورد فاز ۸ فقط *می‌خواند*؛ آمار و نمودار تزئینی نمی‌سازد.
- شمارندهٔ جعلی، تاریخ انقضای جعلی نشست و هر «شبیه‌سازی» که واقعیت نداشته باشد.
