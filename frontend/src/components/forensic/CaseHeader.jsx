import React from 'react';
import { 
  FolderSearch, RefreshCw, MessageSquare, Download, Search, 
  MapPin, Calendar, Shield, AlertTriangle, CheckCircle2, ChevronDown 
} from 'lucide-react';

export default function CaseHeader({
  selectedCase,
  casesList = [],
  onSelectCase,
  onRunAnalysis,
  analyzing,
  onToggleChat,
  isChatOpen,
  onDownloadPdf,
  onOpenSearch,
  solvabilityScore,
  primaryCrime,
}) {
  const priorityColors = {
    CRITICAL: 'bg-red-950 text-red-400 border-red-500/40',
    HIGH: 'bg-amber-950 text-amber-400 border-amber-500/40',
    MEDIUM: 'bg-blue-950 text-blue-400 border-blue-500/40',
    LOW: 'bg-emerald-950 text-emerald-400 border-emerald-500/40',
  };

  const currentPriority = (selectedCase?.priority || 'HIGH').toUpperCase();
  const priorityBadgeStyle = priorityColors[currentPriority] || priorityColors.HIGH;

  return (
    <div className="forensic-panel p-5 rounded-2xl space-y-4 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Case ID, Title & Metadata */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg tracking-wider">
              {selectedCase?.caseNumber || 'CASE-2026-0000'}
            </span>

            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border ${priorityBadgeStyle}`}>
              {currentPriority} PRIORITY
            </span>

            {primaryCrime && (
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700">
                {primaryCrime}
              </span>
            )}

            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              SOLVABILITY: {solvabilityScore || 85}%
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-wide truncate">
            {selectedCase?.title || 'Metropolitan Executive Investigation'}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Location: <strong className="text-slate-200">{selectedCase?.locationName || 'Metropolitan Jurisdiction'}</strong></span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>FIR Date: <strong className="text-slate-200">{selectedCase?.incidentDate || '2026-08-19'}</strong></span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>FORENSIC PIPELINE SYNCED</span>
            </span>
          </div>
        </div>

        {/* Right: Actions Bar & Case Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Case Switcher Dropdown */}
          <div className="relative">
            <select
              aria-label="Switch Active Investigation Case"
              value={selectedCase?.id || ''}
              onChange={(e) => {
                const found = casesList.find(c => c.id === parseInt(e.target.value));
                if (found) onSelectCase(found);
              }}
              className="appearance-none bg-slate-900 hover:bg-slate-800/80 border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
            >
              {casesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} • {c.title.length > 24 ? c.title.substring(0, 24) + '...' : c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Quick Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs flex items-center space-x-1.5"
            title="Global Search (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400">Ctrl+K</span>
          </button>

          {/* Re-run AI Analysis */}
          <button
            onClick={() => onRunAnalysis?.(selectedCase?.id)}
            disabled={analyzing || !selectedCase}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 hover:border-cyan-500/40 flex items-center space-x-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${analyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Re-Run Pipeline</span>
          </button>

          {/* RAG AI Assistant Toggle */}
          <button
            onClick={onToggleChat}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center space-x-2 transition-all shadow-sm ${
              isChatOpen 
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-cyan-glow' 
                : 'bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>

          {/* Download PDF Report */}
          <button
            onClick={onDownloadPdf}
            disabled={!selectedCase}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
