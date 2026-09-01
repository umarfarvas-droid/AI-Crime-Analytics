import React from 'react';
import { AlertOctagon, RefreshCw, ShieldAlert } from 'lucide-react';

export function InvestigationSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="forensic-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-28 skeleton rounded-md" />
            <div className="h-7 w-72 skeleton rounded-md" />
          </div>
          <div className="h-4 w-96 skeleton rounded-md" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-32 skeleton rounded-xl" />
          <div className="h-9 w-36 skeleton rounded-xl" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="forensic-card p-5 rounded-xl space-y-3">
            <div className="h-3 w-20 skeleton rounded" />
            <div className="h-8 w-24 skeleton rounded-lg" />
            <div className="h-2 w-full skeleton rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 forensic-panel p-6 rounded-2xl space-y-4">
          <div className="h-4 w-40 skeleton rounded" />
          <div className="h-8 w-80 skeleton rounded-lg" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full skeleton rounded" />
            <div className="h-3 w-5/6 skeleton rounded" />
            <div className="h-3 w-4/6 skeleton rounded" />
          </div>
        </div>
        <div className="forensic-panel p-6 rounded-2xl space-y-4">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-10 w-28 skeleton rounded-lg" />
          <div className="h-3 w-full skeleton rounded-full" />
          <div className="h-12 w-full skeleton rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="forensic-panel p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-56 skeleton rounded" />
          <div className="h-8 w-36 skeleton rounded-xl" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 w-full skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Investigation Data Unavailable', message, onRetry }) {
  return (
    <div className="forensic-panel p-10 rounded-2xl border-rose-500/30 text-center max-w-xl mx-auto my-12 space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold font-display text-white">{title}</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          {message || 'Unable to retrieve or compute the requested investigation intelligence from the forensic pipeline.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-md hover:border-cyan-500/40"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}

export default { InvestigationSkeleton, ErrorState };
