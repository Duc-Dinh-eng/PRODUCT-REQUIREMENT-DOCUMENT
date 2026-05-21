import { addReviews, Review } from '@/app/lib/db';
import { generateMockReviews, FAMOUS_PLACES } from '@/app/lib/mock-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { placeId, apiKey } = body as { placeId: string; apiKey?: string };

    if (!placeId || typeof placeId !== 'string' || placeId.trim().length < 5) {
      return Response.json({ error: 'Place ID không hợp lệ' }, { status: 400 });
    }

    const googleKey = apiKey || process.env.GOOGLE_PLACES_API_KEY;

    if (!googleKey) {
      // ── MOCK MODE ──────────────────────────────────────────────
      console.log('[fetch] Mock mode - generating mock reviews for', placeId);
      const mockReviews = generateMockReviews(placeId.trim());
      await addReviews(mockReviews);
      return Response.json({
        reviews: mockReviews,
        placeName: mockReviews[0]?.placeName ?? placeId,
        count: mockReviews.length,
        mode: 'mock',
      });
    }

    // ── LIVE MODE ───────────────────────────────────────────────
    console.log('[fetch] Live mode - calling Google Places API for', placeId);

    // 1. Lấy Place Details (tên địa điểm + reviews)
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId.trim()}`;
    const detailsRes = await fetch(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': googleKey,
        'X-Goog-FieldMask': 'id,displayName,reviews',
      },
    });

    if (!detailsRes.ok) {
      const errBody = await detailsRes.json().catch(() => ({}));
      const message =
        (errBody as { error?: { message?: string } })?.error?.message ??
        `HTTP ${detailsRes.status}`;
      return Response.json(
        { error: `Google Places API lỗi: ${message}` },
        { status: detailsRes.status }
      );
    }

    const data = (await detailsRes.json()) as {
      id?: string;
      displayName?: { text?: string };
      reviews?: Array<{
        name?: string;
        rating?: number;
        text?: { text?: string };
        authorAttribution?: { displayName?: string; photoUri?: string };
        publishTime?: string;
        relativePublishTimeDescription?: string;
      }>;
    };

    const placeName =
      FAMOUS_PLACES[placeId.trim()]?.name ?? data.displayName?.text ?? placeId;

    const rawReviews = (data.reviews ?? []).slice(0, 5);

    if (rawReviews.length === 0) {
      return Response.json({
        reviews: [],
        placeName,
        count: 0,
        mode: 'live',
        message: 'Địa điểm này chưa có review nào.',
      });
    }

    const reviews: Review[] = rawReviews.map((r, i) => {
      const author = r.authorAttribution?.displayName ?? 'Ẩn danh';
      const initials = author
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? '')
        .join('');

      return {
        id: `live-${placeId.substring(0, 6)}-${i}-${Date.now()}`,
        placeId: placeId.trim(),
        placeName,
        authorName: author,
        authorAvatar: initials || 'U',
        rating: r.rating ?? 3,
        text: r.text?.text ?? '(Không có nội dung)',
        publishedAt: r.publishTime ?? new Date().toISOString(),
        status: 'pending',
      };
    });

    await addReviews(reviews);

    return Response.json({
      reviews,
      placeName,
      count: reviews.length,
      mode: 'live',
    });
  } catch (error) {
    console.error('[POST /api/reviews/fetch]', error);
    return Response.json({ error: 'Đã xảy ra lỗi nội bộ' }, { status: 500 });
  }
}
