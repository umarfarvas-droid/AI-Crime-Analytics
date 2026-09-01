import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, FileText, Clock, MapPin, Building, Folder, ChevronRight, CornerDownLeft } from 'lucide-react';

export default function GlobalSearchModal({ 
  isOpen, 
  onClose, 
  analysis, 
  casesList = [], 
  onSelectCase, 
  onSelectPerson,
  onNavigateSection
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Aggregate searchable items from analysis and case list
  const suspects = (analysis?.suspect_rankings || analysis?.personsOfInterest || []).map(s => ({
    id: `suspect-${s.rank || s.name}`,
    type: 'suspect',
    title: s.name,
    subtitle: `${s.relationship || 'Person of Interest'} • Risk: ${Math.round((s.risk_score || 0.5) * 100)}%`,
    icon: User,
    color: 'text-cyan-400',
    data: s,
    action: () => {
      onSelectPerson?.(s);
      onClose();
    }
  }));

  const victim = analysis?.victim ? [{
    id: `victim-${analysis.victim.name}`,
    type: 'victim',
    title: `${analysis.victim.name} (Victim)`,
    subtitle: `Occupation: ${analysis.victim.occupation || 'Deceased'} • Status: Excluded from suspects`,
    icon: User,
    color: 'text-rose-400',
    action: () => {
      onNavigateSection?.('entities');
      onClose();
    }
  }] : [];

  const evidence = (analysis?.evidence_vault || analysis?.evidence || []).map((e, i) => ({
    id: `evd-${i}`,
    type: 'evidence',
    title: e.title || `Evidence Item #${i + 1}`,
    subtitle: `${e.category || 'Physical'} • Linked: ${e.related_suspect || 'Unlinked'} • Rel: ${Math.round((e.relevance || 0.8) * 100)}%`,
    icon: FileText,
    color: 'text-amber-400',
    action: () => {
      onNavigateSection?.('evidence');
      onClose();
    }
  }));

  const timeline = (analysis?.timeline || []).map((t, i) => ({
    id: `time-${i}`,
    type: 'timeline',
    title: `[${t.time || t.timestamp}] ${t.event || t.description}`,
    subtitle: `Persons: ${(t.persons || []).join(', ') || 'N/A'}`,
    icon: Clock,
    color: 'text-emerald-400',
    action: () => {
      onNavigateSection?.('timeline');
      onClose();
    }
  }));

  const locations = (analysis?.locations || []).map((loc, i) => ({
    id: `loc-${i}`,
    type: 'location',
    title: loc,
    subtitle: 'Identified Scene / Location',
    icon: MapPin,
    color: 'text-blue-400',
    action: () => {
      onNavigateSection?.('entities');
      onClose();
    }
  }));

  const organizations = (analysis?.organizations || []).map((org, i) => ({
    id: `org-${i}`,
    type: 'organization',
    title: org,
    subtitle: 'Identified Corporate / Entity',
    icon: Building,
    color: 'text-indigo-400',
    action: () => {
      onNavigateSection?.('entities');
      onClose();
    }
  }));

  const cases = casesList.map(c => ({
    id: `case-${c.id}`,
    type: 'case',
    title: `${c.caseNumber || `CASE-${c.id}`} — ${c.title}`,
    subtitle: `${c.type || 'Investigation'} • Date: ${c.incidentDate || 'N/A'}`,
    icon: Folder,
    color: 'text-cyan-300',
    action: () => {
      onSelectCase?.(c);
      onClose();
    }
  }));

  const allItems = [
    ...suspects,
    ...victim,
    ...evidence,
    ...timeline,
    ...locations,
    ...organizations,
    ...cases
  ];

  const filteredItems = query.trim() === ''
    ? allItems.slice(0, 10)
    : allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 15);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#0b101e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 bg-slate-900/90 border-b border-slate-800">
          <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search suspects, evidence, timeline, locations, cases (e.g. 'Sameer', 'CCTV', 'CASE-2026')..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-[55vh] overflow-y-auto custom-scrollbar space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No matching forensic entities or cases found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-cyan-950/50 border border-cyan-500/40 text-white' 
                      : 'hover:bg-slate-900/60 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold truncate text-white">{item.title}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {isSelected && (
                      <span className="text-[10px] font-mono text-cyan-400 flex items-center space-x-1">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">↵</kbd> Open</span>
          </div>
          <span>Showing {filteredItems.length} indexed records</span>
        </div>
      </div>
    </div>
  );
}
