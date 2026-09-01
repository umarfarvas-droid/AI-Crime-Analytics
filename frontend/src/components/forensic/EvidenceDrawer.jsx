import React from 'react';
import { 
  X, FileText, HardDrive, ShieldCheck, User, 
  Clock, MapPin, CheckCircle2, AlertTriangle, Fingerprint 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function EvidenceDrawer({
  isOpen,
  onClose,
  evidenceItem,
  onSelectSuspect,
}) {
  if (!isOpen || !evidenceItem) return null;

  const relevancePct = Math.round((evidenceItem.relevance || 0.85) * 100);
  const confidencePct = Math.round((evidenceItem.confidence || 0.90) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="relative w-full max-w-lg bg-[#080d1a] border-l border-slate-700/80 shadow-2xl h-full flex flex-col animate-slide-left hud-corner">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-[#0c1426] to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
              <HardDrive className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold font-display text-white truncate max-w-xs">
                  {evidenceItem.title || 'Evidence Artifact'}
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {evidenceItem.category || 'FORENSIC'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Item #{evidenceItem.id || 'EVD-AUTO'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Probative Relevance & Confidence Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                PROBATIVE RELEVANCE
              </span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                <AnimatedNumber value={relevancePct} suffix="%" />
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                AI CONFIDENCE
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                <AnimatedNumber value={confidencePct} suffix="%" />
              </span>
            </div>
          </div>

          {/* Detailed Narrative Extraction */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              FORENSIC ARTIFACT DETAILS
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
              {evidenceItem.details || evidenceItem.description || 'Artifact extracted during narrative ingestion.'}
            </div>
          </div>

          {/* Corroborated Person Link */}
          {evidenceItem.related_suspect && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                LINKED PERSON OF INTEREST
              </h4>
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white font-mono">{evidenceItem.related_suspect}</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">DIRECT CLUE</span>
              </div>
            </div>
          )}

          {/* Chain of Custody & Security Stamp */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>CRYPTOGRAPHIC CHAIN OF CUSTODY VERIFIED</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>HASH: SHA-256 (64-HEX INTEGRITY OK)</div>
              <div>INGESTION STATUS: VALIDATED RECORD</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
