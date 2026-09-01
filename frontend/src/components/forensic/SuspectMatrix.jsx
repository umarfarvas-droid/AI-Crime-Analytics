import React, { useState } from 'react';
import { 
  Users, Search, Filter, ShieldAlert, ArrowUpDown, 
  ExternalLink, Eye, ChevronRight, AlertTriangle, CheckCircle2, UserPlus, Table, LayoutGrid 
} from 'lucide-react';
import SuspectDrawer from './SuspectDrawer';
import AnimatedNumber from './AnimatedNumber';

export default function SuspectMatrix({
  suspects = [],
  allEvidence = [],
  allTimeline = [],
  onOpenAddSuspect,
}) {
  const [filterTier, setFilterTier] = useState('ALL'); // 'ALL', 'HIGH', 'MEDIUM', 'LOW'
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [selectedSuspect, setSelectedSuspect] = useState(null);

  // Filter suspects by tier and search query
  const filteredSuspects = suspects.filter((s) => {
    const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                          (s.motive && s.motive.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.role && s.role.toLowerCase().includes(searchTerm.toLowerCase()));

    const risk = s.risk_score !== undefined ? s.risk_score : (s.riskScore !== undefined ? s.riskScore * 100 : 50);
    let tier = 'LOW';
    if (risk >= 75) tier = 'HIGH';
    else if (risk >= 50) tier = 'MEDIUM';

    if (filterTier === 'ALL') return matchesSearch;
    return matchesSearch && tier === filterTier;
  });

  const getTierBadge = (risk) => {
    if (risk >= 75) {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-threat-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>PRIMARY (HIGH)</span>
        </span>
      );
    }
    if (risk >= 50) {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/40 animate-warning-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>SECONDARY (MEDIUM)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-cyan-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span>LOW RISK</span>
      </span>
    );
  };

  const renderRiskBar = (risk) => {
    const barsFilled = Math.min(10, Math.max(0, Math.round(risk / 10)));
    const filledStr = '█'.repeat(barsFilled);
    const emptyStr = '░'.repeat(10 - barsFilled);

    let color = 'text-cyan-400';
    if (risk >= 75) color = 'text-rose-400';
    else if (risk >= 50) color = 'text-amber-400';

    return (
      <div className="font-mono text-xs flex items-center space-x-2">
        <span className={`${color} tracking-widest text-[11px]`}>
          {filledStr}{emptyStr}
        </span>
        <span className={`font-bold ${color}`}>
          <AnimatedNumber value={Math.round(risk)} suffix="%" />
        </span>
      </div>
    );
  };

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl hud-corner">
      
      {/* Top Header & Workstation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                PERSONS OF INTEREST / SUSPECT INTELLIGENCE MATRIX
              </h2>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                5-FACTOR AI RANKED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Mathematical Multi-Factor Weighting (Motive 20%, Opportunity 25%, Evidence 30%, Contradiction 20%, Alibi 5%)
            </p>
          </div>
        </div>

        {/* View Switcher & Add Subject Button */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddSuspect}
            className="flex items-center space-x-1.5 text-xs font-mono bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Off-Record Subject</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        
        {/* Tier Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold mr-1">
            Filter Tier:
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                filterTier === tier
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-cyan-glow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tier} {tier === 'ALL' ? `(${suspects.length})` : ''}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suspect name, role, motive..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

      </div>

      {/* Main Suspects Content (Table or Grid) */}
      {filteredSuspects.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
          No persons of interest match the selected filter.
        </div>
      ) : viewMode === 'table' ? (
        /* Enterprise Tabular Matrix View */
        <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Person & Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 hidden md:table-cell">Motive Analysis</th>
                <th className="py-3 px-4 hidden lg:table-cell">Alibi Status</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {filteredSuspects.map((s, idx) => {
                const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Subject';
                const role = s.role || s.relationship || 'Associate';
                const risk = s.risk_score !== undefined ? s.risk_score : (s.riskScore !== undefined ? s.riskScore * 100 : 50);
                const isHighThreat = risk >= 75;

                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedSuspect(s)}
                    style={{ animationDelay: `${idx * 80}ms` }}
                    className={`hover:bg-slate-900/80 cursor-pointer transition-colors group animate-slide-up ${
                      isHighThreat ? 'border-l-2 border-l-rose-500' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      #{idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {role}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getTierBadge(risk)}
                    </td>

                    <td className="py-3.5 px-4">
                      {renderRiskBar(risk)}
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell max-w-xs truncate text-slate-300 text-xs font-mono">
                      {s.motive || 'Under Active Verification'}
                    </td>

                    <td className="py-3.5 px-4 hidden lg:table-cell text-xs font-mono">
                      {s.alibi_status === 'VERIFIED' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Corroborated
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Contradicted / Unverified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSuspect(s);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-600 text-slate-400 hover:text-white transition-colors"
                        title="View Full Profile Drawer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuspects.map((s, idx) => {
            const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Subject';
            const role = s.role || s.relationship || 'Associate';
            const risk = s.risk_score !== undefined ? s.risk_score : (s.riskScore !== undefined ? s.riskScore * 100 : 50);
            const isHigh = risk >= 75;

            return (
              <div
                key={idx}
                onClick={() => setSelectedSuspect(s)}
                style={{ animationDelay: `${idx * 80}ms` }}
                className={`forensic-card p-5 rounded-xl border cursor-pointer group transition-all animate-slide-up ${
                  isHigh ? 'border-rose-500/40 animate-threat-pulse' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      RANK #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                      {name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">{role}</p>
                  </div>
                  {getTierBadge(risk)}
                </div>

                <div className="my-3 py-2.5 border-y border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">5-FACTOR RISK:</span>
                    <span className="font-bold text-white"><AnimatedNumber value={Math.round(risk)} suffix="%" /></span>
                  </div>
                  {renderRiskBar(risk)}
                </div>

                <p className="text-xs text-slate-300 font-sans line-clamp-2 mb-3">
                  <strong className="font-mono text-slate-400 text-[11px]">MOTIVE: </strong>
                  {s.motive || 'Under Investigation'}
                </p>

                <div className="flex items-center justify-between pt-2 text-xs font-mono text-cyan-400">
                  <span>Click to view dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-Out Suspect Dossier Drawer */}
      <SuspectDrawer
        isOpen={!!selectedSuspect}
        onClose={() => setSelectedSuspect(null)}
        suspect={selectedSuspect}
        allEvidence={allEvidence}
        allTimeline={allTimeline}
      />

    </div>
  );
}
