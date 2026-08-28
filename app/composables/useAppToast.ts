/**
 * الگوی واحد اعلان‌های درون‌اپی (toast).
 * به‌جای toast.add با رنگ/آیکون پراکنده، از متدهای معنایی استفاده کنید.
 */

/** اکشن اختیاری یک اعلان (مثلاً «بازگردانی» بعد از حذف از نشان‌شده‌ها). */
export interface AppToastAction {
  label: string
  onClick: () => void
}

export interface AppToastOptions {
  description?: string
  /** عمر اعلان به میلی‌ثانیه — برای اعلان‌های قابل‌اکشن بلندتر می‌شود. */
  duration?: number
  action?: AppToastAction
}

function toActionProps(action?: AppToastAction) {
  if (!action) return {}
  return {
    actions: [
      {
        label: action.label,
        color: 'neutral' as const,
        variant: 'solid' as const,
        onClick: action.onClick
      }
    ]
  }
}

export function useAppToast() {
  const toast = useToast()

  /** حذف «زود از بین می‌رود»، رنگ/آیکون ثابت هر نوع */
  function success(title: string, options?: string | AppToastOptions): void {
    const opts = typeof options === 'string' ? { description: options } : (options ?? {})
    toast.add({
      title,
      description: opts.description,
      color: 'success',
      icon: 'i-lucide-circle-check',
      duration: opts.duration,
      ...toActionProps(opts.action)
    })
  }

  function error(title: string, options?: string | AppToastOptions): void {
    const opts = typeof options === 'string' ? { description: options } : (options ?? {})
    toast.add({
      title,
      description: opts.description,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
      duration: opts.duration ?? 5000,
      ...toActionProps(opts.action)
    })
  }

  function info(
    title: string,
    options?: string | AppToastOptions,
    icon = 'i-lucide-info'
  ): void {
    const opts = typeof options === 'string' ? { description: options } : (options ?? {})
    toast.add({
      title,
      description: opts.description,
      color: 'primary',
      icon,
      duration: opts.duration,
      ...toActionProps(opts.action)
    })
  }

  function warning(title: string, options?: string | AppToastOptions): void {
    const opts = typeof options === 'string' ? { description: options } : (options ?? {})
    toast.add({
      title,
      description: opts.description,
      color: 'warning',
      icon: 'i-lucide-triangle-alert',
      duration: opts.duration ?? 5000,
      ...toActionProps(opts.action)
    })
  }

  /** پیام خنثی/اطلاع‌رسانی سبک بدون رنگ برند */
  function neutral(title: string, icon = 'i-lucide-info'): void {
    toast.add({ title, color: 'neutral', icon })
  }

  /**
   * اعلان «قابل بازگشت» — برای کارهایی که کاربر ممکن است پشیمان شود
   * (حذف از نشان‌شده‌ها…). به‌جای دیالوگ تأیید، راه‌حل آرام‌تر.
   */
  function undoable(title: string, action: AppToastAction, description?: string): void {
    toast.add({
      title,
      description,
      color: 'neutral',
      icon: 'i-lucide-bookmark-x',
      duration: 6000,
      ...toActionProps(action)
    })
  }

  return { success, error, info, warning, neutral, undoable }
}
