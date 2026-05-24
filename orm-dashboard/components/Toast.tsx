import React, { useState, useCallback } from 'react';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  
  return { toasts, show };
}

const TOAST_ICON: Record<Toast['type'], string> = { 
  success: '✅', 
  error: '❌', 
  info: 'ℹ️' 
};

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
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
