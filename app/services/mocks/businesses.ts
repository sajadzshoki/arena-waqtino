import type { Business, BusinessCategory } from '~/types/business'
import type { Employee } from '~/types/employee'
import type { BookableService } from '~/types/service'
import type { AvailabilityDay, AvailabilitySchedule, Weekday } from '~/types/availability'
import { APP_TIMEZONE } from '~/config/timezone'
import { WEEKDAY_ORDER } from '~/config/availability'

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
      'سالن زیبایی نارنج با بیش از ده سال تجربه در خدمات تخصصی مو، پوست و میکاپ، در محلهٔ سعادت‌آباد تهران آمادهٔ پذیرش شماست. ما با استفاده از محصولات مرغوب و تکنیک‌های روز دنیا، تلاش می‌کنیم بهترین تجربهٔ زیبایی را برای شما فراهم کنیم. تیم حرفه‌ای ما در زمینهٔ رنگ و لایت، کراتینه، میکاپ عروس و مراقبت‌های پوست فعالیت می‌کند.',
    phone: '02122083145',
    address: { city: 'تهران', district: 'سعادت‌آباد', street: 'بلوار دریا، نبش خیابان مطهری' },
    coverImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=400&fit=crop'
    ],
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
      'کلینیک دندانپزشکی پارس با کادر متخصص در زمینه‌های ایمپلنت، ارتودنسی و زیبایی لبخند، خدمات ویزیت و درمان را با نوبت‌دهی آنلاین ارائه می‌کند. تجهیزات مدرن و محیطی بهداشتی در انتظار شماست. ما با بیش از ۱۵ سال سابقه، خدمات دندانپزشکی عمومی و تخصصی را با بالاترین کیفیت ارائه می‌دهیم.',
    phone: '02188650210',
    address: { city: 'تهران', district: 'ونک', street: 'میدان ونک، برج گلدیس، طبقهٔ ۴' },
    coverImageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1598256989800-feebf06a241a?w=400&h=400&fit=crop'
    ],
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
      'باشگاه انرژی با دستگاه‌های به‌روز قدرتی و هوازی، کلاس‌های کراس‌فیت و مربیان رسمی فدراسیون. امکان رزرو جلسهٔ مشاورهٔ بدن‌سازی و برنامهٔ تمرینی اختصاصی. محیطی حرفه‌ای و دوستانه برای همهٔ سطوح آمادگی جسمانی.',
    phone: '02166742018',
    address: { city: 'تهران', district: 'سعادت‌آباد', street: 'خیابان علامه شمالی، پلاک ۲۷' },
    coverImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=400&fit=crop'
    ],
    rating: { average: 4.3, count: 156 },
    isVerified: false,
    status: 'active',
    // بهرام (09222222222) مدیر همین کسب‌وکار است — مالکیت از همین فیلد خوانده می‌شود
    ownerUserId: 'usr_dev_bahram',
    createdAt: '2026-01-20T09:00:00.000Z'
  },
  {
    id: 'biz_shoka',
    slug: 'shoka-auto',
    name: 'تعمیرگاه تخصصی شوکا',
    categoryId: 'cat_auto',
    description:
      'تعمیرگاه تخصصی شوکا؛ تشخیص عیب با دیاگ، تعمیرات برق و مکانیک خودروهای داخلی و وارداتی. نوبت سرویس دوره‌ای و تعویض روغن را آنلاین رزرو کنید. با بیش از ۲۰ سال تجربه در تعمیرات خودرو.',
    phone: '02133907044',
    address: { city: 'تهران', district: 'صادقیه', street: 'بلوار اشرفی اصفهانی، خیابان صدوقی' },
    coverImageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1530046339915-78e95e5f7e7f?w=400&h=400&fit=crop'
    ],
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
      'آموزشگاه زبان رویش، برگزارکنندهٔ دوره‌های آیلتس، مکالمهٔ انگلیسی و آلمانی با اساتید مجرب. جلسهٔ تعیین سطح رایگان را به‌صورت آنلاین رزرو کنید. کلاس‌ها به‌صورت خصوصی و نیمه‌خصوصی برگزار می‌شود.',
    phone: '02188774156',
    address: { city: 'تهران', district: 'فاطمی', street: 'خیابان فاطمی، روبه‌روی دانشگاه تهران' },
    coverImageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop'
    ],
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
      'استودیو نورا؛ عکاسی پرتره، مدلینگ و عروس با نورپردازی حرفه‌ای. رزرو سانس‌های استودیو و پکیج‌های عکاسی خانوادگی به‌صورت آنلاین. با بیش از ۸ سال تجربه در عکاسی حرفه‌ای.',
    phone: '02144330851',
    address: { city: 'تهران', district: 'نارمک', street: 'میدان هنگام، خیابان فرجام' },
    coverImageUrl: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=400&h=400&fit=crop'
    ],
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
      'مرکز مشاوره آرامش؛ مشاوره فردی، خانوادگی و زوج‌درمانی با روانشناسان مجرب. وقت مشاوره حضوری و آنلاین را آنلاین رزرو کنید. رویکرد ما مبتنی بر روش‌های علمی و به‌روز روانشناسی است.',
    phone: '02188993344',
    address: { city: 'تهران', district: 'یوسف‌آباد', street: 'خیابان اسدآبادی، پلاک ۵۴' },
    coverImageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=400&fit=crop'
    ],
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
      'خدمات نظافت منزل، محل کار و مشاعات با نیروهای مجرب و بیمه‌شده. رزرو آنلاین نوبت نظافت ساعتی و دوره‌ای. استفاده از مواد شویندهٔ مرغوب و تجهیزات حرفه‌ای.',
    phone: '02155443322',
    address: { city: 'تهران', district: 'پونک', street: 'میدان پونک، خیابان عدل' },
    coverImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=400&fit=crop'
    ],
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
      'کلینیک دامپزشکی پتلند؛ واکسیناسیون، چکاپ، grooming و جراحی حیوانات خانگی. نوبت‌دهی آنلاین برای سگ، گربه و پرندگان. تیمی از دامپزشکان متخصص با تجربه.',
    phone: '02144778899',
    address: { city: 'تهران', district: 'ونک', street: 'خیابان ونک، نبش کوچهٔ نیلوفر' },
    coverImageUrl: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop'
    ],
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
      'آرایشگاه مردانه جنتلمن؛ اصلاح مو و ریش، پاکسازی پوست و خدمات VIP با رزرو آنلاین نوبت. محیطی لوکس و حرفه‌ای برای آقایان. استفاده از محصولات اصل و درجه یک.',
    phone: '02177665544',
    address: { city: 'تهران', district: 'تجریش', street: 'میدان تجریش، بازار تجریش، پلاک ۱۲' },
    coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=500&fit=crop',
    logoUrl: null,
    gallery: [
      'https://images.unsplash.com/photo-1585747860019-8968b03467dc?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665f33?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop'
    ],
    rating: { average: 4.5, count: 312 },
    isVerified: true,
    status: 'active',
    ownerUserId: 'usr_owner_barber',
    createdAt: '2025-06-15T10:30:00.000Z'
  },
  {
    // سناریوی فاز ۸: کسب‌وکار دومِ «سارا» — تازه ثبت‌شده، هنوز نوبتی ندارد
    // و در وضعیت «در انتظار بررسی» است (نمایش صادقانهٔ حالت خالی + وضعیت غیرفعال).
    id: 'biz_ayeneh',
    slug: 'ayeneh-salon',
    name: 'آرایشگاه زنانه آینه',
    categoryId: 'cat_beauty',
    description:
      'آرایشگاه زنانه آینه در یوسف‌آباد؛ اصلاح مو، رنگ و مش، شینیون و بستهٔ عروسی. تازه به وقتینو پیوسته و در حال تکمیل خدمات و ساعت کاری است.',
    phone: '02155667788',
    address: { city: 'تهران', district: 'یوسف‌آباد', street: 'خیابان فرشته، پلاک ۹' },
    coverImageUrl: null,
    logoUrl: null,
    gallery: [],
    rating: { average: 0, count: 0 },
    isVerified: false,
    status: 'pending_review',
    ownerUserId: 'usr_dev_sara',
    createdAt: '2026-08-20T10:15:00.000Z'
  },
]

