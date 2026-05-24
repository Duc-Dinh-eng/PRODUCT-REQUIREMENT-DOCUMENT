import React, { useState, useRef, useEffect } from 'react';
import { 
  IconDashboard, 
  IconReviews, 
  IconAssistant, 
  IconAnalytics, 
  IconReports, 
  IconSettings,
  IconChevronDown
} from './Icons';

const QUICK_PLACES = [
  { id: 'ChIJIyEW2hlcNTERFGJBwpQCqXQ', label: 'JW Marriott HN', short: 'JW Marriott' },
  { id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA', label: 'Sheraton HN', short: 'Sheraton HN' },
  { id: 'ChIJa3ZChsUvdTERd0HFD1W-Hss', label: 'Metropole HN', short: 'Metropole HN' },
  { id: 'ChIJr-OQBKcdSjERqBwFlstWGvE', label: 'La Sinfonia', short: 'La Sinfonia' },
  { id: 'ChIJ8wj4jFEuNTERbRTIUSM_kDM', label: 'Pizza 4Ps SG', short: 'Pizza 4Ps SG' },
  { id: 'ChIJRcbZaklzdTERdYNRDFa5kB4', label: 'InterCon SG', short: 'InterCon SG' },
];

interface SidebarProps {
  placeIdInput: string;
  setPlaceIdInput: (id: string) => void;
  handleFetch: (id?: string) => Promise<void>;
  loadingFetch: boolean;
  stats: { total: number; pending: number; resolved: number };
  filterStatus: 'all' | 'pending' | 'resolved';
  setFilterStatus: (status: 'all' | 'pending' | 'resolved') => void;
  showReviewsDrawer: boolean;
  setShowReviewsDrawer: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
}

export function Sidebar({
  placeIdInput,
  setPlaceIdInput,
  handleFetch,
  loadingFetch,
  stats,
  filterStatus,
  setFilterStatus,
  showReviewsDrawer,
  setShowReviewsDrawer,
  setShowSettings,
}: SidebarProps) {
  const [placeDropdownOpen, setPlaceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPlaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
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
      <div className="p-4 border-t border-slate-100" ref={dropdownRef}>
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
  );
}
