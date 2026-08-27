// Waqtino — Nuxt configuration (Phase 0)
// Mobile-first, Persian-first, RTL-first. Frontend-only for now; backend (AdonisJS)
// will be attached later through the services abstraction layer (app/services).
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: true
  },

  // Domain types and other named exports in these folders are auto-imported.
  imports: {
    dirs: ['types', 'config']
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl'
      },
      title: 'وقتینو',
      titleTemplate: '%s | وقتینو',
      meta: [
        { charset: 'utf-8' },
        // viewport-fit=cover + env(safe-area-inset-*) usage keep the app Capacitor-ready.
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'
        },
        {
          name: 'description',
          content:
            'وقتینو — پلتفرم کشف و رزرو آنلاین نوبت از کسب‌وکارها و خدمات.'
        },
        {
          name: 'theme-color',
          media: '(prefers-color-scheme: light)',
          content: '#fafaf8'
        },
        {
          name: 'theme-color',
          media: '(prefers-color-scheme: dark)',
          content: '#1a1814'
        }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    storageKey: 'wq-color-mode'
  },

  // Icons are bundled locally (@iconify-json/lucide) so the app never depends on
  // the external Iconify API — important for offline / Capacitor packaging.
  icon: {
    provider: 'server',
    serverBundle: 'local',
    fallbackToApi: false
  },

  ui: {
    // فونت (وزیرمتن) را خودمان self-host می‌کنیم؛ ماژول @nuxt/fonts که به
    // سرویس‌های بیرونی وابسته است غیرفعال می‌شود.
    fonts: false
  },

  runtimeConfig: {
    public: {
      /**
       * 'mock'  → in-browser mock repositories (development, no backend needed)
       * 'api'   → real AdonisJS backend (wired in a later phase)
       */
      apiMode: process.env.NUXT_PUBLIC_API_MODE || 'mock',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '',
      /** Development-only: deterministic OTP used by the mock auth service. */
      mockOtpCode: process.env.NUXT_PUBLIC_MOCK_OTP_CODE || '1234'
    }
  }
})
