"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data: results, refetch, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: false,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Search</h1>
          <p className="text-sm text-slate-400">Search by case ID, FIR, location, suspect, or evidence</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cases, victims, suspects, evidence..."
                className="glass-input pl-10"
              />
            </div>
            <button onClick={() => refetch()} className="btn-primary" disabled={isFetching}>
              {isFetching ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {results?.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-slate-800/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{item.case_id}</p>
                    <p className="text-sm text-slate-400">{item.fir_number} • {item.location ?? "Unknown location"}</p>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">{item.status}</span>
                </div>
              </div>
            ))}
            {!results && <p className="text-sm text-slate-500">Enter a search query to locate relevant investigations.</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
