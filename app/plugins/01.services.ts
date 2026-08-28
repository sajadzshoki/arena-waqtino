import { createServices } from '~/services'
import type { AppServices } from '~/services'

/**
 * رجیستری سرویس‌ها — تنها نقطهٔ تزریق وابستگی داده.
 * استفاده:  const services = useServices()  یا  useNuxtApp().$services
 */
export default defineNuxtPlugin(() => {
  const services = createServices()
  return {
    provide: {
      services
    }
  }
})

declare module '#app' {
  interface NuxtApp {
    $services: AppServices
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $services: AppServices
  }
}
