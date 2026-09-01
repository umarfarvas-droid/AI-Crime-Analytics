import React, { useState, useEffect } from 'react';
import { 
  Minimize2, Shield, Share2, Activity, Clock, 
  AlertTriangle, Users, HardDrive, MessageSquare, Sparkles 
} from 'lucide-react';
import InvestigationGraph from './InvestigationGraph';
import SolvabilityRadar from './SolvabilityRadar';
import ForensicTimeline from './ForensicTimeline';
import AnimatedNumber from './AnimatedNumber';

export default function FullscreenCommandCenter({
  isOpen,
  onClose,
  selectedCase,
  analysis,
  onSelectPerson,
  onSelectEvidence,
  onToggleChat,
}) {
  const [temporalModeActive, setTemporalModeActive] = useState(false);

  // Esc key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confidencePct = Math.round((analysis?.crime_category_confidence || 0.96) * 100);
  const solvabilityScore = analysis?.solvability_score || selectedCase?.confidenceScore || 95.0;
  const primaryCrime = analysis?.primary_crime || selectedCase?.type || 'HOMICIDE';

  return (
    <div className="fixed inset-0 z-50 bg-[#05070d] text-slate-200 overflow-y-auto p-4 sm:p-6 space-y-4 animate-fade-in custom-scrollbar selection:bg-cyan-500/30">
      
      {/* Top Fullscreen HUD Header */}
      <div className="flex items-center justify-between bg-slate-950/90 p-4 rounded-2xl border border-cyan-500/40 shadow-cyan-glow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                FEDERAL FORENSIC COMMAND CENTER
              </h1>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                IMMERSIVE OPS
              </span>
            </div>
            <p className="text-xs text-cyan-400 font-mono">
              Case: {selectedCase?.caseNumber || 'CASE-2026-ACTIVE'} • {selectedCase?.title}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>RAG COPILOT</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 hover:text-rose-400 border border-slate-800 text-slate-300 text-xs font-mono font-bold transition-all"
            title="Exit Fullscreen (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>EXIT (ESC)</span>
          </button>
        </div>
      </div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Side (8 Cols): Investigation Relationship Graph */}
        <div className="lg:col-span-8">
          <InvestigationGraph
            analysis={analysis}
            onSelectPerson={onSelectPerson}
            onSelectEvidence={onSelectEvidence}
          />
        </div>

        {/* Right Side (4 Cols): Solvability Radar & Key Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <SolvabilityRadar
            analysis={analysis}
            solvabilityScore={solvabilityScore}
          />

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>PRIMARY CLASSIFICATION:</span>
              <span className="text-white font-bold">{primaryCrime}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>AI CONFIDENCE RATING:</span>
              <span className="text-cyan-400 font-bold"><AnimatedNumber value={confidencePct} suffix="%" /></span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>CASE SOLVABILITY INDEX:</span>
              <span className="text-emerald-400 font-bold"><AnimatedNumber value={solvabilityScore} suffix="%" /></span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom: Horizontal Forensic Timeline */}
      <div>
        <ForensicTimeline
          timeline={analysis?.timeline || []}
          primaryLocation={selectedCase?.locationName || 'Crime Scene'}
          temporalModeActive={temporalModeActive}
          onToggleTemporalMode={() => setTemporalModeActive(!temporalModeActive)}
        />
      </div>

    </div>
  );
}
