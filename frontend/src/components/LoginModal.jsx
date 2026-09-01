import React, { useState } from 'react';
import { Lock, Mail, Key, X, ShieldCheck, AlertCircle, Shield } from 'lucide-react';
import { authApi } from '../services/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('admin@crimeanalytics.gov');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(email, password);
      setLoading(false);
      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Verify credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0b101e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#10172b] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Authentication Portal</h3>
              <p className="text-xs text-slate-400">Issue Federal JWT Token for AI Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Investigator Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@crimeanalytics.gov"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Account Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-colors"
              />
            </div>
          </div>

          {/* Preset Buttons for Quick Login */}
          <div className="pt-1">
            <span className="text-[11px] font-mono text-slate-400 font-medium">Quick Credentials:</span>
            <div className="grid grid-cols-3 gap-2 mt-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => { setEmail('admin@crimeanalytics.gov'); setPassword('Admin@123'); }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-cyan-300 border border-slate-800 text-center truncate transition-colors font-semibold"
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => { setEmail('investigator@crimeanalytics.gov'); setPassword('Invest@123'); }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 text-center truncate transition-colors"
              >
                🕵️ Investigator
              </button>
              <button
                type="button"
                onClick={() => { setEmail('supervisor@crimeanalytics.gov'); setPassword('Super@123'); }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 text-center truncate transition-colors"
              >
                📋 Supervisor
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate & Issue Token</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
