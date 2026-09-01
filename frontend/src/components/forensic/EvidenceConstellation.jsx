import React, { useState } from 'react';
import { HardDrive, Sparkles, Filter, CheckCircle2, ShieldCheck, Eye } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function EvidenceConstellation({
  evidence = [],
  onSelectEvidence,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  const getCategoryColor = (cat = '') => {
    const c = cat.toUpperCase();
    if (c.includes('CCTV') || c.includes('SURVEILLANCE')) return { fill: '#a855f7', border: 'border-purple-500/40', text: 'text-purple-300' };
    if (c.includes('DIGITAL') || c.includes('LOG') || c.includes('IP')) return { fill: '#06b6d4', border: 'border-cyan-500/40', text: 'text-cyan-300' };
    if (c.includes('FORENSIC') || c.includes('BLOOD') || c.includes('FINGERPRINT')) return { fill: '#f43f5e', border: 'border-rose-500/40', text: 'text-rose-300' };
    if (c.includes('FINANCIAL') || c.includes('BANK')) return { fill: '#10b981', border: 'border-emerald-500/40', text: 'text-emerald-300' };
    return { fill: '#f59e0b', border: 'border-amber-500/40', text: 'text-amber-300' };
  };

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-5 border border-slate-800 shadow-xl hud-corner">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                EVIDENCE CONSTELLATION MAPPING
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                {evidence.length} NODES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Clustered Forensic Relational Galaxy • Click Any Artifact to Open Dossier
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-cyan-400">
          Cryptographic Integrity: Verified
        </span>
      </div>

      {/* Constellation Grid of Artifact Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {evidence.map((ev, idx) => {
          const colors = getCategoryColor(ev.category || ev.title);
          const relevancePct = Math.round((ev.relevance || 0.85) * 100);
          const isHovered = hoveredId === (ev.id || idx);

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredId(ev.id || idx)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectEvidence?.(ev)}
              style={{ animationDelay: `${idx * 60}ms` }}
              className={`forensic-card p-4 rounded-xl border cursor-pointer transition-all duration-300 relative group overflow-hidden ${colors.border} ${
                isHovered ? 'shadow-cyan-glow scale-[1.02]' : ''
              }`}
            >
              {/* Top Meta */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-950 border ${colors.border} ${colors.text}`}>
                  {ev.category || 'FORENSIC'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  <AnimatedNumber value={relevancePct} suffix="%" />
                </span>
              </div>

              {/* Title */}
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors font-display truncate mb-1">
                {ev.title || 'Evidence Artifact'}
              </h4>

              {/* Preview Snippet */}
              <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                {ev.details || ev.description}
              </p>

              {/* Linked Person */}
              {ev.related_suspect && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-300 flex items-center justify-between">
                  <span className="text-slate-500">LINK:</span>
                  <span className="text-cyan-300 font-bold truncate max-w-[120px]">{ev.related_suspect}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
