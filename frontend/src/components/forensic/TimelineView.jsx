import React, { useState } from 'react';
import { 
  Clock, MapPin, Users, FileText, Filter, 
  AlertTriangle, CheckCircle2, ChevronRight, Sparkles 
} from 'lucide-react';

export default function TimelineView({ 
  timeline = [], 
  primaryLocation = 'Metropolitan Heights' 
}) {
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterEvidence, setFilterEvidence] = useState(false);

  // Extract unique persons appearing in timeline
  const allPersons = Array.from(
    new Set(
      timeline.flatMap((t) => t.persons || (t.person ? [t.person] : []))
    )
  ).filter(Boolean);

  const filteredTimeline = timeline.filter((event) => {
    const hasEvidence = !!event.evidence;
    const eventPersons = event.persons || (event.person ? [event.person] : []);
    const matchesPerson = 
      filterSubject === 'ALL' || 
      eventPersons.some((p) => p.toLowerCase().includes(filterSubject.toLowerCase())) ||
      (event.event && event.event.toLowerCase().includes(filterSubject.toLowerCase()));

    if (filterEvidence && !hasEvidence) return false;
    return matchesPerson;
  });

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl hud-corner">
      
      {/* Top Header & Timeline Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                CHRONOLOGICAL INVESTIGATION TIMELINE
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                24-HR TIME AXIS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Temporal Event Sequencing & Physical Cross-Corroboration
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {/* Person Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Subjects ({allPersons.length})</option>
            {allPersons.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>

          {/* Evidence Only Toggle */}
          <button
            onClick={() => setFilterEvidence(!filterEvidence)}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              filterEvidence
                ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow-cyan-glow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Evidence Only
          </button>
        </div>
      </div>

      {/* Main Vertical Timeline Container */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-slate-800 before:shadow-cyan-glow">
        
        {filteredTimeline.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            No chronological events recorded for this selection.
          </div>
        ) : (
          filteredTimeline.map((item, idx) => {
            const timeStr = item.time || item.normalizedTimestamp || 'TIME UNKNOWN';
            const locationStr = item.location || primaryLocation;
            const personsList = item.persons || (item.person ? [item.person] : []);
            const isAnomaly = item.isAnomaly || (item.event && /argument|clash|contradict|disable|tamper|break/i.test(item.event));

            return (
              <div 
                key={idx} 
                style={{ animationDelay: `${idx * 90}ms` }}
                className="relative group animate-slide-up"
              >
                
                {/* Glowing Timeline Marker Node */}
                <div 
                  className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all group-hover:scale-125 ${
                    isAnomaly 
                      ? 'bg-rose-500 border-rose-300 shadow-rose-glow animate-threat-pulse' 
                      : 'bg-cyan-500 border-cyan-300 shadow-cyan-glow'
                  }`}
                />

                {/* Event Card */}
                <div className="forensic-card p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 space-y-2.5 transition-all">
                  
                  {/* Event Meta: Time & Location */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                        {timeStr}
                      </span>
                      {isAnomaly && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30 animate-pulse">
                          CRITICAL ANOMALY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-mono text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{locationStr}</span>
                    </div>
                  </div>

                  {/* Event Description */}
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    {item.event || 'Recorded event on timeline.'}
                  </p>

                  {/* Persons & Evidence Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {personsList.length > 0 && (
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          {personsList.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.evidence && (
                      <div className="flex items-center space-x-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                        <FileText className="w-3 h-3" />
                        <span>Corroborating Evidence Linked</span>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

    </div>
  );
}
