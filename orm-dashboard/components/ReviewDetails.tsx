import React from 'react';
import { IconStar, IconPrev, IconNext, IconReviews } from './Icons';

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
  aiSuggestions?: {
    standard: string;
    friendly: string;
    recovery: string;
  };
  approvedResponse?: string;
  approvedTone?: 'standard' | 'friendly' | 'recovery';
  resolvedAt?: string;
}

interface ReviewDetailsProps {
  selectedReview: Review | null;
  selectedIndexInFiltered: number;
  filteredReviewsLength: number;
  handlePrevReview: () => void;
  handleNextReview: () => void;
  formatDate: (iso: string) => string;
  setShowReviewsDrawer: (show: boolean) => void;
}

const SENTIMENT_LABEL = {
  positive: 'Tích cực',
  neutral: 'Trung lập',
  negative: 'Tiêu cực',
};

const SENTIMENT_COLORS = {
  positive: { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  neutral: { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
  negative: { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', dot: 'bg-rose-500' },
};

function getSentiment(rating: number) {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
}

function getSentimentScore(rating: number) {
  if (rating === 5) return { score: 92, label: 'Tích cực', color: 'rgb(139, 92, 246)', track: 'rgba(139, 92, 246, 0.1)' };
  if (rating === 4) return { score: 80, label: 'Tích cực', color: 'rgb(139, 92, 246)', track: 'rgba(139, 92, 246, 0.1)' };
  if (rating === 3) return { score: 55, label: 'Trung lập', color: 'rgb(245, 158, 11)', track: 'rgba(245, 158, 11, 0.1)' };
  if (rating === 2) return { score: 32, label: 'Tiêu cực', color: 'rgb(239, 68, 68)', track: 'rgba(239, 68, 68, 0.1)' };
  return { score: 10, label: 'Tiêu cực', color: 'rgb(239, 68, 68)', track: 'rgba(239, 68, 68, 0.1)' };
}

export function ReviewDetails({
  selectedReview,
  selectedIndexInFiltered,
  filteredReviewsLength,
  handlePrevReview,
  handleNextReview,
  formatDate,
  setShowReviewsDrawer,
}: ReviewDetailsProps) {
  if (!selectedReview) {
    return (
      <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-premium">
        <div className="text-6xl mb-4 filter drop-shadow-md">📋</div>
        <h3 className="text-xl font-bold font-display text-slate-800 mb-2">Chọn một đánh giá</h3>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
          Chọn một đánh giá từ danh sách hoặc mở bộ tìm kiếm để xem chi tiết và tạo phản hồi bằng trí tuệ nhân tạo AI.
        </p>
        <button 
          onClick={() => setShowReviewsDrawer(true)} 
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <IconReviews /> Duyệt danh sách reviews
        </button>
      </div>
    );
  }

  const sentiment = getSentiment(selectedReview.rating);
  
  // AI Sentiment circle metrics
  const { score, label, color, track } = getSentimentScore(selectedReview.rating);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Section title & Pagination */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-xl font-black font-display text-slate-800 leading-tight">Review Details</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Đánh giá được nhận: {formatDate(selectedReview.publishedAt)}
          </p>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevReview}
            disabled={selectedIndexInFiltered <= 0}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
            title="Trước đó"
          >
            <IconPrev />
          </button>
          <span className="text-xs font-bold font-display text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            {selectedIndexInFiltered !== -1 ? selectedIndexInFiltered + 1 : 0} / {filteredReviewsLength}
          </span>
          <button
            onClick={handleNextReview}
            disabled={selectedIndexInFiltered >= filteredReviewsLength - 1}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
            title="Kế tiếp"
          >
            <IconNext />
          </button>
        </div>
      </div>

      {/* Main Review Details Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium transition relative overflow-hidden">
        {/* Top subtle highlight bar based on sentiment */}
        <div className={`absolute top-0 left-0 w-full h-[4px] ${
          sentiment === 'positive' ? 'bg-emerald-400' : sentiment === 'neutral' ? 'bg-amber-400' : 'bg-rose-400'
        }`} />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* User row */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 border-2 border-violet-200 text-violet-700 font-extrabold flex items-center justify-center text-lg shadow-sm">
              {selectedReview.authorAvatar || selectedReview.authorName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold font-display text-slate-800 leading-tight">{selectedReview.authorName}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  selectedReview.status === 'pending'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {selectedReview.status === 'pending' ? (
                    <>
                      <span className="pulse-dot text-amber-500" />
                      PENDING
                    </>
                  ) : '✓ RESOLVED'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">📍 {selectedReview.placeName}</div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IconStar key={s} filled={s <= selectedReview.rating} />
                  ))}
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${SENTIMENT_COLORS[sentiment].text} ${SENTIMENT_COLORS[sentiment].bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${SENTIMENT_COLORS[sentiment].dot}`} />
                  {SENTIMENT_LABEL[sentiment]}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">🕐 {formatDate(selectedReview.publishedAt)}</span>
              </div>
            </div>
          </div>

          {/* AI Sentiment Circle Gauge (Mockup style) */}
          <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 self-start">
            <div className="relative w-[72px] h-[72px] flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="36" cy="36" r={radius} fill="transparent" stroke={track} strokeWidth="6" />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[14px] font-bold text-slate-800 font-display leading-none">{score}%</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Sentiment</div>
              <div className="text-sm font-extrabold text-slate-700 leading-tight mt-0.5">{label}</div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Độ tin cậy: Cao
              </div>
            </div>
          </div>
        </div>

        {/* Review Text Body */}
        <div className="mt-6 text-slate-600 leading-relaxed text-sm bg-slate-50/50 rounded-2xl p-6 border border-slate-100 italic relative">
          <span className="text-slate-200 text-5xl absolute -top-1 left-3 font-serif pointer-events-none">“</span>
          <p className="relative z-10 pl-4">{selectedReview.text || 'Review này không có nội dung văn bản.'}</p>
        </div>

        {/* Dynamic Review Tags (Mockup style) */}
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedReview.rating >= 4 ? (
            <>
              <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg">Không gian</span>
              <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg">Nhân viên</span>
              <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg">Dịch vụ</span>
              {selectedReview.rating === 5 && <span className="text-xs font-semibold px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg">Tuyệt vời</span>}
            </>
          ) : (
            <>
              <span className="text-xs font-semibold px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">Phản hồi chậm</span>
              <span className="text-xs font-semibold px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">Cần khắc phục</span>
              <span className="text-xs font-semibold px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">Hỗ trợ</span>
            </>
          )}
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-500 rounded-lg">Phân tích bởi AI</span>
        </div>
      </div>
    </div>
  );
}
