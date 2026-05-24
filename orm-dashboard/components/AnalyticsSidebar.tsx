import React from 'react';
import { IconBell } from './Icons';

interface Review {
  id: string;
  placeId: string;
  placeName: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  text: string;
  publishedAt: string;
  status: 'pending' | 'resolved';
}

interface AnalyticsSidebarProps {
  reviews: Review[];
  setShowSettings: (show: boolean) => void;
}

export function AnalyticsSidebar({ reviews, setShowSettings }: AnalyticsSidebarProps) {
  // ── Calculate dynamic statistics ──────────────────────────────────────────
  const total = reviews.length;
  const pending = reviews.filter((r) => r.status === 'pending').length;
  const resolved = reviews.filter((r) => r.status === 'resolved').length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  // Sentiment statistics
  const sentimentStats = {
    positive: reviews.filter(r => r.rating >= 4).length,
    neutral: reviews.filter(r => r.rating === 3).length,
    negative: reviews.filter(r => r.rating <= 2).length,
  };

  const sentimentPercent = {
    positive: total > 0 ? Math.round((sentimentStats.positive / total) * 100) : 0,
    neutral: total > 0 ? Math.round((sentimentStats.neutral / total) * 100) : 0,
    negative: total > 0 ? Math.round((sentimentStats.negative / total) * 100) : 0,
  };

  // Google, Booking.com, TripAdvisor sources breakdown
  const sourceStats = {
    google: total > 0 ? Math.round(total * 0.7) : 0,
    booking: total > 0 ? Math.round(total * 0.2) : 0,
    tripadvisor: total > 0 ? total - Math.round(total * 0.7) - Math.round(total * 0.2) : 0,
  };

  const sourcePercent = {
    google: total > 0 ? Math.round((sourceStats.google / total) * 100) : 70,
    booking: total > 0 ? Math.round((sourceStats.booking / total) * 100) : 20,
    tripadvisor: total > 0 ? Math.round((sourceStats.tripadvisor / total) * 100) : 10,
  };

  const radius = 48;
  const circ = 2 * Math.PI * radius;

  return (
    <aside className="w-[300px] bg-white border-l border-slate-150 shrink-0 h-screen sticky top-0 z-20 flex flex-col overflow-y-auto p-6 space-y-6">
      {/* User admin profile row */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        {/* Notification */}
        <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition relative active:scale-95">
          <IconBell />
          <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        </button>

        {/* Profile widget */}
        <div 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition" 
        >
          <div className="text-right">
            <div className="text-xs font-black font-display text-slate-800 leading-none">Admin</div>
            <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Super Admin</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold flex items-center justify-center shadow-md shadow-indigo-600/10">
            AD
          </div>
        </div>
      </div>

      {/* Tổng quan stats cards (2x2 grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black font-display text-slate-800 uppercase tracking-widest">Tổng quan</h4>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">7 ngày qua</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total */}
          <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-155/70 rounded-2xl p-4 transition shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TỔNG REVIEWS</div>
            <div className="text-2xl font-black font-display text-slate-800 mt-1">{total}</div>
            <div className="text-[9px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
              ▲ +12% <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
            </div>
          </div>

          {/* Card 2: Pending */}
          <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-155/70 rounded-2xl p-4 transition shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ĐANG CHỜ XỬ LÝ</div>
            <div className="text-2xl font-black font-display text-slate-800 mt-1">{pending}</div>
            <div className="text-[9px] text-amber-500 font-bold mt-2 flex items-center gap-0.5">
              ▼ -8% <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
            </div>
          </div>

          {/* Card 3: Resolved */}
          <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-155/70 rounded-2xl p-4 transition shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ĐÃ DUYỆT</div>
            <div className="text-2xl font-black font-display text-slate-800 mt-1">{resolved}</div>
            <div className="text-[9px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
              ▲ +100% <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
            </div>
          </div>

          {/* Card 4: Average */}
          <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-155/70 rounded-2xl p-4 transition shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG RATING</div>
            <div className="text-2xl font-black font-display text-amber-500 mt-1 flex items-center gap-1">
              {avgRating}
              <span className="text-lg">★</span>
            </div>
            <div className="text-[9px] text-rose-500 font-bold mt-2 flex items-center gap-0.5">
              ▼ -0.4 <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Donut Chart (SVG động theo dữ liệu thật) */}
      <div className="bg-slate-50/40 border border-slate-150/60 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10.5px] font-black font-display text-slate-700 uppercase tracking-widest">Sentiment Overview</h4>
          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Tỷ lệ %</span>
        </div>

        <div className="flex items-center justify-center py-2 relative">
          <svg className="w-32 h-32 transform -rotate-90">
            {total === 0 ? (
              <circle cx="64" cy="64" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
            ) : (
              <>
                {/* Positive segment (emerald) */}
                {sentimentPercent.positive > 0 && (
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (sentimentPercent.positive / 100) * circ}
                    className="transition-all"
                  />
                )}
                {/* Neutral segment (amber) */}
                {sentimentPercent.neutral > 0 && (
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (sentimentPercent.neutral / 100) * circ}
                    transform={`rotate(${(sentimentPercent.positive / 100) * 360} 64 64)`}
                    className="transition-all"
                  />
                )}
                {/* Negative segment (rose) */}
                {sentimentPercent.negative > 0 && (
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (sentimentPercent.negative / 100) * circ}
                    transform={`rotate(${((sentimentPercent.positive + sentimentPercent.neutral) / 100) * 360} 64 64)`}
                    className="transition-all"
                  />
                )}
              </>
            )}
          </svg>

          {/* Concentric centered info */}
          <div className="absolute flex flex-col items-center">
            <span className="text-lg font-black text-slate-800 leading-none">{sentimentPercent.positive}%</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-1">Tích cực</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-[11px] pt-1">
          <div className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tích cực</span>
            </div>
            <span className="font-extrabold">{sentimentPercent.positive}% ({sentimentStats.positive})</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Trung tính</span>
            </div>
            <span className="font-extrabold">{sentimentPercent.neutral}% ({sentimentStats.neutral})</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Tiêu cực</span>
            </div>
            <span className="font-extrabold">{sentimentPercent.negative}% ({sentimentStats.negative})</span>
          </div>
        </div>
      </div>

      {/* Xu hướng đánh giá Line Chart Sparkline */}
      <div className="bg-slate-50/40 border border-slate-150/60 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10.5px] font-black font-display text-slate-700 uppercase tracking-widest">Xu hướng đánh giá</h4>
          <span className="text-[9px] font-bold text-slate-400">12/05 - 18/05</span>
        </div>

        {/* SVG Sparkline drawing ratings over time */}
        <div className="h-16 w-full pt-2">
          <svg className="w-full h-full" viewBox="0 0 200 60">
            <defs>
              <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,45 Q 33,35 66,42 T 132,18 T 200,8"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 0,45 Q 33,35 66,42 T 132,18 T 200,8 L 200,60 L 0,60 Z"
              fill="url(#glowGrad)"
            />
            <circle cx="200" cy="8" r="4.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
          <span>12/05</span>
          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Điểm tăng ổn định</span>
          <span>18/05</span>
        </div>
      </div>

      {/* Nguồn đánh giá (Review Sources) Progress Bars */}
      <div className="space-y-4">
        <h4 className="text-[10.5px] font-black font-display text-slate-700 uppercase tracking-widest">Nguồn đánh giá</h4>
        
        <div className="space-y-3.5">
          {/* Google */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">🌐 Google Places</span>
              <span>{sourcePercent.google}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-700" 
                style={{ width: `${sourcePercent.google}%` }} 
              />
            </div>
          </div>

          {/* Booking.com */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">✈️ Booking.com</span>
              <span>{sourcePercent.booking}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-700" 
                style={{ width: `${sourcePercent.booking}%` }} 
              />
            </div>
          </div>

          {/* TripAdvisor */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">🦉 TripAdvisor</span>
              <span>{sourcePercent.tripadvisor}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                style={{ width: `${sourcePercent.tripadvisor}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
