/**
 * خطای استاندارد لایهٔ سرویس.
 * سرویس‌های واقعی (API) خطاهای HTTP را هم به همین شکل تبدیل می‌کنند تا
 * کامپوزبل‌ها/صفحات با یک شکل خطای واحد روبه‌رو باشند.
 */
export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message)
    this.name = 'ServiceError'
  }

  static network(): ServiceError {
    return new ServiceError(
      'NETWORK_ERROR',
      'اتصال اینترنت برقرار نشد. دوباره تلاش کنید.',
      0
    )
  }
}

export function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error
  if (error instanceof Error) {
    return new ServiceError('UNKNOWN_ERROR', error.message || 'خطای ناشناخته رخ داد.', 500)
  }
  return new ServiceError('UNKNOWN_ERROR', 'خطای ناشناخته رخ داد.', 500)
}
