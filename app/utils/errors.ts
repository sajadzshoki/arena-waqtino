/**
 * خطای استاندارد لایهٔ سرویس + طبقه‌بندی پایدار.
 * سرویس‌های واقعی (API) خطاهای HTTP را هم به همین شکل تبدیل می‌کنند تا
 * صفحات/کامپوزبل‌ها با یک شکل خطای واحد روبه‌رو باشند (شبکه/عدم دسترسی/…).
 */
export type ServiceErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'UNKNOWN_ERROR'

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode | (string & {}),
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

  static unauthorized(message = 'برای انجام این کار ابتدا وارد شوید.'): ServiceError {
    return new ServiceError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message = 'به این بخش دسترسی ندارید.'): ServiceError {
    return new ServiceError('FORBIDDEN', message, 403)
  }

  static notFound(message = 'مورد درخواستی یافت نشد.'): ServiceError {
    return new ServiceError('NOT_FOUND', message, 404)
  }

  static validation(message: string): ServiceError {
    return new ServiceError('VALIDATION_ERROR', message, 422)
  }
}

export function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error
  if (error instanceof Error) {
    return new ServiceError('UNKNOWN_ERROR', error.message || 'خطای ناشناخته رخ داد.', 500)
  }
  return new ServiceError('UNKNOWN_ERROR', 'خطای ناشناخته رخ داد.', 500)
}
