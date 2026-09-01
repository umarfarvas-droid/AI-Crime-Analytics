import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X, ShieldAlert } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-xs font-medium ${
          isError
            ? 'bg-rose-950/95 border-rose-500/50 text-rose-100 shadow-rose-glow'
            : isSuccess
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
            : 'bg-slate-900/95 border-cyan-500/40 text-cyan-100 shadow-cyan-glow'
        }`}
      >
        {isError && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {!isError && !isSuccess && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
        <span className="leading-snug">{toast.message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:opacity-75 transition-opacity ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
