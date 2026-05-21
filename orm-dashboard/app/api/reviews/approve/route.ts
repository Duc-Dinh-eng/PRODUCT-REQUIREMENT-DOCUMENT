import { updateReview } from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, tone, response } = body as {
      reviewId: string;
      tone: 'standard' | 'friendly' | 'recovery';
      response: string;
    };

    if (!reviewId || !tone || !response) {
      return Response.json({ error: 'Thiếu reviewId, tone hoặc response' }, { status: 400 });
    }

    if (!['standard', 'friendly', 'recovery'].includes(tone)) {
      return Response.json({ error: 'Tone không hợp lệ' }, { status: 400 });
    }

    const updated = updateReview(reviewId, {
      status: 'resolved',
      approvedResponse: response,
      approvedTone: tone,
      resolvedAt: new Date().toISOString(),
    });

    if (!updated) {
      return Response.json({ error: 'Review không tồn tại' }, { status: 404 });
    }

    return Response.json({ review: updated, success: true });
  } catch (error) {
    console.error('[POST /api/reviews/approve]', error);
    return Response.json({ error: 'Đã xảy ra lỗi nội bộ' }, { status: 500 });
  }
}
