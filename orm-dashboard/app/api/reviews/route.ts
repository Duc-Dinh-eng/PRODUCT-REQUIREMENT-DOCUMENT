import { getReviews } from '@/app/lib/db';

export async function GET() {
  try {
    const reviews = await getReviews();
    return Response.json({ reviews, count: reviews.length });
  } catch (error) {
    console.error('[GET /api/reviews]', error);
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
