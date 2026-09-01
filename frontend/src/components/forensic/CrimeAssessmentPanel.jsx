import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, 
  HelpCircle, Scale, FileText, CheckCircle2, TrendingUp, Cpu 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function CrimeAssessmentPanel({
  primaryCrime = 'HOMICIDE / MURDER',
  associatedCrimes = [],
  confidencePct = 96,
  reasoningFactors = [],
  solvabilityScore = 95.0,
  investigationComplexity = 'LOW',
}) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const getBadgeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'HOMICIDE':
      case 'HOMICIDE / MURDER':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-rose-glow';
      case 'CYBER_CRIME':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-cyan-glow';
      case 'ROBBERY':
      case 'BURGLARY':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-glow';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl overflow-hidden hud-corner relative">
      
      {/* Subtle Moving Laser Scanner Line across the assessment card */}
      <div className="laser-scanner-line opacity-30" />

      {/* Top Header & AI Model Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                AI CRIME PREDICTION & CLASSIFICATION ENGINE
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                VALIDATED MODEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Multi-Layered NLP Feature Extraction • Penal Code Cross-Reference
            </p>
          </div>
        </div>

        {/* Confidence & Solvability Metrics */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">CONFIDENCE RATING</span>
            <span className="text-cyan-400 font-bold text-sm">
              <AnimatedNumber value={confidencePct} suffix="%" />
            </span>
          </div>
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">INVESTIGATION COMPLEXITY</span>
            <span className={`font-bold text-sm ${
              investigationComplexity === 'HIGH' ? 'text-rose-400' : investigationComplexity === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {investigationComplexity}
            </span>
          </div>
        </div>
      </div>

      {/* Main Assessment Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* Left Side (7 Cols): Primary Classification & Associated Offenses */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
              Primary Crime Classification:
            </span>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold border tracking-wide uppercase ${getBadgeColor(primaryCrime)}`}>
                {primaryCrime}
              </span>
              <div className="flex items-center space-x-1 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Probabilistic Match: <AnimatedNumber value={confidencePct} suffix="%" /></span>
              </div>
            </div>
          </div>

          {/* Associated Offenses */}
          {associatedCrimes && associatedCrimes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Concurrent / Associated Offenses:
              </span>
              <div className="flex flex-wrap gap-2">
                {associatedCrimes.map((crime, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{crime}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Reasoning Factors Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsReasoningOpen(!isReasoningOpen)}
              className="flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 px-3.5 py-2 rounded-xl transition-all shadow-sm group"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span>Why this classification? (Forensic Evidence Factors)</span>
              {isReasoningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Expandable Reasoning Drawer */}
            {isReasoningOpen && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5 text-xs text-slate-300 font-sans animate-fade-in">
                <div className="flex items-center space-x-2 font-mono text-cyan-300 text-[11px] font-bold border-b border-slate-800 pb-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DEDUCTIVE REASONING FACTORS:</span>
                </div>
                {reasoningFactors && reasoningFactors.length > 0 ? (
                  <ul className="space-y-1.5 font-mono text-[11px]">
                    {reasoningFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span className="text-slate-300">{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">
                    Derived from incident narrative keyword semantics, physical evidence markers, and reported circumstances.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side (5 Cols): Solvability Index Gauge */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase text-slate-200">
                CASE SOLVABILITY INDEX
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-cyan-300">
              <AnimatedNumber value={solvabilityScore} suffix="%" />
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 progress-shimmer">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${solvabilityScore}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Score evaluated on forensic corroboration, CCTV surveillance timestamps, keycard access logs, and witness reliability.
          </p>
        </div>

      </div>

    </div>
  );
}
