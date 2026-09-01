import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Sparkles, FileText, Download, UserCheck, Search, Clock, 
  AlertTriangle, CheckCircle2, ChevronRight, MessageSquare, Plus, RefreshCw, 
  X, ShieldCheck, UserX, AlertCircle, Video, Film, Fingerprint, Share2, Activity 
} from 'lucide-react';
import { casesApi, evidenceApi, suspectsApi } from '../services/api';

import CaseControlBar from '../components/forensic/CaseControlBar';
import CaseHeader from '../components/forensic/CaseHeader';
import ExecutiveSummary from '../components/forensic/ExecutiveSummary';
import CrimeAssessmentPanel from '../components/forensic/CrimeAssessmentPanel';
import SolvabilityRadar from '../components/forensic/SolvabilityRadar';
import InvestigationGraph from '../components/forensic/InvestigationGraph';
import EvidenceConstellation from '../components/forensic/EvidenceConstellation';
import EvidenceDrawer from '../components/forensic/EvidenceDrawer';
import SuspectMatrix from '../components/forensic/SuspectMatrix';
import SuspectDrawer from '../components/forensic/SuspectDrawer';
import EntityClassificationPanel from '../components/forensic/EntityClassificationPanel';
import EvidenceVault from '../components/forensic/EvidenceVault';
import ForensicTimeline from '../components/forensic/ForensicTimeline';
import TimelineView from '../components/forensic/TimelineView';
import ContradictionsPanel from '../components/forensic/ContradictionsPanel';
import RecommendationsPanel from '../components/forensic/RecommendationsPanel';
import ReconstructionWorkstation from '../components/forensic/ReconstructionWorkstation';
import RagAssistantDrawer from '../components/forensic/RagAssistantDrawer';
import GlobalSearchModal from '../components/forensic/GlobalSearchModal';
import FullscreenCommandCenter from '../components/forensic/FullscreenCommandCenter';
import { InvestigationSkeleton, ErrorState } from '../components/forensic/LoadingSkeletons';

