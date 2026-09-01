"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "blue" | "green" | "amber" | "red" | "cyan";
}

const colorMap = {
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  green: "text-green-400 bg-green-500/10 border-green-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  red: "text-red-400 bg-red-500/10 border-red-500/20",
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

export function StatCard({ title, value, icon: Icon, trend, color = "blue" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
        </div>
        <div className={cn("rounded-lg border p-2.5", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <div className="disclaimer-banner">
      <strong>Important:</strong> {text}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse p-5">
      <div className="h-4 w-24 rounded bg-slate-700" />
      <div className="mt-3 h-8 w-16 rounded bg-slate-700" />
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={cn("animate-spin rounded-full border-2 border-blue-500 border-t-transparent", sizes[size])} />
  );
}
