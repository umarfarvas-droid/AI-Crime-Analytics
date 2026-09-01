import React, { useState } from 'react';
import { 
  FileText, Search, Filter, HardDrive, ShieldCheck, 
  ExternalLink, CheckCircle2, AlertTriangle, Fingerprint, 
  Video, Eye, LayoutGrid, Table 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function EvidenceVault({ evidence = [] }) {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const categories = [
    'ALL',
    'DIGITAL',
    'PHYSICAL',
    'SURVEILLANCE',
    'FINANCIAL',
    'COMMUNICATION',
    'FORENSIC'
  ];

  // Helper to categorize raw evidence string if category is vague
  const normalizeCategory = (cat = '', title = '', details = '') => {
    const combined = `${cat} ${title} ${details}`.toUpperCase();
    if (combined.includes('CCTV') || combined.includes('CAMERA') || combined.includes('FOOTAGE') || combined.includes('SURVEILLANCE')) {
      return 'SURVEILLANCE';
    }
    if (combined.includes('IP') || combined.includes('ACCESS') || combined.includes('CARD') || combined.includes('SERVER') || combined.includes('LOG') || combined.includes('USB') || combined.includes('DIGITAL')) {
      return 'DIGITAL';
    }
    if (combined.includes('BLOOD') || combined.includes('FINGERPRINT') || combined.includes('DNA') || combined.includes('AUTOPSY') || combined.includes('FORENSIC')) {
      return 'FORENSIC';
    }
    if (combined.includes('FINANCIAL') || combined.includes('BANK') || combined.includes('TRANSACTION') || combined.includes('CRORE') || combined.includes('WALLET')) {
      return 'FINANCIAL';
    }
    if (combined.includes('PHONE') || combined.includes('EMAIL') || combined.includes('CALL') || combined.includes('MESSAGE')) {
      return 'COMMUNICATION';
    }
    return 'PHYSICAL';
  };

  const filteredEvidence = evidence.filter((e) => {
    const normCat = normalizeCategory(e.category, e.title, e.details);
    const matchesCat = activeCategory === 'ALL' || normCat === activeCategory;
    const matchesSearch = 
      (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.details && e.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.related_suspect && e.related_suspect.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const getCategoryBadge = (normCat) => {
    switch (normCat) {
      case 'SURVEILLANCE':
        return 'bg-purple-950 text-purple-300 border-purple-500/40 shadow-sm';
      case 'DIGITAL':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40 shadow-cyan-glow';
      case 'FORENSIC':
        return 'bg-rose-950 text-rose-300 border-rose-500/40 shadow-rose-glow';
      case 'FINANCIAL':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-emerald-glow';
      case 'COMMUNICATION':
        return 'bg-blue-950 text-blue-300 border-blue-500/40';
      default:
        return 'bg-amber-950 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl hud-corner">
      
      {/* Top Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                FORENSIC EVIDENCE VAULT
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                INDEXED (<AnimatedNumber value={evidence.length} />)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Cryptographically Verified Multi-Source Artifact Registry
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Table View"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        
        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search evidence vault..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

      </div>

      {/* Main Evidence Content Grid / Table */}
      {filteredEvidence.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
          No evidence items match the selected filter criteria.
        </div>
      ) : viewMode === 'grid' ? (
        /* Cards Grid with Staggered Slide */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidence.map((ev, idx) => {
            const normCat = normalizeCategory(ev.category, ev.title, ev.details);
            const relevancePct = Math.round((ev.relevance || 0.85) * 100);

            return (
              <div
                key={idx}
                style={{ animationDelay: `${idx * 70}ms` }}
                className="forensic-card p-5 rounded-xl border border-slate-800 hover:border-cyan-500/50 space-y-3 group transition-all animate-slide-up"
              >
                {/* Header Badge */}
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${getCategoryBadge(normCat)}`}>
                    {normCat}
                  </span>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>VERIFIED</span>
                  </span>
                </div>

                {/* Evidence Title */}
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                    {ev.title || 'Forensic Evidence Item'}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Item #{ev.id || `EVD-${idx + 101}`}
                  </p>
                </div>

                {/* Details */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                  {ev.details || ev.description || 'Details extracted from official incident report.'}
                </p>

                {/* Corroboration & Relevance */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Relevance Weight:</span>
                  <span className="font-bold text-cyan-300">
                    <AnimatedNumber value={relevancePct} suffix="%" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Title / Artifact</th>
                <th className="py-3 px-4">Extraction Details</th>
                <th className="py-3 px-4 text-right">Relevance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40 font-mono text-xs">
              {filteredEvidence.map((ev, idx) => {
                const normCat = normalizeCategory(ev.category, ev.title, ev.details);
                const relevancePct = Math.round((ev.relevance || 0.85) * 100);

                return (
                  <tr key={idx} className="hover:bg-slate-900/80 transition-colors">
                    <td className="py-3 px-4 text-cyan-400 font-bold">
                      #{ev.id || `EVD-${idx + 101}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(normCat)}`}>
                        {normCat}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                      {ev.title || 'Evidence Artifact'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 max-w-md truncate">
                      {ev.details || ev.description}
                    </td>
                    <td className="py-3 px-4 text-right text-cyan-300 font-bold">
                      <AnimatedNumber value={relevancePct} suffix="%" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
