"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: api.getAnalytics });

  const categoryData = analytics?.crime_categories
    ? Object.entries(analytics.crime_categories).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400">Operational intelligence and investigation performance</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Monthly Crime Trends</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics?.monthly_trends ?? []}>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="cases" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Crime Categories</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            ["Case Resolution Rate", `${analytics?.resolution_rate ?? 0}%`],
            ["Avg Investigation Days", `${analytics?.avg_investigation_days ?? 0}`],
            ["Evidence Collection Rate", `${analytics?.evidence_collection_rate ?? 0}%`],
          ].map(([label, value]) => (
            <div key={label} className="glass-card p-6">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
