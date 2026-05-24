'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ReviewStatus = 'pending' | 'resolved';
type ToneKey = 'standard' | 'friendly' | 'recovery' | 'short';
type FilterStatus = 'all' | 'pending' | 'resolved';
type SentimentLevel = 'positive' | 'neutral' | 'negative';

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

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const QUICK_PLACES = [
  { id: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ', label: 'JW Marriott HN', short: 'JW Marriott' },
  { id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA', label: 'Sheraton HN', short: 'Sheraton HN' },
  { id: 'ChIJa3ZChsUvdTERd0HFD1W-Hss', label: 'Metropole HN', short: 'Metropole HN' },
  { id: 'ChIJr-OQBKcdSjERqBwFlstWGvE', label: 'La Sinfonia', short: 'La Sinfonia' },
  { id: 'ChIJ8wj4jFEuNTERbRTIUSM_kDM', label: 'Pizza 4Ps SG', short: 'Pizza 4Ps SG' },
  { id: 'ChIJRcbZaklzdTERdYNRDFa5kB4', label: 'InterCon SG', short: 'InterCon SG' },
];

const TONE_CONFIG: Record<ToneKey, { label: string; emoji: string; color: string; desc: string }> = {
  standard: { label: 'Professional', emoji: '👔', color: 'rgb(139, 92, 246)', desc: 'Trang trọng & chuẩn mực' },
  friendly: { label: 'Friendly', emoji: '😊', color: 'rgb(16, 185, 129)', desc: 'Thân thiện & gần gũi' },
  recovery: { label: 'Upsell & Recovery', emoji: '⚡', color: 'rgb(245, 158, 11)', desc: 'Khắc phục & quảng bá' },
  short: { label: 'Short & Sweet', emoji: '💖', color: 'rgb(236, 72, 153)', desc: 'Ngắn gọn & súc tích' },
};

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconDashboard = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>;
const IconReviews = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const IconAssistant = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const IconAnalytics = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const IconReports = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconSearch = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconBell = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const IconPrev = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconNext = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const IconChevronDown = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const IconSend = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const IconEmoji = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPaperclip = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const IconImage = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconStar = ({ filled }: { filled: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

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

function getSentiment(rating: number): SentimentLevel {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
}

const SENTIMENT_LABEL: Record<SentimentLevel, string> = {
  positive: 'Tích cực',
  neutral: 'Trung lập',
  negative: 'Tiêu cực',
};

const SENTIMENT_COLORS: Record<SentimentLevel, { text: string; bg: string; dot: string }> = {
  positive: { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  neutral: { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
  negative: { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', dot: 'bg-rose-500' },
};

function getSentimentScore(rating: number): { score: number; label: string; color: string; track: string } {
  if (rating === 5) return { score: 92, label: 'Tích cực', color: 'rgb(139, 92, 246)', track: 'rgba(139, 92, 246, 0.1)' };
  if (rating === 4) return { score: 80, label: 'Tích cực', color: 'rgb(139, 92, 246)', track: 'rgba(139, 92, 246, 0.1)' };
  if (rating === 3) return { score: 55, label: 'Trung lập', color: 'rgb(245, 158, 11)', track: 'rgba(245, 158, 11, 0.1)' };
  if (rating === 2) return { score: 32, label: 'Tiêu cực', color: 'rgb(239, 68, 68)', track: 'rgba(239, 68, 68, 0.1)' };
  return { score: 10, label: 'Tiêu cực', color: 'rgb(239, 68, 68)', track: 'rgba(239, 68, 68, 0.1)' };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <IconStar key={s} filled={s <= rating} />
      ))}
    </div>
  );
}

// ─── Toast System ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

const TOAST_ICON: Record<Toast['type'], string> = { success: '✅', error: '❌', info: 'ℹ️' };

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="text-lg">{TOAST_ICON[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({
  apiKeys,
  onSave,
  onClose,
}: {
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ApiKeys>(apiKeys);

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  const hasAnyKey = local.google || local.openai || local.gemini;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <span>⚙️</span> Cấu hình API Keys
          </h2>
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition" onClick={onClose}>✕</button>
        </div>

        <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-xs text-indigo-700 leading-relaxed">
          {hasAnyKey
            ? '🟢 Chế độ Live — Sẽ gọi API thực tế khi có key.'
            : '🟡 Chế độ Mock — Không có key nào, ứng dụng dùng dữ liệu mẫu.'}
          <br />Keys được lưu cục bộ trong trình duyệt của bạn (localStorage).
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="google-key">Google Places API Key</label>
            <input
              id="google-key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition font-mono"
              type="password"
              placeholder="AIza..."
              value={local.google}
              onChange={(e) => setLocal((p) => ({ ...p, google: e.target.value }))}
            />
            <div className="text-[10px] text-slate-400 mt-1">
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                console.cloud.google.com
              </a>{' '}→ Bật Places API (New)
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="openai-key">OpenAI API Key</label>
            <input
              id="openai-key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition font-mono"
              type="password"
              placeholder="sk-..."
              value={local.openai}
              onChange={(e) => setLocal((p) => ({ ...p, openai: e.target.value }))}
            />
            <div className="text-[10px] text-slate-400 mt-1">Model: gpt-4o-mini · <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">platform.openai.com</a></div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="gemini-key">Gemini API Key <span className="text-slate-400 font-normal">(tuỳ chọn)</span></label>
            <input
              id="gemini-key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition font-mono"
              type="password"
              placeholder="AIza..."
              value={local.gemini}
              onChange={(e) => setLocal((p) => ({ ...p, gemini: e.target.value }))}
            />
            <div className="text-[10px] text-slate-400 mt-1"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">aistudio.google.com</a> → Model: gemini-1.5-flash</div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition" onClick={onClose}>Hủy</button>
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20" onClick={handleSave}>💾 Lưu cấu hình</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
  const [placeDropdownOpen, setPlaceDropdownOpen] = useState(false);
  const [toneDropdownOpen, setToneDropdownOpen] = useState(false);
  const placeDropdownRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);

  // ── Loading states ─────────────────────────────────────────────────────────
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (placeDropdownRef.current && !placeDropdownRef.current.contains(event.target as Node)) {
        setPlaceDropdownOpen(false);
      }
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(event.target as Node)) {
        setToneDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // ── Real Statistics from current state ─────────────────────────────────────
  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    resolved: reviews.filter((r) => r.status === 'resolved').length,
    avgRating: reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—',
  };

  // ── Dynamic Chart Data ─────────────────────────────────────────────────────
  const totalReviews = reviews.length;
  const sentimentStats = {
    positive: reviews.filter(r => r.rating >= 4).length,
    neutral: reviews.filter(r => r.rating === 3).length,
    negative: reviews.filter(r => r.rating <= 2).length,
  };

  const sentimentPercent = {
    positive: totalReviews > 0 ? Math.round((sentimentStats.positive / totalReviews) * 100) : 0,
    neutral: totalReviews > 0 ? Math.round((sentimentStats.neutral / totalReviews) * 100) : 0,
    negative: totalReviews > 0 ? Math.round((sentimentStats.negative / totalReviews) * 100) : 0,
  };

  // Google, Booking.com, TripAdvisor mock sources breakdown relative to total
  const sourceStats = {
    google: totalReviews > 0 ? Math.round(totalReviews * 0.7) : 0,
    booking: totalReviews > 0 ? Math.round(totalReviews * 0.2) : 0,
    tripadvisor: totalReviews > 0 ? totalReviews - Math.round(totalReviews * 0.7) - Math.round(totalReviews * 0.2) : 0,
  };

  const sourcePercent = {
    google: totalReviews > 0 ? Math.round((sourceStats.google / totalReviews) * 100) : 70,
    booking: totalReviews > 0 ? Math.round((sourceStats.booking / totalReviews) * 100) : 20,
    tripadvisor: totalReviews > 0 ? Math.round((sourceStats.tripadvisor / totalReviews) * 100) : 10,
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
      
      // Reset state for new reviews
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
        responseText = editedResponses['short'] ?? getShortAndSweet(selectedReview, selectedReview.aiSuggestions);
      } else {
        responseText = editedResponses[activeTone] ?? selectedReview.aiSuggestions[activeTone];
      }
    } else {
      // Custom typed response
      responseText = editedResponses[activeTone] ?? '';
    }

    if (!responseText.trim()) {
      showToast('Vui lòng chọn hoặc nhập phản hồi trước khi gửi!', 'error');
      return;
    }

    setLoadingApprove(true);
    
    // Map tone key to DB supported tones (standard/friendly/recovery)
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

  // ── Tone 4 (Short & Sweet) dynamic generation ──────────────────────────────
  const getShortAndSweet = (rev: Review, suggestions: AISuggestions): string => {
    if (editedResponses['short']) return editedResponses['short']!;
    
    // Generate dynamically from standard or friendly
    const base = suggestions.friendly || suggestions.standard || '';
    if (!base) return '';
    
    const sentences = base.split(/[.!?]\s+/).filter(Boolean);
    if (sentences.length > 0) {
      // Pick first 2 sentences and clean them up
      const short = sentences.slice(0, 2).join('. ') + '.';
      // If it doesn't end with a dot/emoji correctly
      return short.replace(/\.+$/, '.');
    }
    
    return `Cảm ơn ${rev.authorName}! Chúng tôi rất trân trọng đánh giá ${rev.rating} sao của bạn dành cho ${rev.placeName}.`;
  };

  // ── Render Workspace center content ────────────────────────────────────────
  function renderDetail() {
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
    const suggestions = selectedReview.aiSuggestions;
    
    // AI Sentiment circle metrics
    const { score, label, color, track } = getSentimentScore(selectedReview.rating);
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Current suggestion value for display/edit
    let activeSuggestionText = '';
    if (suggestions) {
      if (activeTone === 'short') {
        activeSuggestionText = editedResponses['short'] ?? getShortAndSweet(selectedReview, suggestions);
      } else {
        activeSuggestionText = editedResponses[activeTone] ?? suggestions[activeTone];
      }
    } else {
      activeSuggestionText = editedResponses[activeTone] ?? '';
    }

    const isEdited = suggestions && 
      ((activeTone !== 'short' && editedResponses[activeTone] !== undefined && editedResponses[activeTone] !== suggestions[activeTone]) ||
       (activeTone === 'short' && editedResponses['short'] !== undefined && editedResponses['short'] !== getShortAndSweet(selectedReview, suggestions)));

    return (
      <div className="space-y-6">
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
                  <Stars rating={selectedReview.rating} />
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

        {/* Resolved Banner */}
        {selectedReview.status === 'resolved' && selectedReview.approvedResponse && (
          <div className="bg-emerald-50/70 border border-emerald-100/70 rounded-3xl p-6 shadow-sm flex items-start gap-4">
            <div className="text-3xl filter drop-shadow">✅</div>
            <div className="space-y-1">
              <div className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest">ĐÃ PHÊ DUYỆT PHẢN HỒI</div>
              <p className="text-slate-600 text-sm leading-relaxed">{selectedReview.approvedResponse}</p>
              {selectedReview.approvedTone && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5 flex items-center gap-1 border border-emerald-200">
                    {TONE_CONFIG[selectedReview.approvedTone as ToneKey]?.emoji} {TONE_CONFIG[selectedReview.approvedTone as ToneKey]?.label}
                  </span>
                  {selectedReview.resolvedAt && (
                    <span className="text-[10px] text-slate-400 font-medium">Duyệt lúc: {formatDate(selectedReview.resolvedAt)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Assistant response options */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                <span className="text-indigo-500 text-lg">✨</span> AI Assistant
              </h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Gợi ý phản hồi thông minh dựa trên đánh giá khách hàng</p>
            </div>
            
            {/* Tone Customizer Dropdown */}
            <div className="relative" ref={toneDropdownRef}>
              <button 
                onClick={() => setToneDropdownOpen(!toneDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition active:scale-95"
              >
                <span>Tùy chỉnh giọng điệu</span>
                <IconChevronDown />
              </button>
              {toneDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                  <button onClick={() => { setActiveTone('standard'); setToneDropdownOpen(false); }} className="w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 flex items-center gap-2">👔 Professional</button>
                  <button onClick={() => { setActiveTone('friendly'); setToneDropdownOpen(false); }} className="w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 flex items-center gap-2">😊 Friendly</button>
                  <button onClick={() => { setActiveTone('recovery'); setToneDropdownOpen(false); }} className="w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 flex items-center gap-2">⚡ Upsell & Recovery</button>
                  <button onClick={() => { setActiveTone('short'); setToneDropdownOpen(false); }} className="w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 flex items-center gap-2">💖 Short & Sweet</button>
                </div>
              )}
            </div>
          </div>

          {/* AI suggestion generation prompt */}
          {!suggestions && !loadingAI && (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
              <div className="text-4xl mb-3 animate-bounce">✨</div>
              <h5 className="text-sm font-bold text-slate-700">Chưa có gợi ý phản hồi AI</h5>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mt-1 mb-4">Nhấp nút bên dưới để tự động sinh 4 phương án câu trả lời bằng AI theo các tông giọng khác nhau.</p>
              <button
                id="btn-generate-ai"
                onClick={handleGenerateAI}
                disabled={loadingAI}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/15 transition active:scale-95 flex items-center gap-2"
              >
                ✨ Generate AI Responses
              </button>
            </div>
          )}

          {loadingAI && (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
              <div className="spinner mb-3" />
              <h5 className="text-sm font-bold text-slate-700">AI đang phân tích đánh giá...</h5>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Quá trình này mất khoảng 2-4 giây với OpenAI / Gemini...</p>
            </div>
          )}

          {suggestions && !loadingAI && (
            <div className="space-y-6">
              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(TONE_CONFIG) as ToneKey[]).map((tone) => {
                  const isActive = activeTone === tone;
                  const cfg = TONE_CONFIG[tone];
                  
                  // Get response text for that card
                  let text = '';
                  if (tone === 'short') {
                    text = editedResponses['short'] ?? getShortAndSweet(selectedReview, suggestions);
                  } else {
                    text = editedResponses[tone] ?? suggestions[tone];
                  }

                  return (
                    <div 
                      key={tone}
                      onClick={() => setActiveTone(tone)}
                      className={`cursor-pointer bg-slate-50/40 hover:bg-slate-50 border rounded-2xl p-5 flex flex-col justify-between min-h-[220px] transition-all relative ${
                        isActive 
                          ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/10' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm shadow-violet-600/30">
                          ✓
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{cfg.emoji}</span>
                          <span className="text-[12.5px] font-bold text-slate-800 font-display">{cfg.label}</span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-6">{text}</p>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTone(tone);
                          showToast(`Đã chọn phản hồi: ${cfg.label}`, 'info');
                        }}
                        className={`w-full mt-4 py-2 border rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                          isActive 
                            ? 'bg-violet-600 border-transparent text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        🗂️ Sử dụng
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Advanced Custom Input editor panel */}
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 font-display uppercase tracking-wider">Hiệu chỉnh phản hồi</span>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={loadingAI}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    🔄 Sinh lại câu trả lời
                  </button>
                </div>

                <textarea
                  id={`response-textarea-${activeTone}`}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none transition leading-relaxed"
                  value={activeSuggestionText}
                  onChange={(e) =>
                    setEditedResponses((prev) => ({ ...prev, [activeTone]: e.target.value }))
                  }
                  rows={4}
                  placeholder="Hoặc nhập phản hồi tùy chỉnh của bạn tại đây..."
                />

                {isEdited && (
                  <div className="text-xs text-amber-600 font-medium flex items-center gap-1 animate-pulse">
                    ✏️ Bạn đã chỉnh sửa gợi ý phản hồi này
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {/* Tool Buttons */}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <button className="p-2 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Thêm emoji"><IconEmoji /></button>
                    <button className="p-2 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Đính kèm tài liệu"><IconPaperclip /></button>
                    <button className="p-2 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Đính kèm hình ảnh"><IconImage /></button>
                  </div>

                  {/* Character stats & Approve button */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">{activeSuggestionText.length} ký tự</span>
                    
                    {isEdited && (
                      <button
                        onClick={() => setEditedResponses((p) => { const n = { ...p }; delete n[activeTone]; return n; })}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition"
                      >
                        ↺ Hoàn tác
                      </button>
                    )}

                    <button
                      id="btn-approve"
                      onClick={handleApprove}
                      disabled={loadingApprove || selectedReview.status === 'resolved'}
                      className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg ${
                        selectedReview.status === 'resolved'
                          ? 'bg-emerald-500 shadow-emerald-500/10 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
                      }`}
                    >
                      {loadingApprove ? (
                        <>
                          <div className="spinner spinner-sm text-white" />
                          Đang gửi...
                        </>
                      ) : selectedReview.status === 'resolved' ? (
                        '✓ Đã gửi thành công'
                      ) : (
                        <>
                          <IconSend />
                          Gửi phản hồi
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Render 3-column dashboard layout ──────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f6f8fc] flex font-sans antialiased text-slate-800 overflow-x-hidden">
      {/* ── Column 1: Left Navigation Sidebar ── */}
      <aside className="w-[260px] bg-white border-r border-slate-150 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div className="p-6 space-y-7 flex-1 overflow-y-auto">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <span className="text-xl animate-pulse filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]">⭐</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold font-display bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-transparent leading-none">ORM Dashboard</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">AI Workspace</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => { setShowReviewsDrawer(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition ${
                !showReviewsDrawer 
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white shadow-lg shadow-indigo-600/15' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <IconDashboard />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => { setShowReviewsDrawer(!showReviewsDrawer); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl transition ${
                showReviewsDrawer 
                  ? 'bg-indigo-50/50 text-indigo-700 border-l-4 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconReviews />
                <span>Reviews</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{stats.pending}</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-slate-400 cursor-not-allowed hover:bg-slate-50/30 transition">
              <IconAssistant />
              <span>AI Assistant</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-slate-400 cursor-not-allowed hover:bg-slate-50/30 transition">
              <IconAnalytics />
              <span>Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-slate-400 cursor-not-allowed hover:bg-slate-50/30 transition">
              <IconReports />
              <span>Reports</span>
            </button>
            <button 
              id="btn-settings"
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
            >
              <IconSettings />
              <span>Settings</span>
            </button>
          </nav>

          {/* Status filters category */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filters</h5>
            <div className="space-y-1">
              <button 
                onClick={() => { setFilterStatus('all'); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${filterStatus === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>All Status</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{stats.total}</span>
              </button>

              <button 
                onClick={() => { setFilterStatus('pending'); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${filterStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Pending</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-100/50 text-amber-700 px-2 py-0.5 rounded-full">{stats.pending}</span>
              </button>

              <button 
                onClick={() => { setFilterStatus('resolved'); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${filterStatus === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Resolved</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100/50 text-emerald-700 px-2 py-0.5 rounded-full">{stats.resolved}</span>
              </button>
            </div>
          </div>

          {/* AI Pro Plan Promo Banner */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 rounded-3xl relative overflow-hidden mt-6 shadow-sm">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 tracking-wider">
              👑 AI PRO PLAN
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-2">Phản hồi không giới hạn và ưu tiên hỗ trợ đặc biệt.</p>
            <button className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all">
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Place Selector dropdown bottom sidebar */}
        <div className="p-4 border-t border-slate-100" ref={placeDropdownRef}>
          <div className="relative">
            <button 
              onClick={() => setPlaceDropdownOpen(!placeDropdownOpen)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-3 rounded-2xl flex items-center justify-between text-left transition active:scale-95"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  🏢
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {QUICK_PLACES.find(p => p.id === placeIdInput)?.short || 'JW Marriott Hanoi'}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 truncate">Hotel Admin</div>
                </div>
              </div>
              <IconChevronDown />
            </button>

            {placeDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 max-h-56 overflow-y-auto overflow-x-hidden p-1.5 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100 mb-1">
                  Chọn địa điểm
                </div>
                {QUICK_PLACES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPlaceIdInput(p.id);
                      handleFetch(p.id);
                      setPlaceDropdownOpen(false);
                    }}
                    disabled={loadingFetch}
                    className={`w-full px-3 py-2 hover:bg-slate-50 text-left text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                      placeIdInput === p.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                    }`}
                  >
                    <span>🏨</span>
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Reviews Drawer Panel (Secondary collapsible sidebar) ── */}
      {showReviewsDrawer && (
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
                    <Stars rating={r.rating} />
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
      )}

      {/* ── Column 2: Center Workspace (Main scrollable area) ── */}
      <main className="flex-1 overflow-y-auto h-screen flex flex-col">
        {/* Workspace Top Header Nav */}
        <header className="bg-white border-b border-slate-150 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
          {/* Centered clean search input (Mockup Style) */}
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

          {/* Quick fetch database tools */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset} 
              disabled={loadingReset}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 rounded-xl transition active:scale-95"
              title="Reset Database về dữ liệu seed mẫu"
            >
              {loadingReset ? <div className="spinner spinner-sm" /> : '🔄 Reset DB'}
            </button>
          </div>
        </header>

        {/* Workspace central workspace container */}
        <div className="flex-1 p-8 space-y-6 max-w-5xl w-full mx-auto pb-16">
          {/* Section title & Pagination */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-xl font-black font-display text-slate-800 leading-tight">Review Details</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {selectedReview ? `Đánh giá được nhận: ${formatDate(selectedReview.publishedAt)}` : 'AI Workspace Management'}
              </p>
            </div>

            {/* Pagination Controls */}
            {selectedReview && (
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
                  {selectedIndexInFiltered !== -1 ? selectedIndexInFiltered + 1 : 0} / {filteredReviews.length}
                </span>
                <button
                  onClick={handleNextReview}
                  disabled={selectedIndexInFiltered >= filteredReviews.length - 1}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
                  title="Kế tiếp"
                >
                  <IconNext />
                </button>
              </div>
            )}
          </div>

          {/* Details & Editor Area */}
          {renderDetail()}
        </div>
      </main>

      {/* ── Column 3: Right Sidebar (Stats & Overview) ── */}
      <aside className="w-[300px] bg-white border-l border-slate-150 shrink-0 h-screen sticky top-0 z-20 flex flex-col overflow-y-auto p-6 space-y-6">
        {/* User admin profile row */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          {/* Notification */}
          <button className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition relative active:scale-95">
            <IconBell />
            <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </button>

          {/* Profile widget */}
          <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition" onClick={() => setShowSettings(true)}>
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
            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150/70 rounded-2xl p-4 transition shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TỔNG REVIEWS</div>
              <div className="text-2xl font-black font-display text-slate-800 mt-1">{stats.total}</div>
              <div className="text-[9px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                ▲ +12% <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
              </div>
            </div>

            {/* Card 2: Pending */}
            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150/70 rounded-2xl p-4 transition shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ĐANG CHỜ XỬ LÝ</div>
              <div className="text-2xl font-black font-display text-slate-800 mt-1">{stats.pending}</div>
              <div className="text-[9px] text-amber-500 font-bold mt-2 flex items-center gap-0.5">
                ▼ -8% <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
              </div>
            </div>

            {/* Card 3: Resolved */}
            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150/70 rounded-2xl p-4 transition shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ĐÃ DUYỆT</div>
              <div className="text-2xl font-black font-display text-slate-800 mt-1">{stats.resolved}</div>
              <div className="text-[9px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                ▲ +100% <span className="text-slate-400 font-medium font-sans">vs tuần trước</span>
              </div>
            </div>

            {/* Card 4: Average */}
            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150/70 rounded-2xl p-4 transition shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG RATING</div>
              <div className="text-2xl font-black font-display text-amber-500 mt-1 flex items-center gap-1">
                {stats.avgRating}
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
            {/* SVG Donut Circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              {totalReviews === 0 ? (
                <circle cx="64" cy="64" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
              ) : (
                (() => {
                  let offset = 0;
                  const radiusVal = 48;
                  const circ = 2 * Math.PI * radiusVal;

                  return (
                    <>
                      {/* Positive segment (emerald) */}
                      {sentimentPercent.positive > 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r={radiusVal}
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
                          r={radiusVal}
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
                          r={radiusVal}
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
                  );
                })()
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
              {/* Curved pathway */}
              <path
                d="M 0,45 Q 33,35 66,42 T 132,18 T 200,8"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Fill area */}
              <path
                d="M 0,45 Q 33,35 66,42 T 132,18 T 200,8 L 200,60 L 0,60 Z"
                fill="url(#glowGrad)"
              />
              {/* Highlight point */}
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

      {/* Cấu hình Keys Modal popup */}
      {showSettings && (
        <SettingsModal
          apiKeys={apiKeys}
          onSave={saveApiKeys}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Floating status alert Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
