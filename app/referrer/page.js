'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
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
      localStorage.setItem('SPARKLE_AMBASSADOR_CODE', usernameInput.trim().toUpperCase());
      router.push('/referrer/dashboard');
    } else {
      setFormError(result.error || "Authentication failed. Please verify credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans antialiased flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500 rounded-full blur-[100px] opacity-10 pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border-2 border-stone-100 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8 relative z-10">
        
        <div className="text-center space-y-4">
          <Link href="/">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={180} height={70} className="h-14 mx-auto object-contain transition-transform hover:scale-105" priority />
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-500" /> Ambassador Hub
          </div>
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tighter leading-tight">The Squad <br/>Portal.</h2>
          <p className="text-sm text-stone-500 font-bold max-w-xs mx-auto leading-relaxed">
            Enter your approved tracking credentials to audit your conversions and payouts.
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Tracking Code</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input type="text" required value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="e.g. SPK-6J5R6" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 text-stone-900 font-black uppercase tracking-widest outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300 placeholder:font-medium" />
            </div>
          </div>
          
          <div>
            <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 text-stone-900 font-bold outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300" />
            </div>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{formError}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-stone-950 hover:bg-stone-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40 transition-all shadow-xl hover:-translate-y-1 mt-2">
            <span>{loading ? 'Authenticating...' : 'Access Portal'}</span> <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center pt-6 border-t border-stone-100 text-xs text-stone-500 font-bold">
            New to the partner group?{' '}
            <Link href="/referrer/signup" className="text-emerald-600 hover:text-emerald-500 underline font-black uppercase tracking-wide ml-1">Apply Here</Link>
          </div>
        </form>

      </div>
    </div>
  );
}