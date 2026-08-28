import type { Business, BusinessCategory } from '~/types/business'
import type { Employee } from '~/types/employee'
import type { BookableService } from '~/types/service'

/**
 * داده‌های اولیهٔ واقع‌گرایانهٔ فارسی برای توسعه.
 * قانون: نام‌ها/قیمت‌ها/توضیح‌ها باید مثل دادهٔ واقعی وقتی‌نو به نظر برسند؛
 * لورم‌ایپسوم و Business 1 ممنوع. همهٔ مقادیر بعداً با پاسخ API جایگزین می‌شوند.
 */

export const MOCK_CATEGORIES: BusinessCategory[] = [
  { id: 'cat_beauty', slug: 'beauty', name: 'زیبایی و آرایش', icon: 'i-lucide-sparkles' },
  { id: 'cat_health', slug: 'health', name: 'پزشکی و درمان', icon: 'i-lucide-stethoscope' },
  { id: 'cat_sport', slug: 'sport', name: 'ورزش و سلامت', icon: 'i-lucide-dumbbell' },
  { id: 'cat_auto', slug: 'auto', name: 'خودرو', icon: 'i-lucide-car' },
  { id: 'cat_education', slug: 'education', name: 'آموزش', icon: 'i-lucide-graduation-cap' },
  { id: 'cat_consult', slug: 'consulting', name: 'مشاوره', icon: 'i-lucide-messages-square' },
  { id: 'cat_photo', slug: 'photo', name: 'عکاسی', icon: 'i-lucide-camera' },
  { id: 'cat_home', slug: 'home', name: 'خدمات منزل', icon: 'i-lucide-house-plus' },
  { id: 'cat_pets', slug: 'pets', name: 'حیوانات خانگی', icon: 'i-lucide-paw-print' }
]

