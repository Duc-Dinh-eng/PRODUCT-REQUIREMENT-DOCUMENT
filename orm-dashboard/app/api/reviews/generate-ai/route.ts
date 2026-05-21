import { getDB, updateReview } from '@/app/lib/db';
import { generateMockAIReplies } from '@/app/lib/mock-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, openAiKey, geminiKey } = body as {
      reviewId: string;
      openAiKey?: string;
      geminiKey?: string;
    };

    if (!reviewId) {
      return Response.json({ error: 'Thiếu reviewId' }, { status: 400 });
    }

    const db = getDB();
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) {
      return Response.json({ error: 'Review không tồn tại' }, { status: 404 });
    }

    const aiKey = openAiKey || process.env.OPENAI_API_KEY;
    const gKey = geminiKey || process.env.GEMINI_API_KEY;

    // ── OPENAI MODE ─────────────────────────────────────────────
    if (aiKey) {
      console.log('[generate-ai] OpenAI mode for review', reviewId);
      const prompt = `Bạn là quản lý khách sạn chuyên nghiệp. Viết 3 câu trả lời cho review Google Maps dưới đây.

Tên địa điểm: ${review.placeName}
Khách hàng: ${review.authorName}
Số sao: ${review.rating}/5
Nội dung review: "${review.text}"

Yêu cầu: Trả về JSON THUẦN TÚY (không markdown, không code block) với format:
{"standard":"...","friendly":"...","recovery":"..."}

- standard: Chuyên nghiệp, trang trọng (~80 từ)
- friendly: Thân thiện, ấm áp, dùng emoji nhẹ nhàng (~70 từ)
- recovery: Tập trung khắc phục vấn đề, đề xuất giải pháp cụ thể (~90 từ)`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[generate-ai] OpenAI error:', err);
        // Fallback to mock on API error
      } else {
        const data = await res.json() as { choices: Array<{ message: { content: string } }> };
        const content = data.choices[0]?.message?.content ?? '';
        try {
          // Strip potential markdown code fences
          const clean = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
          const suggestions = JSON.parse(clean) as { standard: string; friendly: string; recovery: string };
          updateReview(reviewId, { aiSuggestions: suggestions });
          return Response.json({ suggestions, mode: 'openai' });
        } catch {
          console.error('[generate-ai] JSON parse error, falling back to mock');
        }
      }
    }

    // ── GEMINI MODE ─────────────────────────────────────────────
    if (gKey) {
      console.log('[generate-ai] Gemini mode for review', reviewId);
      const prompt = `Bạn là quản lý khách sạn chuyên nghiệp. Viết 3 câu trả lời cho review Google Maps.

Địa điểm: ${review.placeName}
Khách hàng: ${review.authorName}, ${review.rating}/5 sao
Review: "${review.text}"

Trả về JSON THUẦN TÚY:
{"standard":"câu trả lời chuyên nghiệp","friendly":"câu trả lời thân thiện","recovery":"câu trả lời khắc phục vấn đề"}`;

      const gRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
          }),
        }
      );

      if (gRes.ok) {
        const gData = await gRes.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const content = gData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        try {
          const clean = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
          const suggestions = JSON.parse(clean) as { standard: string; friendly: string; recovery: string };
          updateReview(reviewId, { aiSuggestions: suggestions });
          return Response.json({ suggestions, mode: 'gemini' });
        } catch {
          console.error('[generate-ai] Gemini JSON parse error, falling back to mock');
        }
      }
    }

    // ── MOCK MODE (default) ──────────────────────────────────────
    console.log('[generate-ai] Mock mode for review', reviewId);
    const suggestions = generateMockAIReplies(
      review.authorName,
      review.rating,
      review.text,
      review.placeName
    );
    updateReview(reviewId, { aiSuggestions: suggestions });
    return Response.json({ suggestions, mode: 'mock' });
  } catch (error) {
    console.error('[POST /api/reviews/generate-ai]', error);
    return Response.json({ error: 'Đã xảy ra lỗi nội bộ' }, { status: 500 });
  }
}
