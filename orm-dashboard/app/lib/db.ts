/**
 * Database Layer - In-memory store với Global persistence
 * Hoạt động trên cả Local dev và Vercel serverless
 */

export type ReviewStatus = 'pending' | 'resolved';

export interface Review {
  id: string;
  placeId: string;
  placeName: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  text: string;
  publishedAt: string;
  status: ReviewStatus;
  aiSuggestions?: {
    standard: string;
    friendly: string;
    recovery: string;
  };
  approvedResponse?: string;
  approvedTone?: 'standard' | 'friendly' | 'recovery';
  resolvedAt?: string;
}

export interface Database {
  reviews: Review[];
  lastUpdated: string;
}

// Global in-memory store (persists across serverless function calls in same instance)
declare global {
  // eslint-disable-next-line no-var
  var _orm_db: Database | undefined;
}

const SEED_REVIEWS: Review[] = [
  {
    id: 'seed-001',
    placeId: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ',
    placeName: 'JW Marriott Hotel Hanoi',
    authorName: 'Sarah Thompson',
    authorAvatar: 'ST',
    rating: 5,
    text: 'Absolutely stunning hotel! The infinity pool on the 8th floor has breathtaking views of the city. Staff were incredibly helpful and attentive. The breakfast buffet was exceptional with a great variety of both local and international dishes. Will definitely return!',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'seed-002',
    placeId: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ',
    placeName: 'JW Marriott Hotel Hanoi',
    authorName: 'Trần Minh Khoa',
    authorAvatar: 'TK',
    rating: 2,
    text: 'Phòng nhận không khớp với hình ảnh quảng cáo. Điều hòa kêu to suốt đêm khiến tôi không ngủ được. Nhân viên dọn phòng vào lúc 8 giờ sáng mặc dù đã treo biển không làm phiền. Dịch vụ phòng gọi 45 phút mới lên. Thất vọng với mức giá này.',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'seed-003',
    placeId: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
    placeName: 'Sheraton Hanoi Hotel',
    authorName: 'Michael Chen',
    authorAvatar: 'MC',
    rating: 4,
    text: 'Great location right by West Lake. The rooms are spacious and clean. Had a minor issue with the Wi-Fi connection but the front desk resolved it quickly. The rooftop bar has amazing sunset views. Overall a very pleasant stay.',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    aiSuggestions: {
      standard: 'Dear Mr. Chen, thank you for your kind review and for choosing Sheraton Hanoi Hotel. We\'re delighted to hear you enjoyed our West Lake location and rooftop bar. We apologize for the Wi-Fi inconvenience and are glad our team could resolve it promptly. We look forward to welcoming you back.',
      friendly: 'Hi Michael! 😊 What a wonderful review - thank you so much! We\'re so happy you loved our sunset views from the rooftop bar, that\'s definitely one of our favorites too! Sorry about the Wi-Fi hiccup, but we\'re glad it got sorted quickly. Can\'t wait to see you again!',
      recovery: 'Dear Mr. Chen, thank you for your honest feedback. While we\'re glad you had a pleasant stay overall, we sincerely apologize for the Wi-Fi issue. We\'ve since upgraded our network in that wing. As a gesture of appreciation, we\'d love to offer you a 15% discount on your next stay.',
    },
    approvedResponse: 'Dear Mr. Chen, thank you for your kind review and for choosing Sheraton Hanoi Hotel. We\'re delighted to hear you enjoyed our West Lake location and rooftop bar. We apologize for the Wi-Fi inconvenience and are glad our team could resolve it promptly. We look forward to welcoming you back.',
    approvedTone: 'standard',
    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-004',
    placeId: 'ChIJr-OQBKcdSjERqBwFlstWGvE',
    placeName: 'La Sinfonía del Rey Hotel & Spa',
    authorName: 'Phạm Thị Lan',
    authorAvatar: 'PL',
    rating: 3,
    text: 'Khách sạn đẹp nhưng giá hơi cao so với chất lượng. Nhân viên thân thiện tuy nhiên giao tiếp tiếng Anh còn hạn chế. Bể bơi sạch sẽ. Bữa sáng bình thường, không có nhiều lựa chọn. Vị trí thuận tiện gần trung tâm.',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'seed-005',
    placeId: 'ChIJr-OQBKcdSjERqBwFlstWGvE',
    placeName: 'La Sinfonía del Rey Hotel & Spa',
    authorName: 'James Wilson',
    authorAvatar: 'JW',
    rating: 1,
    text: 'Worst hotel experience ever. Found cockroaches in the bathroom on the first night. When I complained, the staff were dismissive and offered no solution. The room smelled musty and the elevator was broken during our entire 3-day stay. Demanded a refund which they refused. Avoid at all costs!',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'seed-006',
    placeId: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ',
    placeName: 'JW Marriott Hotel Hanoi',
    authorName: 'Nguyễn Thanh Hà',
    authorAvatar: 'NH',
    rating: 5,
    text: 'Tôi và gia đình đã có kỳ nghỉ tuyệt vời tại đây. Phòng rộng rãi, sạch sẽ, view đẹp nhìn ra hồ Tây. Nhân viên vô cùng nhiệt tình, đặc biệt chị Linh ở quầy lễ tân đã hỗ trợ rất nhiều khi con tôi bị ốm. Nhà hàng ngon, xứng đáng với chi phí bỏ ra. Sẽ quay lại!',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
];

function initDB(): Database {
  return {
    reviews: JSON.parse(JSON.stringify(SEED_REVIEWS)),
    lastUpdated: new Date().toISOString(),
  };
}

export function getDB(): Database {
  if (!global._orm_db) {
    global._orm_db = initDB();
  }
  return global._orm_db;
}

export function saveDB(db: Database): void {
  global._orm_db = { ...db, lastUpdated: new Date().toISOString() };
}

export function resetDB(): Database {
  global._orm_db = initDB();
  return global._orm_db;
}

export function getReviews(): Review[] {
  const db = getDB();
  return [...db.reviews].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function addReviews(reviews: Review[]): void {
  const db = getDB();
  // Deduplicate by id
  const existingIds = new Set(db.reviews.map((r) => r.id));
  const newReviews = reviews.filter((r) => !existingIds.has(r.id));
  db.reviews = [...newReviews, ...db.reviews];
  saveDB(db);
}

export function updateReview(id: string, updates: Partial<Review>): Review | null {
  const db = getDB();
  const idx = db.reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  db.reviews[idx] = { ...db.reviews[idx], ...updates };
  saveDB(db);
  return db.reviews[idx];
}