export const MOCK_BUSINESSES: Business[] = [
  {
    id: 'biz_narenj',
    slug: 'narenj-beauty',
    name: 'سالن زیبایی نارنج',
    categoryId: 'cat_beauty',
    description:
      'سالن زیبایی نارنج با بیش از ده سال تجربه در خدمات تخصصی مو، پوست و میکاپ، در محلهٔ سعادت‌آباد تهران آمادهٔ پذیرش شماست. رزرو آنلاین نوبت برای رنگ و لایت، کراتینه و میکاپ عروس انجام می‌شود.',
    phone: '02122083145',
    address: { city: 'تهران', district: 'سعادت‌آباد', street: 'بلوار دریا، نبش خیابان مطهری' },
    coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.6, count: 218 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_dev_sara',
    createdAt: '2025-11-02T08:30:00.000Z'
  },
  {
    id: 'biz_pars',
    slug: 'pars-dental',
    name: 'کلینیک دندانپزشکی پارس',
    categoryId: 'cat_health',
    description:
      'کلینیک دندانپزشکی پارس با کادر متخصص در زمینه‌های ایمپلنت، ارتودنسی و زیبایی لبخند، خدمات ویزیت و درمان را با نوبت‌دهی آنلاین ارائه می‌کند.',
    phone: '02188650210',
    address: { city: 'تهران', district: 'ونک', street: 'میدان ونک، برج گلدیس، طبقهٔ ۴' },
    coverImageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.8, count: 342 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_pars',
    createdAt: '2025-09-14T10:00:00.000Z'
  },
  {
    id: 'biz_energy',
    slug: 'energy-gym',
    name: 'باشگاه بدنسازی انرژی',
    categoryId: 'cat_sport',
    description:
      'باشگاه انرژی با دستگاه‌های به‌روز قدرتی و هوازی، کلاس‌های کراس‌فیت و مربیان رسمی فدراسیون. امکان رزرو جلسهٔ مشاورهٔ بدن‌سازی و برنامهٔ تمرینی اختصاصی.',
    phone: '02166742018',
    address: { city: 'تهران', district: 'سعادت‌آباد', street: 'خیابان علامه شمالی، پلاک ۲۷' },
    coverImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.3, count: 156 },
    isVerified: false,
    status: 'active',
    ownerUserId: 'usr_owner_energy',
    createdAt: '2026-01-20T09:00:00.000Z'
  },
  {
    id: 'biz_shoka',
    slug: 'shoka-auto',
    name: 'تعمیرگاه تخصصی شوکا',
    categoryId: 'cat_auto',
    description:
      'تعمیرگاه تخصصی شوکا؛ تشخیص عیب با دیاگ، تعمیرات برق و مکانیک خودروهای داخلی و وارداتی. نوبت سرویس دوره‌ای و تعویض روغن را آنلاین رزرو کنید.',
    phone: '02133907044',
    address: { city: 'تهران', district: 'صادقیه', street: 'بلوار اشرفی اصفهانی، خیابان صدوقی' },
    coverImageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.1, count: 89 },
    isVerified: false,
    status: 'active',
    ownerUserId: 'usr_owner_shoka',
    createdAt: '2026-03-08T07:30:00.000Z'
  },
  {
    id: 'biz_ruyesh',
    slug: 'ruyesh-language',
    name: 'آموزشگاه زبان رویش',
    categoryId: 'cat_education',
    description:
      'آموزشگاه زبان رویش، برگزارکنندهٔ دوره‌های آیلتس، مکالمهٔ انگلیسی و آلمانی با اساتید مجرب. جلسهٔ تعیین سطح رایگان را به‌صورت آنلاین رزرو کنید.',
    phone: '02188774156',
    address: { city: 'تهران', district: 'فاطمی', street: 'خیابان فاطمی، روبه‌روی دانشگاه تهران' },
    coverImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.7, count: 274 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_ruyesh',
    createdAt: '2025-08-05T11:15:00.000Z'
  },
  {
    id: 'biz_noora',
    slug: 'noora-studio',
    name: 'استودیو عکاسی نورا',
    categoryId: 'cat_photo',
    description:
      'استودیو نورا؛ عکاسی پرتره، مدلینگ و عروس با نورپردازی حرفه‌ای. رزرو سانس‌های استودیو و پکیج‌های عکاسی خانوادگی به‌صورت آنلاین.',
    phone: '02144330851',
    address: { city: 'تهران', district: 'نارمک', street: 'میدان هنگام، خیابان فرجام' },
    coverImageUrl: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.5, count: 121 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_noora',
    createdAt: '2025-12-18T13:45:00.000Z'
  },
  {
    id: 'biz_aramesh',
    slug: 'aramesh-consulting',
    name: 'مرکز مشاوره آرامش',
    categoryId: 'cat_consult',
    description:
      'مرکز مشاوره آرامش؛ مشاوره فردی، خانوادگی و زوج‌درمانی با روانشناسان مجرب. وقت مشاوره حضوری و آنلاین را آنلاین رزرو کنید.',
    phone: '02188993344',
    address: { city: 'تهران', district: 'یوسف‌آباد', street: 'خیابان اسدآبادی، پلاک ۵۴' },
    coverImageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.9, count: 187 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_aramesh',
    createdAt: '2025-07-22T14:00:00.000Z'
  },
  {
    id: 'biz_tamiraz',
    slug: 'tamiraz-home',
    name: 'خدمات نظافتی تمیزآز',
    categoryId: 'cat_home',
    description:
      'خدمات نظافت منزل، محل کار و مشاعات با نیروهای مجرب و بیمه‌شده. رزرو آنلاین نوبت نظافت ساعتی و دوره‌ای.',
    phone: '02155443322',
    address: { city: 'تهران', district: 'پونک', street: 'میدان پونک، خیابان عدل' },
    coverImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.4, count: 203 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_tamiraz',
    createdAt: '2025-10-11T09:30:00.000Z'
  },
  {
    id: 'biz_petland',
    slug: 'petland-clinic',
    name: 'کلینیک دامپزشکی پتلند',
    categoryId: 'cat_pets',
    description:
      'کلینیک دامپزشکی پتلند؛ واکسیناسیون، چکاپ، grooming و جراحی حیوانات خانگی. نوبت‌دهی آنلاین برای سگ، گربه و پرندگان.',
    phone: '02144778899',
    address: { city: 'تهران', district: 'ونک', street: 'خیابان ونک، نبش کوچهٔ نیلوفر' },
    coverImageUrl: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.7, count: 145 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_petland',
    createdAt: '2025-11-30T11:00:00.000Z'
  },
  {
    id: 'biz_barbershop',
    slug: 'gentleman-barbershop',
    name: 'آرایشگاه مردانه جنتلمن',
    categoryId: 'cat_beauty',
    description:
      'آرایشگاه مردانه جنتلمن؛ اصلاح مو و ریش، پاکسازی پوست و خدمات VIP با رزرو آنلاین نوبت.',
    phone: '02177665544',
    address: { city: 'تهران', district: 'تجریش', street: 'میدان تجریش، بازار تجریش، پلاک ۱۲' },
    coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop',
    logoUrl: null,
    gallery: [],
    rating: { average: 4.5, count: 312 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_barber',
    createdAt: '2025-06-15T10:30:00.000Z'
  }
]

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp_sara_pars',
    businessId: 'biz_pars',
    userId: 'usr_dev_sara',
    name: 'سارا محمدی',
    title: 'هماهنگ‌کنندهٔ نوبت‌ها و پذیرش',
    avatarUrl: null,
    isActive: true
  },
  {
    id: 'emp_elham_pars',
    businessId: 'biz_pars',
    userId: 'usr_dev_elham',
    name: 'الهه احمدی',
    title: 'منشی و هماهنگ‌کنندهٔ نوبت‌ها',
    avatarUrl: null,
    isActive: true
  },
  {
    id: 'emp_dr_ranjbar',
    businessId: 'biz_pars',
    name: 'دکتر کیان رنجبر',
    title: 'متخصص ایمپلنت',
    avatarUrl: null,
    isActive: true
  },
  {
    id: 'emp_mina_narenj',
    businessId: 'biz_narenj',
    name: 'مینا رحیمی',
    title: 'آرایشگر مو و رنگ',
    avatarUrl: null,
    isActive: true
  },
  {
    id: 'emp_omid_narenj',
    businessId: 'biz_narenj',
    name: 'امید کاظمی',
    title: 'متخصص پوست',
    avatarUrl: null,
    isActive: true
  }
]

