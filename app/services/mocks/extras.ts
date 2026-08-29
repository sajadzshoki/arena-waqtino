import type { ChatConversation, ChatMessage } from '~/types/chat'
import type { Favorite, Review } from '~/types/review'
import type { AppNotification } from '~/types/notification'

/** داده‌های مکمل mock: علاقه‌مندی‌ها، اعلان‌ها، نظرها، گفتگوها، اسلات‌های اشغال‌شده */

function isoIn(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const MOCK_FAVORITES: Favorite[] = [
  { userId: 'usr_dev_sara', businessId: 'biz_ruyesh', createdAt: isoIn(-20, 16, 30) },
  { userId: 'usr_dev_sara', businessId: 'biz_noora', createdAt: isoIn(-7, 21, 10) }
]

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf_01',
    userId: 'usr_dev_sara',
    type: 'booking',
    title: 'نوبت فردای شما تأیید شد',
    body: 'فیشیال و پاکسازی پوست در سالن زیبایی نارنج، ساعت ۱۴:۳۰.',
    isRead: false,
    actionUrl: '/bookings',
    createdAt: isoIn(0, 8, 20)
  },
  {
    id: 'ntf_02',
    userId: 'usr_dev_sara',
    type: 'review',
    title: 'تجربه‌تان را بگویید',
    body: 'خدمت «رنگ و لایت کامل مو» انجام شد — نظرتان برای دیگران ارزشمند است.',
    isRead: false,
    createdAt: isoIn(-11, 19, 45)
  },
  {
    id: 'ntf_03',
    userId: 'usr_dev_sara',
    type: 'system',
    title: 'به وقتینو خوش آمدید',
    body: 'پروفایل خود را کامل کنید تا رزروها سریع‌تر انجام شود.',
    isRead: true,
    createdAt: isoIn(-30, 9, 0)
  }
]

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rvw_01',
    businessId: 'biz_narenj',
    authorId: 'usr_c_01',
    rating: 5,
    text: 'از مشاورهٔ رنگ تا پایان کار همه‌چیز دقیق و حرفه‌ای بود؛ نتیجهٔ لایت دقیقاً همان شد که می‌خواستم.',
    reply: {
      text: 'ممنون از اعتمادتان! خوشحالیم که راضی بودید. 🌱',
      createdAt: isoIn(-9, 12, 0)
    },
    createdAt: isoIn(-10, 18, 22)
  },
  {
    id: 'rvw_02',
    businessId: 'biz_narenj',
    authorId: 'usr_c_02',
    rating: 4,
    text: 'محیط تمیز و پرسنل خوش‌برخورد. فقط کمی معطلی شروع نوبت طول کشید.',
    createdAt: isoIn(-23, 15, 3)
  },
  {
    id: 'rvw_03',
    businessId: 'biz_narenj',
    authorId: 'usr_c_03',
    rating: 5,
    text: 'فیشیال آقای کاظمی عالی بود؛ پوستم حسابی روشن شد. حتماً دوباره میام.',
    createdAt: isoIn(-35, 11, 47)
  },
  {
    id: 'rvw_04',
    businessId: 'biz_pars',
    authorId: 'usr_c_04',
    rating: 5,
    text: 'دکتر رنجبر با حوصله توضیح داد و طرح درمان کاملاً شفاف بود.',
    createdAt: isoIn(-14, 10, 5)
  }
]

export const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'cnv_01',
    businessId: 'biz_narenj',
    customerId: 'usr_dev_sara',
    bookingId: 'bok_ghel_01',
    unreadCount: 1,
    lastMessageAt: isoIn(0, 9, 32),
    createdAt: isoIn(-1, 18, 6)
  },
  {
    id: 'cnv_02',
    businessId: 'biz_pars',
    customerId: 'usr_dev_sara',
    unreadCount: 0,
    lastMessageAt: isoIn(-22, 16, 40),
    createdAt: isoIn(-24, 13, 31)
  }
]

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_01',
    conversationId: 'cnv_01',
    senderId: 'usr_dev_sara',
    text: 'سلام، برای فیشیال نیازی هست چیزی رو از قبل رعایت کنم؟',
    status: 'read',
    createdAt: isoIn(-1, 18, 6)
  },
  {
    id: 'msg_02',
    conversationId: 'cnv_01',
    senderId: 'usr_narenj_staff',
    text: 'سلام وقت بخیر 🌸 فقط لطفاً ۲۴ ساعت قبل از آرایش صورت خودداری کنید.',
    status: 'read',
    createdAt: isoIn(-1, 18, 40)
  },
  {
    id: 'msg_03',
    conversationId: 'cnv_01',
    senderId: 'usr_narenj_staff',
    text: 'اگر حساسیت پوستی خاصی دارید هم هنگام خدمت به کارشناس بگویید.',
    status: 'delivered',
    createdAt: isoIn(0, 9, 32)
  },
  {
    id: 'msg_04',
    conversationId: 'cnv_02',
    senderId: 'usr_dev_sara',
    text: 'متأسفانه نتوانستم برسم؛ امکان جابه‌جایی نوبت هست؟',
    status: 'read',
    createdAt: isoIn(-22, 16, 40)
  }
]
