'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  User, Phone, CreditCard, ShieldCheck, FileText, 
  Upload, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Leaf, LogIn, Camera
} from 'lucide-react';
import { createBrowserSupabaseClient } from '../../../lib/supabaseClient';

export default function ReferrerSignupPage() {
  const supabase = createBrowserSupabaseClient();

  // Form Fields States
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('');
  const [ghanaCardNum, setGhanaCardNum] = useState('');

  // Asset Files Bin State
  const [portraitFile, setPortraitFile] = useState(null);
  const [ghanaCardFile, setGhanaCardFile] = useState(null);

  // Status States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successComplete, setSuccessComplete] = useState(false);
  
  // Terms Constraints States
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleAgreementScrollTracker = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 15;
    if (isAtBottom) setHasScrolledToBottom(true);
  };

  const handleApplicationSubmission = async (e) => {
    e.preventDefault();
    if (!hasScrolledToBottom || !agreedToTerms) {
      alert("Verification Locked: Please read to the bottom of the terms agreement contract and tick the validation box.");
      return;
    }
    if (!portraitFile || !ghanaCardFile) {
      setErrorMessage("Missing Required Documents: Please attach your Face Portrait and physical Ghana Card scan.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const cleanCardNumber = ghanaCardNum.trim().toUpperCase();
      const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');

      // 1. Pre-verification check to block duplicates upfront
      const { data: duplicateCheck } = await supabase
        .from('referral_codes')
        .select('code, phone_number, ghana_card_number')
        .or(`phone_number.eq.${cleanPhone},ghana_card_number.eq.${cleanCardNumber}`);

      if (duplicateCheck && duplicateCheck.length > 0) {
        const match = duplicateCheck[0];
        if (match.phone_number === cleanPhone) {
          throw new Error("Registration Halt: This phone number is already registered under an active partner account.");
        }
        if (match.ghana_card_number === cleanCardNumber) {
          throw new Error("Registration Halt: This Ghana Card Number (NIA ID) has already been utilized for a network account.");
        }
      }

      const generatedCodeSlug = 'SPK-' + Math.random().toString(36).substring(2, 7).toUpperCase();

      // 2. Upload Profile Portrait Image File
      const portraitName = `portrait_${Date.now()}_${portraitFile.name.replace(/\s+/g, '_')}`;
      const { data: portData, error: portUploadError } = await supabase.storage
        .from('sparkle-assets').upload(portraitName, portraitFile, { cacheControl: '3600', upsert: true });

      if (portUploadError) throw new Error(`Face portrait file upload failed: ${portUploadError.message}`);
      const { data: portUrl } = supabase.storage.from('sparkle-assets').getPublicUrl(portData.path);

      // 3. Upload Physical Ghana Card Scan File
      const cardFilename = `ghanacard_${Date.now()}_${ghanaCardFile.name.replace(/\s+/g, '_')}`;
      const { data: cardData, error: cardUploadError } = await supabase.storage
        .from('sparkle-assets').upload(cardFilename, ghanaCardFile, { cacheControl: '3600', upsert: true });

      if (cardUploadError) throw new Error(`Ghana Card scan file upload failed: ${cardUploadError.message}`);
      const { data: cardUrl } = supabase.storage.from('sparkle-assets').getPublicUrl(cardData.path);

      const fallbackTempPassword = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 4. Injects variables securely with system constraints
      const { error: insertError } = await supabase
        .from('referral_codes')
        .insert([{
          code: generatedCodeSlug,
          password: fallbackTempPassword,
          campaign_name: `Agent: ${fullName.trim()}`,
          is_active: false,
          is_verified: false,
          total_earnings: 0.00,
          legal_name: fullName.trim(),
          phone_number: cleanPhone,
          momo_number: momoNumber.trim(),
          momo_network: momoNetwork,
          portrait_url: portUrl.publicUrl,
          ghana_card_url: cardUrl.publicUrl,
          ghana_card_number: cleanCardNumber,
          status: 'pending_review'
        }]);

      if (insertError) throw insertError;
      setSuccessComplete(true);

    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successComplete) {
    return (
      <div className="min-h-screen bg-stone-955 flex items-center justify-center px-4 font-sans text-stone-300 antialiased py-12">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-[36px] p-8 space-y-6 shadow-2xl text-center">
          <div className="h-16 w-16 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-mono font-black tracking-tight text-white uppercase">Application Filed!</h2>
            <p className="text-xs text-stone-400 leading-relaxed font-light font-sans">
              Great work, <strong className="text-white font-bold">{fullName}</strong>! Your application form and verification assets have been successfully routed to our internal review boards.
            </p>
          </div>
          <div className="bg-stone-950 p-5 rounded-2xl text-left text-[11px] font-mono text-stone-400 leading-relaxed space-y-2.5 shadow-xl border border-stone-850">
            <p className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">✨ Next Steps Pipeline:</p>
            <p>• Our backend operations team will verify your submitted Ghana Card document line properties.</p>
            <p>• Once approved, your custom tracking code username and secure access password will wire **instantly to your phone via an automated branding SMS text alert from us.**</p>
          </div>
          <div className="pt-2">
            <Link href="/referrer" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md uppercase tracking-wider">
              <LogIn className="h-4 w-4" /> <span>Go to Portal Sign In Page</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-955 text-stone-300 font-sans antialiased py-12 px-4 flex justify-center items-center relative overflow-hidden">
      <div className="w-full max-w-4xl bg-stone-900 rounded-[36px] p-6 md:p-10 shadow-2xl grid grid-cols-1 md:grid-cols-5 gap-8 items-center border border-stone-800">
        
        <div className="md:col-span-2 space-y-5 text-center md:text-left border-b md:border-b-0 md:border-r border-stone-850 pb-6 md:pb-0 md:pr-8 h-full flex flex-col justify-between">
          <div className="space-y-3">
            <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Logo" className="h-16 mx-auto md:mx-0 object-contain drop-shadow-sm" />
            <h2 className="text-md font-mono font-black tracking-tight text-white uppercase flex items-center justify-center md:justify-start gap-2 mt-2">
              <Leaf className="h-4 w-4 text-emerald-500" /> Referral Program
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed font-light font-sans">
              Share. Earn. Refresh others. Join our ambassador loop network, harvest automated commissions on standard or custom event pouch batches, and track your cashouts live with 100% processing clarity.
            </p>
          </div>

          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-850 text-left space-y-2 text-[11px] font-medium text-stone-400 shadow-inner font-mono">
            <div className="text-emerald-400 font-black uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Account Safeguards:
            </div>
            <div className="flex justify-between"><span>• Min Payout Floor:</span><strong className="text-white">₵100.00</strong></div>
            <div className="flex justify-between"><span>• Transfer Limits:</span><strong className="text-white">Once a Week</strong></div>
            <div className="flex justify-between"><span>• Processing Cuts:</span><strong className="text-white">Tax + MoMo Fees</strong></div>
          </div>

          <div className="pt-4 border-t border-stone-850 text-center md:text-left">
            <span className="text-[11px] text-stone-500 block mb-1.5 font-sans">Already have an activated tracker code?</span>
            <Link href="/referrer" className="inline-flex items-center gap-1 bg-stone-950 hover:bg-stone-850 text-stone-300 text-[11px] font-mono font-bold px-4 py-2 rounded-xl transition-all border border-stone-800 uppercase tracking-wide">
              <LogIn className="h-3.5 w-3.5 text-emerald-500" /> <span>Log In to Agent Vault</span>
            </Link>
          </div>
        </div>

        <form onSubmit={handleApplicationSubmission} className="md:col-span-3 space-y-4 text-xs text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-black text-white uppercase tracking-tight">Ambassador Onboarding Request</h3>
            <p className="text-[11px] text-stone-500 font-light font-sans">Submit your legal identity tracking items to auto-generate your code parameters.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-400 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Matches Ghana Card exactly" className="w-full bg-stone-950 border border-stone-850 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-stone-400 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Contact Phone Line</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g., 0547664422" className="w-full bg-stone-950 border border-stone-850 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-white outline-none transition-all" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-stone-400 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Ghana Card Number (NIA Number ID)</label>
            <input type="text" required value={ghanaCardNum} onChange={(e) => setGhanaCardNum(e.target.value.toUpperCase())} placeholder="GHA-XXXXXXXXX-X" className="w-full bg-stone-950 border border-stone-850 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white tracking-widest outline-none transition-all uppercase font-bold" />
          </div>

          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-850 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-stone-500 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Target Payout MoMo Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                <input type="text" required value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="Wallet Phone Line" className="w-full bg-stone-900 border border-stone-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-white outline-none font-mono font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-stone-500 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Network Type</label>
              <select required value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} className="w-full bg-stone-900 border border-stone-800 focus:border-emerald-500 rounded-xl px-2 py-2 text-stone-300 outline-none font-mono cursor-pointer">
                <option value="">Select...</option>
                <option value="MTN">MTN MoMo</option>
                <option value="Telecel">Telecel Cash</option>
                <option value="AT">AT Money</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-400 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Face Portrait Picture (Selfie)</label>
              <label className="w-full bg-stone-950 border border-stone-850 focus:border-emerald-500 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-stone-900 transition-all border-dashed">
                <Camera className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-[10px] text-stone-400 truncate font-sans">{portraitFile ? portraitFile.name : 'Choose Face Photo file'}</span>
                {/* FORCED DEVICE HARDWARE CAMERA CALL SNAPSHOT ATTR INJECTION */}
                <input type="file" required accept="image/*" capture="user" className="hidden" onChange={(e) => setPortraitFile(e.target.files?.[0])} />
              </label>
            </div>
            <div>
              <label className="block text-stone-400 font-mono font-bold text-[9px] uppercase tracking-wide mb-1">Ghana Card Front Photo Scan</label>
              <label className="w-full bg-stone-950 border border-stone-850 focus:border-emerald-500 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-stone-900 transition-all border-dashed">
                <CreditCard className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-[10px] text-stone-400 truncate font-sans">{ghanaCardFile ? ghanaCardFile.name : 'Choose Identity Scan file'}</span>
                <input type="file" required accept="image/*" className="hidden" onChange={(e) => setGhanaCardFile(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div ref={scrollContainerRef} onScroll={handleAgreementScrollTracker} className="h-24 bg-stone-950 border border-stone-850 rounded-2xl p-4 overflow-y-auto font-sans text-[10px] text-stone-400 leading-relaxed space-y-2 text-justify scrollbar-thin shadow-inner font-light">
              <h4 className="font-mono text-white font-black uppercase text-[9px] tracking-wide border-b border-stone-850 pb-1">Statutory Compliance Agreement Doc</h4>
              <p><strong>1. Independent Contractor Status:</strong> You align with the Sparkle Agent Network explicitly as an Independent Marketer. This setup does not configure an employment loop or legal company partnership.</p>
              <p><strong>2. Account Financial Guardrails:</strong> You agree that your commissions remain locked and unavailable until your wallet balance hits or crosses a minimum floor of <strong>₵100.00 Gross</strong>. Withdrawal requests are capped at a rate limit of once every seven (7) calendar days.</p>
              <p><strong>3. Statutory Tax Cuts & Fee Liabilities:</strong> In absolute compliance with the guidelines established by the Ghana Revenue Authority (GRA), a 10% Withholding Tax (WHT) deduction will slice out automatically from every single gross withdrawal requested. Additionally, mobile network payment transaction gateway fees are deducted from your final mobile payment delivery.</p>
              <p><strong>4. Anti-Fraud Compliance:</strong> Multiple duplicate profiles or self-referral circles generated to falsify purchases or siphon metrics trigger immediate channel deactivation and total wallet balance forfeiture.</p>
            </div>

            <label className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all duration-300 font-sans ${hasScrolledToBottom ? 'bg-emerald-950/20 border-emerald-900/40 text-stone-300 cursor-pointer' : 'bg-stone-950 border-stone-900 opacity-40 select-none text-stone-600'}`}>
              <input type="checkbox" disabled={!hasScrolledToBottom} checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-800 bg-stone-950 text-emerald-600 accent-emerald-600 cursor-pointer" />
              <span className="text-[10px] font-light leading-tight">
                {hasScrolledToBottom ? "I have read completely and agree to execute this contract, accepting the 10% Withholding Tax rules, the ₵100 limit floor, and the once-a-week withdrawal cycle cap." : "🔒 [Scroll to the absolute bottom of the agreement above to unlock the validation checkbox]"}
              </span>
            </label>
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-900/30 p-3 rounded-xl flex gap-2 leading-relaxed text-red-400 font-sans">
              <AlertCircle className="h-4 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button type="submit" disabled={loading || !agreedToTerms} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-40 text-xs uppercase tracking-wide">
            <span>{loading ? 'Processing Identity Data Assets...' : 'Submit Ambassador Application'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}