'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalPortalLoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col justify-center items-center px-6 selection:bg-emerald-500 text-center">
      
      {/* Container holding layout assets stable */}
      <div className="space-y-6 max-w-sm w-full animate-pulse flex flex-col items-center">
        
        {/* Placeholder Logo circle node outline */}
        <div className="h-20 w-20 rounded-full bg-stone-200 flex items-center justify-center shadow-inner relative border border-stone-300/30">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>

        {/* Shimmering typography lines keeping users focused */}
        <div className="space-y-2.5 w-full flex flex-col items-center">
          <div className="h-4 bg-stone-300 rounded-full w-3/4" />
          <div className="h-3 bg-stone-200 rounded-full w-1/2" />
        </div>

        {/* Subtle status tracker */}
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 block pt-4">
          Securing Sparkle API Node...
        </span>
      </div>

    </div>
  );
}