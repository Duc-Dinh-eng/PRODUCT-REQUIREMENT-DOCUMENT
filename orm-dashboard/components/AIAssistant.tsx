import React, { useState, useRef, useEffect } from 'react';
import { 
  IconChevronDown, 
  IconEmoji, 
  IconPaperclip, 
  IconImage, 
  IconSend 
} from './Icons';

type ToneKey = 'standard' | 'friendly' | 'recovery' | 'short';

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
}

interface AIAssistantProps {
  selectedReview: Review;
  loadingAI: boolean;
  handleGenerateAI: () => Promise<void>;
  activeTone: ToneKey;
  setActiveTone: (tone: ToneKey) => void;
  editedResponses: Partial<Record<ToneKey, string>>;
  setEditedResponses: React.Dispatch<React.SetStateAction<Partial<Record<ToneKey, string>>>>;
  loadingApprove: boolean;
  handleApprove: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const TONE_CONFIG: Record<ToneKey, { label: string; emoji: string; color: string; desc: string }> = {
  standard: { label: 'Professional', emoji: '👔', color: 'rgb(139, 92, 246)', desc: 'Trang trọng & chuẩn mực' },
  friendly: { label: 'Friendly', emoji: '😊', color: 'rgb(16, 185, 129)', desc: 'Thân thiện & gần gũi' },
  recovery: { label: 'Upsell & Recovery', emoji: '⚡', color: 'rgb(245, 158, 11)', desc: 'Khắc phục & quảng bá' },
  short: { label: 'Short & Sweet', emoji: '💖', color: 'rgb(236, 72, 153)', desc: 'Ngắn gọn & súc tích' },
};

export function AIAssistant({
  selectedReview,
  loadingAI,
  handleGenerateAI,
  activeTone,
  setActiveTone,
  editedResponses,
  setEditedResponses,
  loadingApprove,
  handleApprove,
  showToast,
}: AIAssistantProps) {
  const [toneDropdownOpen, setToneDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToneDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = selectedReview.aiSuggestions;

  // ── Tone 4 (Short & Sweet) dynamic generation ──────────────────────────────
  const getShortAndSweet = (rev: Review, sugs: { standard: string; friendly: string; recovery: string }): string => {
    if (editedResponses['short']) return editedResponses['short']!;
    
    // Generate dynamically from friendly or standard
    const base = sugs.friendly || sugs.standard || '';
    if (!base) return '';
    
    const sentences = base.split(/[.!?]\s+/).filter(Boolean);
    if (sentences.length > 0) {
      const short = sentences.slice(0, 2).join('. ') + '.';
      return short.replace(/\.+$/, '.');
    }
    
    return `Cảm ơn ${rev.authorName}! Chúng tôi rất trân trọng đánh giá ${rev.rating} sao của bạn dành cho ${rev.placeName}.`;
  };

  // Determine current suggestion text
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
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-premium space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
            <span className="text-indigo-500 text-lg">✨</span> AI Assistant
          </h4>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Gợi ý phản hồi thông minh dựa trên đánh giá khách hàng</p>
        </div>
        
        {/* Tone Customizer Dropdown */}
        <div className="relative" ref={dropdownRef}>
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
  );
}
