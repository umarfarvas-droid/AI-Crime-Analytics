import React, { useState } from 'react';
import { 
  FolderLock, ShieldAlert, Sparkles, ChevronDown, 
  RotateCw, Download, Search, Maximize2, Activity 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function CaseControlBar({
  selectedCase,
  casesList = [],
  onSelectCase,
  solvabilityScore = 95.0,
  confidencePct = 96,
  onOpenSearch,
  onEnterFullscreen,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const priorityColor = (p = '') => {
    switch (p.toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/80 border-rose-500/40 animate-threat-pulse';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/80 border-amber-500/40';
      default:
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40';
    }
  };

  return (
    <div className="w-full bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80 py-2.5 px-4 sm:px-6 lg:px-8 text-xs font-mono select-none sticky top-16 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Active Case Selector Pill */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 rounded-xl text-cyan-300 transition-all shadow-cyan-glow"
            >
              <FolderLock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">
                {selectedCase?.caseNumber || 'CASE-2026-ACTIVE'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Case Dropdown */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-[#0b101e] border border-slate-700/90 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-slide-up">
                <div className="text-[10px] text-slate-500 uppercase px-2 py-1 font-bold">
                  Switch Active Investigation
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {casesList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCase(c);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        selectedCase?.id === c.id
                          ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="truncate">{c.caseNumber || c.title}</span>
                      <span className="text-[10px] opacity-60">#{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-2 text-slate-300 truncate max-w-sm">
            <span className="text-slate-500">•</span>
            <span className="font-sans font-medium text-xs truncate">
              {selectedCase?.title || 'Active Investigation'}
            </span>
          </div>
        </div>

        {/* Center: Live Status Badges */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>ACTIVE INVESTIGATION</span>
          </span>

          <span className={`px-2.5 py-0.5 rounded-lg border font-bold ${priorityColor(selectedCase?.priority)}`}>
            PRIORITY: {selectedCase?.priority || 'CRITICAL'}
          </span>

          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            CONFIDENCE: <strong className="text-cyan-300 ml-1"><AnimatedNumber value={confidencePct} suffix="%" /></strong>
          </span>
        </div>

        {/* Right: Quick Actions (Search, Fullscreen Command Center) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg transition-colors text-[11px]"
            title="Search Investigation (Ctrl + K)"
          >
            <Search className="w-3 h-3 text-cyan-400" />
            <span className="hidden lg:inline">Find (Ctrl+K)</span>
          </button>

          <button
            onClick={onEnterFullscreen}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-3 py-1 rounded-lg shadow-cyan-glow transition-all text-[11px]"
            title="Enter Fullscreen Command Center"
          >
            <Maximize2 className="w-3 h-3" />
            <span>COMMAND CENTER</span>
          </button>
        </div>

      </div>
    </div>
  );
}
