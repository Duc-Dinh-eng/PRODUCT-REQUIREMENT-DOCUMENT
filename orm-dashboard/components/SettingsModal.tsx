import React, { useState } from 'react';

interface ApiKeys {
  google: string;
  openai: string;
  gemini: string;
}

interface SettingsModalProps {
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
  onClose: () => void;
}

export function SettingsModal({ apiKeys, onSave, onClose }: SettingsModalProps) {
  const [local, setLocal] = useState<ApiKeys>(apiKeys);

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  const hasAnyKey = local.google || local.openai || local.gemini;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl relative border border-slate-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <span>⚙️</span> Cấu hình API Keys
          </h2>
          <button 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-xs text-indigo-700 leading-relaxed">
          {hasAnyKey
            ? '🟢 Chế độ Live — Sẽ gọi API thực tế khi có key.'
            : '🟡 Chế độ Mock — Không có key nào, ứng dụng dùng dữ liệu mẫu.'}
          <br />Keys được lưu cục bộ trong trình duyệt của bạn (localStorage).
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="google-key">
              Google Places API Key
            </label>
            <input
              id="google-key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition font-mono"
              type="password"
              placeholder="AIza..."
              value={local.google}
              onChange={(e) => setLocal((p) => ({ ...p, google: e.target.value }))}
            />
            <div className="text-[10px] text-slate-400 mt-1">
              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-600 hover:underline"
              >
                console.cloud.google.com
              </a>{' '}→ Bật Places API (New)
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="openai-key">
              OpenAI API Key
            </label>
            <input
              id="openai-key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition font-mono"
              type="password"
              placeholder="sk-..."
              value={local.openai}
              onChange={(e) => setLocal((p) => ({ ...p, openai: e.target.value }))}
            />
            <div className="text-[10px] text-slate-400 mt-1">
              Model: gpt-4o-mini ·{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-600 hover:underline"
              >
                platform.openai.com
              </a>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="gemini-key">
              Gemini API Key <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
            </label>
            <input
              id="gemini-key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition font-mono"
              type="password"
              placeholder="AIza..."
              value={local.gemini}
              onChange={(e) => setLocal((p) => ({ ...p, gemini: e.target.value }))}
            />
            <div className="text-[10px] text-slate-400 mt-1">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-600 hover:underline"
              >
                aistudio.google.com
              </a>{' '}→ Model: gemini-1.5-flash
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button 
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition" 
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20" 
            onClick={handleSave}
          >
            💾 Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
}
