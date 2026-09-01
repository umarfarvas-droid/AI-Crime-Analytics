"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { DisclaimerBanner, LoadingSpinner } from "@/components/ui/stat-card";
import { api } from "@/lib/api";
import { CRIME_CATEGORIES, AI_DISCLAIMER } from "@/lib/utils";
import { Brain, Save, FileText, Upload } from "lucide-react";

const SAMPLE_FIR = `A 42-year-old businessman was found dead inside his office at approximately 10 PM. CCTV footage shows one unidentified person entering the building. The victim had financial disputes with his business partner. Fingerprints were recovered from the weapon. A nearby witness heard an argument.`;

export default function NewInvestigationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    case_id: `CA-${Date.now().toString(36).toUpperCase()}`,
    fir_number: "",
    police_station: "",
    crime_category: "",
    incident_date: "",
    incident_time: "",
    location: "",
    crime_description: "",
    victim_details: "",
    suspect_details: "",
    witness_details: "",
    evidence_list: "",
    additional_notes: "",
    priority: "medium",
  });
  const [analyzing, setAnalyzing] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createCase(data as never),
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const buildPayload = () => ({
    ...form,
    incident_date: form.incident_date ? new Date(form.incident_date).toISOString() : undefined,
    victim_details: form.victim_details ? { description: form.victim_details } : undefined,
    suspect_details: form.suspect_details ? { description: form.suspect_details } : undefined,
    witness_details: form.witness_details ? { description: form.witness_details } : undefined,
    evidence_list: form.evidence_list ? { items: form.evidence_list.split(",").map((s) => s.trim()) } : undefined,
  });

  const handleSave = async (analyze = false) => {
    try {
      const payload = buildPayload();
      const created = await createMutation.mutateAsync(payload);
      if (analyze) {
        setAnalyzing(true);
        await api.analyzeCase(created.id);
        setAnalyzing(false);
      }
      router.push(`/cases/${created.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save case");
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For new cases, we'll just show the filename - upload happens after case creation
    update("additional_notes", `${form.additional_notes}\n[File to upload: ${file.name}]`.trim());
  };

  const fields = [
    { key: "case_id", label: "Case ID", required: true },
    { key: "fir_number", label: "FIR Number", required: true },
    { key: "police_station", label: "Police Station", required: true },
    { key: "location", label: "Location" },
    { key: "incident_date", label: "Date", type: "date" },
    { key: "incident_time", label: "Time", type: "time" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">New Investigation</h1>
          <p className="text-sm text-slate-400">Create and analyze a new case</p>
        </div>

        <DisclaimerBanner text={AI_DISCLAIMER} />

        <div className="glass-card p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-sm text-slate-400">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="glass-input"
                  required={f.required}
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Crime Category</label>
              <select value={form.crime_category} onChange={(e) => update("crime_category", e.target.value)} className="glass-input">
                <option value="">Auto-detect</option>
                {CRIME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Priority</label>
              <select value={form.priority} onChange={(e) => update("priority", e.target.value)} className="glass-input">
                {["low", "medium", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm text-slate-400">Crime Description / FIR Text</label>
              <button type="button" onClick={() => update("crime_description", SAMPLE_FIR)} className="text-xs text-blue-400 hover:underline">
                Load sample FIR
              </button>
            </div>
            <textarea
              value={form.crime_description}
              onChange={(e) => update("crime_description", e.target.value)}
              className="glass-input min-h-[150px]"
              placeholder="Enter FIR details or paste natural language description..."
            />
          </div>

          {[
            { key: "victim_details", label: "Victim Details" },
            { key: "suspect_details", label: "Suspect Details (optional)" },
            { key: "witness_details", label: "Witness Details" },
            { key: "evidence_list", label: "Evidence List (comma-separated)" },
            { key: "additional_notes", label: "Additional Notes" },
          ].map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm text-slate-400">{f.label}</label>
              <textarea
                value={form[f.key as keyof typeof form]}
                onChange={(e) => update(f.key, e.target.value)}
                className="glass-input min-h-[80px]"
              />
            </div>
          ))}

          <div>
            <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 p-6 text-center hover:border-blue-500/50">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-400">Drag & drop FIR documents (PDF, DOCX, TXT, JPEG, PNG)</span>
              <input type="file" className="hidden" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <button onClick={() => handleSave(true)} disabled={createMutation.isPending || analyzing} className="btn-primary">
              {analyzing ? <LoadingSpinner size="sm" /> : <Brain className="h-4 w-4" />}
              Analyze Case
            </button>
            <button onClick={() => handleSave(false)} disabled={createMutation.isPending} className="btn-secondary">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={createMutation.isPending} className="btn-secondary">
              <FileText className="h-4 w-4" /> Generate Report
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
