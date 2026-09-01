"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { StatCard, DisclaimerBanner, SkeletonCard } from "@/components/ui/stat-card";
import { api } from "@/lib/api";
import { AI_DISCLAIMER } from "@/lib/utils";
import {
  FolderOpen, FolderCheck, AlertTriangle, Clock, FileSearch,
  Activity, Target, Brain,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#22c55e"];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: api.getDashboardStats });
  const { data: activities } = useQuery({ queryKey: ["activities"], queryFn: api.getActivities });

  const categoryData = stats?.crime_categories
    ? Object.entries(stats.crime_categories).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Investigation Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time crime analytics overview</p>
        </div>

        <DisclaimerBanner text={AI_DISCLAIMER} />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Cases" value={stats?.total_cases ?? 0} icon={FolderOpen} color="blue" />
            <StatCard title="Open Cases" value={stats?.open_cases ?? 0} icon={FolderCheck} color="cyan" />
            <StatCard title="Closed Cases" value={stats?.closed_cases ?? 0} icon={FolderCheck} color="green" />
            <StatCard title="High Priority" value={stats?.high_priority_cases ?? 0} icon={AlertTriangle} color="red" />
            <StatCard title="Pending Evidence" value={stats?.pending_evidence ?? 0} icon={FileSearch} color="amber" />
            <StatCard title="Today's Investigations" value={stats?.todays_investigations ?? 0} icon={Activity} color="blue" />
            <StatCard title="AI Accuracy" value={`${stats?.ai_prediction_accuracy ?? 0}%`} icon={Brain} color="cyan" />
            <StatCard title="Avg Solvability" value={`${stats?.avg_solvability_score ?? 0}%`} icon={Target} color="green" />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Crime Categories</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Recent Activities</h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {(activities ?? []).map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-800/30 p-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <div>
                    <p className="text-sm text-white">{a.action.replace(/_/g, " ")}</p>
                    {a.details && <p className="text-xs text-slate-400">{a.details}</p>}
                    <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!activities || activities.length === 0) && (
                <p className="text-sm text-slate-500">No recent activities</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
