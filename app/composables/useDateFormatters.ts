import { formatFaDate, formatFaTime, formatFaDateTime, isToday, isTomorrow, isThisWeek } from '~/utils/datetime'

/**
 * ابزارهای قالب‌بندی تاریخ و ساعت (فارسی/جلالی)
 * تابع‌های خواندن تاریخ و ساعت با ارقام و تقویم فارسی
 */
export function useDateFormatters() {
  /**
   * تبدیل تاریخ به برچسب خوانا (فارسی، جلالی)
   * Shows "امروز", "فردا", or the full date
   */
  function formatDateLabel(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    
    if (isToday(d)) {
      return 'امروز'
    }
    
    if (isTomorrow(d)) {
      return 'فردا'
    }
    
    return formatFaDate(d)
  }

  /**
   * ساعت به قالب فارسی (HH:MM با ارقام فارسی)
   */
  function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatFaTime(d)
  }

  /**
   * تاریخ و ساعت، کنار هم
   */
  function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatFaDateTime(d)
  }

  /**
   * آیا امروز است؟
   */
  function checkIsToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return isToday(d)
  }

  /**
   * آیا فردا است؟
   */
  function checkIsTomorrow(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return isTomorrow(d)
  }

  /**
   * آیا در همین هفته است؟
   */
  function checkIsThisWeek(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return isThisWeek(d)
  }

  /**
   * توضیح نسبی زمان (چند دقیقه/ساعت/روز دیگر)
   */
  function getRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    
    if (isToday(d)) {
      return 'امروز'
    }
    
    if (isTomorrow(d)) {
      return 'فردا'
    }
    
    const diffTime = d.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} روز پیش`
    }
    
    if (diffDays < 7) {
      return `${diffDays} روز دیگر`
    }
    
    return formatFaDate(d)
  }

  return {
    formatDateLabel,
    formatTime,
    formatDateTime,
    isToday: checkIsToday,
    isTomorrow: checkIsTomorrow,
    isThisWeek: checkIsThisWeek,
    getRelativeTime
  }
}
