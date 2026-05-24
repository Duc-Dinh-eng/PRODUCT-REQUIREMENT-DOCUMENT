import React from 'react';
import { IconSearch, IconStar, IconReviews } from './Icons';

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

interface ReviewsDrawerProps {
  showReviewsDrawer: boolean;
  setShowReviewsDrawer: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterRating: number;
  setFilterRating: (rating: number) => void;
  filteredReviews: Review[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setEditedResponses: (val: any) => void;
  setActiveTone: (tone: any) => void;
  loadingFetch: boolean;
  formatDate: (iso: string) => string;
}

export function ReviewsDrawer({
  showReviewsDrawer,
  setShowReviewsDrawer,
  searchQuery,
  setSearchQuery,
  filterRating,
  setFilterRating,
  filteredReviews,
  selectedId,
  setSelectedId,
  setEditedResponses,
  setActiveTone,
  loadingFetch,
  formatDate,
}: ReviewsDrawerProps) {
  if (!showReviewsDrawer) return null;

  return (
    <aside className="w-[340px] bg-white border-r border-slate-150 flex flex-col h-screen sticky top-0 z-20 animate-slideUp">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-800 font-display uppercase tracking-wider">Danh sách Đánh giá</h3>
        <button 
          onClick={() => setShowReviewsDrawer(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
        >
          ✕
        </button>
      </div>

      {/* Search box within drawer */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <IconSearch />
          </span>
          <input
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            placeholder="Tìm kiếm review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Rating Stars filter pills */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterRating(0)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
              filterRating === 0
                ? 'bg-slate-800 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r === filterRating ? 0 : r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-0.5 shrink-0 ${
                filterRating === r
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r} ★
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingFetch ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex gap-3 skeleton-shimmer">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
                <div className="h-2.5 w-1/3 bg-slate-200 rounded" />
                <div className="h-3 w-5/6 bg-slate-200 rounded mt-2" />
              </div>
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Không tìm thấy review nào</div>
        ) : (
          filteredReviews.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                setSelectedId(r.id);
                setEditedResponses({});
                setActiveTone('standard');
              }}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                selectedId === r.id
                  ? 'bg-indigo-50/30 border-indigo-400 shadow-sm'
                  : 'bg-white hover:bg-slate-50/40 border-slate-150'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {r.authorAvatar || r.authorName.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">{r.authorName}</span>
                </div>
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {r.status === 'pending' ? 'Pending' : 'Resolved'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IconStar key={s} filled={s <= r.rating} />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{formatDate(r.publishedAt)}</span>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-2">{r.text || '(Không có nội dung)'}</p>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                🏢 {r.placeName}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
