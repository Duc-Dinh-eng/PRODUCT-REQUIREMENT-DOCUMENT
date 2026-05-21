/**
 * Mock Data Generator & Mock AI Engine
 * Sinh dữ liệu thực tế khi không có API keys
 */

import { Review } from './db';

// ─── Danh sách địa điểm nổi tiếng ───────────────────────────────────────────
export const FAMOUS_PLACES: Record<string, { name: string; city: string; type: string }> = {
  'ChIJIyEW2hlcNTERFGJBwpQCqXQ': { name: 'JW Marriott Hotel Hanoi', city: 'Hà Nội', type: 'hotel' },
  'ChIJd8BlQ2BZwokRAFUEcm_qrcA': { name: 'Sheraton Hanoi Hotel', city: 'Hà Nội', type: 'hotel' },
  'ChIJr-OQBKcdSjERqBwFlstWGvE': { name: 'La Sinfonía del Rey Hotel & Spa', city: 'Hà Nội', type: 'hotel' },
  'ChIJa3ZChsUvdTERd0HFD1W-Hss': { name: 'Sofitel Legend Metropole Hanoi', city: 'Hà Nội', type: 'hotel' },
  'ChIJ8wj4jFEuNTERbRTIUSM_kDM': { name: 'Pizza 4Ps - Bến Thành', city: 'TP.HCM', type: 'restaurant' },
  'ChIJRcbZaklzdTERdYNRDFa5kB4': { name: 'InterContinental Saigon', city: 'TP.HCM', type: 'hotel' },
};

function getPlaceInfo(placeId: string): { name: string; city: string; type: string } {
  return FAMOUS_PLACES[placeId] ?? { name: `Khách sạn ${placeId.substring(0, 8)}`, city: 'Việt Nam', type: 'hotel' };
}

// ─── Tập dữ liệu review mẫu ────────────────────────────────────────────────
const MOCK_REVIEW_TEMPLATES = [
  {
    rating: 5,
    authorName: 'Nguyễn Minh Tuấn',
    authorAvatar: 'NT',
    text: (name: string) =>
      `Trải nghiệm tuyệt vời tại ${name}! Phòng rộng rãi, sạch sẽ và được trang bị đầy đủ tiện nghi. Nhân viên rất chuyên nghiệp và thân thiện. Bữa sáng buffet phong phú, đặc biệt là các món ăn địa phương rất ngon. View từ phòng cực đẹp. Sẽ quay lại và giới thiệu cho bạn bè!`,
  },
  {
    rating: 4,
    authorName: 'Emma Johnson',
    authorAvatar: 'EJ',
    text: (name: string) =>
      `Really enjoyed our stay at ${name}. The location is perfect, rooms are clean and comfortable. The pool area is lovely. Only minor issue was the slow Wi-Fi in the room, but the lobby had great connection. Restaurant food was delicious. Would recommend to friends visiting the area.`,
  },
  {
    rating: 2,
    authorName: 'Lê Văn Hùng',
    authorAvatar: 'LH',
    text: (name: string) =>
      `Dịch vụ tại ${name} không xứng với mức giá. Check-in chờ gần 1 tiếng dù đã đặt trước. Phòng có mùi ẩm và điều hòa hoạt động kém. Gọi room service 1 tiếng không có ai trả lời. Lần sau sẽ không quay lại và không giới thiệu cho ai.`,
  },
  {
    rating: 5,
    authorName: 'Robert Kim',
    authorAvatar: 'RK',
    text: (name: string) =>
      `${name} exceeded all expectations! The concierge team went above and beyond to make our anniversary special - they arranged surprise decorations and a complimentary cake. The spa was world-class. Every single staff member greeted us with a smile. This is luxury hospitality at its finest.`,
  },
  {
    rating: 3,
    authorName: 'Trần Thị Mai',
    authorAvatar: 'TM',
    text: (name: string) =>
      `${name} ở mức trung bình. Phòng sạch nhưng hơi nhỏ so với giá tiền. Nhân viên thân thiện nhưng tiếng Anh còn hạn chế. Bữa sáng ít lựa chọn. Vị trí thuận tiện. Nhìn chung là được nhưng kỳ vọng cao hơn với mức giá này.`,
  },
];

// ─── Mock Google Places Fetcher ─────────────────────────────────────────────
export function generateMockReviews(placeId: string): Review[] {
  const place = getPlaceInfo(placeId);
  const now = Date.now();

  return MOCK_REVIEW_TEMPLATES.map((template, i) => ({
    id: `mock-${placeId.substring(0, 6)}-${i + 1}-${Date.now()}`,
    placeId,
    placeName: place.name,
    authorName: template.authorName,
    authorAvatar: template.authorAvatar,
    rating: template.rating,
    text: template.text(place.name),
    publishedAt: new Date(now - (i + 1) * 12 * 60 * 60 * 1000).toISOString(),
    status: 'pending' as const,
  }));
}

// ─── Mock AI Response Generator ──────────────────────────────────────────────
interface AISuggestions {
  standard: string;
  friendly: string;
  recovery: string;
}

function detectSentiment(text: string, rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
}

