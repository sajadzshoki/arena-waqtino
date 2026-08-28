# سیستم طراحی وقتی‌نو (Phase 1)

این سند پاسخ این سؤال است: «چطور یک صفحهٔ جدید وقتی‌نو بسازم بدون اختراع سبک تازه؟»

نمایش زندهٔ همهٔ عناصر (فقط در محیط توسعه): **`/dev/design`**

---

## ۱. توکن‌ها کجا هستند

| لایه | فایل |
| --- | --- |
| توکن‌ها (رنگ/شعاع/سایه/ابعاد/موشن) | `app/assets/css/tokens.css` |
| تایپوگرافی و utilityهای تعامل | `app/assets/css/main.css` |
| اتصال به Nuxt UI (alias رنگ‌ها و ظاهر پیش‌فرض کامپوننت‌ها) | `app/app.config.ts` |

قانون: **هگز و مقدار خام فقط در `tokens.css`.** در `.vue` فقط کلاس‌های معنایی.

## ۲. تغییر رنگ اصلی

بلوک «پالت برند» (`--color-brand-*`) در `tokens.css` را ویرایش کنید — تمام حالت‌ها
(hover/active/soft/border)، هر دو تم، و همهٔ کامپوننت‌های Nuxt UI و Waqtino به‌روز
می‌شوند. `--wq-primary-soft/-border` با `color-mix` از رنگ پایه مشتق می‌شوند.

```text
--color-brand-* (tokens.css)
  → --wq-primary + hover/active/soft/foreground (:root / .dark)
    → --ui-primary (Nuxt UI runtime)
      → UButton/UBadge/UInput/… + کلاس‌های bg-primary, text-primary
```

## ۳. رنگ‌های معنایی — جدول کلاس‌ها

| مقصود | کلاس‌ها |
| --- | --- |
| پس‌زمینهٔ صفحه | `bg-background` |
| سطوح | `bg-surface` · `bg-surface-muted` · `bg-surface-raised` · `bg-surface-overlay` · `bg-surface-inverse` |
| متن | `text-foreground` · `text-foreground-secondary` · `text-foreground-muted` · `text-foreground-disabled` · `text-foreground-strong` · `text-inverse` |
| خطوط | `border-line` · `border-line-subtle` (divide/جداکننده) · `border-line-strong` |
| برند | `bg-primary` · `bg-primary-hover` · `bg-primary-active` · `bg-primary-soft` · `border-primary-border` · `text-primary` |
| وضعیت | `bg-success/-soft · border-success-border` … (warning/error/info هم‌الگو) |
| ارتفاع | `shadow-raised` (کارت ملایم) · `shadow-pop` (شیت/دیالوگ) · `shadow-sticky` (اکشن چسبیده) |

`bg-default`/`text-muted`/`border-default` ِ Nuxt UI هم به همان توکن‌ها نگاشت شده‌اند،
اما در کد جدید از نام‌های وقتی‌نو (جدول بالا) استفاده کنید.

## ۴. تم‌ها

- یک مدیر تم، دو نقطهٔ ورود: `AppThemeToggle` (هدر، چرخش سیستم→روشن→تیره) و
  گروه «ظاهر» در `/settings` (رادیوی سه‌گزینه‌ای). هر دو از
  **`useThemePreference()`** می‌خوانند/می‌نویسند — state تم خصوصی در صفحه‌ها
  نداریم.
- ترجیح در `localStorage` با کلید `wq-color-mode` (پیکربندی
  `@nuxtjs/color-mode` در `nuxt.config.ts`)؛ همان ماژول اسکریپت پیش‌از‌رندر
  می‌کارد، پس **FOUC/فلاش تم** نداریم و با `System` به ترجیح سیستم گوش می‌دهد.
- دارک‌مود **دست‌ساز** است (بلوک `.dark` در tokens.css) — نه معکوس‌سازی؛ به همین
  دلیل رنگ برند، `primary-soft`، تمام حالت‌های تعامل (hover/active/focus/disabled)
  و خطا/موفقیت در هر دو تم جدا تنظیم شده‌اند. رنگ هگز تازه در کامپوننت = نقض.
- انتخاب تم و هر وضعیت معنایی دیگر **فقط با رنگ** اعلام نمی‌شود: گزینهٔ انتخاب‌شده
  آیکون + برچسب + `aria-checked` دارد (و نه صرفاً کادر رنگی).
- هر تغییر بصری را همیشه در هر دو تم بررسی کنید: `npm run dev` → `/dev/design`.

