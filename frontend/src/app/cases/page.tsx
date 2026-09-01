"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PlusCircle, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  open: "bg-blue-500/20 text-blue-300",
  under_investigation: "bg-amber-500/20 text-amber-300",
  pending_review: "bg-purple-500/20 text-purple-300",
  closed: "bg-green-500/20 text-green-300",
};

const priorityColors: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

export default function CasesPage() {
  const { data: cases, isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => api.getCases() });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Cases</h1>
            <p className="text-sm text-slate-400">All investigation cases</p>
          </div>
          <Link href="/cases/new" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> New Case
          </Link>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-400">
                <th className="p-4">Case ID</th>
                <th className="p-4">FIR</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Solvability</th>
                <th className="p-4">Updated</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Loading...</td></tr>
              )}
              {(cases ?? []).map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{c.case_id}</td>
                  <td className="p-4 text-slate-300">{c.fir_number}</td>
                  <td className="p-4 text-slate-300">{c.crime_category || "—"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${statusColors[c.status] || ""}`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className={`p-4 text-sm capitalize ${priorityColors[c.priority]}`}>{c.priority}</td>
                  <td className="p-4 text-slate-300">{c.solvability_score ? `${c.solvability_score}%` : "—"}</td>
                  <td className="p-4 text-sm text-slate-400">{formatDate(c.updated_at)}</td>
                  <td className="p-4">
                    <Link href={`/cases/${c.id}`} className="text-blue-400 hover:text-blue-300">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && (!cases || cases.length === 0) && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No cases yet. Create your first investigation.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
