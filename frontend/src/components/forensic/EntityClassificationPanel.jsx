import React, { useState } from 'react';
import { 
  UserX, Users, Building, MapPin, ShieldAlert, 
  CheckCircle2, AlertOctagon, UserCheck, Shield 
} from 'lucide-react';

export default function EntityClassificationPanel({
  victim,
  victimsList = [],
  witnesses = [],
  organizations = [],
  locations = [],
  primaryLocation = '',
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, VICTIMS, WITNESSES, ORGS, LOCATIONS

  // Aggregate victims
  const allVictims = victim ? [victim] : victimsList;

  return (
    <div className="forensic-panel p-6 rounded-2xl space-y-6 border border-slate-800 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white tracking-wide">
              STRUCTURED ENTITY CLASSIFICATION & DIRECTORY
            </h3>
            <p className="text-xs text-slate-400">
              Strict categorical isolation of victims, witnesses, corporate organizations, and crime scene locations.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
          {[
            { id: 'ALL', label: 'ALL ENTITIES' },
            { id: 'VICTIMS', label: `VICTIMS (${allVictims.length})` },
            { id: 'WITNESSES', label: `WITNESSES (${witnesses.length})` },
            { id: 'ORGS', label: `ORGS (${organizations.length})` },
            { id: 'LOCATIONS', label: `LOCATIONS (${locations.length || (primaryLocation ? 1 : 0)})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Dedicated Victim Profile Section */}
      {(activeTab === 'ALL' || activeTab === 'VICTIMS') && allVictims.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
              Identified Victims (Exempt from Suspect Matrix)
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {allVictims.map((vic, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-rose-950/20 to-slate-950 border border-rose-500/40 space-y-3 shadow-lg relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded">
                          VICTIM ENTITY
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                          Status: {vic.status || 'DECEASED'}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold font-display text-white mt-0.5">
                        {vic.name}
                      </h4>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 sm:text-right space-y-0.5 font-mono">
                    <div><strong>Role / Occupation:</strong> <span className="text-slate-200">{vic.occupation || 'Executive / Victim'}</span></div>
                    <div><strong>Scene Location:</strong> <span className="text-cyan-400">{primaryLocation || (locations.length > 0 ? locations[0] : 'Crime Scene')}</span></div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {vic.details || `${vic.name}, principal victim identified in the initial FIR incident narrative.`}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-rose-400/90 italic font-mono flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Case isolation validated: Excluded from suspect risk calculation.</span>
                  </span>
                  <span className="font-mono text-rose-300 font-bold">Category: Victim</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Three Column Layout for Witnesses, Organizations & Locations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Witnesses Column */}
        {(activeTab === 'ALL' || activeTab === 'WITNESSES') && (
          <div className="forensic-card p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase">WITNESSES ({witnesses.length})</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                STATEMENTS
              </span>
            </div>

            {witnesses.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No separate witnesses extracted.</p>
            ) : (
              <div className="space-y-2">
                {witnesses.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="font-semibold text-slate-200">{w}</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400/90 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      Witness
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Organizations Column */}
        {(activeTab === 'ALL' || activeTab === 'ORGS') && (
          <div className="forensic-card p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase">ORGANIZATIONS ({organizations.length})</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                CORPORATE
              </span>
            </div>

            {organizations.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No corporate entities logged.</p>
            ) : (
              <div className="space-y-2">
                {organizations.map((org, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="font-semibold text-slate-200">{org}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      Entity
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Locations Column */}
        {(activeTab === 'ALL' || activeTab === 'LOCATIONS') && (
          <div className="forensic-card p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase">LOCATIONS ({locations.length || (primaryLocation ? 1 : 0)})</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                SCENES
              </span>
            </div>

            {locations.length === 0 && !primaryLocation ? (
              <p className="text-xs text-slate-500 italic py-4">No explicit locations logged.</p>
            ) : (
              <div className="space-y-2">
                {(locations.length > 0 ? locations : [primaryLocation]).map((loc, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-slate-200">{loc}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {idx === 0 ? 'Primary Scene' : 'Perimeter'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
