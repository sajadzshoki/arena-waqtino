/**
 * آواتارهای آمادهٔ حالت mock — «دارایی» (asset) ساختگی، نه توکن UI.
 *
 * رنگ‌های داخل SVG پیکسل‌های یک تصویر هستند (مثل پیکسل‌های عکس کاور یک
 * کسب‌وکار)؛ قانون «ممنوعیت هگز» مربوط به کامپوننت‌ها/استایل‌هاست و اینجا
 * کاربرد دارد که فایل mock نباید به شبکه وابسته باشد. هر آواتار یک data-URL
 * کوتاه (<۴۰۰ کاراکتر) است تا در کوکیِ وضعیت کاربر جا شود.
 */

export interface MockAvatarAsset {
  id: string
  /** برچسب فارسی — برای `aria-label` و فهرست انتخاب */
  label: string
  url: string
}

interface Palette {
  bg: string
  ink: string
}

const PALETTE: Palette[] = [
  { bg: '#0a8571', ink: '#ccf2e9' },
  { bg: '#d98f4a', ink: '#fff4e6' },
  { bg: '#5c6bb3', ink: '#e8ecff' },
  { bg: '#b0506a', ink: '#ffe9ef' },
  { bg: '#4d7a4f', ink: '#eaf7e6' },
  { bg: '#413e35', ink: '#f4f4f1' },
  { bg: '#2bbfa8', ink: '#052e29' },
  { bg: '#8e887b', ink: '#fafaf8' }
]

const LABELS = [
  'سبز عمیق',
  'کهربایی',
  'نیلی',
  'گلگون',
  'یشمی',
  'زغالی',
  'فیروزه‌ای',
  'خاکی'
]

/** نقشهٔ انتزاعی کوچک (دایره/کمان) — بدون نیاز به فونت یا تصویر بیرونی. */
function buildAvatar(palette: Palette, variant: number): string {
  const shapes = [
    `<circle cx="56" cy="24" r="26" fill="${palette.ink}" opacity=".28"/><circle cx="24" cy="58" r="18" fill="${palette.ink}" opacity=".5"/>`,
    `<path d="M0 80 L40 24 L80 80 Z" fill="${palette.ink}" opacity=".34"/><circle cx="60" cy="20" r="10" fill="${palette.ink}" opacity=".6"/>`,
    `<circle cx="40" cy="40" r="22" fill="${palette.ink}" opacity=".45"/><circle cx="40" cy="40" r="34" fill="none" stroke="${palette.ink}" stroke-width="4" opacity=".25"/>`,
    `<path d="M0 52 Q20 32 40 52 T80 52 V80 H0 Z" fill="${palette.ink}" opacity=".42"/>`,
    `<rect x="14" y="14" width="26" height="26" rx="8" fill="${palette.ink}" opacity=".5"/><rect x="42" y="40" width="24" height="24" rx="8" fill="${palette.ink}" opacity=".28"/>`,
    `<circle cx="20" cy="20" r="12" fill="${palette.ink}" opacity=".45"/><circle cx="58" cy="58" r="16" fill="${palette.ink}" opacity=".3"/><rect x="44" y="12" width="24" height="8" rx="4" fill="${palette.ink}" opacity=".45"/>`,
    `<path d="M40 8 L64 40 L40 72 L16 40 Z" fill="${palette.ink}" opacity=".4"/>`,
    `<path d="M0 0 H80 V34 Q56 54 40 34 Q24 14 0 34 Z" fill="${palette.ink}" opacity=".3"/>`
  ]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">` +
    `<rect width="80" height="80" fill="${palette.bg}"/>${shapes[variant % shapes.length]}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const MOCK_AVATAR_ASSETS: MockAvatarAsset[] = PALETTE.map((palette, index) => ({
  id: `av_${index + 1}`,
  label: LABELS[index] ?? `گزینهٔ ${index + 1}`,
  url: buildAvatar(palette, index)
}))

/**
 * سقف طول آدرسی که در کوکیِ وضعیت کاربر جا می‌شود. بالاتر از این مقدار
 * مقدار «پیش‌نمایش محلی» است و عمداً persist نمی‌شود (آپلود واقعی به فاز
 * اتصال بک‌اند موکول است —endpoint ساختگی نمی‌سازیم).
 */
export const PERSISTABLE_AVATAR_MAX_LENGTH = 900

export function isPersistableAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return true
  return url.length <= PERSISTABLE_AVATAR_MAX_LENGTH
}
