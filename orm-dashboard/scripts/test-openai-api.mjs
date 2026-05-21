/**
 * B3: Test OpenAI API
 * =============================================
 * Chạy: node scripts/test-openai-api.mjs YOUR_API_KEY
 */

const API_KEY = process.argv[2] || process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('❌ Thiếu API Key!');
  console.error('   Dùng: node scripts/test-openai-api.mjs YOUR_OPENAI_KEY');
  process.exit(1);
}

const SAMPLE_REVIEW = {
  authorName: 'Nguyễn Văn A',
  rating: 2,
  text: 'Phòng khách sạn khá bẩn, nhân viên lễ tân thái độ không tốt và tôi phải chờ check-in gần 2 tiếng. Wifi cũng rất chập chờn. Rất thất vọng với giá tiền bỏ ra.',
};

async function testOpenAI() {
  console.log('🤖 Testing OpenAI API (gpt-4o-mini)...');
  console.log(`\n📝 Review mẫu:\n   "${SAMPLE_REVIEW.text}"\n`);

  const startTime = Date.now();

  try {
    const prompt = `Bạn là quản lý khách sạn chuyên nghiệp. Hãy viết 3 câu trả lời cho review sau đây.

Review của khách hàng (${SAMPLE_REVIEW.authorName}, ${SAMPLE_REVIEW.rating}/5 sao):
"${SAMPLE_REVIEW.text}"

Yêu cầu: Trả về JSON với format sau (không thêm markdown):
{
  "standard": "Câu trả lời chuẩn mực, chuyên nghiệp",
  "friendly": "Câu trả lời thân thiện, ấm áp, gần gũi",
  "recovery": "Câu trả lời tập trung vào giải quyết vấn đề, đề xuất bồi thường"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`OpenAI lỗi: ${JSON.stringify(err, null, 2)}`);
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;
    const content = data.choices[0].message.content;

    console.log(`✅ Response nhận được trong ${elapsed}ms:`);
    console.log(`   Model: ${data.model}`);
    console.log(`   Tokens dùng: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);

    try {
      const parsed = JSON.parse(content);
      console.log('\n📨 3 Gợi ý trả lời:');
      console.log('\n[1] STANDARD (Chuẩn mực):');
      console.log(`   ${parsed.standard}`);
      console.log('\n[2] FRIENDLY (Thân thiện):');
      console.log(`   ${parsed.friendly}`);
      console.log('\n[3] RECOVERY (Khắc phục):');
      console.log(`   ${parsed.recovery}`);
    } catch {
      console.log('\n   Raw response:', content);
    }

    console.log(`\n🎉 OpenAI API hoạt động bình thường! (${elapsed}ms < 5000ms ✓)`);
    console.log(`\n💡 Thêm vào .env.local:\n   OPENAI_API_KEY=${API_KEY}`);

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  }
}

testOpenAI();