export const MOCK_EMPLOYEES: Employee[] = [
  // مدل فاز ۱۰: نام در دو جزء نگه داشته می‌شود (نام نمایشی مشتق‌شده است)، رابطهٔ
  // سرویس‌ها *این‌جا* ذخیره می‌شود (`serviceIds`)، و `userId` اختیاری است —
  // پرسنل می‌تواند حساب وقتینو نداشته باشد. `phone` هم هیچوقت معنی حساب نیست.
  {
    id: 'emp_sara_pars',
    businessId: 'biz_pars',
    userId: 'usr_dev_sara',
    firstName: 'سارا',
    lastName: 'محمدی',
    title: 'هماهنگ‌کنندهٔ نوبت‌ها و پذیرش',
    avatarUrl: null,
    status: 'active',
    serviceIds: [],
  },
  {
    id: 'emp_elham_pars',
    businessId: 'biz_pars',
    userId: 'usr_dev_elham',
    firstName: 'الهه',
    lastName: 'احمدی',
    title: 'منشی و هماهنگ‌کنندهٔ نوبت‌ها',
    avatarUrl: null,
    status: 'active',
    serviceIds: [],
  },
  {
    id: 'emp_dr_ranjbar',
    businessId: 'biz_pars',
    firstName: 'دکتر کیان',
    lastName: 'رنجبر',
    title: 'متخصص ایمپلنت',
    phone: '09301110022',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_pars_implant'],
  },
  {
    id: 'emp_dr_mirzaei',
    businessId: 'biz_pars',
    firstName: 'دکتر فرهاد',
    lastName: 'میرزایی',
    title: 'متخصص ارتودنسی',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_pars_ortho'],
  },
  {
    id: 'emp_mina_narenj',
    businessId: 'biz_narenj',
    firstName: 'مینا',
    lastName: 'رحیمی',
    title: 'آرایشگر مو و رنگ',
    phone: '09122223344',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_narenj_color', 'srv_narenj_keratin', 'srv_narenj_haircut'],
  },
  {
    id: 'emp_omid_narenj',
    businessId: 'biz_narenj',
    firstName: 'امید',
    lastName: 'کاظمی',
    title: 'متخصص پوست',
    phone: '09125556677',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_narenj_skin'],
  },
  {
    id: 'emp_nike_narenj',
    businessId: 'biz_narenj',
    firstName: 'نیک',
    lastName: 'آهنگ',
    title: 'میکاپ آرتیست عروس',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_narenj_bridal'],
  },
  {
    id: 'emp_reza_energy',
    businessId: 'biz_energy',
    userId: 'usr_dev_bahram',
    firstName: 'رضا',
    lastName: 'کریمی',
    title: 'مربی بدن‌سازی',
    phone: '09351112233',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_energy_personal'],
  },
  {
    id: 'emp_ali_energy',
    businessId: 'biz_energy',
    firstName: 'علی',
    lastName: 'حسینی',
    title: 'مربی کراس‌فیت',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_energy_crossfit'],
  },
  {
    id: 'emp_maryam_aramesh',
    businessId: 'biz_aramesh',
    firstName: 'مریم',
    lastName: 'سلطانی',
    title: 'روانشناس بالینی',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_aramesh_individual'],
  },
  {
    id: 'emp_hassan_aramesh',
    businessId: 'biz_aramesh',
    firstName: 'حسن',
    lastName: 'نوری',
    title: 'مشاور خانواده',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_aramesh_couple', 'srv_aramesh_family'],
  },
  {
    id: 'emp_shima_ruyesh',
    businessId: 'biz_ruyesh',
    firstName: 'شیما',
    lastName: 'عباسی',
    title: 'مدرس زبان انگلیسی (IELTS)',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_ruyesh_ielts'],
  },
  {
    id: 'emp_amir_noora',
    businessId: 'biz_noora',
    firstName: 'امیر',
    lastName: 'جعفری',
    title: 'عکاس پرتره و مدلینگ',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_noora_portrait', 'srv_noora_family'],
  },
  {
    id: 'emp_reza_barber',
    businessId: 'biz_barbershop',
    firstName: 'رضا',
    lastName: 'صادقی',
    title: 'آرایشگر ارشد',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_barber_cut', 'srv_barber_vip'],
  },
  {
    id: 'emp_mehdi_barber',
    businessId: 'biz_barbershop',
    firstName: 'مهدی',
    lastName: 'قاسمی',
    title: 'متخصص اصلاح ریش',
    avatarUrl: null,
    status: 'active',
    serviceIds: ['srv_barber_beard'],
  },
  {
    // سناریوهای فاز ۱۰: «پرسنل بدون سرویس» + «فقط تاریخچه» (حذف مجاز با توضیح)
    id: 'emp_samin_narenj',
    businessId: 'biz_narenj',
    firstName: 'سامین',
    lastName: 'نویدی',
    title: 'هماهنگ‌کنندهٔ سالن',
    avatarUrl: null,
    status: 'active',
    serviceIds: [],
  },
  {
    // سناریوی «غیرفعال» + «غیرفعال را می‌شود فعال کرد و به انتخاب رزرو برگردد»
    id: 'emp_yasmin_narenj',
    businessId: 'biz_narenj',
    firstName: 'یاسمین',
    lastName: 'فروزش',
    title: 'میکاپ آرتیست',
    phone: '09387778899',
    avatarUrl: null,
    status: 'inactive',
    serviceIds: ['srv_narenj_bridal'],
  }
]

