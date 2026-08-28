export interface BusinessCategory {
  id: EntityId
  slug: string
  /** نام فارسی دسته‌بندی، مثل «زیبایی و آرایش» */
  name: string
  /** نام آیکون lucide برای نمایش در UI */
  icon: string
}

export interface BusinessAddress {
  city: string
  district: string
  street?: string
  geo?: GeoPoint
}

export interface BusinessRating {
  average: number
  count: number
}

/** وضعیت چرخهٔ حیات کسب‌وکار در پلتفرم */
export type BusinessStatus = 'active' | 'pending_review' | 'suspended'

export interface Business {
  id: EntityId
  slug: string
  name: string
  categoryId: EntityId
  description: string
  phone?: string
  address: BusinessAddress
  coverImageUrl?: string | null
  logoUrl?: string | null
  gallery: string[]
  rating: BusinessRating
  isVerified: boolean
  status: BusinessStatus
  ownerUserId: EntityId
  createdAt: ISODateTime
}

/** کسب‌وکار + فاصلهٔ تقریبی از کاربر — برای بخش «نزدیک شما». */
export interface BusinessWithDistance extends Business {
  /** فاصلهٔ تقریبی به کیلومتر */
  distanceKm: number
}

/** ترتیب نمایش بخش‌های صفحهٔ کشف. */
export type DiscoverySectionKey = 'featured' | 'popular' | 'nearby' | 'recent'
