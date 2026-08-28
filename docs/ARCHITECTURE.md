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
- خطاها به‌صورت `ServiceError` (با پیام فارسی) از سرویس بیرون می‌آیند.

### محافظت مسیر (από فاز ۲)

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
  composables/       useAuth، useUserMode، useServices، useAppToast
  config/            navigation.ts، booking-status.ts (پیکربندی دامنه، auto-import)
  layouts/           default.vue (پوستهٔ موبایل؛ meta.tabbar)
  pages/             index.vue، dev/design.vue (شوکیس فقط-توسعه)
  plugins/           01.services.ts، 02.session.ts
  services/          index.ts (registry) — auth/ users/ businesses/ (contract+mock)
    mocks/           داده‌های واقع‌گرایانهٔ فارسی (users، businesses)
  types/             مدل دامنه (auto-import) + page-meta.ts
  utils/             digits، datetime، duration، delay، errors (ServiceError)
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
- خروجی لینت/تایپچک/بیلد در پایان هر فاز باید سبز باشد (`.github`-کمتر، حداقل
  `npm run check`).
- کامیت هر فاز: پیام conventional؛ push به ریموت پیش‌فرض.

## ۷. آمادگی Capacitor (بدون پیچیدگی زودرس)

- `viewport-fit=cover` + `env(safe-area-inset-*)` در هدر و تب‌بار.
- `min-h-dvh` برای صفحه؛ هدف لمسی ≥ ۴۸px در ناوبری و کنترل‌ها.
- آیکون‌ها محلی باندل می‌شوند (`@iconify-json/lucide`)؛ فونت self-host
  (Vazirmatn Variable) — بدون وابستگی شبکهٔ ثالث.
- هیچ دسترسی مستقیم به `window`/`document` بیرون از نگه‌بان `import.meta.client`.

## ۸. آنچه عمداً ساخته نشده (مقید به فاز ۰)

- صفحات واقعی مشتری/کسب‌وکار/کارمند، جریان رزرو، چت، اعلان‌ها.
- پنل ادمین (خارج از اسکوپ کل پروژه).
- فرم‌های کامل ثبت‌نام/ورود (پوستهٔ composable + سرویس آماده است).
- اتصال API واقعی (`apiMode==='api'` عمداً خطای راهنما می‌دهد).
