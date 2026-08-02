'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { requestPasswordResetAction } from '../../actions/referrer';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [emailInput, setEmailInput] = useState('');

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    
    setLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    const result = await requestPasswordResetAction(emailInput);
    
    if (result.success) {
      setSuccessMessage(result.message);
      setEmailInput(''); // Clear the input on success
    } else {
      setFormError(result.error || "Failed to process request. Please try again.");
    }
    
    setLoading(false);
  };

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
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tighter leading-tight">Reset <br/>Password.</h2>
          <p className="text-sm text-stone-500 font-bold max-w-xs mx-auto leading-relaxed">
            Enter the email address tied to your ambassador account to receive a secure recovery link.
          </p>
        </div>

        {successMessage ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-emerald-800 font-black text-sm">{successMessage}</p>
            <p className="text-emerald-600/80 text-xs font-bold px-4">Please check your inbox and spam folder. The link will expire in 1 hour.</p>
            <Link href="/referrer" className="inline-block mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input 
                  type="email" 
                  required 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)} 
                  placeholder="name@example.com" 
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
              className="w-full bg-stone-950 hover:bg-stone-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40 transition-all shadow-xl hover:-translate-y-1 mt-2"
            >
              <span>{loading ? 'Sending Link...' : 'Send Recovery Link'}</span> 
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <div className="text-center pt-6 border-t border-stone-100">
              <Link href="/referrer" className="text-stone-500 hover:text-stone-900 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft className="h-3 w-3" /> Back to Portal
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}