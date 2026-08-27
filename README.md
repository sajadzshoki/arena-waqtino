# وقتینو — Waqtino

فرانت‌اند اپلیکیشن رزرو نوبت **وقتینو** — موبایل‌محور، فارسی‌محور، RTL، با Nuxt 4 + TypeScript + Nuxt UI. در نهایت با Capacitor به اپ اندروید تبدیل می‌شود. بک‌اند (AdonisJS) جداگانه است و در فازهای بعد از طریق لایهٔ سرویس متصل خواهد شد.

## شروع

```bash
npm install
npm run dev        # http://localhost:3000
```

اسکریپت‌ها:

| دستور | کار |
| --- | --- |
| `npm run dev` | سرور توسعه |
| `npm run lint` | ESLint |
| `npm run typecheck` | vue-tsc / nuxi typecheck |
| `npm run build` | بیلد پروداکشن |
| `npm run check` | lint + typecheck + build (گیت پایان هر فاز) |
| `npm run generate` | خروجی استاتیک (پیش‌شرط Capacitor) |

## حالت داده (mock / api)

پیش‌فرض `mock` است — بدون نیاز به بک‌اند. ورود آزمایشی با OTP ثابت
(پیش‌فرض `۱۲۳۴`) از صفحهٔ خانه انجام می‌شود. تنظیمات در `.env` (نمونه:
`.env.example`):

```bash
NUXT_PUBLIC_API_MODE=mock        # mock | api
NUXT_PUBLIC_MOCK_OTP_CODE=1234   # فقط توسعه
```

## تغییر رنگ برند

فقط بلوک `--color-brand-*` در `app/assets/css/tokens.css` را ویرایش کنید؛
تمام تم لایت/دارک و کامپوننت‌های Nuxt UI خودکار به‌روز می‌شوند.

## اسناد

- `docs/DESIGN-SYSTEM.md` — سیستم طراحی: توکن‌ها، کامپوننت‌ها، قوانین استفاده  
  (نمایش زنده در محیط توسعه: مسیر `/dev/design`)
- `docs/ARCHITECTURE.md` — لایه‌ها، قوانین طراحی، الگوی سرویس، استانداردها
- `docs/CONSTITUTION.md` — چک‌لیست اجرایی قانون اساسی پروژه
