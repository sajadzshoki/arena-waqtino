export interface ReviewReply {
  text: string
  createdAt: ISODateTime
}

export interface Review {
  id: EntityId
  businessId: EntityId
  authorId: EntityId
  /** امتیاز ۱ تا ۵ */
  rating: 1 | 2 | 3 | 4 | 5
  text?: string
  /** پاسخ کسب‌وکار به نظر */
  reply?: ReviewReply
  createdAt: ISODateTime
}

export interface Favorite {
  userId: EntityId
  businessId: EntityId
  createdAt: ISODateTime
}
