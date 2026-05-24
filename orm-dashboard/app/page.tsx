'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Import Sub-Components ───────────────────────────────────────────────────
import { Sidebar } from '@/components/Sidebar';
import { ReviewsDrawer } from '@/components/ReviewsDrawer';
import { ReviewDetails } from '@/components/ReviewDetails';
import { AIAssistant } from '@/components/AIAssistant';
import { AnalyticsSidebar } from '@/components/AnalyticsSidebar';
import { SettingsModal } from '@/components/SettingsModal';
import { useToast, ToastContainer } from '@/components/Toast';
import { IconSearch } from '@/components/Icons';

// ─── Types ───────────────────────────────────────────────────────────────────
type ReviewStatus = 'pending' | 'resolved';
type ToneKey = 'standard' | 'friendly' | 'recovery' | 'short';
type FilterStatus = 'all' | 'pending' | 'resolved';

interface AISuggestions {
  standard: string;
  friendly: string;
  recovery: string;
}

interface Review {
  id: string;
  placeId: string;
  placeName: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  text: string;
  publishedAt: string;
  status: ReviewStatus;
  aiSuggestions?: AISuggestions;
  approvedResponse?: string;
  approvedTone?: 'standard' | 'friendly' | 'recovery';
  resolvedAt?: string;
}

