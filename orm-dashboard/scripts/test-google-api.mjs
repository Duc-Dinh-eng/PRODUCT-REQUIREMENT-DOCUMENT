/**
 * B3: Test Google Places API
 * =============================================
 * Chạy: node scripts/test-google-api.mjs YOUR_API_KEY PLACE_ID
 *
 * Ví dụ Place IDs để test:
 *   ChIJN1t_tDeuEmsRUsoyG83frY4  → Google Sydney
 *   ChIJd8BlQ2BZwokRAFUEcm_qrcA  → Sheraton Hanoi
 *   ChIJIyEW2hlcNTERFGJBwpQCqXQ  → JW Marriott Hanoi
 */

const API_KEY = process.argv[2] || process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.argv[3] || 'ChIJIyEW2hlcNTERFGJBwpQCqXQ'; // JW Marriott Hanoi

if (!API_KEY) {
  console.error('❌ Thiếu API Key!');
  console.error('   Dùng: node scripts/test-google-api.mjs YOUR_API_KEY');
  process.exit(1);
}

async function testGooglePlacesAPI() {
  console.log('🔍 Testing Google Places API (New)...');
  console.log(`📍 Place ID: ${PLACE_ID}\n`);

  try {
    // Test 1: Place Details - lấy tên địa điểm
    console.log('--- Test 1: Place Details ---');
    const detailsUrl = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    const detailsRes = await fetch(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,formattedAddress',
      },
    });

    if (!detailsRes.ok) {
      const err = await detailsRes.json();
      throw new Error(`Place Details API lỗi: ${JSON.stringify(err, null, 2)}`);
    }

    const details = await detailsRes.json();
    console.log('✅ Place Details OK:');
    console.log(`   Tên: ${details.displayName?.text || 'N/A'}`);
    console.log(`   Rating: ${details.rating || 'N/A'} (${details.userRatingCount || 0} reviews)`);
    console.log(`   Địa chỉ: ${details.formattedAddress || 'N/A'}`);

    // Test 2: Reviews
    console.log('\n--- Test 2: Reviews ---');
    const reviewsUrl = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    const reviewsRes = await fetch(reviewsUrl, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'reviews',
      },
    });

    if (!reviewsRes.ok) {
      const err = await reviewsRes.json();
      throw new Error(`Reviews API lỗi: ${JSON.stringify(err, null, 2)}`);
    }

    const reviewsData = await reviewsRes.json();
    const reviews = reviewsData.reviews || [];
    console.log(`✅ Lấy được ${reviews.length} reviews:`);

    reviews.slice(0, 3).forEach((r, i) => {
      console.log(`\n   [${i + 1}] ${r.authorAttribution?.displayName || 'Anonymous'}`);
      console.log(`       ⭐ ${r.rating}/5`);
      console.log(`       📝 ${(r.text?.text || '').substring(0, 100)}...`);
    });

    console.log('\n🎉 Google Places API hoạt động bình thường!');
    console.log(`\n💡 Thêm vào .env.local:\n   GOOGLE_PLACES_API_KEY=${API_KEY}`);

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  }
}

testGooglePlacesAPI();
