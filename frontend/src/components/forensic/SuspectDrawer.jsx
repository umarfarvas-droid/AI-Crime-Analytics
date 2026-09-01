import React from 'react';
import { 
  X, User, ShieldAlert, FileText, Clock, AlertTriangle, 
  CheckCircle2, Fingerprint, ExternalLink, Activity 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function SuspectDrawer({
  isOpen,
  onClose,
  suspect,
  allEvidence = [],
  allTimeline = [],
}) {
  if (!isOpen || !suspect) return null;

  const name = suspect.name || `${suspect.firstName || ''} ${suspect.lastName || ''}`.trim() || 'Unknown Subject';
  const role = suspect.role || suspect.relationship || 'Person of Interest';
  const risk = suspect.risk_score !== undefined ? suspect.risk_score : (suspect.riskScore !== undefined ? suspect.riskScore * 100 : 50);

  // Breakdown scores (either direct or heuristic estimation)
  const motiveScore = Math.round((suspect.motive_score !== undefined ? suspect.motive_score : 0.8) * 100);
  const opportunityScore = Math.round((suspect.opportunity_score !== undefined ? suspect.opportunity_score : 0.85) * 100);
  const evidenceScore = Math.round((suspect.evidence_score !== undefined ? suspect.evidence_score : 0.9) * 100);
  const contradictionScore = Math.round((suspect.contradiction_score !== undefined ? suspect.contradiction_score : 0.85) * 100);
  const alibiScore = suspect.alibi_status === 'VERIFIED' ? 20 : 80;

  // Corroborate related evidence & timeline events
  const relatedEvidence = allEvidence.filter(
    (e) => (e.related_suspect && e.related_suspect.toLowerCase().includes(name.toLowerCase())) ||
           (e.details && e.details.toLowerCase().includes(name.toLowerCase()))
  );

  const relatedTimeline = allTimeline.filter(
    (t) => (t.persons && t.persons.some((p) => p.toLowerCase().includes(name.toLowerCase()))) ||
           (t.event && t.event.toLowerCase().includes(name.toLowerCase()))
  );

  const breakdownFactors = [
    { label: 'Motive Weight (20%)', score: motiveScore, color: 'from-amber-500 to-orange-500' },
    { label: 'Opportunity Weight (25%)', score: opportunityScore, color: 'from-blue-500 to-cyan-500' },
    { label: 'Corroborating Evidence (30%)', score: evidenceScore, color: 'from-rose-500 to-red-600' },
    { label: 'Contradiction Severity (20%)', score: contradictionScore, color: 'from-purple-500 to-pink-500' },
    { label: 'Alibi Inconsistency (5%)', score: alibiScore, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="relative w-full max-w-lg bg-[#080d1a] border-l border-slate-700/80 shadow-2xl h-full flex flex-col animate-slide-left hud-corner">
        
        {/* Drawer Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-[#0c1426] to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold font-display text-white">{name}</h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  DOSSIER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{role}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Risk Level Badge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                AGGREGATE 5-FACTOR RISK
              </span>
              <span className="text-2xl font-bold font-mono text-white">
                <AnimatedNumber value={Math.round(risk)} suffix="%" />
              </span>
            </div>
            <div>
              {risk >= 75 ? (
                <span className="px-3 py-1 rounded-lg bg-rose-950 text-rose-400 border border-rose-500/40 text-xs font-mono font-bold animate-threat-pulse">
                  PRIMARY SUSPECT
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-amber-950 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold">
                  PERSON OF INTEREST
                </span>
              )}
            </div>
          </div>

          {/* 5-Factor Mathematical Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>5-FACTOR RISK CONTRIBUTION BREAKDOWN</span>
            </h4>

            <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-mono text-xs">
              {breakdownFactors.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{f.label}</span>
                    <span className="font-bold text-white"><AnimatedNumber value={f.score} suffix="%" /></span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/80 progress-shimmer">
                    <div
                      className={`bg-gradient-to-r ${f.color} h-full rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motive Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              MOTIVE & BACKGROUND
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
              {suspect.motive || 'No specific financial or personal dispute recorded prior to incident.'}
            </div>
          </div>

          {/* Alibi Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              STATED ALIBI & TIMING
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
              {suspect.alibi_status === 'VERIFIED' ? (
                <div className="flex items-start space-x-2 text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Alibi verified by secondary witness and timestamps.</span>
                </div>
              ) : (
                <div className="flex items-start space-x-2 text-rose-400 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Stated alibi contradicts physical electronic access badge records.</span>
                </div>
              )}
            </div>
          </div>

          {/* Linked Evidence */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              DIRECTLY LINKED EVIDENCE ({relatedEvidence.length})
            </h4>
            {relatedEvidence.length === 0 ? (
              <p className="text-xs font-mono text-slate-500">No direct physical evidence registered.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {relatedEvidence.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-cyan-300 font-semibold">{ev.title || ev.category}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{ev.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