interface ApiKeys {
  google: string;
  openai: string;
  gemini: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { toasts, show: showToast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placeIdInput, setPlaceIdInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTone, setActiveTone] = useState<ToneKey>('standard');
  const [editedResponses, setEditedResponses] = useState<Partial<Record<ToneKey, string>>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ google: '', openai: '', gemini: '' });

  // ── Extended UX States ─────────────────────────────────────────────────────
  const [showReviewsDrawer, setShowReviewsDrawer] = useState(false);

  // ── Loading states ─────────────────────────────────────────────────────────
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('orm-api-keys');
      if (saved) setApiKeys(JSON.parse(saved));
    } catch {}
  }, []);

  const saveApiKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('orm-api-keys', JSON.stringify(keys));
    showToast('API keys đã được lưu!', 'success');
  };

  // ── Fetch reviews from DB ──────────────────────────────────────────────────
  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json() as { reviews: Review[] };
      setReviews(data.reviews ?? []);
      
      // Auto-select first review if none selected
      if (data.reviews && data.reviews.length > 0 && !selectedId) {
        setSelectedId(data.reviews[0].id);
      }
    } catch {
      showToast('Không thể tải reviews', 'error');
    }
  }, [selectedId, showToast]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const selectedReview = reviews.find((r) => r.id === selectedId) ?? null;

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterRating > 0 && r.rating !== filterRating) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.authorName.toLowerCase().includes(q) &&
          !r.text.toLowerCase().includes(q) &&
          !r.placeName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selectedIndexInFiltered = filteredReviews.findIndex((r) => r.id === selectedId);

  // ── Statistics for Sidebar ────────────────────────────────────────────────
  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    resolved: reviews.filter((r) => r.status === 'resolved').length,
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleFetch = async (pid?: string) => {
    const id = pid ?? placeIdInput.trim();
    if (!id) { showToast('Vui lòng nhập Place ID', 'error'); return; }
    setLoadingFetch(true);
    try {
      const res = await fetch('/api/reviews/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: id,
          apiKey: apiKeys.google || undefined,
        }),
      });
      const data = await res.json() as { reviews?: Review[]; count?: number; placeName?: string; mode?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Lỗi không xác định');
      
      // Reset search/filters
      setSearchQuery('');
      setFilterStatus('all');
      setFilterRating(0);
      
      await loadReviews();
      const modeLabel = data.mode === 'live' ? '🌐 Live' : '🎭 Mock';
      showToast(`${modeLabel} — Đã tải ${data.count ?? 0} reviews từ ${data.placeName ?? id}`, 'success');
      
      if (data.reviews && data.reviews.length > 0) {
        setSelectedId(data.reviews[0].id);
        setEditedResponses({});
        setActiveTone('standard');
      }
    } catch (err: unknown) {
      showToast(`Lỗi: ${err instanceof Error ? err.message : 'Không thể lấy reviews'}`, 'error');
    } finally {
      setLoadingFetch(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedReview) return;
    setLoadingAI(true);
    setEditedResponses({});
    try {
      const res = await fetch('/api/reviews/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          openAiKey: apiKeys.openai || undefined,
          geminiKey: apiKeys.gemini || undefined,
        }),
      });
      const data = await res.json() as { suggestions?: AISuggestions; mode?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Lỗi AI');
      await loadReviews();
      const modeLabel = data.mode === 'openai' ? '🤖 OpenAI' : data.mode === 'gemini' ? '✨ Gemini' : '🎭 Mock AI';
      showToast(`${modeLabel} — Đã sinh 3 gợi ý phản hồi!`, 'success');
      setActiveTone('standard');
    } catch (err: unknown) {
      showToast(`Lỗi AI: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReview) return;
    
    // Determine the response text to send
    let responseText = '';
    if (selectedReview.aiSuggestions) {
      if (activeTone === 'short') {
        // Fallback or dynamic generation
        const base = selectedReview.aiSuggestions.friendly || selectedReview.aiSuggestions.standard || '';
        const sentences = base.split(/[.!?]\s+/).filter(Boolean);
        const shortSug = sentences.length > 0 ? (sentences.slice(0, 2).join('. ') + '.') : '';
        responseText = editedResponses['short'] ?? shortSug.replace(/\.+$/, '.');
      } else {
        responseText = editedResponses[activeTone] ?? selectedReview.aiSuggestions[activeTone];
      }
    } else {
      responseText = editedResponses[activeTone] ?? '';
    }

    if (!responseText.trim()) {
      showToast('Vui lòng chọn hoặc nhập phản hồi trước khi gửi!', 'error');
      return;
    }

    setLoadingApprove(true);
    const dbTone = activeTone === 'short' ? 'friendly' : activeTone;

    try {
      const res = await fetch('/api/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          tone: dbTone,
          response: responseText,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Lỗi approve');
      await loadReviews();
      showToast('✅ Review đã được duyệt và cập nhật Resolved!', 'success');
    } catch (err: unknown) {
      showToast(`Lỗi: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
    } finally {
      setLoadingApprove(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset database về dữ liệu mẫu? Mọi thay đổi sẽ bị mất.')) return;
    setLoadingReset(true);
    try {
      await fetch('/api/reviews/reset', { method: 'POST' });
      setSelectedId(null);
      setEditedResponses({});
      await loadReviews();
      showToast('Database đã được reset!', 'info');
    } catch {
      showToast('Không thể reset', 'error');
    } finally {
      setLoadingReset(false);
    }
  };

  // ── Pagination controls ────────────────────────────────────────────────────
  const handlePrevReview = () => {
    if (selectedIndexInFiltered > 0) {
      const prevRev = filteredReviews[selectedIndexInFiltered - 1];
      setSelectedId(prevRev.id);
      setEditedResponses({});
      setActiveTone('standard');
    }
  };

  const handleNextReview = () => {
    if (selectedIndexInFiltered < filteredReviews.length - 1) {
      const nextRev = filteredReviews[selectedIndexInFiltered + 1];
      setSelectedId(nextRev.id);
      setEditedResponses({});
      setActiveTone('standard');
    }
  };

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f6f8fc] flex font-sans antialiased text-slate-800 overflow-x-hidden">
      {/* Sidebar (Left column) */}
      <Sidebar
        placeIdInput={placeIdInput}
        setPlaceIdInput={setPlaceIdInput}
        handleFetch={handleFetch}
        loadingFetch={loadingFetch}
        stats={stats}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        showReviewsDrawer={showReviewsDrawer}
        setShowReviewsDrawer={setShowReviewsDrawer}
        setShowSettings={setShowSettings}
      />

      {/* Reviews Drawer (Secondary sliding column) */}
      <ReviewsDrawer
        showReviewsDrawer={showReviewsDrawer}
        setShowReviewsDrawer={setShowReviewsDrawer}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRating={filterRating}
        setFilterRating={setFilterRating}
        filteredReviews={filteredReviews}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        setEditedResponses={setEditedResponses}
        setActiveTone={setActiveTone}
        loadingFetch={loadingFetch}
        formatDate={formatDate}
      />

      {/* Workspace Center (Middle column) */}
      <main className="flex-1 overflow-y-auto h-screen flex flex-col">
        {/* Workspace Header */}
        <header className="bg-white border-b border-slate-150 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IconSearch />
            </span>
            <input 
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-12 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
              placeholder="Search reviews, hotels, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[11px] font-bold text-slate-400">
              ⌘ K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset} 
              disabled={loadingReset}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1"
              title="Reset Database về dữ liệu seed mẫu"
            >
              {loadingReset ? <div className="spinner spinner-sm" /> : '🔄 Reset DB'}
            </button>
          </div>
        </header>

        {/* Central workspace content */}
        <div className="flex-1 p-8 space-y-6 max-w-5xl w-full mx-auto pb-16">
          <ReviewDetails
            selectedReview={selectedReview}
            selectedIndexInFiltered={selectedIndexInFiltered}
            filteredReviewsLength={filteredReviews.length}
            handlePrevReview={handlePrevReview}
            handleNextReview={handleNextReview}
            formatDate={formatDate}
            setShowReviewsDrawer={setShowReviewsDrawer}
          />

          {selectedReview && (
            <AIAssistant
              selectedReview={selectedReview}
              loadingAI={loadingAI}
              handleGenerateAI={handleGenerateAI}
              activeTone={activeTone}
              setActiveTone={setActiveTone}
              editedResponses={editedResponses}
              setEditedResponses={setEditedResponses}
              loadingApprove={loadingApprove}
              handleApprove={handleApprove}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Analytics Right Sidebar (Right column) */}
      <AnalyticsSidebar
        reviews={reviews}
        setShowSettings={setShowSettings}
      />

      {/* Settings Modal popups */}
      {showSettings && (
        <SettingsModal
          apiKeys={apiKeys}
          onSave={saveApiKeys}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Toasts alerting system */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
