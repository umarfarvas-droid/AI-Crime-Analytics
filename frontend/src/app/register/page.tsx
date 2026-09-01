"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", badge_number: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register(form);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-500" />
          <h1 className="mt-4 text-2xl font-bold text-white">Register</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {(["full_name", "email", "badge_number", "password"] as const).map((field) => (
            <div key={field}>
              <label className="mb-1.5 block text-sm capitalize text-slate-400">{field.replace("_", " ")}</label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="glass-input"
                required={field !== "badge_number"}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
