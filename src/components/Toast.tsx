import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastState {
  message: string;
  tone: 'success' | 'error';
}

interface ToastProps {
  toast: ToastState | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const isError = toast.tone === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-200 ${
          isError
            ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
            : 'bg-slate-900/95 border-emerald-500/40 text-emerald-100'
        }`}
      >
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        <span className="text-sm font-medium leading-snug">{toast.message}</span>
      </div>
    </div>
  );
};
