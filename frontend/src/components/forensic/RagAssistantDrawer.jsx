import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Send, Shield, User, FileText, 
  AlertTriangle, Clock, ChevronRight, CornerDownLeft, RefreshCw, 
  CheckCircle2, MoreVertical, Trash2, ArrowRight, Activity, MapPin, HardDrive, Film 
} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

export default function RagAssistantDrawer({
  isOpen,
  onClose,
  selectedCase,
  chatMessages = [],
  onSendMessage,
  onClearChat,
  onSelectCase,
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const messagesEndRef = useRef(null);

  const stages = [
    'ANALYZING CASE CONTEXT...',
    'RETRIEVING CASE-SCOPED EVIDENCE...',
    'VALIDATING CASE ISOLATION...',
    'GENERATING RESPONSE...'
  ];

  // Dynamic suggested queries based on active case
  const suggestedQueries = [
    'Who are the primary suspects?',
    'What evidence links Sameer Khan?',
    'Show critical contradictions',
    'What happened at 9:42 PM?',
    'Show reconstructed scenes',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen, loading]);

  useEffect(() => {
    let interval;
    if (loading) {
      setPipelineStage(0);
      interval = setInterval(() => {
        setPipelineStage((prev) => (prev + 1) % stages.length);
      }, 400);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Esc key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !selectedCase || loading) return;

    const query = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    try {
      await onSendMessage(query);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggested = async (query) => {
    if (loading || !selectedCase) return;
    setLoading(true);
    try {
      await onSendMessage(query);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render risk progress bar
  const renderRiskBar = (score) => {
    const num = typeof score === 'number' ? score : parseInt(score) || 50;
    const barsFilled = Math.min(10, Math.max(0, Math.round(num / 10)));
    const filledStr = '█'.repeat(barsFilled);
    const emptyStr = '░'.repeat(10 - barsFilled);

    let color = 'text-cyan-400';
    if (num >= 75) color = 'text-rose-400';
    else if (num >= 50) color = 'text-amber-400';

    return (
      <div className="font-mono text-xs flex items-center space-x-2">
        <span className={`${color} tracking-widest text-[11px]`}>
          {filledStr}{emptyStr}
        </span>
        <span className={`font-bold ${color}`}>
          <AnimatedNumber value={num} suffix="%" />
        </span>
      </div>
    );
  };

  // Structured response renderer based on answerType and DTO fields
  const renderStructuredResponse = (message) => {
    const data = message.data || {};
    const text = message.text || data.response || '';
    const answerType = data.answerType || '';
    const person = data.person;
    const riskScore = data.riskScore !== undefined ? data.riskScore : (person?.riskScore);

    // 1. PERSON PROFILE CARD
    if (answerType === 'PERSON_PROFILE' || (person && person.name)) {
      const pName = person?.name || data.entityName || 'Person of Interest';
      const pRole = person?.role || data.role || 'Subject';
      const pStatus = person?.investigationStatus || person?.status || 'Person of Interest';
      const pMotive = person?.motive || 'Under Verification';
      const pRisk = riskScore !== undefined ? riskScore : 81;
      const isHigh = pRisk >= 75;

      return (
        <div className="space-y-3 font-sans">
          {/* Structured Person Header */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                  PERSON PROFILE
                </span>
                <h4 className="text-sm font-bold font-display text-white">{pName}</h4>
                <p className="text-[11px] font-mono text-slate-400">{pRole}</p>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isHigh ? 'bg-rose-950 text-rose-300 border-rose-500/40 animate-threat-pulse' : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {pStatus}
              </span>
            </div>

            {/* Risk Gauge */}
            <div className="py-2 border-y border-slate-800/80 space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">RISK SCORE:</span>
                <span className="font-bold text-white"><AnimatedNumber value={pRisk} suffix="%" /></span>
              </div>
              {renderRiskBar(pRisk)}
            </div>

            {/* Motive & Alibi */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">MOTIVE:</span>
                <span className="text-slate-200 truncate block">{pMotive}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">ALIBI:</span>
                <span className="text-amber-300 truncate block">{person?.alibiStatus || 'CONTRADICTED BY LOGS'}</span>
              </div>
            </div>
          </div>

          {/* Narrative text below */}
          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );
    }

    // 2. RISK ASSESSMENT CARD
    if (answerType === 'RISK_ASSESSMENT' || (text.includes('Risk Score:') && riskScore !== undefined)) {
      const pName = data.entityName || person?.name || 'Subject';
      const pRisk = riskScore !== undefined ? riskScore : 78;

      return (
        <div className="space-y-3 font-sans">
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">RISK ASSESSMENT: {pName}</span>
              <span className="font-bold text-white"><AnimatedNumber value={pRisk} suffix="%" /></span>
            </div>
            {renderRiskBar(pRisk)}
            <div className="text-[11px] text-slate-300 font-mono mt-1">
              Status: <span className="text-amber-300">Person of Interest</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );
    }

    // 3. EVIDENCE PROFILE CARD
    if (answerType === 'EVIDENCE_PROFILE' || data.evidence?.length > 0) {
      return (
        <div className="space-y-3 font-sans">
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-cyan-400">
              <HardDrive className="w-3.5 h-3.5" />
              <span>FORENSIC EVIDENCE CORROBORATION</span>
            </div>
            <div className="text-xs font-bold text-white font-display">
              {data.evidence?.[0]?.title || 'Corroborating Evidence Record'}
            </div>
            {data.entityName && (
              <div className="text-[11px] font-mono text-slate-400">
                Linked Person: <span className="text-cyan-300">{data.entityName}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );
    }

    // 4. CONTRADICTION CARD
    if (answerType === 'CONTRADICTION' || (text.includes('Contradiction') && text.includes('Statement:'))) {
      return (
        <div className="space-y-3 font-sans">
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2 shadow-rose-glow">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                CONTRADICTION DETECTED
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-500/30">
                HIGH IMPACT
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );
    }

    // 5. SCENE RECONSTRUCTION CARD
    if (answerType === 'SCENE_RECONSTRUCTION' || answerType === 'SCENE_RECONSTRUCTION_LIST') {
      return (
        <div className="space-y-3 font-sans">
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center space-x-2 text-[10px] font-mono font-bold text-cyan-300">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI CRIME SCENE RECONSTRUCTION PLAN</span>
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      );
    }

    // Fallback: Clean structured formatting
    return (
      <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    );
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/25 backdrop-blur-[2px] animate-fade-in flex justify-end"
    >
      <div className="relative w-full sm:w-[460px] max-w-[480px] bg-[#070b14] border-l border-cyan-500/30 shadow-[-12px_0_40px_rgba(0,0,0,0.7)] h-full flex flex-col animate-slide-left z-50">
        
        {/* Compact Header */}
        <div className="p-3.5 bg-gradient-to-r from-slate-950 via-[#0c1426] to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold font-display text-white tracking-wide">
                  ✦ RAG FORENSIC AI
                </h3>
                <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>CASE CONNECTED</span>
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400">
                {selectedCase?.caseNumber || 'CASE-2026-ACTIVE'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Options Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#0b101e] border border-slate-800 rounded-xl shadow-2xl p-1 z-50 text-xs font-mono animate-slide-up">
                  <button
                    onClick={() => {
                      onClearChat?.();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-rose-950 hover:text-rose-300 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Conversation</span>
                  </button>
                </div>
              )}
            </div>

            {/* Close Drawer Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Panel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Case Context Bar */}
        <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-slate-500">CASE:</span>
            <span className="text-cyan-300 font-bold truncate">
              {selectedCase?.caseNumber || 'CASE-2026-ACTIVE'}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-300 truncate hidden sm:inline text-[10px] font-sans">
              {selectedCase?.title}
            </span>
          </div>

          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 uppercase font-bold shrink-0">
            ISOLATED
          </span>
        </div>

        {/* Chat Messages Stream (Largest Scrollable Area) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5">
          
          {/* Welcome Card if chat empty */}
          {chatMessages.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 text-xs animate-fade-in text-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 mx-auto border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white font-display">✦ FORENSIC COPILOT</h4>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                I can analyze this case's persons of interest, evidence links, statement contradictions, chronological timeline, and scene reconstruction plans.
              </p>
            </div>
          )}

          {/* Messages */}
          {chatMessages.map((m, idx) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[92%] space-y-2 border transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/40 rounded-tr-none shadow-cyan-glow'
                      : 'bg-[#0c1426]/90 text-slate-200 border-slate-800 rounded-tl-none shadow-md'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono opacity-80 border-b border-white/10 pb-1">
                    {isUser ? (
                      <>
                        <User className="w-3 h-3" />
                        <span>Lead Investigator</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>RAG Forensic Pipeline</span>
                      </>
                    )}
                  </div>

                  {/* Message Content / Structured Cards */}
                  {isUser ? (
                    <div className="text-xs font-sans whitespace-pre-wrap">{m.text}</div>
                  ) : (
                    renderStructuredResponse(m)
                  )}

                  {/* Sources Chips */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold block">
                        Corroborating Sources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {m.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[8.5px] font-mono bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Processing Telemetry Indicator */}
          {loading && (
            <div className="flex items-center space-x-2 p-3 bg-slate-950 rounded-xl border border-cyan-500/40 text-xs text-cyan-400 font-mono w-fit animate-pulse shadow-cyan-glow">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{stages[pipelineStage]}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Compact Suggested Questions Chips (Directly Above Input Bar) */}
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1">
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggested(q)}
                disabled={loading || !selectedCase}
                className="text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 px-2.5 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned Bottom Input Form */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading || !selectedCase}
            placeholder="Ask about suspects, evidence, timeline..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading || !selectedCase}
            className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-cyan-glow transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