export const MOCK_SERVICES: BookableService[] = [
  // === سالن نارنج ===
  {
    id: 'srv_narenj_color',
    businessId: 'biz_narenj',
    name: 'رنگ و لایت کامل مو',
    description: 'شامل مشاورهٔ رنگ، تست حساسیت و ماسک ترمیمی پایان کار',
    price: 3_200_000,
    durationMinutes: 180,
    status: 'active'
  },
  {
    id: 'srv_narenj_keratin',
    businessId: 'biz_narenj',
    name: 'کراتینه و احیای مو',
    description: 'کراتینه برزیلی با مواد درجه یک + پروتئین‌تراپی',
    price: 2_450_000,
    durationMinutes: 120,
    status: 'active'
  },
  {
    id: 'srv_narenj_skin',
    businessId: 'biz_narenj',
    name: 'فیشیال و پاکسازی پوست',
    description: 'پاکسازی عمیق + ماسک مناسب نوع پوست',
    price: 890_000,
    durationMinutes: 60,
    status: 'active'
  },
  {
    id: 'srv_narenj_bridal',
    businessId: 'biz_narenj',
    name: 'میکاپ عروس',
    description: 'میکاپ حرفه‌ای عروس + تست میکاپ + شینیون مو',
    price: 8_500_000,
    durationMinutes: 240,
    status: 'active'
  },
  {
    id: 'srv_narenj_haircut',
    businessId: 'biz_narenj',
    name: 'کوتاهی و مدل مو',
    description: 'شامل شستشو، کوتاهی و حالت‌دهی',
    price: 450_000,
    durationMinutes: 45,
    status: 'active'
  },

  // === کلینیک پارس ===
  {
    id: 'srv_pars_visit',
    businessId: 'biz_pars',
    name: 'ویزیت و معاینهٔ دندان',
    description: 'معاینه کامل + عکس‌برداری در صورت نیاز',
    price: 450_000,
    durationMinutes: 30,
    status: 'active'
  },
  {
    id: 'srv_pars_implant',
    businessId: 'biz_pars',
    name: 'جلسهٔ مشاورهٔ ایمپلنت',
    description: 'ارزیابی استخوان فک، بررسی عکس CBCT و ارائهٔ طرح درمان',
    price: 600_000,
    durationMinutes: 45,
    status: 'active'
  },
  {
    id: 'srv_pars_scaling',
    businessId: 'biz_pars',
    name: 'جرم‌گیری و بروساژ',
    description: 'تمیز کردن حرفه‌ای دندان + پولیش',
    price: 750_000,
    durationMinutes: 45,
    status: 'active'
  },
  {
    id: 'srv_pars_whitening',
    businessId: 'biz_pars',
    name: 'بلیچینگ (سفیدکردن) دندان',
    description: 'سفیدکردن دندان با لیزر در یک جلسه',
    price: 3_800_000,
    durationMinutes: 60,
    status: 'active'
  },
  {
    id: 'srv_pars_ortho',
    businessId: 'biz_pars',
    name: 'مشاورهٔ ارتودنسی',
    description: 'بررسی ناهنجاری فک و دندان + طرح درمان ارتودنسی',
    price: 500_000,
    durationMinutes: 30,
    status: 'active'
  },

  // === باشگاه انرژی ===
  {
    id: 'srv_energy_consult',
    businessId: 'biz_energy',
    name: 'جلسهٔ مشاورهٔ بدن‌سازی',
    description: 'آنالیز بدن + تنظیم برنامهٔ تمرینی + توصیهٔ تغذیه‌ای',
    price: 350_000,
    durationMinutes: 45,
    status: 'active'
  },
  {
    id: 'srv_energy_crossfit',
    businessId: 'biz_energy',
    name: 'کلاس گروهی کراس‌فیت',
    description: 'کلاس ۶۰ دقیقه‌ای کراس‌فیت با مربی رسمی',
    price: 180_000,
    durationMinutes: 60,
    status: 'active'
  },
  {
    id: 'srv_energy_personal',
    businessId: 'biz_energy',
    name: 'جلسهٔ تمرین خصوصی',
    description: 'یک جلسه تمرین خصوصی با مربی اختصاصی',
    price: 500_000,
    durationMinutes: 60,
    status: 'active'
  },

  // === آموزشگاه رویش ===
  {
    id: 'srv_ruyesh_level',
    businessId: 'biz_ruyesh',
    name: 'تعیین سطح زبان انگلیسی',
    description: 'مصاحبهٔ شفاهی + آزمون کتبی کوتاه',
    price: 0,
    durationMinutes: 30,
    status: 'active'
  },
  {
    id: 'srv_ruyesh_ielts',
    businessId: 'biz_ruyesh',
    name: 'دورهٔ آمادگی آیلتس',
    description: 'جلسهٔ اول دورهٔ آمادگی آزمون آیلتس (جلسهٔ آزمایشی)',
    price: 450_000,
    durationMinutes: 90,
    status: 'active'
  },
  {
    id: 'srv_ruyesh_conversation',
    businessId: 'biz_ruyesh',
    name: 'جلسهٔ مکالمهٔ انگلیسی',
    description: 'یک جلسه تمرین مکالمه با پارتنر نیتیو',
    price: 280_000,
    durationMinutes: 60,
    status: 'active'
  },

  // === استودیو نورا ===
  {
    id: 'srv_noora_portrait',
    businessId: 'biz_noora',
    name: 'عکاسی پرتره (استودیویی)',
    description: 'یک ساعت عکاسی پرتره در استودیو + ۱۰ عکس ویرایش‌شده',
    price: 2_200_000,
    durationMinutes: 60,
    status: 'active'
  },
  {
    id: 'srv_noora_family',
    businessId: 'biz_noora',
    name: 'عکاسی خانوادگی',
    description: 'عکاسی خانوادگی در فضای باز + ۱۵ عکس ویرایش‌شده',
    price: 3_500_000,
    durationMinutes: 90,
    status: 'active'
  },

  // === مرکز مشاوره آرامش ===
  {
    id: 'srv_aramesh_individual',
    businessId: 'biz_aramesh',
    name: 'جلسهٔ مشاورهٔ فردی',
    description: 'یک جلسه ۵۰ دقیقه‌ای مشاورهٔ فردی',
    price: 700_000,
    durationMinutes: 50,
    status: 'active'
  },
  {
    id: 'srv_aramesh_couple',
    businessId: 'biz_aramesh',
    name: 'جلسهٔ زوج‌درمانی',
    description: 'یک جلسه ۷۰ دقیقه‌ای مشاورهٔ زوجین',
    price: 1_100_000,
    durationMinutes: 70,
    status: 'active'
  },
  {
    id: 'srv_aramesh_family',
    businessId: 'biz_aramesh',
    name: 'مشاورهٔ خانواده',
    description: 'یک جلسه ۶۰ دقیقه‌ای مشاورهٔ خانوادگی',
    price: 900_000,
    durationMinutes: 60,
    status: 'active'
  },

  // === آرایشگاه جنتلمن ===
  {
    id: 'srv_barber_cut',
    businessId: 'biz_barbershop',
    name: 'اصلاح مو',
    description: 'شستشو + کوتاهی مو + حالت‌دهی',
    price: 250_000,
    durationMinutes: 30,
    status: 'active'
  },
  {
    id: 'srv_barber_beard',
    businessId: 'biz_barbershop',
    name: 'اصلاح ریش',
    description: 'طراحی و اصلاح ریش با تیغ و ماشین',
    price: 150_000,
    durationMinutes: 20,
    status: 'active'
  },
  {
    id: 'srv_barber_vip',
    businessId: 'biz_barbershop',
    name: 'پکیج VIP (مو + ریش + ماسک صورت)',
    description: 'اصلاح مو و ریش + ماسک صورت + شستشوی صورت',
    price: 550_000,
    durationMinutes: 75,
    status: 'active'
  },

  // === کلینیک پتلند ===
  {
    id: 'srv_petland_checkup',
    businessId: 'biz_petland',
    name: 'چکاپ کامل',
    description: 'معاینهٔ عمومی + آزمایش خون + توصیه‌های بهداشتی',
    price: 650_000,
    durationMinutes: 40,
    status: 'active'
  },
  {
    id: 'srv_petland_vaccine',
    businessId: 'biz_petland',
    name: 'واکسیناسیون',
    description: 'تزریق واکسن چندگانه (سگ یا گربه)',
    price: 380_000,
    durationMinutes: 20,
    status: 'active'
  },
  {
    id: 'srv_petland_grooming',
    businessId: 'biz_petland',
    name: 'آرایش و حمام (Grooming)',
    description: 'حمام + کوتاهی مو + ناخن + تمیز کردن گوش',
    price: 550_000,
    durationMinutes: 90,
    status: 'active'
  },

  // === خدمات نظافتی تمیزآز ===
  {
    id: 'srv_tamiraz_hourly',
    businessId: 'biz_tamiraz',
    name: 'نظافت ساعتی منزل',
    description: 'هر ساعت نظافت عمومی منزل',
    price: 180_000,
    durationMinutes: 60,
    status: 'active'
  },
  {
    id: 'srv_tamiraz_deep',
    businessId: 'biz_tamiraz',
    name: 'نظافت اساسی (Deep Clean)',
    description: 'نظافت کامل + شستشوی پنجره + تمیز کردن کابینت',
    price: 2_500_000,
    durationMinutes: 360,
    status: 'active'
  },
  {
    id: 'srv_narenj_color_fix',
    businessId: 'biz_narenj',
    name: 'تصحیح رنگ مو',
    description: 'رفع عیب رنگ و نچرال‌کردن ته مو در یک جلسه',
    price: 1_900_000,
    durationMinutes: 90,
    status: 'inactive'
  },
  {
    id: 'srv_narenj_kidcut',
    businessId: 'biz_narenj',
    name: 'کوتاهی مو کودک',
    price: 380_000,
    durationMinutes: 30,
    status: 'active'
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

/**
 * برنامهٔ ساعت کاری هفتگی (فاز ۱۱) — seed.
 *
 * دو نوع رکورد در یک آرایه:
 *   • بدون `employeeId` → ساعت *پیش‌فرض کسب‌وکار*
 *   • با `employeeId` + `source: 'custom'` → برنامهٔ اختصاصی یک نفر
 * پرسنلی که ردیف ندارد یعنی «مطابق کسب‌وکار» کار می‌کند — این حالت *بازنمایی*
 * صریح همان `business-default` است، نه فراموشی داده. برای همین هیچ‌جا هفت سطر
 * برای هر نفر کپی نمی‌شود.
 *
 * `biz_ayeneh` عمداً ردیف ندارد: صفحهٔ ساعات کاری باید «تنظیم‌نشده» را هم
 * تجربه کند (حالت خالی، نه صفر ساختگی).
 */

type SeedDay = Partial<Record<Weekday, Array<[string, string]>>>

function seedWeek(businessId: string, days: SeedDay, employeeId?: string): AvailabilitySchedule {
  const weekDays: AvailabilityDay[] = WEEKDAY_ORDER.map((weekday) => {
    const intervals = days[weekday]
    return {
      weekday,
      enabled: Array.isArray(intervals) && intervals.length > 0,
      intervals: (intervals ?? []).map(([start, end]) => ({ start, end }))
    }
  })
  return {
    businessId,
    ...(employeeId ? { employeeId } : {}),
    timezone: APP_TIMEZONE,
    days: weekDays,
    source: employeeId ? 'custom' : 'business-default',
    updatedAt: '2026-04-18T10:12:00.000Z'
  }
}

const FULL_WEEK = (start: string, end: string): SeedDay => ({
  saturday: [[start, end]],
  sunday: [[start, end]],
  monday: [[start, end]],
  tuesday: [[start, end]],
  wednesday: [[start, end]]
})

export const MOCK_SCHEDULES: AvailabilitySchedule[] = [
  // آرایشگاه زنانه نارنج: چهارشنبه با استراحت ناهار (دو بازه در روز)، پنج‌شنبه کوتاه، جمعه تعطیل
  seedWeek('biz_narenj', {
    ...FULL_WEEK('09:00', '19:00'),
    wednesday: [['09:00', '13:00'], ['15:00', '19:00']],
    thursday: [['10:00', '16:00']]
  }),
  // دندان‌پزشکی پارس: سه‌شنبه نیم‌روز، پنج‌شنبه و جمعه تعطیل
  seedWeek('biz_pars', {
    ...FULL_WEEK('08:00', '17:00'),
    wednesday: [['09:00', '13:00']]
  }),
  // باشگاه انرژی: همهٔ روزها باز، آخر هفته کوتاه‌تر
  seedWeek('biz_energy', {
    saturday: [['06:00', '22:00']],
    sunday: [['06:00', '22:00']],
    monday: [['06:00', '22:00']],
    tuesday: [['06:00', '22:00']],
    wednesday: [['06:00', '22:00']],
    thursday: [['08:00', '18:00']],
    friday: [['08:00', '14:00']]
  }),
  seedWeek('biz_shoka', {
    ...FULL_WEEK('08:00', '18:00'),
    thursday: [['08:00', '14:00']]
  }),
  seedWeek('biz_ruyesh', {
    ...FULL_WEEK('08:00', '20:00'),
    thursday: [['09:00', '15:00']]
  }),
  seedWeek('biz_noora', {
    ...FULL_WEEK('10:00', '19:00'),
    thursday: [['10:00', '16:00']]
  }),
  seedWeek('biz_aramesh', { ...FULL_WEEK('09:00', '18:00') }),
  seedWeek('biz_tamiraz', {
    ...FULL_WEEK('07:00', '20:00'),
    thursday: [['07:00', '20:00']],
    friday: [['08:00', '14:00']]
  }),
  seedWeek('biz_petland', {
    ...FULL_WEEK('09:00', '18:00'),
    thursday: [['09:00', '15:00']]
  }),
  seedWeek('biz_barbershop', {
    ...FULL_WEEK('09:00', '21:00'),
    thursday: [['09:00', '21:00']]
  }),

  // ── برنامه‌های اختصاصی پرسنل ──
  // مینا (نارنج): کوتاه‌تر از کسب‌وکار + فاصلهٔ ناهار — یعنی «پرسنل ⊆ کسب‌وکار» با دو بازه
  seedWeek('biz_narenj', {
    saturday: [['10:00', '14:00'], ['16:00', '19:00']],
    sunday: [['10:00', '14:00'], ['16:00', '19:00']],
    monday: [['10:00', '14:00']],
    tuesday: [['10:00', '14:00'], ['16:00', '19:00']],
    wednesday: [['10:00', '13:00'], ['16:00', '19:00']],
    thursday: [['11:00', '16:00']]
  }, 'emp_mina_narenj'),
  // نایک (نارنج): فقط شیفت صبح
  seedWeek('biz_narenj', {
    ...FULL_WEEK('09:00', '13:00')
  }, 'emp_nike_narenj'),
  // دکتر رنجبر (پارس): فقط دو روز، داخل ساعات کلینیک
  seedWeek('biz_pars', {
    saturday: [['09:00', '13:00']],
    monday: [['14:00', '17:00']]
  }, 'emp_dr_ranjbar')
]
