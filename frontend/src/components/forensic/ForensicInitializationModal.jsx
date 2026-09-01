import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, RefreshCw, Cpu, ShieldCheck, Activity } from 'lucide-react';

export default function ForensicInitializationModal({ isOpen, caseNumber, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'FIR NARRATIVE INGESTED & CRYPTO-HASHED',
    'MULTI-VECTOR NLP ENTITY EXTRACTION',
    'PROBABILISTIC CRIME CLASSIFICATION',
    'EVIDENCE VAULT CROSS-CORROBORATION',
    'CHRONOLOGICAL TIMELINE SYNTHESIS',
    '5-FACTOR SUSPECT RISK & MOTIVE MATRIX',
    'RAG FORENSIC VECTOR CORPUS READY',
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 350);
          return prev;
        }
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPct = Math.min(100, Math.round((currentStep / steps.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#080d1a] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden hud-corner">
        
        {/* Background Laser Scanner */}
        <div className="laser-scanner-line opacity-50" />

        {/* Top Icon & Title */}
        <div className="flex items-center space-x-3.5 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold font-display text-white tracking-wide">
                INITIALIZING FORENSIC PIPELINE
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 animate-pulse">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-cyan-400/90 font-mono">
              Target Case: {caseNumber || 'CASE-2026-ACTIVE'}
            </p>
          </div>
        </div>

        {/* Staged Checklist */}
        <div className="space-y-2.5 font-mono text-xs">
          {steps.map((step, idx) => {
            const isDone = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-slate-200'
                    : isCurrent
                    ? 'bg-slate-900 border-cyan-500/60 text-cyan-300 shadow-cyan-glow'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-700 block shrink-0" />
                  )}
                  <span className="font-semibold text-[11px]">{step}</span>
                </div>

                <span className="text-[10px] uppercase">
                  {isDone ? 'COMPLETED' : isCurrent ? 'PROCESSING' : 'QUEUED'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1 font-mono">
          <div className="flex justify-between text-xs text-slate-400">
            <span>PIPELINE VELOCITY</span>
            <span className="font-bold text-cyan-400">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 progress-shimmer">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