function extractIssues(text: string): string[] {
  const issues: string[] = [];
  const lowerText = text.toLowerCase();

  if (lowerText.includes('wifi') || lowerText.includes('wi-fi') || lowerText.includes('internet') || lowerText.includes('mạng'))
    issues.push('kết nối Wi-Fi');
  if (lowerText.includes('dirty') || lowerText.includes('bẩn') || lowerText.includes('clean'))
    issues.push('vệ sinh phòng');
  if (lowerText.includes('slow') || lowerText.includes('chậm') || lowerText.includes('wait') || lowerText.includes('chờ'))
    issues.push('thời gian chờ đợi');
  if (lowerText.includes('noise') || lowerText.includes('loud') || lowerText.includes('ồn') || lowerText.includes('tiếng ồn'))
    issues.push('tiếng ồn');
  if (lowerText.includes('air') || lowerText.includes('điều hòa') || lowerText.includes('con'))
    issues.push('hệ thống điều hòa');
  if (lowerText.includes('staff') || lowerText.includes('nhân viên') || lowerText.includes('rude'))
    issues.push('thái độ nhân viên');
  if (lowerText.includes('breakfast') || lowerText.includes('bữa sáng') || lowerText.includes('food') || lowerText.includes('đồ ăn'))
    issues.push('chất lượng ẩm thực');

  return issues;
}

export function generateMockAIReplies(
  authorName: string,
  rating: number,
  reviewText: string,
  placeName: string
): AISuggestions {
  const sentiment = detectSentiment(reviewText, rating);
  const issues = extractIssues(reviewText);
  const firstName = authorName.split(' ').pop() || authorName;
  const issueList = issues.length > 0 ? issues.join(', ') : 'các vấn đề bạn đề cập';

  if (sentiment === 'positive') {
    return {
      standard: `Kính gửi Quý khách ${authorName},\n\nThay mặt toàn thể đội ngũ ${placeName}, chúng tôi xin chân thành cảm ơn Quý khách đã dành thời gian chia sẻ trải nghiệm. Sự hài lòng của Quý khách là nguồn động lực lớn nhất để chúng tôi không ngừng nỗ lực. Chúng tôi rất mong được đón tiếp Quý khách trong những lần tiếp theo.\n\nTrân trọng,\nBan Quản lý ${placeName}`,
      friendly: `Chào ${firstName}! 😊\n\nCảm ơn bạn rất nhiều vì những lời đánh giá tốt đẹp này! Đội ngũ chúng mình đọc được đã vui lắm đó! Mong sẽ sớm được gặp lại bạn - lần sau nhớ ghé chơi nhé! 🌟\n\nHẹn gặp lại,\nĐội ngũ ${placeName}`,
      recovery: `Kính gửi ${authorName},\n\nCảm ơn Quý khách đã có trải nghiệm tuyệt vời tại ${placeName}. Chúng tôi rất vui khi nhận được phản hồi tích cực từ Quý khách. Như một lời tri ân, chúng tôi xin gửi tặng Quý khách ưu đãi đặc biệt 10% cho lần lưu trú tiếp theo.\n\nTrân trọng,\n${placeName}`,
    };
  }

  if (sentiment === 'negative') {
    return {
      standard: `Kính gửi Quý khách ${authorName},\n\nChúng tôi thành thật xin lỗi về những bất tiện Quý khách đã gặp phải trong thời gian lưu trú, đặc biệt liên quan đến ${issueList}. Đây là điều không đáng có và không phản ánh tiêu chuẩn dịch vụ mà chúng tôi cam kết. Chúng tôi đã ghi nhận phản hồi và sẽ có biện pháp khắc phục ngay. Xin trân trọng cảm ơn.`,
      friendly: `Chào ${firstName},\n\nChúng mình vô cùng xin lỗi vì trải nghiệm không tốt của bạn 😔 Thật sự rất tiếc khi nghe về vấn đề ${issueList}. Điều này không phải là bình thường với chúng mình chút nào. Bạn có thể liên hệ trực tiếp qua email để chúng mình có cơ hội bù đắp cho bạn không?\n\nChân thành xin lỗi,\nĐội ngũ ${placeName}`,
      recovery: `Kính gửi ${authorName},\n\nChúng tôi thành thật xin lỗi về trải nghiệm không như mong đợi của Quý khách liên quan đến ${issueList}. Để bù đắp cho sự bất tiện này, chúng tôi xin phép:\n• Hoàn trả 20% chi phí lưu trú\n• Tặng ưu đãi 30% cho lần đặt phòng tiếp theo\n• Đảm bảo nâng cấp phòng miễn phí\n\nVui lòng liên hệ hotline để được hỗ trợ ngay.\n\nTrân trọng,\nBan Giám đốc ${placeName}`,
    };
  }

  // neutral
  return {
    standard: `Kính gửi Quý khách ${authorName},\n\nCảm ơn Quý khách đã chia sẻ nhận xét về ${placeName}. Chúng tôi ghi nhận những đóng góp của Quý khách về ${issueList} và sẽ nỗ lực cải thiện để mang đến trải nghiệm tốt hơn. Mong được phục vụ Quý khách trong tương lai.\n\nTrân trọng,\n${placeName}`,
    friendly: `Chào ${firstName}! 👋\n\nCảm ơn bạn đã chia sẻ trải nghiệm! Chúng mình rất vui vì bạn thấy một số điểm tốt và cũng thành thật về những điều chưa ổn. Phản hồi của bạn giúp chúng mình cải thiện rất nhiều đó! Hy vọng lần sau sẽ làm bạn ấn tượng hơn nhé! 💪\n\nHẹn gặp lại,\n${placeName}`,
    recovery: `Kính gửi ${authorName},\n\nCảm ơn Quý khách đã dành thời gian đánh giá ${placeName}. Chúng tôi hiểu rằng kỳ vọng của Quý khách chưa được đáp ứng hoàn toàn. Như một lời cảm ơn chân thành, chúng tôi xin tặng Quý khách voucher ưu đãi 15% cho lần lưu trú tiếp theo để chúng tôi có cơ hội phục vụ Quý khách tốt hơn.\n\nTrân trọng,\n${placeName}`,
  };
}
