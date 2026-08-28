import { formatFaDate, formatFaTime, formatFaDateTime, isToday, isTomorrow, isThisWeek } from '~/utils/datetime'

/**
 * Composable for date formatting utilities
 * Provides Persian date/time formatting functions
 */
export function useDateFormatters() {
  /**
   * Format a date to a readable Persian label
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
   * Format time in Persian format (HH:MM)
   */
  function formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatFaTime(d)
  }

  /**
   * Format date and time together
   */
  function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatFaDateTime(d)
  }

  /**
   * Check if date is today
   */
  function checkIsToday(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return isToday(d)
  }

  /**
   * Check if date is tomorrow
   */
  function checkIsTomorrow(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return isTomorrow(d)
  }

  /**
   * Check if date is this week
   */
  function checkIsThisWeek(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date
    return isThisWeek(d)
  }

  /**
   * Get relative time description
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