## ۵. تایپوگرافی فارسی (t-\*)

| Utility | سایز/وزن | کاربرد |
| --- | --- | --- |
| `t-display` | 28/extrabold | تیتر قهرمان صفحات کلیدی |
| `t-h1` | 22/bold | عنوان صفحه |
| `t-h2` | 19/bold | عنوان کارت/مدال بزرگ |
| `t-h3` | 16/semibold | عنوان آیتم/کارت کوچک |
| `t-section` | 15/semibold | عنوان بخش (با `WqSectionHeader`) |
| `t-body-lg` | 16 | متن اصلی مهم |
| `t-body` | 15 | متن بدنهٔ استاندارد |
| `t-body-sm` | 13 | توضیح فرعی |
| `t-label` | 13/medium | برچسب فرم |
| `t-caption` | 12 + muted | متادیتا |
| `t-num` | — | اعداد منظم (قیمت/ساعت/تلفن) |

فونت: **Vazirmatn Variable** (self-host از npm؛ بدون وابستگی شبکه).

## ۶. فاصله، شعاع، ارتفاع، موشن

- **فاصله**: شبکهٔ ۴px تیلویند. فضای داخلی کارت `p-4`، فاصلهٔ بین بخش‌ها `mt-8`،
  گپ داخلی فهرست `gap-2/3/4`. توکن‌های ساختاری: `--wq-page-px`، `--wq-header-h`،
  `--wq-tabbar-h`، `--wq-content-max`.
- **شعاع**: کنترل‌های کوچک `rounded-md`، دکمه/اینپوت خودکار از `--ui-radius` (12)،
  کارت `rounded-xl`، شیت/دیالوگ `rounded-2xl`. **pill فقط برای چیپ/تگ/وضعیت کوچک.**
- **سایه**: به‌ندرت — `shadow-raised`/`shadow-pop`/`shadow-sticky`. کارت‌ها بدون سایه،
  با مرز `border-line`.
- **موشن**: `pressable` (فیدبک لمس scale) + `--wq-dur-1/2/3` + `--wq-ease`. انیمیشن
  تزئینی ممنوع.

## ۷. کامپوننت‌های Waqtino — نقشهٔ استفاده

### اکشن
```vue
<WqButton>رزرو نوبت</WqButton>                    <!-- primary (پیش‌فرض، size lg) -->
<WqButton variant="secondary" />                  <!-- soft برند -->
<WqButton variant="tertiary" />                   <!-- متنی/خاموش -->
<WqButton variant="destructive" />                <!-- مخرب -->
<WqIconButton icon="i-lucide-heart" label="…" />
```
loading/disabled/icon/trailingIcon/block پشتیبانی می‌شود. اندازهٔ جدید بی‌رویه نسازید.

### فرم
`WqInput` · `WqPhoneInput` (ارقام فارسی خودکار نرمال می‌شود، v-model همیشه ASCII) ·
`WqSearchInput` · `WqTextarea` (شمارندهٔ کاراکتر) · `WqSelect` (items: `{label,value}`) ·
کنترل‌ها: `UCheckbox`/`URadioGroup`/`USwitch` مستقیم با `color="primary"` · `WqChip`
(تنها pill) · `WqSelectCard` (کارت انتخابی با چک).

### اورلی — قانون انتخاب
| موقعیت | ابزار |
| --- | --- |
| فیلتر/مرتب‌سازی/انتخاب از فهرست (موبایل) | `WqSheet` (شیت پایین) |
| تأیید کوتاه / عمل مخرب | `WqConfirm` (tone: default/destructive) |
| اطلاع‌رسانی سبک | `useAppToast()` → `success/error/info/neutral` |
| منوی نقطه‌ای روی آیتم | `UDropdownMenu` (مستقیم) |

### نمایش داده
`WqStatusBadge` (status رزرو یا دستی) · `WqAvatar` (src/initials/icon + `@error`
برای fallback؛ در حالت خرابی حروف اول نام را نشان می‌دهد، نه تصویر شکسته) ·
`WqRating` · `WqPrice` (`0` → «رایگان»، strike برای حذف) · `WqDuration` ·
`WqDateTime` (date/datetime/time/full) · `WqMetaRow` · `WqSectionHeader` · `WqListRow`.

