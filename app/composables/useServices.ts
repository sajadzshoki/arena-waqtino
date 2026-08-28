import type { AppServices } from '~/services'

/** دسترسی تایپ‌سیف به رجیستری سرویس‌ها. */
export function useServices(): AppServices {
  return useNuxtApp().$services
}
