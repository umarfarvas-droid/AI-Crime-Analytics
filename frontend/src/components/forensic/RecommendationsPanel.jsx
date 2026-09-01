import React from 'react';
import { 
  Compass, CheckCircle2, ArrowRight, AlertCircle, 
  HelpCircle, ChevronRight, Sparkles 
} from 'lucide-react';

export default function RecommendationsPanel({ 
  recommendations = [], 
  missingInformation = [] 
}) {
  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl hud-corner">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                RECOMMENDED INVESTIGATIVE DIRECTIVES
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                PRIORITIZED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Actionable Leads, Interrogation Focus Areas & Evidence Verification
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-cyan-400">
          Ranked by Probative Value
        </span>
      </div>

      {/* Main Recommendations List */}
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            No specific recommendations generated.
          </div>
        ) : (
          recommendations.map((rec, idx) => {
            const recText = typeof rec === 'string' ? rec : rec.action || rec.recommendation || JSON.stringify(rec);
            const rationale = typeof rec === 'object' ? rec.rationale : null;

            return (
              <div
                key={idx}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="forensic-card p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 flex items-start space-x-3.5 group transition-all animate-slide-left"
              >
                {/* Priority Number Badge */}
                <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  {idx + 1}
                </div>

                {/* Directive Text */}
                <div className="flex-1 space-y-1">
                  <p className="text-xs sm:text-sm text-slate-100 font-sans font-medium leading-relaxed group-hover:text-cyan-200 transition-colors">
                    {recText}
                  </p>
                  {rationale && (
                    <p className="text-xs font-mono text-slate-400">
                      Rationale: {rationale}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            );
          })
        )}
      </div>

      {/* Missing Information / Evidence Gaps Analysis */}
      {missingInformation && missingInformation.length > 0 && (
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 font-mono text-amber-400 text-xs font-bold">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>CRITICAL INFORMATION GAPS & UNRESOLVED INQUIRIES:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {missingInformation.map((gap, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 font-mono flex items-start space-x-2"
              >
                <span className="text-amber-400 font-bold">•</span>
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
