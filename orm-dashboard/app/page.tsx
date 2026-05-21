'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ReviewStatus = 'pending' | 'resolved';
type ToneKey = 'standard' | 'friendly' | 'recovery';
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
  approvedTone?: ToneKey;
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
  { id: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ', label: '🏨 JW Marriott HN' },
  { id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA', label: '🏨 Sheraton HN' },
  { id: 'ChIJa3ZChsUvdTERd0HFD1W-Hss', label: '🏨 Metropole HN' },
  { id: 'ChIJr-OQBKcdSjERqBwFlstWGvE', label: '🏨 La Sinfonia' },
  { id: 'ChIJ8wj4jFEuNTERbRTIUSM_kDM', label: '🍕 Pizza 4Ps SG' },
  { id: 'ChIJRcbZaklzdTERdYNRDFa5kB4', label: '🏨 InterCon SG' },
];

const TONE_CONFIG: Record<ToneKey, { label: string; emoji: string; color: string }> = {
  standard: { label: 'Chuẩn mực', emoji: '💼', color: '#6366f1' },
  friendly: { label: 'Thân thiện', emoji: '😊', color: '#10b981' },
  recovery: { label: 'Khắc phục', emoji: '🛠️', color: '#f59e0b' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
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
  positive: '😊 Tích cực',
  neutral: '😐 Trung lập',
  negative: '😠 Tiêu cực',
};

function Stars({ rating, small = false }: { rating: number; small?: boolean }) {
  return (
    <div className={`stars${small ? ' stars-sm' : ''}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`star${s <= rating ? ' filled' : ''}`}>★</span>
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
          <span>{TOAST_ICON[t.type]}</span>
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Cấu hình API Keys</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--accent-hover)', lineHeight: 1.6 }}>
          {hasAnyKey
            ? '🟢 Chế độ Live — Sẽ gọi API thực tế khi có key.'
            : '🟡 Chế độ Mock — Không có key nào, ứng dụng dùng dữ liệu mẫu.'}
          <br />Keys được lưu cục bộ trong trình duyệt của bạn (localStorage).
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="google-key">Google Places API Key</label>
          <input
            id="google-key"
            className="form-input"
            type="password"
            placeholder="AIza..."
            value={local.google}
            onChange={(e) => setLocal((p) => ({ ...p, google: e.target.value }))}
          />
          <div className="form-hint">
            <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hover)' }}>
              console.cloud.google.com
            </a>{' '}→ Bật Places API (New)
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="openai-key">OpenAI API Key</label>
          <input
            id="openai-key"
            className="form-input"
            type="password"
            placeholder="sk-..."
            value={local.openai}
            onChange={(e) => setLocal((p) => ({ ...p, openai: e.target.value }))}
          />
          <div className="form-hint">Model: gpt-4o-mini · <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hover)' }}>platform.openai.com</a></div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gemini-key">Gemini API Key <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(tuỳ chọn)</span></label>
          <input
            id="gemini-key"
            className="form-input"
            type="password"
            placeholder="AIza..."
            value={local.gemini}
            onChange={(e) => setLocal((p) => ({ ...p, gemini: e.target.value }))}
          />
          <div className="form-hint"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hover)' }}>aistudio.google.com</a> → Model: gemini-1.5-flash</div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Lưu cấu hình</button>
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
  const [editedResponses, setEditedResponses] = useState<Partial<AISuggestions>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ google: '', openai: '', gemini: '' });

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
    } catch {
      showToast('Không thể tải reviews', 'error');
    }
  }, [showToast]);

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

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    resolved: reviews.filter((r) => r.status === 'resolved').length,
    avgRating: reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—',
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
      await loadReviews();
      const modeLabel = data.mode === 'live' ? '🌐 Live' : '🎭 Mock';
      showToast(`${modeLabel} — Đã tải ${data.count ?? 0} reviews từ ${data.placeName ?? id}`, 'success');
      if (data.reviews && data.reviews.length > 0) setSelectedId(data.reviews[0].id);
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
    } catch (err: unknown) {
      showToast(`Lỗi AI: ${err instanceof Error ? err.message : 'Unknown'}`, 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReview?.aiSuggestions) return;
    setLoadingApprove(true);
    const responseText =
      editedResponses[activeTone] ?? selectedReview.aiSuggestions[activeTone];
    try {
      const res = await fetch('/api/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          tone: activeTone,
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
      await loadReviews();
      setSelectedId(null);
      showToast('Database đã được reset!', 'info');
    } catch {
      showToast('Không thể reset', 'error');
    } finally {
      setLoadingReset(false);
    }
  };

  // ── Render Review Detail ───────────────────────────────────────────────────
  function renderDetail() {
    if (!selectedReview) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Chọn một review</div>
          <div className="empty-sub">
            Chọn review từ danh sách bên trái để xem chi tiết và sinh gợi ý trả lời bằng AI.
          </div>
        </div>
      );
    }

    const sentiment = getSentiment(selectedReview.rating);
    const suggestions = selectedReview.aiSuggestions;

    return (
      <div>
        {/* Review Card */}
        <div className="review-detail-card">
          <div className="detail-header">
            <div className="detail-avatar">{selectedReview.authorAvatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div className="detail-author-name">{selectedReview.authorName}</div>
                <span className={`badge badge-${selectedReview.status}`}>
                  {selectedReview.status === 'pending' ? <><span className="pulse-dot" />Pending</> : '✓ Resolved'}
                </span>
              </div>
              <div className="detail-place">📍 {selectedReview.placeName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Stars rating={selectedReview.rating} />
                <span className={`sentiment-chip sentiment-${sentiment}`}>
                  {SENTIMENT_LABEL[sentiment]}
                </span>
                <span className="detail-date">🕐 {formatDate(selectedReview.publishedAt)}</span>
              </div>
            </div>
          </div>
          <div className="review-text">{selectedReview.text}</div>
        </div>

        {/* Approved Banner */}
        {selectedReview.status === 'resolved' && selectedReview.approvedResponse && (
          <div className="approved-banner">
            <div className="approved-check">✅</div>
            <div>
              <div className="approved-label">Đã phê duyệt</div>
              <div className="approved-text">{selectedReview.approvedResponse}</div>
              {selectedReview.approvedTone && (
                <span className="approved-tone-chip">
                  {TONE_CONFIG[selectedReview.approvedTone].emoji} {TONE_CONFIG[selectedReview.approvedTone].label}
                </span>
              )}
              {selectedReview.resolvedAt && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Duyệt lúc: {formatDate(selectedReview.resolvedAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Workbench */}
        <div className="workbench">
          <div className="workbench-header">
            <div className="workbench-title">🤖 AI Response Workbench</div>
            {!suggestions && (
              <button
                id="btn-generate-ai"
                className="btn btn-primary btn-sm"
                onClick={handleGenerateAI}
                disabled={loadingAI}
              >
                {loadingAI ? <><div className="spinner spinner-sm" />Đang sinh...</> : '✨ Generate AI'}
              </button>
            )}
            {suggestions && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleGenerateAI}
                disabled={loadingAI}
                title="Tạo lại gợi ý"
              >
                {loadingAI ? <div className="spinner spinner-sm" /> : '🔄'}
              </button>
            )}
          </div>

          {!suggestions && !loadingAI && (
            <div className="generate-prompt">
              <div className="generate-icon">✨</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Chưa có gợi ý AI</div>
              <div className="generate-desc">
                Nhấn &quot;Generate AI&quot; để tự động sinh 3 câu trả lời chuyên nghiệp cho review này.
              </div>
              <button
                id="btn-generate-ai-body"
                className="btn btn-primary"
                onClick={handleGenerateAI}
                disabled={loadingAI}
              >
                {loadingAI ? <><div className="spinner spinner-sm" />Đang xử lý...</> : '✨ Generate AI Responses'}
              </button>
            </div>
          )}

          {loadingAI && (
            <div className="generate-prompt">
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>AI đang phân tích review...</div>
              <div className="generate-desc">Thường mất 1-3 giây với Mock AI, 3-5 giây với OpenAI</div>
            </div>
          )}

          {suggestions && !loadingAI && (
            <>
              <div className="tone-tabs">
                {(Object.keys(TONE_CONFIG) as ToneKey[]).map((tone) => (
                  <button
                    key={tone}
                    className={`tone-tab${activeTone === tone ? ' active' : ''}`}
                    onClick={() => setActiveTone(tone)}
                    id={`tab-${tone}`}
                  >
                    {TONE_CONFIG[tone].emoji} {TONE_CONFIG[tone].label}
                  </button>
                ))}
              </div>

              <div className="tone-body">
                <textarea
                  id={`response-textarea-${activeTone}`}
                  className="response-textarea"
                  value={editedResponses[activeTone] ?? suggestions[activeTone]}
                  onChange={(e) =>
                    setEditedResponses((prev) => ({ ...prev, [activeTone]: e.target.value }))
                  }
                  rows={6}
                  placeholder="Nội dung gợi ý phản hồi..."
                />
                {editedResponses[activeTone] && editedResponses[activeTone] !== suggestions[activeTone] && (
                  <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                    ✏️ Bạn đã chỉnh sửa gợi ý này
                  </div>
                )}
              </div>

              <div className="workbench-footer">
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {editedResponses[activeTone]
                    ? `${(editedResponses[activeTone] ?? '').length} ký tự`
                    : `${suggestions[activeTone].length} ký tự`}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {editedResponses[activeTone] && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditedResponses((p) => { const n = { ...p }; delete n[activeTone]; return n; })}
                    >
                      ↺ Hoàn tác
                    </button>
                  )}
                  <button
                    id="btn-approve"
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={loadingApprove || selectedReview.status === 'resolved'}
                  >
                    {loadingApprove
                      ? <><div className="spinner spinner-sm" />Đang duyệt...</>
                      : selectedReview.status === 'resolved'
                        ? '✓ Đã duyệt'
                        : `✅ Approve — ${TONE_CONFIG[activeTone].label}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      <div className="dashboard-layout">
        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="logo">
            <div className="logo-icon">⭐</div>
            ORM Dashboard
          </div>

          <div className="fetch-bar">
            <input
              id="place-id-input"
              className="fetch-input"
              placeholder="Nhập Google Place ID... (vd: ChIJIyEW2hlcNTERFGJBwpQCqXQ)"
              value={placeIdInput}
              onChange={(e) => setPlaceIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            />
            <button
              id="btn-fetch"
              className="btn btn-primary"
              onClick={() => handleFetch()}
              disabled={loadingFetch}
            >
              {loadingFetch ? <><div className="spinner spinner-sm" />Fetching...</> : '🔍 Fetch'}
            </button>
          </div>

          <div className="quick-tags">
            {QUICK_PLACES.map((p) => (
              <button
                key={p.id}
                className="tag"
                id={`quick-${p.id.substring(0, 8)}`}
                onClick={() => { setPlaceIdInput(p.id); handleFetch(p.id); }}
                disabled={loadingFetch}
                title={p.id}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleReset}
              disabled={loadingReset}
              title="Reset database về dữ liệu mẫu"
            >
              {loadingReset ? <div className="spinner spinner-sm" /> : '🔄'}
            </button>
            <button
              id="btn-settings"
              className="btn btn-secondary btn-icon"
              onClick={() => setShowSettings(true)}
              title="Cấu hình API Keys"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Tổng</div>
              <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
              <div className="stat-sub">reviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
              <div className="stat-sub">chờ xử lý</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Resolved</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.resolved}</div>
              <div className="stat-sub">đã duyệt</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg ⭐</div>
              <div className="stat-value" style={{ color: 'var(--star-gold)' }}>{stats.avgRating}</div>
              <div className="stat-sub">rating</div>
            </div>
          </div>

          {/* Filters */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Tìm kiếm</div>
            <input
              id="search-input"
              className="search-input"
              placeholder="Tìm theo tên, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Trạng thái</div>
            <div className="filter-pills">
              {(['all', 'pending', 'resolved'] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  className={`filter-pill${filterStatus === s ? ' active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                  id={`filter-${s}`}
                >
                  {s === 'all' ? '📋 Tất cả' : s === 'pending' ? '⏳ Pending' : '✅ Resolved'}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Lọc theo sao</div>
            <div className="filter-pills">
              <button
                className={`filter-pill${filterRating === 0 ? ' active' : ''}`}
                onClick={() => setFilterRating(0)}
                id="filter-rating-all"
              >
                Tất cả
              </button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  className={`filter-pill${filterRating === r ? ' active' : ''}`}
                  onClick={() => setFilterRating(r === filterRating ? 0 : r)}
                  id={`filter-rating-${r}`}
                >
                  {'★'.repeat(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Review List */}
          <div className="review-list">
            {loadingFetch ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="review-item skeleton-shimmer" style={{ height: 96, pointerEvents: 'none' }}>
                  <div className="avatar" style={{ background: 'rgba(255,255,255,0.06)', border: 'none' }} />
                  <div className="review-item-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 14, width: '60%', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                    <div style={{ height: 10, width: '40%', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                    <div style={{ height: 12, width: '90%', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Không có review phù hợp
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div
                  key={r.id}
                  id={`review-item-${r.id}`}
                  className={`review-item${selectedId === r.id ? ' active' : ''}`}
                  onClick={() => { setSelectedId(r.id); setEditedResponses({}); setActiveTone('standard'); }}
                >
                  <div className="avatar">{r.authorAvatar}</div>
                  <div className="review-item-content">
                    <div className="review-meta">
                      <div className="review-author">{r.authorName}</div>
                      <span className={`badge badge-${r.status}`}>
                        {r.status === 'pending' ? 'Pending' : '✓ Done'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Stars rating={r.rating} small />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(r.publishedAt)}</span>
                    </div>
                    <div className="review-preview">{r.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>📍 {r.placeName}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Main Panel ── */}
        <main className="main-panel">
          {renderDetail()}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          apiKeys={apiKeys}
          onSave={saveApiKeys}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </>
  );
}