export default function ReportPage({ 
  caseData, 
  onSelectCase, 
  showToast, 
  initialTab = 'investigation',
  isSearchOpen,
  setIsSearchOpen,
  isChatOpen,
  setIsChatOpen
}) {
  const [casesList, setCasesList] = useState([]);
  const [selectedCase, setSelectedCase] = useState(caseData || null);
  const [analysis, setAnalysis] = useState(caseData?.analysis || null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Video Reconstruction state
  const [videoJob, setVideoJob] = useState(null);
  const [videoGenerating, setVideoGenerating] = useState(false);

  // Selected drawers state
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [temporalModeActive, setTemporalModeActive] = useState(false);

  // Chat message state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello Investigator. I am ready to answer queries regarding this FIR narrative, evidence links, suspect motives, and timeline events.' }
  ]);

  // Optional manual suspect registration modal
  const [isAddSuspectOpen, setIsAddSuspectOpen] = useState(false);
  const [newSuspect, setNewSuspect] = useState({ firstName: '', lastName: '', riskScore: 0.65, notes: '' });

  const navigateToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const validateCaseIsolation = (data, currentCaseId) => {
    if (!data) return null;
    if (data.caseId && currentCaseId && Number(data.caseId) !== Number(currentCaseId)) {
      console.warn(`[CASE ISOLATION AUDIT] Discarding mismatched analysis (case ${data.caseId} vs ${currentCaseId})`);
      return null;
    }
    return data;
  };

  useEffect(() => {
    if (caseData) {
      setAnalysis(null);
      setVideoJob(null);
      setSelectedCase(caseData);
      setChatMessages([
        { sender: 'ai', text: `AI Forensic Pipeline active for Case #${caseData.caseNumber || caseData.id} ('${caseData.title || 'Active Case'}'). Ready to answer queries regarding suspects, evidence links, and timeline.` }
      ]);
      if (caseData.analysis) {
        setAnalysis(validateCaseIsolation(caseData.analysis, caseData.id));
      } else {
        runAnalysis(caseData.id);
      }
      fetchVideoForCase(caseData.id);
    }
  }, [caseData]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await casesApi.getAllCases();
      const list = res.content || res || [];
      setCasesList(list);

      if (!selectedCase && list.length > 0) {
        handleSelectCase(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
      setError('Unable to retrieve cases from the Spring Boot backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (c) => {
    setAnalysis(null);
    setVideoJob(null);
    setSelectedCase(c);
    setChatMessages([
      { sender: 'ai', text: `AI Forensic Pipeline active for Case #${c.caseNumber || c.id} ('${c.title || 'Case'}'). Ready to answer queries regarding suspects, evidence links, and timeline.` }
    ]);
    if (onSelectCase) onSelectCase(c);
    runAnalysis(c.id);
    fetchVideoForCase(c.id);
  };

  const runAnalysis = async (caseId) => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await casesApi.analyzeCase(caseId);
      const rawAnalysis = res.analysis || res;
      const validated = validateCaseIsolation(rawAnalysis, caseId);
      setAnalysis(validated);
      if (res.videoJob) {
        setVideoJob(res.videoJob);
      }
      showToast?.({ type: 'success', message: 'AI Analysis & Forensic Extraction complete.' });
    } catch (err) {
      console.error('Analysis error:', err);
      showToast?.({ type: 'error', message: 'Analysis failed: ' + (err.response?.data?.message || err.message) });
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchVideoForCase = async (caseId) => {
    try {
      const res = await casesApi.getVideo(caseId);
      if (res && res.status !== 'NOT_STARTED') {
        setVideoJob(res);
      } else {
        setVideoJob(null);
      }
    } catch (err) {
      console.error('Fetch video error:', err);
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedCase) return;
    setVideoGenerating(true);
    try {
      showToast?.({ type: 'info', message: 'Launching AI Crime Scene Reconstruction...' });
      const job = await casesApi.generateVideo(selectedCase.id);
      setVideoJob(job);
      if (job.status === 'UNCONFIGURED') {
        showToast?.({ type: 'error', message: 'Video generation provider not configured. Running SVG simulation mode.' });
      } else {
        showToast?.({ type: 'info', message: 'Video generation job started.' });
      }
    } catch (err) {
      showToast?.({ type: 'error', message: 'Failed to start video reconstruction: ' + err.message });
    } finally {
      setVideoGenerating(false);
    }
  };

  useEffect(() => {
    let intervalId;
    if (selectedCase && videoJob && (
      videoJob.status === 'IN_PROGRESS' || 
      videoJob.status === 'PREPARING' || 
      videoJob.status === 'GENERATING_SCENE_PLAN' || 
      videoJob.status === 'GENERATING_VISUALS' || 
      videoJob.status === 'GENERATING_VIDEO'
    )) {
      intervalId = setInterval(async () => {
        try {
          const res = await casesApi.getVideoStatus(selectedCase.id, videoJob.jobId);
          setVideoJob(res);
          if (res.status === 'COMPLETED') {
            showToast?.({ type: 'success', message: 'AI Crime Scene Reconstruction completed!' });
          } else if (res.status === 'FAILED') {
            showToast?.({ type: 'error', message: 'Video reconstruction failed: ' + (res.errorMessage || 'Unknown error') });
          }
        } catch (err) {
          console.error('Polling video status error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [selectedCase, videoJob?.status, videoJob?.jobId]);

  const handleDownloadPdf = async () => {
    if (!selectedCase) return;
    try {
      showToast?.({ type: 'info', message: 'Generating official Investigation PDF Report...' });
      if (casesApi.downloadPdfReport) {
        await casesApi.downloadPdfReport(selectedCase.id);
      } else {
        await casesApi.generateReport(selectedCase.id);
      }
      showToast?.({ type: 'success', message: 'PDF Investigation Report generated & downloaded!' });
    } catch (err) {
      showToast?.({ type: 'error', message: 'Failed to generate PDF report: ' + err.message });
    }
  };

  const handleSendChat = async (userMsg) => {
    if (!selectedCase) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    try {
      const res = await casesApi.sendChatMessage(selectedCase.id, userMsg);
      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: res.response || 'No response returned.',
        sources: res.sources || [],
        data: res
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error querying AI assistant. Please try again.' }]);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    showToast?.({ type: 'info', message: 'Conversation cleared for current case.' });
  };

  const handleAddManualSuspect = async (e) => {
    e.preventDefault();
    if (!newSuspect.firstName || !selectedCase) return;
    try {
      await suspectsApi.createSuspect({
        caseId: selectedCase.id,
        firstName: newSuspect.firstName,
        lastName: newSuspect.lastName,
        riskScore: parseFloat(newSuspect.riskScore),
        notes: newSuspect.notes
      });
      showToast?.({ type: 'success', message: 'Optional manual suspect added.' });
      setIsAddSuspectOpen(false);
      setNewSuspect({ firstName: '', lastName: '', riskScore: 0.65, notes: '' });
      runAnalysis(selectedCase.id);
    } catch (err) {
      showToast?.({ type: 'error', message: 'Failed to add suspect: ' + err.message });
    }
  };

  if (loading && !selectedCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <InvestigationSkeleton />
      </div>
    );
  }

  if (error && !selectedCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorState message={error} onRetry={fetchCases} />
      </div>
    );
  }

  // Extract structured lists from analysis
  const victim = analysis?.victim;
  const victimsList = analysis?.victims || (victim ? [victim] : []);
  const witnesses = analysis?.witnesses || [];
  const locations = analysis?.locations || [];
  const organizations = analysis?.organizations || [];
  const suspectRankings = analysis?.suspect_rankings || analysis?.personsOfInterest || [];
  const evidenceVault = analysis?.evidence_vault || analysis?.evidence || [];
  const timelineEvents = analysis?.timeline || [];
  const contradictionsList = analysis?.contradictions || [];
  const reasoningFactors = analysis?.reasoning_factors || [];
  const recommendationsList = analysis?.recommendations || [];
  const missingInfoList = analysis?.missing_information || [];
  const primaryCrime = analysis?.primary_crime || analysis?.crime_category || selectedCase?.type || 'HOMICIDE';
  const associatedCrimes = analysis?.associated_crimes || [];
  const confidencePct = Math.round((analysis?.crime_category_confidence || 0.90) * 100);
  const solvabilityScore = analysis?.solvability_score || selectedCase?.confidenceScore || 95.0;
  const investigationComplexity = analysis?.investigation_complexity || (solvabilityScore > 75 ? 'LOW' : 'MEDIUM');

  return (
    <div className="space-y-6 page-enter-active pb-12">
      
      {/* Floating Case Control Strip */}
      <CaseControlBar
        selectedCase={selectedCase}
        casesList={casesList}
        onSelectCase={handleSelectCase}
        solvabilityScore={solvabilityScore}
        confidencePct={confidencePct}
        onOpenSearch={() => setIsSearchOpen(true)}
        onEnterFullscreen={() => setIsFullscreenOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 1. Case Header Banner */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''}>
          <CaseHeader
            selectedCase={selectedCase}
            casesList={casesList}
            onSelectCase={handleSelectCase}
            onRunAnalysis={runAnalysis}
            analyzing={analyzing}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            isChatOpen={isChatOpen}
            onDownloadPdf={handleDownloadPdf}
            onOpenSearch={() => setIsSearchOpen(true)}
            solvabilityScore={solvabilityScore}
            primaryCrime={primaryCrime}
          />
        </div>

        {/* 2. Executive Summary Metrics */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''}>
          <ExecutiveSummary
            confidencePct={confidencePct}
            solvabilityScore={solvabilityScore}
            suspectsCount={suspectRankings.length}
            evidenceCount={evidenceVault.length}
            contradictionsCount={contradictionsList.length}
          />
        </div>

        {/* 3. Hero Command Deck: Crime Assessment + 6-Axis Solvability Radar */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${temporalModeActive ? 'temporal-mode-dimmed' : ''}`} id="assessment">
          <div className="lg:col-span-7 flex">
            <CrimeAssessmentPanel
              primaryCrime={primaryCrime}
              associatedCrimes={associatedCrimes}
              confidencePct={confidencePct}
              reasoningFactors={reasoningFactors}
              solvabilityScore={solvabilityScore}
              investigationComplexity={investigationComplexity}
            />
          </div>

          <div className="lg:col-span-5 flex">
            <SolvabilityRadar
              analysis={analysis}
              solvabilityScore={solvabilityScore}
            />
          </div>
        </div>

        {/* 4. Interactive Investigation Relationship Graph */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="graph">
          <InvestigationGraph
            analysis={analysis}
            onSelectPerson={setSelectedSuspect}
            onSelectEvidence={setSelectedEvidence}
          />
        </div>

        {/* 5. Evidence Constellation Mapping */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="constellation">
          <EvidenceConstellation
            evidence={evidenceVault}
            onSelectEvidence={setSelectedEvidence}
          />
        </div>

        {/* 6. Suspects Intelligence Matrix */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="suspects">
          <SuspectMatrix
            suspects={suspectRankings}
            allEvidence={evidenceVault}
            allTimeline={timelineEvents}
            onOpenAddSuspect={() => setIsAddSuspectOpen(true)}
          />
        </div>

        {/* 7. Entity Classification (Victims, Witnesses, Organizations, Locations) */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="entities">
          <EntityClassificationPanel
            victim={victim}
            victimsList={victimsList}
            witnesses={witnesses}
            organizations={organizations}
            locations={locations}
            primaryLocation={selectedCase?.locationName || (locations.length > 0 ? locations[0] : '')}
          />
        </div>

        {/* 8. Forensic Horizontal Timeline (Supports Temporal Analysis Mode) */}
        <div id="timeline">
          <ForensicTimeline
            timeline={timelineEvents}
            primaryLocation={selectedCase?.locationName || (locations.length > 0 ? locations[0] : '')}
            temporalModeActive={temporalModeActive}
            onToggleTemporalMode={() => setTemporalModeActive(!temporalModeActive)}
          />
        </div>

        {/* 9. Statement Discrepancies & Contradictions Panel */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="contradictions">
          <ContradictionsPanel
            contradictions={contradictionsList}
          />
        </div>

        {/* 10. Prioritized Recommendations */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="recommendations">
          <RecommendationsPanel
            recommendations={recommendationsList}
            missingInformation={missingInfoList}
          />
        </div>

        {/* 11. AI Crime Scene Reconstruction Workstation */}
        <div className={temporalModeActive ? 'temporal-mode-dimmed' : ''} id="reconstruction">
          <ReconstructionWorkstation
            selectedCase={selectedCase}
            videoJob={videoJob}
            videoGenerating={videoGenerating}
            onGenerateVideo={handleGenerateVideo}
          />
        </div>

      </div>

      {/* RAG Forensic AI Assistant Slide-out Drawer */}
      <RagAssistantDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedCase={selectedCase}
        chatMessages={chatMessages}
        onSendMessage={handleSendChat}
        onClearChat={handleClearChat}
      />

      {/* Person Detail Drawer */}
      <SuspectDrawer
        isOpen={!!selectedSuspect}
        onClose={() => setSelectedSuspect(null)}
        suspect={selectedSuspect}
        allEvidence={evidenceVault}
        allTimeline={timelineEvents}
      />

      {/* Evidence Detail Drawer */}
      <EvidenceDrawer
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        evidenceItem={selectedEvidence}
      />

      {/* Fullscreen Command Center Modal */}
      <FullscreenCommandCenter
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        selectedCase={selectedCase}
        analysis={analysis}
        onSelectPerson={setSelectedSuspect}
        onSelectEvidence={setSelectedEvidence}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Global Search Command Palette (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        analysis={analysis}
        casesList={casesList}
        onSelectCase={handleSelectCase}
        onNavigateSection={navigateToSection}
      />

      {/* Manual Suspect Registration Modal */}
      {isAddSuspectOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b101e] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl hud-corner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-display text-white">Add Off-Record Suspect (Optional)</h3>
              </div>
              <button onClick={() => setIsAddSuspectOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualSuspect} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={newSuspect.firstName}
                  onChange={(e) => setNewSuspect({ ...newSuspect, firstName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={newSuspect.lastName}
                  onChange={(e) => setNewSuspect({ ...newSuspect, lastName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Risk Score (0.1 to 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={newSuspect.riskScore}
                  onChange={(e) => setNewSuspect({ ...newSuspect, riskScore: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Off-Record Notes / Context</label>
                <textarea
                  rows={3}
                  value={newSuspect.notes}
                  onChange={(e) => setNewSuspect({ ...newSuspect, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSuspectOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl font-sans shadow-cyan-glow"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
