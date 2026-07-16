'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageCircle, Smartphone, Truck, ShieldCheck, Sparkles } from 'lucide-react';

export default function PublicPriceListPage() {
  const whatsappLink = "https://wa.me/233533527192?text=Hello%20Sparkle!%20I%20just%20reviewed%20your%20official%20price%20sheet%20and%20I'd%20like%20to%20place%20an%20order.";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 antialiased font-sans pb-16">
      {/* HEADER NAV */}
      <nav className="bg-white border-b border-stone-200 py-4 px-6 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <Link href="/">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={140} height={60} className="h-12 w-auto object-contain cursor-pointer" />
        </Link>
        <Link href="/shop" className="text-xs font-black uppercase tracking-wider text-stone-500 hover:text-stone-950 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Go To Store
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-12 space-y-8">
        {/* PAGE TITLE */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 text-stone-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" /> Official Price Menu
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-stone-950">Product Sizing & Rates</h1>
          <p className="text-xs text-stone-500 font-medium">Premium, cold-pressed fruit infusions packed in clean spouted hustle pouches.</p>
        </div>

        {/* SECTION 1: RETAIL */}
        <div className="bg-white border-2 border-stone-200 rounded-[32px] p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-rose-600 border-b border-stone-100 pb-2">01 // Retail Pouch Packs (Sold in Packs of 12)</h2>
          
          <div className="divide-y divide-stone-100">
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-black text-stone-950 block text-sm">300ml Hustle Pouch <span className="text-stone-400 font-mono text-xs">(Solo ⚡)</span></span>
                <span className="text-[11px] text-stone-500 font-medium">Ideal for casual hydration & light refreshments</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-stone-950 block">₵120.00 <span className="text-[10px] text-stone-400 font-normal">/ Pack</span></span>
                <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono font-bold text-stone-600">₵10.00 per btl</span>
              </div>
            </div>

            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-black text-stone-950 block text-sm">500ml Premium Pouch <span className="text-stone-400 font-mono text-xs">(Gee ✊)</span></span>
                <span className="text-[11px] text-stone-500 font-medium">Our standard high-energy heavy pack</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-stone-950 block">₵144.00 <span className="text-[10px] text-stone-400 font-normal">/ Pack</span></span>
                <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono font-bold text-stone-600">₵12.00 per btl</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: WHOLESALE */}
        <div className="bg-stone-950 text-white rounded-[32px] p-6 shadow-xl space-y-4 border border-stone-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10" />
          <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-b border-stone-900 pb-2 relative z-10">02 // Independent Wholesale Bulk Tier</h2>
          
          <p className="text-[11px] text-stone-400 leading-relaxed font-medium relative z-10">
            Planning a larger gathering, catering service, or corporate setup? Wholesale rates activate automatically in our database pipeline for any mixed batch exceeding <strong className="text-white">50 total units</strong>.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs relative z-10">
            <div className="bg-stone-900 border border-stone-850 p-3 rounded-xl">
              <span className="text-[9px] text-stone-500 uppercase block font-bold">300ml Bulk Rate</span>
              <strong className="text-sm text-white">₵8.50 - ₵9.00</strong> <span className="text-[10px] text-stone-400">/ pouch</span>
            </div>
            <div className="bg-stone-900 border border-stone-850 p-3 rounded-xl">
              <span className="text-[9px] text-stone-500 uppercase block font-bold">500ml Bulk Rate</span>
              <strong className="text-sm text-white">₵10.50 - ₵11.00</strong> <span className="text-[10px] text-stone-400">/ pouch</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: LOGISTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px] font-bold text-stone-600">
          <div className="bg-stone-100/60 border border-stone-200 p-4 rounded-2xl flex items-center gap-3">
            <Truck className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <span className="text-stone-950 block uppercase text-[9px] font-black">Accra Corridor Logistics</span>
              <span>Flat Dispatch Rate: ₵30.00</span>
            </div>
          </div>
          <div className="bg-stone-100/60 border border-stone-200 p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <span className="text-stone-950 block uppercase text-[9px] font-black">Depot Self-Pickup</span>
              <span>HQ Central Location: FREE</span>
            </div>
          </div>
        </div>

        {/* MASTER WHATSAPP ORDER CTA */}
        <div className="text-center pt-4">
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="h-4 w-4" /> Tap to Order via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}