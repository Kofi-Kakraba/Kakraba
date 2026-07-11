'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';

export default function CustomEventsPackagesPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased pb-20 selection:bg-emerald-600 selection:text-white">
      
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/60 py-4 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" className="h-12 object-contain" />
          <div className="h-6 w-px bg-stone-200" />
          <span className="text-xs font-serif font-black text-emerald-950 uppercase tracking-tight">Custom Events</span>
        </div>
        <Link href="/shop" className="text-[11px] font-mono font-bold text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
          <ArrowLeft className="h-3.5 w-3.5" /> <span>Return to Store Menu</span>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-700 font-black bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Bespoke Production</span>
          <h1 className="text-3xl font-serif font-black tracking-tight text-emerald-950 uppercase">Available Production Packages (300ml)</h1>
          <p className="text-xs text-stone-500 leading-relaxed font-light font-sans">
            Refining weddings, massive corporate AGMs, and special milestones across Ghana with custom flavor profiling layouts and custom branded batch labeling lines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border border-stone-200/60 rounded-[32px] p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg text-emerald-950 uppercase">Bronze Package</h3>
                <p className="text-[11px] text-stone-500 font-light leading-normal mt-0.5">Perfect for intimate gatherings, small birthdays, and private dinner milestones.</p>
              </div>
              <div className="border-t border-stone-100 pt-3">
                <span className="text-2xl font-serif font-black text-emerald-950">₵8.00</span>
                <span className="text-[10px] text-stone-400 font-mono"> / unit rate</span>
              </div>
              <ul className="space-y-2 font-mono text-[11px] text-stone-600 border-t border-stone-100 pt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Min MOQ: 100 pouches</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Standard Recipe Mix</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Basic Event Labeling</span></li>
              </ul>
            </div>
            <a href="https://wa.me/233547664422?text=Hi%20Sparkle,%20I%20want%20to%20book%20the%20Bronze%20Events%20Package" target="_blank" className="w-full bg-stone-900 hover:bg-stone-950 text-white font-mono font-bold text-center py-2.5 rounded-xl text-[11px] uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" /> <span>Book via WhatsApp</span>
            </a>
          </div>

          <div className="bg-white border border-stone-200/60 rounded-[32px] p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg text-emerald-950 uppercase">Silver Package</h3>
                <p className="text-[11px] text-stone-500 font-light leading-normal mt-0.5">Ideal for standard corporate networking sessions and traditional engagements.</p>
              </div>
              <div className="border-t border-stone-100 pt-3">
                <span className="text-2xl font-serif font-black text-emerald-950">₵8.00</span>
                <span className="text-[10px] text-stone-400 font-mono"> / unit rate</span>
              </div>
              <ul className="space-y-2 font-mono text-[11px] text-stone-600 border-t border-stone-100 pt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Min MOQ: 200 pouches</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>2 Branded Water Packs Free</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Custom Branding Crests</span></li>
              </ul>
            </div>
            <a href="https://wa.me/233547664422?text=Hi%20Sparkle,%20I%20want%20to%20book%20the%20Silver%20Events%20Package" target="_blank" className="w-full bg-stone-900 hover:bg-stone-950 text-white font-mono font-bold text-center py-2.5 rounded-xl text-[11px] uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" /> <span>Book via WhatsApp</span>
            </a>
          </div>

          <div className="bg-white border-2 border-emerald-600 rounded-[32px] p-6 flex flex-col justify-between space-y-6 shadow-md relative">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-600 text-white font-mono font-bold uppercase text-[8px] tracking-widest px-2.5 py-0.5 rounded-md shadow-sm">Most Requested</span>
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg text-emerald-950 uppercase flex items-center gap-1">Gold Package <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" /></h3>
                <p className="text-[11px] text-stone-500 font-light leading-normal mt-0.5">Tailored for large wedding celebrations and multi-day high-profile conferences.</p>
              </div>
              <div className="border-t border-stone-100 pt-3">
                <span className="text-2xl font-serif font-black text-emerald-950">₵8.00</span>
                <span className="text-[10px] text-stone-400 font-mono"> / unit rate</span>
              </div>
              <ul className="space-y-2 font-mono text-[11px] text-stone-600 border-t border-stone-100 pt-3">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Min MOQ: 300 pouches</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>3 Branded Water Packs Free</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span>Premium Mango/Zest variants</span></li>
              </ul>
            </div>
            <a href="https://wa.me/233547664422?text=Hi%20Sparkle,%20I%20want%20to%20book%20the%20Gold%20Events%20Package" target="_blank" className="w-full bg-stone-900 hover:bg-stone-950 text-white font-mono font-bold text-center py-2.5 rounded-xl text-[11px] uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-md">
              <MessageSquare className="h-3.5 w-3.5" /> <span>Book via WhatsApp</span>
            </a>
          </div>

          {/* DIAMOND TIER COMPONENT CARD FIXED CONTRAST */}
          <div className="bg-white border border-stone-200/60 rounded-[32px] p-6 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-black text-lg text-emerald-950 uppercase">Diamond Tier</h3>
                <p className="text-[11px] text-stone-700 font-semibold leading-normal mt-0.5">Our ultimate tier for massive festivals, mega-weddings, and high-volume corporate retreats.</p>
              </div>
              <div className="border-t border-stone-100 pt-3">
                <span className="text-2xl font-serif font-black text-emerald-600">₵8.00</span>
                <span className="text-[10px] text-stone-700 font-mono font-bold"> / unit base</span>
              </div>
              <ul className="space-y-2 font-mono text-[11px] text-stone-800 border-t border-stone-200 pt-3 font-bold">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span className="text-stone-900">Custom MOQ Options Available</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span className="text-stone-900">4 Branded Water Packs Free</span></li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /><span className="text-stone-900">Dedicated Event Coordinator</span></li>
              </ul>
            </div>
            <a href="https://wa.me/233547664422?text=Hi%20Sparkle,%20I%20want%20to%20book%20the%20Diamond%20Events%20Package" target="_blank" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-center py-2.5 rounded-xl text-[11px] uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" /> <span>Book via WhatsApp</span>
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}