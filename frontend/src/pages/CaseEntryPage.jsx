import React, { useState } from 'react';
import { 
  FilePlus, ShieldAlert, Sparkles, Send, MapPin, Calendar, 
  Layers, Cpu, CheckCircle2, FileText, Info, AlertCircle, ArrowRight 
} from 'lucide-react';
import { casesApi } from '../services/api';
import AnimatedNumber from '../components/forensic/AnimatedNumber';
import ForensicInitializationModal from '../components/forensic/ForensicInitializationModal';

const PRESET_TEMPLATES = [
  {
    name: '🔪 Metropolitan Heights Homicide (Benchmark)',
    data: {
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'Metropolitan Heights Executive Suite Homicide',
      type: 'HOMICIDE',
      priority: 'CRITICAL',
      incidentDate: '2026-08-19',
      locationName: 'Metropolitan Heights',
      description: 'Rohan Malhotra, a 32-year-old company executive, was found dead inside his apartment at Metropolitan Heights at approximately 10:15 PM on 19 August 2026. His business partner Vikram Rao had a financial dispute with him over a pending transaction and was reportedly seen arguing with the victim at 8:30 PM. The victim\'s wife Neha Malhotra claimed that she left the apartment at 8:45 PM to visit her sister and returned at approximately 10:20 PM. CCTV footage showed Arjun Das, a former employee who had recently been dismissed by the victim, entering the apartment building at 9:18 PM and leaving at 9:56 PM. Security contractor Sameer Khan stated that he remained inside the security room throughout the evening, but access-control records showed that his security card was used to enter the victim\'s floor at 9:42 PM. A neighbour reported hearing a loud argument from the apartment at approximately 9:35 PM followed by the sound of breaking glass. Investigators found a broken glass near the victim, blood stains on the living-room floor, partial fingerprints on the glass, and CCTV footage showing an unidentified person leaving the building shortly before 10:00 PM. The victim\'s mobile phone and a confidential business file were also missing from the apartment. Preliminary investigation suggests that the crime may have been motivated by financial conflict, revenge, or an attempt to obtain confidential information. The conflicting statements, CCTV footage, access-card records, and physical evidence require further investigation to identify the primary suspect and reconstruct the exact sequence of events.'
    }
  },
  {
    name: '💻 Bank Corporate Ransomware Intrusion',
    data: {
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'Metropolitan Bank Corporate Ransomware Attack',
      type: 'CYBER_CRIME',
      priority: 'CRITICAL',
      incidentDate: '2026-08-19',
      locationName: 'Metropolitan Business Park, Chennai, Tamil Nadu',
      description: 'On 19 August 2026 at approximately 9:20 AM, employees at Metropolitan Bank located at Metropolitan Business Park, Chennai, Tamil Nadu discovered that core financial database files had been encrypted with a ransom note demanding 75 Bitcoin sent to a cryptocurrency wallet address. Systems administrator Rahul Menon detected unusual external IP login activity at 8:45 AM from an unauthorized IP address attempting administrator-level access. Priya Nair, an IT operations specialist, claimed she was working in the server room from 8:30 AM to 10:00 AM, but electronic access-control records showed her employee card was used to enter the restricted backup server room at 9:05 AM where critical PowerShell commands were executed. CCTV footage recorded an unknown person entering the restricted server area at 9:02 AM. Furthermore, forensic logs revealed that a remote-access account belonging to former system administrator Arjun Kumar, who had recently resigned under contentious circumstances, remained active and was used to execute unauthorized network traffic commands during the intrusion window.'
    }
  },
  {
    name: '🏢 Phantom Ledger Multi-Layer Corporate Crime',
    data: {
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'Phantom Ledger – Multi-Layer Corporate Crime',
      type: 'HOMICIDE',
      priority: 'CRITICAL',
      incidentDate: '2026-08-19',
      locationName: 'Chennai Financial District, Chennai, Tamil Nadu',
      description: "On 19 August 2026, Meridian Capital Technologies reported a suspected coordinated criminal operation involving the death of its Chief Financial Officer, Daniel Mathews, unauthorized access to the company's financial servers, and the disappearance of approximately ₹18 crore in corporate funds. Daniel Mathews was found unconscious inside a restricted executive conference room at 11:40 PM and was later declared deceased by emergency medical personnel. CCTV records showed that Daniel entered the building at 8:15 PM, followed by his business partner Vikram Rao at 8:42 PM and cybersecurity administrator Aisha Rahman at 9:05 PM. Aisha stated that she remained inside the network operations centre throughout the night, but access-control records show her employee credentials were used to enter the executive floor at 9:37 PM. At 9:45 PM, the company's financial database recorded an administrator-level login from an external IP address, followed by the transfer of ₹18 crore through multiple accounts. Former systems engineer Arjun Kumar, who resigned six weeks earlier after a dispute with the company, still had an active remote-access credential that was used at 9:52 PM. Security officer Sameer Khan claimed that he left the building at 9:20 PM, but parking records show his vehicle remained inside the premises until 11:15 PM. At approximately 10:05 PM, a journalist named Meera Iyer received an anonymous encrypted email containing confidential company documents and a cryptocurrency wallet address. At 10:30 PM, a fire alarm was triggered on the basement floor, temporarily disabling one section of the building's CCTV system. Investigators later found a broken access card, traces of blood on a conference-room table, Daniel's damaged mobile phone, and a USB storage device hidden inside a maintenance cabinet. The USB contained encrypted financial records and a deleted video file that forensic investigators are attempting to recover. Daniel's business partner Vikram Rao reported that Daniel had threatened to expose financial irregularities within the company two days before his death. Meanwhile, Daniel's assistant Priya Nair stated that she left the building at 9:10 PM, but a ride-booking record places her near the building again at approximately 10:25 PM. Investigators also discovered that the cryptocurrency wallet mentioned in the anonymous email had received funds from an account previously associated with Arjun Kumar. A preliminary forensic examination indicates that some fingerprints found on the conference-room table may have been deliberately transferred from another object. Investigators suspect that the incident may involve an insider conspiracy, financial fraud, unauthorized cyber access, staged physical evidence, and an attempt to eliminate a person who possessed information about the company's financial activities. The investigation is continuing across digital forensics, financial records, CCTV footage, access-control systems, witness statements, mobile-device data, and recovered physical evidence."
    }
  },
  {
    name: '🏦 Armoured Bank Vault Precision Heist',
    data: {
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: 'Central Vault High-Precision Heist',
      type: 'ROBBERY',
      priority: 'HIGH',
      incidentDate: '2026-08-19',
      locationName: 'Central Plaza Financial District',
      description: 'Vault manager Robert Chen reported $3.5M cash missing. CCTV recorded suspect Marcus Vance entering secondary corridor at 09:15 AM wearing dark overalls. Security guard Leo Torres claimed he was patrolling floor 2, but corridor camera 4 was manually disabled at 09:22 AM. Access logs showed keycard 4092 assigned to technician Elena Rostova was used on vault door at 09:28 AM.'
    }
  }
];

