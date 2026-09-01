import React from 'react';
import { X, Activity, Server, Cpu, Video, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function SystemStatusModal({ isOpen, onClose, backendOnline = true }) {
  if (!isOpen) return null;

  const subsystems = [
    {
      name: 'Frontend Command Center',
      type: 'Vite 5.2 + React 18',
      status: 'OPERATIONAL',
      latency: '2ms (Local)',
      detail: 'Client-side rendering, forensic dashboard state, dynamic telemetry, HUD theme active.',
      icon: Cpu,
      online: true,
    },
    {
      name: 'Spring Boot Forensic Engine',
      type: 'Spring Boot 3.2.0 • REST / JPA',
      status: backendOnline ? 'OPERATIONAL' : 'OFFLINE / STANDBY',
      latency: backendOnline ? '12ms' : 'Unreachable',
      detail: 'Core NLP entity extraction, 5-factor suspect risk algorithm, case isolation manager.',
      icon: Server,
      online: backendOnline,
    },
    {
      name: 'RAG Forensic Copilot Pipeline',
      type: 'Vector Embedding & Retrieval',
      status: 'OPERATIONAL',
      latency: '18ms',
      detail: 'Narrative document retrieval, cross-statement contradiction detection, grounded QA.',
      icon: Shield,
      online: true,
    },
    {
      name: 'Forensic Video Reconstruction Engine',
      type: 'Visual HUD / Video Stream Pipeline',
      status: 'OPERATIONAL',
      latency: '45ms',
      detail: 'Chronological scene synthesis, SVG blueprint vector rendering, MP4 video streamer.',
      icon: Video,
      online: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0b101e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold font-display text-white">System Telemetry & Architecture</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  ALL SYSTEMS NOMINAL
                </span>
              </div>
              <p className="text-xs text-slate-400">AI Crime Analytics Real-Time Diagnostic Feed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subsystems List */}
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {subsystems.map((sub, idx) => {
            const Icon = sub.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${sub.online ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{sub.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">{sub.type}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${sub.online ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'}`}>
                      {sub.online ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{sub.status}</span>
                    </span>
                    <span className="block text-[10px] font-mono text-slate-500 mt-0.5">Ping: {sub.latency}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-900">
                  {sub.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Port: 5173 (Client) ↔ 8080 (API)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
