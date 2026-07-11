'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShoppingBag, ChevronRight } from 'lucide-react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export default function BrandWelcomeHomePage() {
  const supabase = createBrowserSupabaseClient();
  const [content, setContent] = useState(null);

  useEffect(() => {
    async function loadWebpageContent() {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'homepage').single();
      if (data?.content) {
        setContent(data.content);
      }
    }
    loadWebpageContent();
  }, []);

  const cms = content || {
    hero_title: "Crafted for Flavors, Branded for Your Memories.",
    hero_subtitle: "From cold-pressed premium hibiscus blends to custom-tailored branding architectures for weddings and milestones. Explore refreshing authenticity made entirely to order.",
    hero_image: "/SPARKLE DRINK Banner.jpg",
    story_title: "A Recipe Born from Pure Authenticity.",
    story_p1: "Sparkle Beverages began with a simple observation: refreshments at celebrations often lacked raw local flavor and personalized soul. Our founders stepped in to change that loop, formulating organic hibiscus, zesty lemonade, and tropical pineapple expressions that taste homemade because they are slow-cooked to perfection.",
    story_p2: "We do not settle for mass-market chemical rules. Every pouch is packed with natural extracts, striking a pristine balance between tartness, crispness, and refreshing energy.",
    team_m1_name: "Chief Executive Founder", "team_m1_role": "Vision & Recipe Formulation", "team_m1_img": "",
    team_m2_name: "Head of Brand Architecture", "team_m2_role": "Custom Label & Event Aesthetics", "team_m2_img": "",
    team_m3_name: "Director of Operations", "team_m3_role": "Logistics & Supply Fulfillment", "team_m3_img": "",
    gallery_1_title: "Signature Flavors", "gallery_1_img": "/SPARKLE DRINK Banner.jpg",
    gallery_2_title: "Michael & Naa Custom Pouch", "gallery_2_img": "/M&N 2.jpg",
    gallery_3_title: "Corporate Gala Catering", "gallery_3_img": "/SPARKLE DRINK Banner.jpg",
    gallery_4_title: "Community Water Donation", "gallery_4_img": "/SPARKLE DRINK Banner.jpg"
  };

  const galleryItems = [
    { id: 1, title: cms.gallery_1_title, src: cms.gallery_1_img, tag: "Products" },
    { id: 2, title: cms.gallery_2_title, src: cms.gallery_2_img, tag: "Weddings" },
    { id: 3, title: cms.gallery_3_title, src: cms.gallery_3_img, tag: "Events" },
    { id: 4, title: cms.gallery_4_title, src: cms.gallery_4_img, tag: "Social Impact" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-stone-800 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* BRAND NAVIGATION HEADER */}
      <nav className="bg-stone-900 text-white py-2 px-6 sticky top-0 z-50 shadow-md flex justify-between items-center h-24">
        <div className="flex items-center h-full">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" className="h-16 sm:h-20 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/shop" className="text-xs font-semibold text-stone-300 hover:text-white transition-colors">Retail Shop</Link>
          <Link href="/custom" className="bg-[#15803D] hover:bg-[#166534] text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> <span>Custom Packages</span>
          </Link>
        </div>
      </nav>

      {/* COVER HERO */}
      <header className="relative bg-stone-950 text-white overflow-hidden py-24 px-4 md:px-8 min-h-[70vh] flex items-center">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
          <img src={cms.hero_image} alt="Cover Banner Graphic" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent z-10" />

        <div className="max-w-4xl mx-auto w-full z-20 space-y-6 relative">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> Premium Organic Refreshments
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-tight max-w-2xl text-white">
            {cms.hero_title}
          </h1>
          <p className="text-stone-300 text-sm md:text-base max-w-xl leading-relaxed font-light">
            {cms.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/shop" className="bg-white hover:bg-stone-100 text-stone-950 text-xs font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <ShoppingBag className="h-4 w-4" /> <span>Order Retail Batches</span> <ChevronRight className="h-4 w-4 text-stone-400" />
            </Link>
            <Link href="/custom" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <Sparkles className="h-4 w-4" /> <span>Explore Custom Event Packages</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* BRAND STORY */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="text-[10px] font-bold tracking-widest text-emerald-600 font-mono uppercase">01 / Our Story</div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-stone-900">{cms.story_title}</h2>
          <div className="space-y-4 text-stone-600 text-xs md:text-sm leading-relaxed font-light">
            <p>{cms.story_p1}</p>
            <p>{cms.story_p2}</p>
          </div>
        </div>
        <div className="relative rounded-[32px] overflow-hidden bg-stone-100 p-8 h-[420px] border border-stone-200 flex items-center justify-center shadow-sm">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Branding Graphic" className="max-h-64 object-contain" />
        </div>
      </section>

      {/* MEDIA GALLERY - TRANSFORMED INTO PORTRAIT (3:4) CONTAINER CONFIGURATIONS */}
      <section className="bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="text-[10px] font-bold tracking-widest text-emerald-400 font-mono uppercase">02 / Media Gallery</div>
            <h2 className="text-3xl font-serif font-black tracking-tight text-white">Sparkle in the Wild</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {galleryItems.map(item => (
              <div key={item.id} className="bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:border-emerald-500/30 shadow-xl">
                
                {/* UPGRADED TO aspect-[3/4] TO NATIVELY MATCH VERTICAL STAND-UP POUCHES EDGE-TO-EDGE */}
                <div className="aspect-[3/4] w-full relative overflow-hidden bg-stone-900 flex items-center justify-center">
                  {item.src ? (
                    <img 
                      src={item.src} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" 
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-900 flex items-center justify-center text-[10px] text-stone-600 font-mono font-bold uppercase">No Asset Uploaded</div>
                  )}
                  <span className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-sm text-emerald-400 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-stone-800 z-10">{item.tag}</span>
                </div>

                <div className="p-4 bg-stone-900/60">
                  <h3 className="font-serif font-bold text-sm text-stone-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP SQUAD */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-12">
        <div className="border-b border-stone-200 pb-4">
          <div className="text-[10px] font-bold tracking-widest text-emerald-600 font-mono uppercase">03 / Leadership</div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-stone-900">Meet Our Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          
          {/* LEADER 1 */}
          <div className="space-y-2 group">
            <div className="aspect-[3/4] w-full bg-stone-200 rounded-2xl overflow-hidden border border-stone-200 shadow-inner flex items-center justify-center">
              {cms.team_m1_img ? (
                <img src={cms.team_m1_img} alt={cms.team_m1_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
              ) : (
                <div className="text-stone-400 font-mono text-[11px] font-bold flex items-center gap-1">👤 Awaiting Portrait</div>
              )}
            </div>
            <h4 className="font-serif font-bold text-base text-stone-900 mt-3">{cms.team_m1_name}</h4>
            <p className="text-xs text-stone-400 font-mono uppercase tracking-wide">{cms.team_m1_role}</p>
          </div>

          {/* LEADER 2 */}
          <div className="space-y-2 group">
            <div className="aspect-[3/4] w-full bg-stone-200 rounded-2xl overflow-hidden border border-stone-200 shadow-inner flex items-center justify-center">
              {cms.team_m2_img ? (
                <img src={cms.team_m2_img} alt={cms.team_m2_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
              ) : (
                <div className="text-stone-400 font-mono text-[11px] font-bold flex items-center gap-1">👤 Awaiting Portrait</div>
              )}
            </div>
            <h4 className="font-serif font-bold text-base text-stone-900 mt-3">{cms.team_m2_name}</h4>
            <p className="text-xs text-stone-400 font-mono uppercase tracking-wide">{cms.team_m2_role}</p>
          </div>

          {/* LEADER 3 */}
          <div className="space-y-2 group">
            <div className="aspect-[3/4] w-full bg-stone-200 rounded-2xl overflow-hidden border border-stone-200 shadow-inner flex items-center justify-center">
              {cms.team_m3_img ? (
                <img src={cms.team_m3_img} alt={cms.team_m3_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
              ) : (
                <div className="text-stone-400 font-mono text-[11px] font-bold flex items-center gap-1">👤 Awaiting Portrait</div>
              )}
            </div>
            <h4 className="font-serif font-bold text-base text-stone-900 mt-3">{cms.team_m3_name}</h4>
            <p className="text-xs text-stone-400 font-mono uppercase tracking-wide">{cms.team_m3_role}</p>
          </div>

        </div>
      </section>

      <footer className="bg-stone-950 text-stone-400 text-center py-8 text-[11px] font-medium border-t border-stone-900">
        © 2026 Sparkle Beverages Ltd. All rights reserved. • Empowering authentic hydration across Ghana.
      </footer>
    </div>
  );
}