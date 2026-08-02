'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import { resetPasswordWithTokenAction } from '../../actions/referrer';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    const result = await resetPasswordWithTokenAction(token, newPassword);

    if (result.success) {
      setSuccess(true);
    } else {
      setFormError(result.error || "Failed to reset password. The link may have expired.");
    }

    setLoading(false);
  };

  // If there is no token in the URL, immediately stop them
  if (!token) {
    return (
      <div className="text-center space-y-5 py-6">
        <div className="mx-auto w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-inner mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-black text-stone-950 uppercase tracking-tight">Invalid Link</h3>
        <p className="text-stone-500 font-bold text-xs leading-relaxed">
          We couldn't find a secure token in your URL. This link may be broken or missing details.
        </p>
        <Link href="/referrer/forgot-password" className="inline-block mt-4 w-full bg-stone-950 hover:bg-stone-800 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1">
          Request a New Link
        </Link>
      </div>
    );
  }

  // If the reset was successful, show the success screen
  if (success) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-emerald-800 font-black text-sm uppercase tracking-tight">Access Restored!</p>
        <p className="text-emerald-600/80 text-xs font-bold px-4 pb-2">Your password has been securely updated. You can now log into your portal.</p>
        <Link href="/referrer" className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1">
          Go To Login
        </Link>
      </div>
    );
  }

  // The actual password reset form
  return (
    <form onSubmit={handlePasswordSave} className="space-y-5 text-left">
      <div>
        <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">New Password</label>
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input 
            type="password" 
            required 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="••••••••" 
            className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 text-stone-900 font-bold outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300" 
          />
        </div>
      </div>

      <div>
        <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input 
            type="password" 
            required 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="••••••••" 
            className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-12 pr-4 py-3.5 text-stone-900 font-bold outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300" 
          />
        </div>
      </div>

      {formError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{formError}</span>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-stone-950 hover:bg-stone-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-40 transition-all shadow-xl hover:-translate-y-1 mt-4"
      >
        <span>{loading ? 'Securing Profile...' : 'Save New Password'}</span> 
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen font-sans antialiased flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/sparkle-drinks.png" 
          alt="Sparkle Squad Lifestyle" 
          layout="fill" 
          objectFit="cover" 
          priority
          className="w-full h-full object-cover object-center opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950/90 via-stone-900/80 to-emerald-950/70" />
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border-2 border-white/50 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8 relative z-10">
        
        <div className="text-center space-y-4">
          <Link href="/" className="block">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={180} height={70} className="h-14 mx-auto object-contain transition-transform hover:scale-105" priority />
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="h-3 w-3 text-emerald-500" /> Security
          </div>
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tighter leading-tight">Create <br/>Password.</h2>
          <p className="text-sm text-stone-500 font-bold max-w-xs mx-auto leading-relaxed">
            Create a strong, secure password for your Ambassador Portal.
          </p>
        </div>

        <Suspense fallback={<div className="py-10 text-center text-stone-400 font-bold text-xs uppercase tracking-widest animate-pulse">Verifying Secure Link...</div>}>
          <ResetPasswordForm />
        </Suspense>

      </div>
    </div>
  );
}