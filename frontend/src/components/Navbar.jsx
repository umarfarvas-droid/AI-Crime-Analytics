import React, { useState, useEffect } from 'react';
import { 
  Shield, FileText, BarChart3, Video, MessageSquare, 
  Search, Activity, Lock, User, LogOut, Cpu, CheckCircle2, 
  Server, HardDrive, Film 
} from 'lucide-react';

export default function Navbar({
  activePage,
  setActivePage,
  activeCase,
  onOpenLogin,
  user,
  onSwitchRole,
  onLogout,
  onOpenSearch,
  onOpenStatus,
  onToggleChat,
  isChatOpen,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#060910]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name with initial load slide and sweep */}
          <div 
            className={`flex items-center space-x-3 cursor-pointer shrink-0 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`} 
            onClick={() => setActivePage('entry')}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-600 flex items-center justify-center shadow-cyan-glow ring-1 ring-white/20 overflow-hidden group">
              <Shield className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-base sm:text-lg tracking-wider text-white">
                  AI CRIME ANALYTICS
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  FORENSIC FED-SUITE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
                Intelligent Crime Investigation & RAG Analytics System
              </p>
            </div>
          </div>

          {/* Center Navigation Links with staged entrance */}
          <nav className={`hidden md:flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
            {/* 1. Case Intake */}
            <button
              onClick={() => setActivePage('entry')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                activePage === 'entry'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Case Intake</span>
            </button>

            {/* 2. Investigation */}
            <button
              onClick={() => setActivePage('report')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                activePage === 'report'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>2. Investigation</span>
              {activeCase && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded bg-cyan-400/20 text-cyan-300 font-mono">
                  #{activeCase.caseNumber || activeCase.id}
                </span>
              )}
            </button>

            {/* 3. Reconstruction Tab */}
            <button
              onClick={() => setActivePage('reconstruction')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                activePage === 'reconstruction'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>3. Reconstruction</span>
            </button>

            {/* 4. RAG Assistant Copilot */}
            <button
              onClick={onToggleChat}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                isChatOpen
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-cyan-glow'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>4. RAG Assistant</span>
            </button>
          </nav>

          {/* Right Controls: Status, Search, Role, Profile with staged entrance */}
          <div className={`flex items-center space-x-2.5 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
            
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all flex items-center space-x-1 text-xs hover:border-cyan-500/40"
              title="Global Forensic Search (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline text-[11px] font-mono text-slate-400">Ctrl+K</span>
            </button>

            {/* Pulsating System Status Telemetry Indicator */}
            <button
              onClick={onOpenStatus}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono transition-all shadow-sm group"
              title="View Subsystems Telemetry"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden sm:inline font-bold tracking-wider">SYSTEM OPERATIONAL</span>
            </button>

            {/* Role Switcher */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => onSwitchRole?.('admin@crimeanalytics.gov', 'Admin@123')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  user?.role === 'ADMIN' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Administrator"
              >
                Admin
              </button>
              <button
                onClick={() => onSwitchRole?.('investigator@crimeanalytics.gov', 'Invest@123')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  user?.role === 'INVESTIGATOR' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Lead Investigator"
              >
                Investigator
              </button>
              <button
                onClick={() => onSwitchRole?.('supervisor@crimeanalytics.gov', 'Super@123')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  user?.role === 'ANALYST' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Forensic Supervisor"
              >
                Supervisor
              </button>
            </div>

            {/* User Profile / Login */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-semibold text-white truncate max-w-[90px]">{user.firstName || 'Investigator'}</p>
                  <p className="text-[9px] text-cyan-400 font-mono uppercase">{user.role || 'INVESTIGATOR'}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
