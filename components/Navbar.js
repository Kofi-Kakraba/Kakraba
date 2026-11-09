'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { Droplet, X, Home, ShoppingBag, CalendarDays, Users, MessageCircle } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 🚨 Ensures the portal only renders after the client has loaded
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav className="bg-transparent py-3 sticky top-0 z-50 flex justify-between items-center h-20 w-full">
        {/* LOGO */}
        <div className="flex items-center h-full">
          <Link href="/">
            <Image 
              src="/SPARKLE BEV. LOGO A No BG.png" 
              alt="Sparkle Logo" 
              width={200} 
              height={80} 
              className="h-14 sm:h-16 w-auto object-contain cursor-pointer" 
              priority 
            />
          </Link>
        </div>
        
        {/* THE JUICE DROP MENU BUTTON */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-2 group bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 px-4 py-2.5 rounded-full shadow-sm transition-all duration-300"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-900 group-hover:text-rose-600 transition-colors">
            Menu
          </span>
          <div className="relative">
            <Droplet className="h-5 w-5 text-rose-500 fill-rose-500 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
            <div className="absolute inset-0 bg-rose-500 blur-md rounded-full opacity-0 group-hover:opacity-40 transition-opacity"></div>
          </div>
        </button>
      </nav>

      {/* 🚨 FIX: Using a React Portal to break out of the sticky navbar trap! */}
      {isMenuOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
          <div 
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)} 
          />
          
          <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-[#FDFBF7] shadow-2xl flex flex-col h-full transform transition-transform duration-300">
            
            <div className="p-6 flex items-center justify-between border-b border-stone-200 bg-white">
              <span className="font-black uppercase tracking-widest text-stone-900 text-sm flex items-center gap-2">
                <Droplet className="h-4 w-4 text-rose-500 fill-rose-500" /> The Directory
              </span>
              <button onClick={() => setIsMenuOpen(false)} className="bg-stone-100 hover:bg-stone-200 p-2 rounded-full text-stone-600 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:border-stone-400 hover:shadow-md transition-all group">
                <div className="bg-stone-100 text-stone-700 p-3 rounded-xl group-hover:scale-110 transition-transform"><Home className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-black uppercase text-stone-950 text-lg">Home</h3>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Back To The Vibe</p>
                </div>
              </Link>

              <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:border-rose-300 hover:shadow-md transition-all group">
                <div className="bg-rose-100 text-rose-600 p-3 rounded-xl group-hover:scale-110 transition-transform"><ShoppingBag className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-black uppercase text-stone-950 text-lg">Shop Batches</h3>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Grab Your Pouches</p>
                </div>
              </Link>

              <Link href="/custom" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:border-amber-300 hover:shadow-md transition-all group">
                <div className="bg-amber-100 text-amber-600 p-3 rounded-xl group-hover:scale-110 transition-transform"><CalendarDays className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-black uppercase text-stone-950 text-lg">Custom Drops</h3>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Weddings & Events</p>
                </div>
              </Link>

              <Link href="/referrer" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:border-emerald-300 hover:shadow-md transition-all group">
                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform"><Users className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-black uppercase text-stone-950 text-lg">Ambassador Hub</h3>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Share & Earn Cash</p>
                </div>
              </Link>
            </div>

            <div className="p-6 bg-stone-950 mt-auto">
              <a href="https://wa.me/233533527192" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#20ba5a] transition-colors">
                <MessageCircle className="h-5 w-5 fill-white" /> Contact Dispatch
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
