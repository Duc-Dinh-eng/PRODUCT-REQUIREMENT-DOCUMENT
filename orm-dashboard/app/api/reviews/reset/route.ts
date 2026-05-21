import { resetDB, getReviews } from '@/app/lib/db';

export async function POST() {
  try {
    resetDB();
    const reviews = getReviews();
    return Response.json({ success: true, count: reviews.length, message: 'Database đã được reset về dữ liệu mẫu' });
  } catch (error) {
    console.error('[POST /api/reviews/reset]', error);
    return Response.json({ error: 'Đã xảy ra lỗi nội bộ' }, { status: 500 });
  }
}
