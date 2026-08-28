import { toServiceError } from '~/utils/errors'
import type { ServiceError } from '~/utils/errors'

/**
 * الگوی استاندارد اکشن‌های async (موجودی/فرم):
 * pending + error مدیریت‌شده بدون تکرار ref دستی در هر صفحه.
 *
 * const { execute, pending, error } = useAsyncAction((id: string) => services.x.do(id))
 */
export function useAsyncAction<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>
) {
  const pending = ref(false)
  const error = ref<ServiceError | null>(null)
  /** شمارندهٔ موفقیت — برای invalidate کردن واکشی‌ها */
  const succeeded = ref(0)

  async function execute(...args: Args): Promise<Result | undefined> {
    pending.value = true
    error.value = null
    try {
      const result = await fn(...args)
      succeeded.value++
      return result
    }
    catch (e) {
      error.value = toServiceError(e)
      return undefined
    }
    finally {
      pending.value = false
    }
  }

  return { pending: readonly(pending), error: readonly(error), succeeded: readonly(succeeded), execute }
}
