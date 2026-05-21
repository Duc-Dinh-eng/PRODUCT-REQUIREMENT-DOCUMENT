import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORM Dashboard — AI-Powered Review Management',
  description:
    'Nền tảng quản trị đánh giá khách hàng bằng AI. Tự động phân tích review Google Maps và sinh gợi ý phản hồi chuyên nghiệp.',
  keywords: ['ORM', 'review management', 'AI', 'Google Maps', 'hotel management'],
  authors: [{ name: 'UCTalent Labs' }],
  openGraph: {
    title: 'ORM Dashboard — AI-Powered Review Management',
    description: 'Quản trị review Google Maps bằng AI - Tự động sinh 3 gợi ý phản hồi chuyên nghiệp',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