### تنظیمات و حساب (از فاز ۷)
```vue
<SettingsSection title="ظاهر" description="…">           <!-- کارت گروه + aria-labelledby -->
  <SettingsRow icon="i-lucide-user" label="ویرایش پروفایل" to="/profile/edit" />
  <SettingsInfoRow icon="i-lucide-phone" label="شمارهٔ موبایل" :value="phone" locked />
  <template #footer>…</template>
</SettingsSection>
```
- `SettingsRow` = ردیف **قابل‌عمل** (روی `WqListRow`): `to` → لینک، `action`/`@select`
  → دکمه، `value`/`#value` مقدار فعلی، `#trailing` چیپ/سوئیچ، `tone="danger"` برای
  عمل مخرب. ردیف فقط‌نمایشی **هرگز** دکمهٔ مرده نیست: `SettingsInfoRow`
  (`<dt>/<dd>`؛ `locked` → آیکون قفل به‌جای فلش).
- `SettingsSection` با `tone="danger"` برای «حساب کاربری/خروج» — جدا از گروه‌های معمولی.
- ردیف‌ها فشرده نمی‌شوند؛ ارتفاع لمسی ≥ ۴۸px با همان `WqListRow` حفظ می‌شود.
- `ProfileIdentity` (کارت هویت: آواتار بزرگ + نام یا «نام شما ثبت نشده» + تلفن
  `dir="ltr"` + راهنمای تکمیل پروفایل) و `ProfileAvatarEditor` (پیش‌نمایش، انتخاب از
  آواتارهای آماده در شیت `role="radiogroup"`، جایگزینی از فایل، حذف، و پیام صادقانه
  وقتی پیش‌نمایش فقط برای همین نشست است) مخصوص پروفایل‌اند؛ صفحهٔ پروفایل
  داشبورد کسب‌وکار نیست و هیچ آنالیتیکی ندارد.
- «خروج از حساب» در سه نقطه (پروفایل، تنظیمات، سوییچر حالت) همان
  `useLogout()` + `WqConfirm` است — `confirm()` مرورگر ممنوع.

### نشان‌کردن کسب‌وکار (از فاز ۷)
`BusinessSaveToggle` تنها دکمهٔ «نشان‌کردن» کل اپ است (Home/Search/Category/Details/Saved
از آن استفاده می‌کنند؛ `mode="remove"` برای ردیف صفحهٔ نشان‌شده‌ها). وضعیت با
**آیکونِ پر در برابر خطی (filled/outline) + `aria-pressed` + برچسب** اعلام می‌شود،
نه فقط با رنگ. همه از
`useSavedBusinesses()` می‌خوانند؛ حذف/اضافه‌شدن همان لحظه در همهٔ صفحه‌ها اعمال می‌شود.
`BusinessCardCompact` (+ `BusinessCardCompactSkeleton count`) کارت صفحهٔ نشان‌شده‌هاست.

### فضای کاری مدیر (از فاز ۸)

| کامپوننت | نقش | قانون استفاده |
| --- | --- | --- |
| `owner/OwnerBusinessHeader` | هدر زمینه: کدام کسب‌وکار + وضعیت + دکمهٔ «تغییر» | بالای همهٔ صفحه‌های فضای کاری؛ دکمهٔ تغییر فقط با بیش از یک کسب‌وکار |
| `owner/OwnerBusinessSwitcher` | شیت پایین انتخاب کسب‌وکار (`WqSheet` + `WqSelectCard`) | هیچ‌وقت دراپ‌داون سایدباری؛ state باز/بسته در `useState('owner:ui:switcher')` |
| `owner/OwnerNextAppointment` | نزدیک‌ترین نوبت (ظرف `primary-soft`) | تنها بلوک «مهم» صفحه؛ بدون اکشن مدیریتی |
| `owner/OwnerScheduleList` | ردیف‌های فشردهٔ نوبت (ساعت، مشتری، سرویس، پرسنل، وضعیت) | فقط نمایش؛ ردیف مدیریتی فاز بعدی است |
| `owner/OwnerMetricsStrip` | سه شاخص: امروز / پیش‌رو / در انتظار تأیید | با همه‌صفر **رندر نمی‌شود** (عدد بی‌معنی نه) |
| `owner/OwnerQuickActions` | شبکهٔ ۲×۲ دسترسی سریع | فقط مقصد‌های واقعی همین فاز |
| `owner/OwnerBusinessCard` | کارت کسب‌وکارِ مدیر در فهرست | کارت = یک ورودی؛ «در حال مدیریت» به‌جای دکمهٔ تکراری |
| `owner/OwnerBusinessSummary` | نمای کلی کسب‌وکار در داشبورد | `SettingsSection` + `SettingsInfoRow`؛ بدون فرم و دکمهٔ ذخیره |
| `owner/OwnerAccessState` | «مال شما نیست» / «پیدا نشد» + راه بازگشت | پاسخ سرویس را نشان می‌دهد، نه فرض UI |
| `owner/OwnerNoBusinessState` | صاحبِ بدون کسب‌وکار | حالت خالی عمدی، با مسیر واقعی؛ بدون فرم جعلی |
| `owner/OwnerDashboardSkeleton`, `owner/OwnerBusinessCardSkeleton` | اسکلت‌های هم‌شکل صفحه | جای اسپینر تمام‌صفحه؛ هنگام سوییچ هم همین |
| `business/BusinessStatusBadge` | نشان وضعیت چرخهٔ حیات کسب‌وکار | از `BUSINESS_STATUS_META`؛ متن + آیکون، هیچ‌وقت فقط رنگ |

