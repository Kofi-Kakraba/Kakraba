'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { loginReferrerPortal } from '../actions/referrer';

export default function ReferrerPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;
    setLoading(true);
    setFormError(null);

    const result = await loginReferrerPortal(usernameInput, passwordInput);
    
    if (result.success) {
      // FIXED ENGINES: Saves token to local memory sheets to allow the subfolder checkpoint loop to verify access
      localStorage.setItem('SPARKLE_AMBASSADOR_CODE', usernameInput.trim().toUpperCase());
      router.push('/referrer/dashboard');
    } else {
      setFormError(result.error || "Authentication failed. Please verify credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-955 text-stone-300 font-sans antialiased flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-600 selection:text-white">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-[36px] p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="text-center space-y-1.5">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" className="h-14 mx-auto object-contain" />
          <h2 className="text-lg font-mono font-black text-white uppercase tracking-tight pt-1">Ambassador Portal</h2>
          <p className="text-xs text-stone-500 font-light font-sans max-w-xs mx-auto leading-normal">
            Enter your approved tracking credentials code block to audit conversions metrics balances.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 font-mono text-xs text-left">
          <div>
            <label className="block text-stone-500 uppercase font-bold text-[8px] mb-1.5 tracking-wider">Tracking Code (Username)</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-600" />
              <input type="text" required value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="e.g. SPK-6J5R6" className="w-full bg-stone-950 border border-stone-850 rounded-xl pl-10 pr-4 py-2.5 text-white uppercase tracking-widest outline-none focus:border-emerald-600 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-stone-500 uppercase font-bold text-[8px] mb-1.5 tracking-wider">Account Access Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-600" />
              <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" className="w-full bg-stone-955 border border-stone-850 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-emerald-600 transition-colors" />
            </div>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-900/30 p-3 rounded-xl text-[11px] font-medium text-red-400 flex gap-2 font-sans leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{formError}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide disabled:opacity-40 transition-all shadow-md">
            <span>{loading ? 'Logging you in...' : 'Login'}</span> <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center pt-3 border-t border-stone-850/60 font-sans text-[11px] text-stone-500 font-light">
            New to the partner group?{' '}
            <Link href="/referrer/signup" className="text-emerald-400 hover:underline font-bold font-mono uppercase text-[10px]">Apply For Registry Here</Link>
          </div>
        </form>

      </div>
    </div>
  );
}