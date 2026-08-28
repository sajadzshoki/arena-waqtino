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
    search/ bookings/ business/ employee/  (کامپوننت‌های دامنه‌ای)
  composables/       useAuth، useUserMode، useServices، useAppToast،
                     useSavedBusinesses (منبع‌واحد‌حقیقت نشان‌شده‌ها)، useUserProfile،
                     useProfileForm، useProfileAvatar، useThemePreference،
                     useAuthRecovery، useLogout، useMockFlags، useAsyncAction
  config/            navigation.ts، booking-status.ts (پیکربندی دامنه، auto-import)
  layouts/           default.vue (پوستهٔ موبایل؛ meta.tabbar)
  pages/             index.vue، saved.vue، profile(/edit).vue، settings.vue،
                     notifications.vue، booking*، business*، employee*،
                     dev/design.vue (شوکیس + کلیدهای شبیه‌سازی، فقط-توسعه)
  plugins/           01.services.ts، 02.session.ts، 03-user-scope.client.ts
  services/          index.ts (registry) — auth/ users/ favorites/ avatars/
                     businesses/ bookings/ … (هر دامنه: قرارداد + پیاده‌سازی mock)
    mocks/           داده‌های واقع‌گرایانهٔ فارسی (users، businesses، extras)،
                     session.ts (نگهبان نشست)، user-state.ts (کوکی `wq_user_data`)،
                     avatar-assets.ts
  types/             مدل دامنه (auto-import) + page-meta.ts + theme.ts
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
| ترجیح تم | `wq-color-mode` | `localStorage` | همیشگی |
| تاریخچهٔ مشاهده / پیش‌نویس رزرو | `useState` | حافظهٔ همین بار اجرا | تا پایان نشست مرورگر |

- دادهٔ کاربر-محور **به `userId` قید می‌شود**؛ برای چنداکانتیسم چیز دیگری
  اختراع نکرده‌ایم — فقط اینکه دو حساب روی هم نوشته نشوند.
- `plugins/03-user-scope.client.ts` تنها جایی است که با تغییر/خروج کاربر،
  stateهای گذرا (`saved:*`, `profile:*`, تاریخچهٔ مشاهده، پیش‌نویس رزرو) را
  reset می‌کند. منطق login/logout در صفحه‌ها پخش نمی‌شود.
- عمداً ماندگار نمی‌شود: خطاهای فرم، متن موقت، باز/بسته‌بودن شیت‌ها،
  پیش‌نمایش آواتارِ فایلِ انتخابی (فقط `useState('avatar:local-previews')`).
  دلیل: دادهٔ کاربری نه، حالت UI است.
- در `apiMode='api'` این کوکی‌ها نوشته/خوانده نمی‌شوند؛ `Api*Service`ها
  منبع‌حقیقت را از بک‌اند می‌گیرند (کوکی‌ها متعلق به لایهٔ mock‌اند:
  `app/services/mocks/*`).

## ۹. آنچه عمداً ساخته نشده (مقید به فاز ۰)

- صفحات واقعی مشتری/کسب‌وکار/کارمند، جریان رزرو، چت، اعلان‌ها.
- پنل ادمین (خارج از اسکوپ کل پروژه).
- فرم‌های کامل ثبت‌نام/ورود (پوستهٔ composable + سرویس آماده است).
- اتصال API واقعی (`apiMode==='api'` عمداً خطای راهنما می‌دهد).
- (فاز ۷) مرکز اعلان‌ها، پوش‌نوتیفیکیشن، چت، دیدگاه‌ها، حذف حساب، تغییر شمارهٔ
  موبایل با تأیید، داشبورد/مدیریت کسب‌وکار و هر نوع ادمین — صفحهٔ
  `/notifications` عمداً فقط حالت صادقانهٔ «فعلاً در دسترس نیست» است.
- شمارندهٔ جعلی، تاریخ انقضای جعلی نشست و هر «شبیه‌سازی» که واقعیت نداشته باشد.
