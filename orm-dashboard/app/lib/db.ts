/**
 * Database Layer - Supabase PostgreSQL
 * Replaces in-memory store with persistent database
 * All functions are async and work correctly on Vercel serverless
 */

import { supabase } from './supabase';

// ─── Public Types ─────────────────────────────────────────────────────────────
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

// ─── Internal DB Row Type (snake_case columns from Supabase) ──────────────────
interface ReviewRow {
  id: string;
  place_id: string;
  place_name: string;
  author_name: string;
  author_avatar: string;
  rating: number;
  text: string;
  published_at: string;
  status: 'pending' | 'resolved';
  ai_suggestions: { standard: string; friendly: string; recovery: string } | null;
  approved_response: string | null;
  approved_tone: 'standard' | 'friendly' | 'recovery' | null;
  resolved_at: string | null;
  created_at?: string;
}

// ─── Mappers: DB row ↔ App model ─────────────────────────────────────────────
function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    placeId: row.place_id,
    placeName: row.place_name,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    rating: row.rating,
    text: row.text,
    publishedAt: row.published_at,
    status: row.status,
    ...(row.ai_suggestions ? { aiSuggestions: row.ai_suggestions } : {}),
    ...(row.approved_response ? { approvedResponse: row.approved_response } : {}),
    ...(row.approved_tone ? { approvedTone: row.approved_tone } : {}),
    ...(row.resolved_at ? { resolvedAt: row.resolved_at } : {}),
  };
}

function reviewToRow(review: Review): Omit<ReviewRow, 'created_at'> {
  return {
    id: review.id,
    place_id: review.placeId,
    place_name: review.placeName,
    author_name: review.authorName,
    author_avatar: review.authorAvatar,
    rating: review.rating,
    text: review.text,
    published_at: review.publishedAt,
    status: review.status,
    ai_suggestions: review.aiSuggestions ?? null,
    approved_response: review.approvedResponse ?? null,
    approved_tone: review.approvedTone ?? null,
    resolved_at: review.resolvedAt ?? null,
  };
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
function makeSeedReviews(): Review[] {
  const now = Date.now();
  return [
    {
      id: 'seed-001',
      placeId: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ',
      placeName: 'JW Marriott Hotel Hanoi',
      authorName: 'Sarah Thompson',
      authorAvatar: 'ST',
      rating: 5,
      text: 'Absolutely stunning hotel! The infinity pool on the 8th floor has breathtaking views of the city. Staff were incredibly helpful and attentive. The breakfast buffet was exceptional with a great variety of both local and international dishes. Will definitely return!',
      publishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
      publishedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
      publishedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'resolved',
      aiSuggestions: {
        standard: "Dear Mr. Chen, thank you for your kind review and for choosing Sheraton Hanoi Hotel. We're delighted to hear you enjoyed our West Lake location and rooftop bar. We apologize for the Wi-Fi inconvenience and are glad our team could resolve it promptly. We look forward to welcoming you back.",
        friendly: "Hi Michael! 😊 What a wonderful review - thank you so much! We're so happy you loved our sunset views from the rooftop bar, that's definitely one of our favorites too! Sorry about the Wi-Fi hiccup, but we're glad it got sorted quickly. Can't wait to see you again!",
        recovery: "Dear Mr. Chen, thank you for your honest feedback. While we're glad you had a pleasant stay overall, we sincerely apologize for the Wi-Fi issue. We've since upgraded our network in that wing. As a gesture of appreciation, we'd love to offer you a 15% discount on your next stay.",
      },
      approvedResponse: "Dear Mr. Chen, thank you for your kind review and for choosing Sheraton Hanoi Hotel. We're delighted to hear you enjoyed our West Lake location and rooftop bar. We apologize for the Wi-Fi inconvenience and are glad our team could resolve it promptly. We look forward to welcoming you back.",
      approvedTone: 'standard',
      resolvedAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'seed-004',
      placeId: 'ChIJr-OQBKcdSjERqBwFlstWGvE',
      placeName: 'La Sinfonía del Rey Hotel & Spa',
      authorName: 'Phạm Thị Lan',
      authorAvatar: 'PL',
      rating: 3,
      text: 'Khách sạn đẹp nhưng giá hơi cao so với chất lượng. Nhân viên thân thiện tuy nhiên giao tiếp tiếng Anh còn hạn chế. Bể bơi sạch sẽ. Bữa sáng bình thường, không có nhiều lựa chọn. Vị trí thuận tiện gần trung tâm.',
      publishedAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      publishedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
      publishedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
  ];
}

// ─── Database Functions ───────────────────────────────────────────────────────

/** Lấy tất cả reviews, sắp xếp mới nhất trước */
export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[getReviews]', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return (data as ReviewRow[]).map(rowToReview);
}

/** Lấy một review theo ID */
export async function getReviewById(id: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToReview(data as ReviewRow);
}

/** Thêm reviews mới, bỏ qua nếu ID đã tồn tại (dedup) */
export async function addReviews(reviews: Review[]): Promise<void> {
  if (reviews.length === 0) return;
  const rows = reviews.map(reviewToRow);

  const { error } = await supabase
    .from('reviews')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.error('[addReviews]', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

/** Cập nhật một review theo ID, trả về review đã cập nhật */
export async function updateReview(
  id: string,
  updates: Partial<Review>
): Promise<Review | null> {
  const rowUpdates: Partial<Omit<ReviewRow, 'id' | 'created_at'>> = {};

  if (updates.status !== undefined) rowUpdates.status = updates.status;
  if (updates.aiSuggestions !== undefined)
    rowUpdates.ai_suggestions = updates.aiSuggestions ?? null;
  if (updates.approvedResponse !== undefined)
    rowUpdates.approved_response = updates.approvedResponse ?? null;
  if (updates.approvedTone !== undefined)
    rowUpdates.approved_tone = updates.approvedTone ?? null;
  if (updates.resolvedAt !== undefined)
    rowUpdates.resolved_at = updates.resolvedAt ?? null;

  const { data, error } = await supabase
    .from('reviews')
    .update(rowUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[updateReview]', error);
    return null;
  }

  return rowToReview(data as ReviewRow);
}

/** Xóa tất cả reviews và insert lại 6 reviews seed mẫu */
export async function resetDB(): Promise<void> {
  // Xóa toàn bộ
  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .not('id', 'is', null);

  if (deleteError) {
    console.error('[resetDB] delete error', deleteError);
    throw new Error(`Database error: ${deleteError.message}`);
  }

  // Insert seed data mới (với timestamps fresh)
  const seeds = makeSeedReviews();
  const rows = seeds.map(reviewToRow);
  const { error: insertError } = await supabase.from('reviews').insert(rows);

  if (insertError) {
    console.error('[resetDB] insert error', insertError);
    throw new Error(`Database error: ${insertError.message}`);
  }
}
