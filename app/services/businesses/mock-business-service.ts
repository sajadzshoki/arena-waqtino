import type { Business, BusinessCategory, BusinessWithDistance } from '~/types/business'
import type { EntityId, Paginated } from '~/types/common'
import type { Employee } from '~/types/employee'
import type { BookableService } from '~/types/service'
import type { BookingServiceSnapshot } from '~/types/booking'
import { resolveBookingServiceSnapshot, resolveBusinessServices } from '~/services/mocks/service-state'
import { ServiceError } from '~/utils/errors'
import { MOCK_BUSINESSES, MOCK_CATEGORIES, MOCK_DISTANCES, MOCK_EMPLOYEES, MOCK_SERVICES } from '~/services/mocks/businesses'
import type { BusinessListQuery, BusinessService } from './business-service'

export class MockBusinessService implements BusinessService {
  async list(query: BusinessListQuery = {}): Promise<Paginated<Business>> {
    await delay()
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    if (flags.forceEmpty.value) {
      return { items: [], total: 0, page: query.page ?? 1, perPage: query.perPage ?? 10 }
    }

    const page = query.page ?? 1
    const perPage = query.perPage ?? 10
    const search = query.search?.trim()

    let items = MOCK_BUSINESSES.filter(b => b.status === 'active')
    if (query.categoryId) {
      items = items.filter(b => b.categoryId === query.categoryId)
    }
    if (search) {
      const lowerSearch = search.toLowerCase()
      // جستجو در نام/توضیح کسب‌وکار + نام خدمات
      const serviceBizIds = MOCK_SERVICES
        .filter(s => s.name.toLowerCase().includes(lowerSearch))
        .map(s => s.businessId)

      items = items.filter(
        b =>
          b.name.includes(search) ||
          b.description.includes(search) ||
          serviceBizIds.includes(b.id)
      )
    }

    const start = (page - 1) * perPage
    return {
      items: items.slice(start, start + perPage),
      total: items.length,
      page,
      perPage
    }
  }

  async getById(id: EntityId): Promise<Business | null> {
    await delay(200)
    return MOCK_BUSINESSES.find(b => b.id === id) ?? null
  }

  async listCategories(): Promise<BusinessCategory[]> {
    await delay(150)
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    return MOCK_CATEGORIES
  }

  async listFeatured(): Promise<Business[]> {
    await delay(300)
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    // کسب‌وکارهای تاییدشده با امتیاز بالا
    return MOCK_BUSINESSES
      .filter(b => b.status === 'active' && b.isVerified)
      .sort((a, b) => b.rating.average - a.rating.average)
      .slice(0, 5)
  }

  async listPopular(): Promise<Business[]> {
    await delay(250)
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    // محبوب‌ترین‌ها بر اساس تعداد نظر × میانگین امتیاز
    return MOCK_BUSINESSES
      .filter(b => b.status === 'active')
      .sort((a, b) => (b.rating.average * b.rating.count) - (a.rating.average * a.rating.count))
      .slice(0, 5)
  }

  async listNearby(): Promise<BusinessWithDistance[]> {
    await delay(350)
    const flags = useMockFlags()
    if (flags.forceError.value) throw ServiceError.network()
    return MOCK_BUSINESSES
      .filter(b => b.status === 'active' && MOCK_DISTANCES[b.id] !== undefined)
      .map(b => ({
        ...b,
        distanceKm: MOCK_DISTANCES[b.id] ?? 0
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5)
  }

  async listServices(businessId: EntityId): Promise<BookableService[]> {
    await delay(200)
    // «قابل رزرو بودن» همین‌جا تصمیم گرفته می‌شود (نه در UI): فهرست مشتری فقط
    // سرویس‌های active است و همان حالتی است که مدیر تغییرش می‌دهد.
    return resolveBusinessServices(businessId).filter(s => s.status === 'active')
  }

  async getServiceForHistory(serviceId: EntityId): Promise<BookingServiceSnapshot | null> {
    // بدون فلگ‌های شبیه‌سازی: این خواندن «تاریخچه» است، نه فهرست کشف/رزرو.
    await delay(150)
    return resolveBookingServiceSnapshot({ serviceId })
  }

  async listEmployees(businessId: EntityId): Promise<Employee[]> {
    await delay(200)
    return MOCK_EMPLOYEES.filter(e => e.businessId === businessId && e.isActive)
  }
}