export default function CaseEntryPage({ onCaseCreated, showToast }) {
  const [formData, setFormData] = useState(PRESET_TEMPLATES[0].data);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [analyzedCaseResult, setAnalyzedCaseResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyPreset = (presetData) => {
    setFormData({
      ...presetData,
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`
    });
    showToast?.({ type: 'info', message: 'Applied FIR Narrative template. Ready for AI Analysis.' });
  };

  // Calculate narrative quality & word/char metrics
  const text = formData.description || '';
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  
  // Heuristic completeness indicator
  const hasTimestamps = (text.match(/\d{1,2}:\d{2}\s*(?:AM|PM)?/gi) || []).length;
  const hasNames = (text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g) || []).length;
  const hasEvidence = /cctv|access|card|glass|blood|phone|file|usb|fingerprint|log|camera|ip/i.test(text);
  
  let qualityPct = Math.min(98, Math.round(
    (Math.min(wordCount, 150) / 150) * 45 + 
    (Math.min(hasTimestamps, 4) / 4) * 25 + 
    (Math.min(hasNames, 4) / 4) * 20 + 
    (hasEvidence ? 10 : 0)
  ));
  if (wordCount < 15) qualityPct = 15;

  const getQualityText = (score) => {
    if (score >= 80) return { label: 'Optimal Narrative Quality — Ready for Multi-Vector Entity Extraction', color: 'text-emerald-400', bar: 'bg-emerald-500' };
    if (score >= 50) return { label: 'Moderate Quality — Sufficient for Basic Suspect Matrix Ranking', color: 'text-cyan-400', bar: 'bg-cyan-500' };
    return { label: 'Low Narrative Density — Add timestamps, names, or physical clues', color: 'text-amber-400', bar: 'bg-amber-500' };
  };

  const qualityInfo = getQualityText(qualityPct);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast?.({ type: 'error', message: 'Please provide both an Incident Title and complete FIR Narrative.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Create Case in Backend
      const createdCase = await casesApi.createCase(formData);

      // 2. Trigger Spring Boot AI NLP Pipeline
      const analysisResult = await casesApi.analyzeCase(createdCase.id);

      const completeCase = {
        ...createdCase,
        analysis: analysisResult.analysis || analysisResult
      };

      setAnalyzedCaseResult(completeCase);
      setIsInitializing(true);
    } catch (err) {
      console.error('Case Submission Error:', err);
      showToast?.({ type: 'error', message: 'Failed to complete AI Case Analysis: ' + (err.response?.data?.message || err.message) });
      setLoading(false);
    }
  };

  const handleInitializationComplete = () => {
    setIsInitializing(false);
    setLoading(false);
    if (analyzedCaseResult) {
      onCaseCreated(analyzedCaseResult);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 page-enter-active">
      
      {/* Top Banner & Header */}
      <div className="forensic-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-xl hud-corner">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-cyan-glow">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-wide">
                DIGITAL CASE INTAKE WORKSTATION
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                FIR INGESTION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Narrative-First NLP Intelligence Pipeline • Automated Entity Extraction & Crime Prediction
            </p>
          </div>
        </div>

        {/* Preset Templates Quick Selector */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Presets & Test Benchmark Narratives:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(tmpl.data)}
                className="text-xs font-mono bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-all shadow-sm"
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Intake Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Pane (5 Cols): Case Identification & Metadata */}
        <div className="lg:col-span-5 forensic-panel p-6 rounded-2xl space-y-4 border border-slate-800 shadow-xl flex flex-col justify-between hud-corner">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <FilePlus className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                CASE IDENTIFICATION & RECORD
              </h3>
            </div>

            {/* Case Number */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                FIR Case Number <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* Incident Title */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                Incident Title / Case Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Metropolitan Heights Executive Homicide"
                required
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
              />
            </div>

            {/* Initial Category & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Initial Category
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="HOMICIDE">HOMICIDE / MURDER</option>
                  <option value="ROBBERY">ROBBERY / HEIST</option>
                  <option value="CYBER_CRIME">CYBER CRIME</option>
                  <option value="BURGLARY">BURGLARY</option>
                  <option value="THEFT">THEFT</option>
                  <option value="FRAUD">FINANCIAL FRAUD</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            {/* Incident Date & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Incident Date
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Jurisdiction / Location
                </label>
                <input
                  type="text"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleChange}
                  placeholder="e.g. Metropolitan Heights"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 space-y-1 mt-4">
            <div className="flex items-center space-x-1.5 font-bold text-cyan-300 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Automated Extraction Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Entities, suspect risk rankings, contradictory statements, and reconstructed scene plans are parsed automatically by the backend NLP model.
            </p>
          </div>
        </div>

        {/* Right Pane (7 Cols): Forensic FIR Narrative Workstation */}
        <div className="lg:col-span-7 forensic-panel p-6 rounded-2xl space-y-4 border border-slate-800 shadow-xl flex flex-col justify-between hud-corner">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  FIR NARRATIVE WORKSTATION (PRIMARY AI INPUT) <span className="text-red-400">*</span>
                </h3>
              </div>

              {/* Counters */}
              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                <span>Words: <strong className="text-cyan-300"><AnimatedNumber value={wordCount} /></strong></span>
                <span>•</span>
                <span>Chars: <strong className="text-cyan-300"><AnimatedNumber value={charCount} /></strong></span>
              </div>
            </div>

            {/* Narrative Quality Bar */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase font-semibold">NARRATIVE COMPLETENESS SCORE:</span>
                <span className={`font-bold ${qualityInfo.color}`}>
                  <AnimatedNumber value={qualityPct} suffix="% QUALITY" />
                </span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 progress-shimmer">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${qualityInfo.bar}`}
                  style={{ width: `${qualityPct}%` }}
                />
              </div>

              <p className={`text-[11px] font-mono ${qualityInfo.color}`}>
                {qualityInfo.label}
              </p>
            </div>

            {/* Large Textarea Editor */}
            <div>
              <textarea
                name="description"
                rows={12}
                value={formData.description}
                onChange={handleChange}
                placeholder="Paste full FIR incident narrative paragraph here with names, timestamps, alibis, and physical evidence..."
                required
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed shadow-inner custom-scrollbar"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 font-sans">
              Executing case ingestion will trigger Spring Boot NLP analysis & forensic scene synthesis.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-cyan-glow hover:shadow-cyan-glow-intense transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing AI Forensic Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Case & Generate Investigation Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </form>

      {/* Forensic Initialization Sequence Modal */}
      <ForensicInitializationModal
        isOpen={isInitializing}
        caseNumber={formData.caseNumber}
        onComplete={handleInitializationComplete}
      />

    </div>
  );
}
