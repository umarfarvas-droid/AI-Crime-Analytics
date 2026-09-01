import React, { useState } from 'react';
import { 
  Clock, MapPin, Users, FileText, Filter, 
  AlertTriangle, CheckCircle2, ChevronRight, Sparkles, Eye, Play, Pause 
} from 'lucide-react';

export default function ForensicTimeline({
  timeline = [],
  primaryLocation = 'Metropolitan Heights',
  temporalModeActive = false,
  onToggleTemporalMode,
}) {
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [filterSubject, setFilterSubject] = useState('ALL');

  const allPersons = Array.from(
    new Set(
      timeline.flatMap((t) => t.persons || (t.person ? [t.person] : []))
    )
  ).filter(Boolean);

  const filteredTimeline = timeline.filter((event) => {
    const eventPersons = event.persons || (event.person ? [event.person] : []);
    if (filterSubject === 'ALL') return true;
    return eventPersons.some((p) => p.toLowerCase().includes(filterSubject.toLowerCase()));
  });

  const activeEvent = filteredTimeline[activeEventIndex] || filteredTimeline[0] || null;

  return (
    <div className={`forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl hud-corner transition-all ${
      temporalModeActive ? 'temporal-mode-active' : ''
    }`}>
      
      {/* Top Header & Temporal Mode Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                CHRONOLOGICAL FORENSIC TIMELINE & EVENT STREAM
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                TEMPORAL SEQUENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Interactive 24-Hr Event Scrubber • Spatial Movement & Contradiction Tracing
            </p>
          </div>
        </div>

        {/* Temporal Mode Toggle & Filter */}
        <div className="flex items-center space-x-2.5">
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setActiveEventIndex(0);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Subjects ({allPersons.length})</option>
            {allPersons.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>

          <button
            onClick={onToggleTemporalMode}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
              temporalModeActive
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-glow-intense animate-pulse'
                : 'bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{temporalModeActive ? 'EXIT TEMPORAL MODE' : 'TEMPORAL ANALYSIS MODE'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Interactive Timeline Scrubber Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>TIME AXIS NAVIGATION</span>
          <span className="text-cyan-400 font-bold">
            EVENT {activeEventIndex + 1} OF {filteredTimeline.length}
          </span>
        </div>

        {/* Horizontal Track with Node Badges */}
        <div className="relative py-4 overflow-x-auto custom-scrollbar">
          {/* Central Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-cyan-glow" />

          <div className="flex items-center space-x-4 px-2 min-w-max relative z-10">
            {filteredTimeline.map((item, idx) => {
              const isSelected = activeEventIndex === idx;
              const isAnomaly = item.isAnomaly || (item.event && /argument|clash|contradict|disable|tamper|break/i.test(item.event));

              return (
                <button
                  key={idx}
                  onClick={() => setActiveEventIndex(idx)}
                  className={`flex flex-col items-center group transition-all duration-300 ${
                    isSelected ? 'scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Timestamp Chip */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md mb-2 border transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-glow font-extrabold'
                      : 'bg-slate-900 text-cyan-300 border-slate-800'
                  }`}>
                    {item.time || 'TIME'}
                  </span>

                  {/* Marker Node */}
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'bg-white border-cyan-400 shadow-cyan-glow-intense scale-125'
                      : isAnomaly
                      ? 'bg-rose-500 border-rose-300 animate-threat-pulse'
                      : 'bg-cyan-600 border-slate-900'
                  }`} />

                  {/* Small Location Label Below */}
                  <span className="text-[9px] font-mono text-slate-400 mt-2 truncate max-w-[80px]">
                    {item.location || primaryLocation}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Active Event Spotlight Card */}
      {activeEvent && (
        <div className="forensic-card p-5 rounded-2xl border border-cyan-500/40 space-y-3 bg-gradient-to-r from-slate-950 via-[#0c1426] to-slate-950 shadow-cyan-glow animate-fade-in">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-sm font-extrabold text-cyan-300 bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-500/40">
                {activeEvent.time || 'TIME UNKNOWN'}
              </span>
              <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeEvent.location || primaryLocation}</span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              CORROBORATED INCIDENT ANCHOR
            </span>
          </div>

          {/* Event Narrative */}
          <p className="text-xs sm:text-sm text-white font-sans leading-relaxed">
            {activeEvent.event || 'Recorded event detail.'}
          </p>

          {/* Persons & Evidence Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs font-mono">
            {activeEvent.persons && activeEvent.persons.length > 0 && (
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-500">Subjects Present:</span>
                <span className="font-bold text-cyan-300">{activeEvent.persons.join(', ')}</span>
              </div>
            )}

            {activeEvent.evidence && (
              <div className="flex items-center space-x-1.5 text-amber-300 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-500/30">
                <FileText className="w-3 h-3" />
                <span>Evidence: {activeEvent.evidence}</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
