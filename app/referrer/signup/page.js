'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, AlertCircle, Zap, ArrowLeft, Camera, CreditCard, Upload, Phone, Mail, Wallet, FileText } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../../lib/supabaseClient';

export default function ReferrerSignupPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMode, setSuccessMode] = useState(false);
  const [assignedCode, setAssignedCode] = useState('');

  // Form States
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [password, setPassword] = useState('');
  
  // File States
  const [selfieFile, setSelfieFile] = useState(null);
  const [cardFile, setCardFile] = useState(null);
  
  // Terms State
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const uploadFileToSupabase = async (file, pathPrefix) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('sparkle-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('sparkle-assets')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!agreedToTerms) {
      setFormError("You must read and acknowledge the Ambassador Agreement to proceed.");
      return;
    }
    if (!selfieFile || !cardFile) {
      setFormError("Both a Live Selfie and a snapshot of your Ghana Card are required for KYC verification.");
      return;
    }

    setLoading(true);

    try {
      // 1. SYSTEM AUTO-GENERATE UNIQUE TRACKING CODE TO PREVENT DUPLICATES
      let finalGeneratedCode = '';
      let isUnique = false;
      let safetyCounter = 0;

      while (!isUnique && safetyCounter < 10) {
        const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
        const candidateCode = `SPK-${randomString}`;
        
        const { data: checkCode } = await supabase
          .from('referral_codes')
          .select('id')
          .eq('code', candidateCode)
          .maybeSingle();
          
        if (!checkCode) {
          finalGeneratedCode = candidateCode;
          isUnique = true;
        }
        safetyCounter++;
      }

      if (!finalGeneratedCode) {
        throw new Error("System code routing collision. Please press submit again.");
      }

      // 2. Upload KYC Documents to public bucket
      const selfieUrl = await uploadFileToSupabase(selfieFile, `kyc_selfie_${finalGeneratedCode}`);
      const cardUrl = await uploadFileToSupabase(cardFile, `kyc_card_${finalGeneratedCode}`);

      // 3. Insert Application into Database under 'pending_review' lockdown
      const { error: insertError } = await supabase.from('referral_codes').insert([{
        code: finalGeneratedCode,
        campaign_name: `${legalName.trim()} [Ambassador]`,
        legal_name: legalName.trim(),
        phone_number: phone.trim(),
        email: email.trim(),
        momo_number: momoNumber.trim(),
        momo_network: momoNetwork,
        ghana_card_number: ghanaCardNumber.trim().toUpperCase(),
        portrait_url: selfieUrl,
        ghana_card_url: cardUrl,
        total_earnings: 0.00,
        is_active: false, 
        is_verified: false,
        status: 'pending_review',
        password: password.trim()
      }]);

      if (insertError) throw insertError;

      setAssignedCode(finalGeneratedCode);
      setSuccessMode(true);

    } catch (err) {
      setFormError(err.message || "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successMode) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 selection:bg-rose-500 selection:text-white">
        <div className="max-w-md bg-white border-2 border-stone-200 rounded-[40px] p-10 text-center shadow-2xl space-y-6">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tight">Profile Staged.</h2>
          <div className="bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 font-mono">
            <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest block mb-1">Your Allocated Tracking Code</span>
            <strong className="text-2xl text-emerald-600 font-black tracking-wider block">{assignedCode}</strong>
          </div>
          <p className="text-stone-500 font-bold text-sm leading-relaxed">
            Your profile details and KYC uploads are locked into our verification queue. You will receive an email advisory and an SMS broadcast details string as soon as an administrator confirms your credentials node!
          </p>
          <Link href="/" className="inline-block mt-4 bg-stone-950 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all text-xs">
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased flex flex-col justify-center items-center px-4 py-16 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      
      {/* SQUAD LIFESTYLE BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/sparkle-drinks.png" 
          alt="Sparkle Squad Lifestyle" 
          layout="fill" 
          objectFit="cover" 
          priority
          className="w-full h-full object-cover object-center opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-950/95 via-stone-900/90 to-rose-950/80" />
      </div>

      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl border-2 border-white/50 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8 relative z-10 my-8">
        
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Storefront
          </Link>
          <Link href="/" className="block">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={180} height={70} className="h-14 mx-auto object-contain transition-transform hover:scale-105" priority />
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
            <Zap className="h-3 w-3" /> Official Registry
          </div>
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tighter leading-tight">Join The Squad.</h2>
          <p className="text-sm text-stone-500 font-bold max-w-sm mx-auto leading-relaxed">
            Submit your personal data and identity verification to let the system generate your tracking keys.
          </p>
        </div>

        <form onSubmit={handleSignupSubmit} className="space-y-8 text-left">
          
          {/* SECTION 1: PERSONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">1. Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input type="text" required value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="e.g. Kwame Mensah" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0540000000" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PAYOUT DETAILS */}
          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">2. Payout Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">MoMo Network</label>
                <select value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer">
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Telecel">Telecel Cash</option>
                  <option value="AT">AT Money</option>
                </select>
              </div>
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">MoMo Wallet Number</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input type="tel" required value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="Receiving Number" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: KYC VERIFICATION */}
          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">3. KYC Identity Audit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Ghana Card ID Number</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input type="text" required value={ghanaCardNumber} onChange={(e) => setGhanaCardNumber(e.target.value)} placeholder="e.g. GHA-123456789-0" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold uppercase tracking-widest outline-none focus:border-rose-500 transition-colors" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selfie Upload */}
                <div className="bg-[#FDFBF7] border-2 border-dashed border-stone-200 rounded-2xl p-4 text-center hover:border-rose-400 transition-colors">
                  <Camera className="h-6 w-6 text-stone-400 mx-auto mb-2" />
                  <label className="cursor-pointer block">
                    <span className="text-xs font-black uppercase tracking-widest text-rose-600 block mb-1">Live Face Selfie</span>
                    <span className="text-[10px] text-stone-500 font-bold block mb-3 truncate px-2">{selfieFile ? selfieFile.name : 'Upload clear profile photo'}</span>
                    <div className="bg-white border border-stone-200 text-stone-600 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl shadow-sm inline-flex items-center gap-1.5 px-4">
                      <Upload className="h-3 w-3" /> Select File
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>

                {/* ID Card Upload */}
                <div className="bg-[#FDFBF7] border-2 border-dashed border-stone-200 rounded-2xl p-4 text-center hover:border-rose-400 transition-colors">
                  <CreditCard className="h-6 w-6 text-stone-400 mx-auto mb-2" />
                  <label className="cursor-pointer block">
                    <span className="text-xs font-black uppercase tracking-widest text-rose-600 block mb-1">Ghana Card Front Photo</span>
                    <span className="text-[10px] text-stone-500 font-bold block mb-3 truncate px-2">{cardFile ? cardFile.name : 'Upload clear card image'}</span>
                    <div className="bg-white border border-stone-200 text-stone-600 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl shadow-sm inline-flex items-center gap-1.5 px-4">
                      <Upload className="h-3 w-3" /> Select File
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => setCardFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: SECURITY PASSPHRASE */}
          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2">4. Access Security</h3>
            <div>
              <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Create Private Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters..." className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* COMPREHENSIVE TERMS AND CONDITIONS BOX */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex items-start gap-4 shadow-inner">
            <input 
              type="checkbox" 
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <label htmlFor="terms" className="text-[11px] text-stone-600 font-bold leading-relaxed cursor-pointer uppercase tracking-wide space-y-2 block">
              <span className="text-stone-900 block font-black border-b border-stone-200 pb-1 text-[10px]">Ambassador Commission & Operational Agreement</span>
              <span className="block normal-case font-bold text-stone-500">
                1. I understand that my unique tracking parameters are system auto-allocated to guarantee routing uniqueness across the entire beverage network database nodes.<br/>
                2. I explicitly acknowledge that the minimum structural threshold to initiate a disbursal pipeline payout request is <strong>₵100.00</strong> per week.<br/>
                3. I accept that all gross tracking conversions calculations are legally bounded under Ghanaian fiscal rules, triggering an automated <strong>10% WHT (Withholding Tax)</strong> deduction alongside standard third-party Paystack Mobile Money API railway rail platform execution fees.
              </span>
            </label>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> <span>{formError}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40 transition-all shadow-[0_8px_30px_rgb(225,29,72,0.3)] hover:-translate-y-1 mt-2">
            <span>{loading ? 'Processing System Registration...' : 'Complete Registry & Auto-Generate Code'}</span> <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center pt-6 border-t border-stone-100 text-xs text-stone-500 font-bold">
            Already have an active code?{' '}
            <Link href="/referrer" className="text-stone-950 hover:text-rose-600 underline font-black uppercase tracking-wide ml-1">Login Here</Link>
          </div>
        </form>

      </div>
    </div>
  );
}