تراکم فضای کاری از حالت مشتری «کاری‌تر» است ولی همان توکن‌ها:
`rounded-xl` + `border-line` برای کارت‌ها، `t-num` برای ساعت و شمارش‌ها،
`--wq-dur-*` + `pressable` برای حرکت. رنگ اصلی فقط روی یک عنصر (نوبت بعدی)
می‌نشیند تا حس پنل ادمین آبی/سازمانی ندهد.

### حالت‌ها
`AppLoadingState` (اسپینر یا `rows` برای اسکلت) · `AppEmptyState` (با slot اکشن) ·
`AppErrorState` (`retryable` + `@retry`) · `AppOfflineState`.

قانون ترجیح: وقتی اسکلت محلی ممکن است، **اسپینر تمام‌صفحه نمی‌گذاریم** —
`BusinessCardCompactSkeleton` جای فهرست را می‌گیرد تا چیدمان جهش نکند. حالت خالی
عمداً خالی است (CTA مثل «مشاهده کسب‌وکارها»)، نه فهرست صفر‌آیتمِ بی‌توضیح.

### پوستهٔ صفحه
`AppPageHeader` (صفحات اصلی) · `AppBackHeader` (جزئیات/فرم، sticky + بازگشت) ·
`AppStickyAction` (CTA چسبیده؛ خودش بالای تب‌بار/safe-area قرار می‌گیرد) ·
صفحه با `definePageMeta({ tabbar: false })` تب‌بار را مخفی می‌کند.

## ۸. الگوهای صفحه

الگوی «فضای کاری» (فاز ۸) — سلسله‌مراتب از «الان» به «کلیات»:

```
هدر زمینه (کدام کسب‌وکار) → نوبت بعدی → نوبت‌های امروز → شاخص‌ها → دسترسی سریع → نمای کلی
```

- هر بخش یک `WqSectionHeader` دارد؛ محتوای خالی با خط‌چین و یک جمله توضیح
  می‌ماند (نه حذفِ بی‌سروصدا، نه جدول صفرها).
- سوییچ کسب‌وکار = اسکلتِ همان صفحه، نه «نمایش دادهٔ قبلی».
- صفحه‌های عمیق (`/info`, `/manage`) با `AppBackHeader` باز می‌شوند و `tabbar`
  ندارند؛ تب فعالِ ناوبری پایین با `activeWhen` همان‌جا روشن می‌ماند.


```text
استاندارد:  AppPageHeader → بخش‌ها (WqSectionHeader) 
جزئیات:    AppBackHeader → بخش‌ها → AppStickyAction (اختیاری)
فرم:      AppBackHeader → WqInput/… → AppStickyAction (submit)
```

## ۹. قوانین RTL

- «به سمت جلو/ادامه» همیشه `i-lucide-chevron-left`، «بازگشت» `i-lucide-arrow-right`.
- فاصله‌های افقی با کلاس‌های منطقی (`ps/pe/ms/me`) نه `pl/pr`.
- اعداد/تلفن/slug انگلیسی با `dir="ltr"` (+ معمولاً `t-num`).
- آیکون غیرجهت‌دار (جستجو/قلب/…) هرگز flip نمی‌شود؛ جهت‌دارها `dir-flip`.

## ۱۰. آیکون‌ها

فقط **lucide** (`i-lucide-*`) — محلی باندل می‌شود. سایز رایج: متن `size-4`،
لیست `size-5`، تب‌بار `size-6`. مخلوط‌کردن کتابخانهٔ آیکون دیگر ممنوع.
