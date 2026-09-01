import React from 'react';
import { 
  ShieldCheck, TrendingUp, Users, FileSearch, AlertCircle, 
  Sparkles, CheckCircle2, AlertTriangle, Fingerprint 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function ExecutiveSummary({
  confidencePct = 96,
  solvabilityScore = 95.0,
  suspectsCount = 3,
  evidenceCount = 7,
  contradictionsCount = 1,
}) {
  const cards = [
    {
      label: 'AI CLASSIFICATION CONFIDENCE',
      numericValue: confidencePct,
      valueDisplay: <AnimatedNumber value={confidencePct} suffix="%" />,
      subtext: 'NLP Pattern Corroboration',
      icon: ShieldCheck,
      color: 'cyan',
      progress: confidencePct,
      glowClass: 'shadow-cyan-glow',
      progressColor: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'CASE SOLVABILITY INDEX',
      numericValue: solvabilityScore,
      valueDisplay: <AnimatedNumber value={solvabilityScore} suffix="%" />,
      subtext: 'Forensic Lead Weighting',
      icon: TrendingUp,
      color: 'emerald',
      progress: solvabilityScore,
      glowClass: 'shadow-emerald-glow',
      progressColor: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'PERSONS OF INTEREST',
      numericValue: suspectsCount,
      valueDisplay: <AnimatedNumber value={suspectsCount} />,
      subtext: 'Ranked Risk Subjects',
      icon: Users,
      color: 'amber',
      progress: Math.min(100, (suspectsCount / 5) * 100),
      glowClass: 'shadow-amber-glow',
      progressColor: 'from-amber-500 to-orange-500',
    },
    {
      label: 'EVIDENCE ITEMS INDEXED',
      numericValue: evidenceCount,
      valueDisplay: <AnimatedNumber value={evidenceCount} />,
      subtext: 'Digital & Physical Artifacts',
      icon: FileSearch,
      color: 'blue',
      progress: Math.min(100, (evidenceCount / 10) * 100),
      glowClass: 'shadow-cyan-glow',
      progressColor: 'from-blue-500 to-indigo-500',
    },
    {
      label: 'STATEMENT DISCREPANCIES',
      numericValue: contradictionsCount,
      valueDisplay: <AnimatedNumber value={contradictionsCount} />,
      subtext: contradictionsCount > 0 ? 'Critical Alibi Clashes' : 'Zero Discrepancies',
      icon: contradictionsCount > 0 ? AlertTriangle : CheckCircle2,
      color: contradictionsCount > 0 ? 'rose' : 'emerald',
      progress: contradictionsCount > 0 ? 100 : 0,
      glowClass: contradictionsCount > 0 ? 'shadow-rose-glow animate-threat-pulse' : '',
      progressColor: contradictionsCount > 0 ? 'from-rose-500 to-red-600' : 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((c, idx) => {
        const IconComponent = c.icon;

        return (
          <div
            key={idx}
            className={`forensic-card p-4 rounded-2xl border transition-all duration-300 hud-corner animate-stagger-${idx + 1} ${c.glowClass}`}
          >
            {/* Header / Metric Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                {c.label}
              </span>
              <div className="w-6 h-6 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-cyan-400">
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Big Numeric Value with Count-Up */}
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                {c.valueDisplay}
              </span>
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-slate-400 font-sans truncate mb-2.5">
              {c.subtext}
            </p>

            {/* Mini Progress Bar with Shimmer Highlight */}
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 progress-shimmer">
              <div
                className={`bg-gradient-to-r ${c.progressColor} h-full rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${c.progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
