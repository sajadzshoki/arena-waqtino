/**
 * Waqtino — Nuxt UI theme binding.
 *
 * رنگ‌های معنایی Nuxt UI به پالت‌های تعریف‌شده در app/assets/css/tokens.css
 * متصل می‌شوند. تغییر رنگ برند = ویرایش بلوک --color-brand-* در tokens.css
 * (همین‌جا فقط «alias» تعریف می‌شود، نه مقدار رنگ).
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      secondary: 'warm',
      neutral: 'warm',
      success: 'green',
      info: 'sky',
      warning: 'amber',
      error: 'red'
    },

    /* تنظیمات سبک سراسری کامپوننت‌ها — محتاطانه و token-based.
       هدف: حس محصولی متعلق به وقتینو، نه دموی پیش‌فرض Nuxt UI. */
    button: {
      slots: {
        base: 'font-semibold'
      },
      defaultVariants: {
        size: 'lg'
      }
    },
    input: {
      defaultVariants: {
        size: 'lg'
      }
    },
    badge: {
      slots: {
        base: 'font-medium'
      }
    },
    drawer: {
      slots: {
        content: 'bg-elevated rounded-t-2xl'
      }
    }
  }
})
