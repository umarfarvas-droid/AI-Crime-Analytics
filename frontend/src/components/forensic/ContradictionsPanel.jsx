import React from 'react';
import { 
  AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2, 
  FileText, User, Sparkles, Scale 
} from 'lucide-react';

export default function ContradictionsPanel({ contradictions = [] }) {
  if (!contradictions || contradictions.length === 0) {
    return (
      <div className="forensic-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 hud-corner">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-white">
              STATEMENT DISCREPANCIES & CONTRADICTIONS
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Algorithmic Cross-Verification of Subject Claims vs Physical Logs
            </p>
          </div>
        </div>
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 flex items-center justify-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>ZERO STATEMENT CONTRADICTIONS DETECTED ACROSS AVAILABLE RECORDS</span>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity = 'HIGH') => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-500/40 animate-threat-pulse">
            HIGH IMPACT CONTRADICTION
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-500/40">
            MEDIUM IMPACT CONTRADICTION
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            LOW IMPACT DISCREPANCY
          </span>
        );
    }
  };

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl hud-corner">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-rose-glow">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                STATEMENT DISCREPANCIES & CONTRADICTIONS
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                {contradictions.length} DETECTED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Algorithmic Cross-Verification of Subject Claims vs Physical Logs
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Auto-Detected by Discrepancy Matching Logic
        </span>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="space-y-4">
        {contradictions.map((c, idx) => {
          const subject = c.subject || c.person || 'Subject';
          const statement = c.statement || c.claim || 'Verbal claim made to investigators.';
          const evidence = c.evidence || c.conflict || 'Physical or electronic record on file.';
          const discrepancy = c.discrepancy || 'Direct temporal/spatial contradiction.';
          const severity = c.severity || 'HIGH';

          return (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 100}ms` }}
              className="forensic-card p-5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 space-y-4 transition-all shadow-rose-glow animate-slide-up"
            >
              {/* Header with Subject Name & Severity */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="font-display font-bold text-sm text-white">{subject}</span>
                </div>
                {getSeverityBadge(severity)}
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                
                {/* Left: Stated Claim */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase text-slate-400 font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>SUBJECT VERBAL STATEMENT / ALIBI:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans italic leading-relaxed">
                    "{statement}"
                  </p>
                </div>

                {/* Right: Conflicting Physical Evidence */}
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase text-rose-400 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>CONFLICTING PHYSICAL / ELECTRONIC RECORD:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-100 font-sans font-medium leading-relaxed">
                    "{evidence}"
                  </p>
                </div>

              </div>

              {/* Deduction Analysis Summary */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start space-x-2 text-xs font-mono text-cyan-300">
                <Scale className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-400 uppercase text-[10px] block">FORENSIC DEDUCTION:</strong>
                  <span>{discrepancy}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
