/**
 * الگوی واحد اعلان‌های درون‌اپی (toast).
 * به‌جای toast.add با رنگ/آیکون پراکنده، از متدهای معنایی استفاده کنید.
 */
export function useAppToast() {
  const toast = useToast()

  /** حذف «زود از بین می‌رود»، رنگ/آیکون ثابت هر نوع */
  function success(title: string, description?: string): void {
    toast.add({
      title,
      description,
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
  }

  function error(title: string, description?: string): void {
    toast.add({
      title,
      description,
      color: 'error',
      icon: 'i-lucide-triangle-alert',
      duration: 5000
    })
  }

  function info(title: string, description?: string, icon = 'i-lucide-info'): void {
    toast.add({ title, description, color: 'primary', icon })
  }

  /** پیام خنثی/اطلاع‌رسانی سبک بدون رنگ برند */
  function neutral(title: string, icon = 'i-lucide-info'): void {
    toast.add({ title, color: 'neutral', icon })
  }

  return { success, error, info, neutral }
}