export const MOCK_SERVICES: BookableService[] = [
  {
    id: 'srv_narenj_color',
    businessId: 'biz_narenj',
    name: 'رنگ و لایت کامل مو',
    description: 'شامل مشاورهٔ رنگ، تست حساسیت و ماسک ترمیمی پایان کار',
    price: 3_200_000,
    durationMinutes: 180,
    employeeIds: ['emp_mina_narenj'],
    isActive: true
  },
  {
    id: 'srv_narenj_keratin',
    businessId: 'biz_narenj',
    name: 'کراتینه و احیای مو',
    price: 2_450_000,
    durationMinutes: 120,
    employeeIds: ['emp_mina_narenj'],
    isActive: true
  },
  {
    id: 'srv_narenj_skin',
    businessId: 'biz_narenj',
    name: 'فیشیال و پاکسازی پوست',
    price: 890_000,
    durationMinutes: 60,
    employeeIds: ['emp_omid_narenj'],
    isActive: true
  },
  {
    id: 'srv_pars_visit',
    businessId: 'biz_pars',
    name: 'ویزیت و معاینهٔ دندان',
    price: 450_000,
    durationMinutes: 30,
    isActive: true
  },
  {
    id: 'srv_pars_implant',
    businessId: 'biz_pars',
    name: 'جلسهٔ مشاورهٔ ایمپلنت',
    description: 'ارزیابی استخوان فک، بررسی عکس CBCT و ارائهٔ طرح درمان',
    price: 600_000,
    durationMinutes: 45,
    employeeIds: ['emp_dr_ranjbar'],
    isActive: true
  },
  {
    id: 'srv_energy_consult',
    businessId: 'biz_energy',
    name: 'جلسهٔ مشاورهٔ بدن‌سازی',
    price: 350_000,
    durationMinutes: 45,
    isActive: true
  },
  {
    id: 'srv_ruyesh_level',
    businessId: 'biz_ruyesh',
    name: 'تعیین سطح زبان انگلیسی',
    description: 'مصاحبهٔ شفاهی + آزمون کتبی کوتاه',
    price: 0,
    durationMinutes: 30,
    isActive: true
  }
]

/**
 * فاصله‌های mock — جایگزین محاسبهٔ واقعی جغرافیایی وقتی بک‌اند لوکیشن آماده شود.
 * اعداد بر اساس فاصلهٔ تقریبی از مرکز تهران (میدان ولیعصر).
 */
export const MOCK_DISTANCES: Record<string, number> = {
  biz_narenj: 4.2,
  biz_pars: 3.1,
  biz_energy: 4.8,
  biz_shoka: 6.5,
  biz_ruyesh: 2.3,
  biz_noora: 5.7,
  biz_aramesh: 3.4,
  biz_tamiraz: 7.1,
  biz_petland: 3.8,
  biz_barbershop: 8.2
}
