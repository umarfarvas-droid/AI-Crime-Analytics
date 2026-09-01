"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { DisclaimerBanner, LoadingSpinner } from "@/components/ui/stat-card";
import { api } from "@/lib/api";
import { AI_DISCLAIMER } from "@/lib/utils";
import { Brain, FileText, Upload } from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const caseId = Number(params.id);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => api.getCase(caseId),
    enabled: Number.isFinite(caseId),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeCase(caseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
  });

  const reportMutation = useMutation({
    mutationFn: () => api.generateReport(caseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadDocument(caseId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
  });

  const evidence = useMemo(
    () => (caseData?.ai_analysis?.evidence ?? {}) as { detected_evidence?: Array<{ type: string; strength: number; reliability: number }> },
    [caseData]
  );

  if (isLoading || !caseData) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{caseData.case_id}</h1>
            <p className="text-sm text-slate-400">{caseData.fir_number} • {caseData.location ?? "Unknown location"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => analyzeMutation.mutate()} className="btn-primary">
              {analyzeMutation.isPending ? <LoadingSpinner size="sm" /> : <Brain className="h-4 w-4" />} Analyze
            </button>
            <button onClick={() => reportMutation.mutate()} className="btn-secondary">
              <FileText className="h-4 w-4" /> Generate Report
            </button>
            <label className="btn-secondary cursor-pointer">
              <Upload className="h-4 w-4" /> Upload Evidence
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])} />
            </label>
          </div>
        </div>

        <DisclaimerBanner text={AI_DISCLAIMER} />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="glass-card p-6 xl:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">Case Overview</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-4">
                <p className="text-xs uppercase text-slate-500">Crime Category</p>
                <p className="mt-1 text-white">{caseData.crime_category ?? "Pending analysis"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-4">
                <p className="text-xs uppercase text-slate-500">Solvability</p>
                <p className="mt-1 text-white">{caseData.solvability_score ?? 0}%</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-4">
                <p className="text-xs uppercase text-slate-500">Priority</p>
                <p className="mt-1 capitalize text-white">{caseData.priority}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-4">
                <p className="text-xs uppercase text-slate-500">Status</p>
                <p className="mt-1 capitalize text-white">{caseData.status}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-slate-800/30 p-4">
              <p className="text-sm text-slate-400">Crime Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{caseData.crime_description ?? "No description provided yet."}</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">AI Insights</h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
                <p className="text-slate-500">Likely motive</p>
                <p className="mt-1 text-white">{caseData.predictions?.likely_motive ?? "Pending"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
                <p className="text-slate-500">Top suspect</p>
                <p className="mt-1 text-white">{caseData.predictions?.likely_suspect ?? "Pending"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
                <p className="text-slate-500">Recommended actions</p>
                <p className="mt-1 text-white">{caseData.recommendations?.recommendations?.[0]?.action ?? "Pending"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Evidence Summary</h2>
            <div className="space-y-3">
              {(evidence.detected_evidence ?? []).map((item: { type: string; strength: number; reliability: number }, idx: number) => (
                <div key={`${item.type}-${idx}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/30 p-3">
                  <span className="text-sm text-white">{item.type}</span>
                  <span className="text-sm text-slate-400">Strength {Math.round(item.strength * 100)}%</span>
                </div>
              ))}
              {(!evidence.detected_evidence || evidence.detected_evidence.length === 0) && <p className="text-sm text-slate-500">No evidence detected yet.</p>}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Timeline</h2>
            <div className="space-y-3">
              {(caseData.timeline?.events ?? []).slice(0, 5).map((event: { title: string; description: string }) => (
                <div key={event.title} className="rounded-lg border border-white/10 bg-slate-800/30 p-3">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
