"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { AI_DISCLAIMER, SIMULATOR_SAMPLE_CASE } from "@/lib/utils";
import { DisclaimerBanner, LoadingSpinner, StatCard } from "@/components/ui/stat-card";
import { AlertTriangle, Bolt, CircleDot, Eye, Sparkles, Trash2, Zap } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const analysisStages = [
  "🔍 Reading case...",
  "🧠 Understanding events...",
  "🕵 Identifying people...",
  "🔬 Finding clues...",
  "🕐 Reconstructing timeline...",
  "⚠ Detecting contradictions...",
  "🔗 Connecting evidence...",
  "🎯 Generating possible scenarios...",
  "📊 Calculating confidence...",
];

export default function Home() {
  const [description, setDescription] = useState("");
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: (value: string) => api.analyzeSimulation(value),
    onError: () => setError("Unable to analyze the case. Please try again."),
    onSuccess: () => setError(null),
  });

  const isAnalyzing = analyzeMutation.status === "pending";

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setActiveStage((index) => (index + 1) % analysisStages.length);
      }, 600);
    } else {
      setActiveStage(0);
    }
    return () => interval && clearInterval(interval);
  }, [isAnalyzing]);

  const result = analyzeMutation.data?.simulation;
  const peopleCount = useMemo(
    () => (result?.victims?.length ?? 0) + (result?.persons_of_interest?.length ?? 0) + (result?.witnesses?.length ?? 0),
    [result]
  );
  const clueCount = useMemo(
    () =>
      (result?.clues?.strong?.length ?? 0) +
      (result?.clues?.weak?.length ?? 0) +
      (result?.clues?.contradictions?.length ?? 0),
    [result]
  );
  const eventCount = result?.timeline?.events?.length ?? 0;

  const sceneObjects = useMemo(() => {
    const weapons = Array.isArray(result?.objects?.weapons) ? result.objects.weapons : [];
    const phones = Array.isArray(result?.objects?.phones) ? result.objects.phones : [];
    const vehicles = Array.isArray(result?.objects?.vehicles) ? result.objects.vehicles : [];
    return [...weapons, ...phones, ...vehicles].slice(0, 3).join(", ") || "No explicit objects identified.";
  }, [result?.objects]);

  const handleAnalyze = () => {
    if (!description.trim() || description.trim().length < 20) {
      setError("Please enter a detailed case paragraph before analyzing.");
      return;
    }
    analyzeMutation.mutate(description.trim());
  };

  const handleClear = () => {
    setDescription("");
    setError(null);
    analyzeMutation.reset();
  };

  const handleExample = () => {
    setDescription(SIMULATOR_SAMPLE_CASE);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%),_linear-gradient(180deg,#020617_0%,#0b101f_40%,#0b101f_100%)] px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">AI Crime Investigation Simulator</p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">ChatGPT meets a digital detective simulator.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Enter a full crime case paragraph. The AI will extract people, clues, timelines, contradictions, and generate the most consistent scenario with a premium investigation dashboard.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-800/60 p-5">
                  <p className="text-sm text-slate-400">🧠 Case Understanding</p>
                  <p className="mt-2 text-white">AI extracts people, locations, objects, and events.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-800/60 p-5">
                  <p className="text-sm text-slate-400">🎯 Scenario Prediction</p>
                  <p className="mt-2 text-white">Multiple possible outcomes with confidence and reasoning.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-800/60 p-5">
                  <p className="text-sm text-slate-400">🔗 Evidence Graph</p>
                  <p className="mt-2 text-white">Visualize connections between people, evidence, and events.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-800/60 p-5">
                  <p className="text-sm text-slate-400">📄 Investigation Report</p>
                  <p className="mt-2 text-white">Generate a professional summary and recommended next steps.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-card border-cyan-500/30 p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Describe the Case</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Enter the complete crime scenario.</h2>
              </div>
              <div className="rounded-2xl bg-slate-950/80 px-4 py-2 text-sm text-cyan-300">One action. Full AI analysis.</div>
            </div>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enter the complete crime case here. Describe what happened, people involved, location, timeline, evidence, witness statements, and any other available information."
              className="glass-input min-h-[260px] mt-6 resize-none"
            />

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-primary">
                {isAnalyzing ? <LoadingSpinner size="sm" /> : <Bolt className="h-4 w-4" />}
                Analyze Case
              </button>
              <button onClick={handleClear} className="btn-secondary">
                <Trash2 className="h-4 w-4" /> Clear
              </button>
              <button onClick={handleExample} className="btn-secondary">
                <Eye className="h-4 w-4" /> Example Case
              </button>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">Analysis pipeline</p>
              <p className="mt-3">{analysisStages[activeStage]}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                  style={{ width: `${((activeStage + 1) / analysisStages.length) * 100}%` }}
                />
              </div>
            </div>

            <DisclaimerBanner text={AI_DISCLAIMER} />
          </motion.div>
        </section>

        {result ? (
          <section className="space-y-8">
            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="glass-card p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">AI Case Prediction</p>
                    <h3 className="mt-3 text-3xl font-semibold text-white">{result.prediction?.scenario ?? "Pending prediction"}</h3>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 px-5 py-3 text-sm text-white">
                    Confidence {result.prediction?.confidence ?? 0}%
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-800/50 p-5">
                    <p className="text-sm text-slate-400">Detected Crime Type</p>
                    <p className="mt-2 text-white">{result.crime_type}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-800/50 p-5">
                    <p className="text-sm text-slate-400">Suggested motive</p>
                    <p className="mt-2 text-white">{result.possible_motives?.[0] ?? "Not identified"}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-slate-800/40 p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Why?</p>
                  <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-200">
                    {(result.prediction?.reasoning ?? []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ol>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">What would change this prediction?</p>
                  <ul className="mt-4 space-y-2 text-slate-200">
                    {(result.prediction?.what_would_change ?? []).map((item, index) => (
                      <li key={index} className="rounded-2xl border border-white/5 bg-slate-800/50 px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-6">
                <StatCard title="People" value={peopleCount} icon={CircleDot} color="cyan" />
                <StatCard title="Clues" value={clueCount} icon={AlertTriangle} color="amber" />
                <StatCard title="Events" value={eventCount} icon={Zap} color="blue" />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold text-white">Timeline Reconstruction</h3>
                <div className="mt-6 space-y-4">
                  {(result.timeline?.events ?? []).slice(0, 6).map((event, index) => (
                    <div key={`${event.id ?? index}-${index}`} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{event.type.replace(/_/g, " ")}</p>
                        <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.14em] text-slate-300">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-3 text-white">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold text-white">Person of Interest Analysis</h3>
                <div className="mt-6 space-y-4">
                  {(result.persons_of_interest ?? []).map((person, index) => (
                    <div key={index} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                      <p className="font-semibold text-white">{person.name ?? person.description ?? `Person ${index + 1}`}</p>
                      <p className="mt-2 text-sm text-slate-400">{person.relationship ?? "Relationship unknown"}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                          style={{ width: `${Math.min(100, ((person.probability || 0) * 100) / 1) ?? 0}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-slate-300">Simulation score {(person.probability ? Math.round(person.probability * 100) : 0)}%</p>
                    </div>
                  ))}
                  {!(result.persons_of_interest?.length) && (
                    <p className="text-sm text-slate-400">No specific persons of interest identified from the paragraph.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-white">Key Clues</h4>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  {result.clues?.strong?.map((clue: string, idx: number) => (
                    <div key={`strong-${idx}`} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="font-medium text-emerald-200">Strong</p>
                      <p className="mt-1 text-slate-200">{clue}</p>
                    </div>
                  ))}
                  {result.clues?.weak?.map((clue: string, idx: number) => (
                    <div key={`weak-${idx}`} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="font-medium text-amber-200">Weak</p>
                      <p className="mt-1 text-slate-200">{clue}</p>
                    </div>
                  ))}
                  {result.clues?.contradictions?.map((clue: string, idx: number) => (
                    <div key={`contradiction-${idx}`} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                      <p className="font-medium text-red-200">Contradiction</p>
                      <p className="mt-1 text-slate-200">{clue}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-white">Evidence Relationship Graph</h4>
                <div className="mt-4 h-[320px] rounded-3xl border border-white/10 bg-slate-950/80 p-3">
                  {result.relationship_graph?.nodes?.length ? (
                    <ForceGraph2D
                      key={result.relationship_graph?.nodes?.length}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      graphData={result.relationship_graph as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      nodeLabel={(node: any) => `${node.label} (${node.type})`}
                      nodeAutoColorBy="type"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const label = node.label;
                        const fontSize = 10 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth + 8, fontSize + 6];
                        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
                        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#E2E8F0";
                        ctx.fillText(label, node.x, node.y);
                      }}
                      linkDirectionalArrowLength={3.5}
                      linkDirectionalArrowRelPos={1}
                      width={600}
                      height={320}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Graph will appear after analysis.</div>
                  )}
                </div>
              </div>

              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-white">AI Crime Scene Reconstruction</h4>
                <div className="mt-6 space-y-4 text-sm text-slate-200">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="font-medium text-white">Environment</p>
                    <p className="mt-2">{result.locations?.[0] ?? "Unknown crime scene"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="font-medium text-white">Objects in scene</p>
                    <p className="mt-2">{sceneObjects}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="font-medium text-white">Visual note</p>
                    <p className="mt-2 text-slate-400">AI-generated simulation — NOT actual evidence.</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button className="btn-secondary w-full">Generate Image</button>
                  <button className="btn-secondary w-full">Regenerate</button>
                  <button className="btn-secondary w-full">Fullscreen View</button>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crime Scenario Reconstruction</p>
                  <h4 className="mt-3 text-2xl font-semibold text-white">Fictional AI reconstruction</h4>
                </div>
                <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300">Scene flow based on predicted scenario</div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-5">
                {[
                  "Person enters building",
                  "Interaction occurs",
                  "Possible crime event",
                  "Evidence staged",
                  "Discovery by police",
                ].map((label, idx) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center text-sm text-slate-200">
                    <span className="block text-2xl font-semibold text-cyan-300">{idx + 1}</span>
                    <p className="mt-3">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold text-white">Investigation Report</h3>
                <div className="mt-6 space-y-5 text-sm text-slate-200">
                  <div>
                    <p className="text-slate-400">Case Summary</p>
                    <p className="mt-2 text-white">{result.case_summary}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Detected Crime Type</p>
                    <p className="mt-2 text-white">{result.crime_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">People Identified</p>
                    <p className="mt-2 text-white">Victim: {result.victims?.length ?? 0}, POI: {result.persons_of_interest?.length ?? 0}, Witnesses: {result.witnesses?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Key Clues</p>
                    <ul className="mt-2 space-y-2 text-slate-300">
                      {[...result.clues?.strong ?? [], ...result.clues?.weak ?? [], ...result.clues?.contradictions ?? []].slice(0, 5).map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-slate-400">Motive Analysis</p>
                    <p className="mt-2 text-white">{result.possible_motives?.join(", ") || "No reliable motive identified from the available information."}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Scenario Comparison</p>
                    <div className="mt-3 space-y-3">
                      {(result.scenarios ?? []).map((scenario, idx) => (
                        <div key={idx} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                          <p className="font-semibold text-white">{scenario.title}</p>
                          <p className="mt-1 text-slate-400">Confidence {scenario.confidence}%</p>
                          <p className="mt-2 text-slate-200">{scenario.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400">Missing Information</p>
                    <ul className="mt-2 space-y-2 text-slate-300">
                      {(result.missing_information ?? []).slice(0, 4).map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-slate-400">Recommended Investigation Leads</p>
                    <ul className="mt-2 space-y-2 text-slate-300">
                      {(result.investigation_leads ?? []).slice(0, 5).map((item: string, idx: number) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-blue-500/10 p-3 text-blue-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Ethical Reminder</p>
                    <p className="mt-2 text-white">This is an AI-generated educational simulation. Predictions are hypothetical and should not be treated as factual evidence.</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  {result.investigation_leads?.slice(0, 4).map((lead: string, idx: number) => (
                    <div key={idx} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                      <p className="text-sm text-slate-300">{lead}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
