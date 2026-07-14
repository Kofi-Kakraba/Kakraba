'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, ShoppingBag, ChevronRight, UserPlus, Flame } from 'lucide-react';
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

  // UPDATED: High-energy youth/campus fallback copy!
  const cms = content || {
    hero_title: "Premium Taste. Zero Boring.",
    hero_subtitle: "Bold flavors packed in grab-and-go pouches. Whether you're rushing to class, stocking the dorm fridge, or fueling a study session, Sparkle has your back.",
    hero_image: "/SPARKLE DRINK Banner.jpg",
    story_title: "The Sparkle Vibe.",
    story_p1: "We got tired of the same old boring campus drinks. Sparkle was born to bring high-energy, authentic fruit flavors in a pouch that actually keeps up with your lifestyle. Slow-cooked, locally sourced, and packed with real vibes.",
    story_p2: "No mass-market chemical rules here. Just pure, striking balances of tartness and crispness. Grab a pouch, crack the cap, and upgrade your day.",
    team_m1_name: "Chief Executive Founder", "team_m1_role": "Vision & Vibe Architect", "team_m1_img": "",
    team_m2_name: "Head of Brand Architecture", "team_m2_role": "Aesthetics & Culture", "team_m2_img": "",
    team_m3_name: "Director of Operations", "team_m3_role": "Logistics & Drops", "team_m3_img": "",
    gallery_1_title: "Signature Flavors", "gallery_1_img": "/SPARKLE DRINK Banner.jpg",
    gallery_2_title: "Campus Hangouts", "gallery_2_img": "/M&N 2.jpg",
    gallery_3_title: "Study Session Fuel", "gallery_3_img": "/SPARKLE DRINK Banner.jpg",
    gallery_4_title: "Community Impact", "gallery_4_img": "/SPARKLE DRINK Banner.jpg"
  };

  const galleryItems = [
    { id: 1, title: cms.gallery_1_title, src: cms.gallery_1_img, tag: "The Drop" },
    { id: 2, title: cms.gallery_2_title, src: cms.gallery_2_img, tag: "Lifestyle" },
    { id: 3, title: cms.gallery_3_title, src: cms.gallery_3_img, tag: "Events" },
    { id: 4, title: cms.gallery_4_title, src: cms.gallery_4_img, tag: "Culture" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-950 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* MODERN BRIGHT NAVIGATION */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200 text-stone-900 py-2 px-6 sticky top-0 z-50 flex justify-between items-center h-20 shadow-sm">
        <div className="flex items-center h-full">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={180} height={70} className="h-14 sm:h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/referrer" className="text-[11px] font-black uppercase tracking-wide text-emerald-600 hover:text-emerald-500 transition-colors hidden sm:inline-block">Become an Ambassador 🌟</Link>
          <Link href="/shop" className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wide">Shop Now</Link>
          <Link href="/custom" className="bg-stone-950 hover:bg-stone-800 text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-md">
            <Flame className="h-3.5 w-3.5 text-amber-400" /> <span>Custom Drops</span>
          </Link>
        </div>
      </nav>

      {/* HIGH-ENERGY BRIGHT HERO */}
      <header className="relative bg-white text-stone-900 overflow-hidden py-24 px-4 md:px-8 min-h-[85vh] flex items-center border-b border-stone-200">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-multiply">
          <Image 
            src={cms.hero_image} 
            alt="Cover Banner Graphic" 
            width={1920} 
            height={1080} 
            priority
            className="w-full h-full object-cover" 
          />
        </div>
        {/* Bright gradient overlay instead of dark */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-stone-50/90 to-transparent z-10" />

        <div className="max-w-5xl mx-auto w-full z-20 space-y-8 relative">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Zap className="h-3.5 w-3.5 fill-emerald-500" /> The Campus Favorite
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] max-w-3xl text-stone-950 uppercase">
            {cms.hero_title}
          </h1>
          <p className="text-stone-500 text-sm md:text-lg max-w-xl leading-relaxed font-medium">
            {cms.hero_subtitle}
          </p>
          
          {/* POUCH-COLORED ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
            {/* Sobolo Red Button */}
            <Link href="/shop" className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wide px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(225,29,72,0.3)] transition-transform hover:-translate-y-1">
              <ShoppingBag className="h-4 w-4" /> <span>Grab a Pouch</span> <ChevronRight className="h-4 w-4" />
            </Link>
            
            {/* PineZest Green Button */}
            <Link href="/custom" className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wide px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(16,185,129,0.3)] transition-transform hover:-translate-y-1">
              <Flame className="h-4 w-4" /> <span>Event Packages</span> <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Lemonade Yellow Outline Button */}
            <Link href="/referrer" className="bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-200 hover:border-amber-400 text-xs font-black uppercase tracking-wide px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-1">
              <UserPlus className="h-4 w-4 text-amber-500" /> <span>Join the Squad</span>
            </Link>
          </div>
        </div>
      </header>

      {/* BRAND STORY - STREETWEAR MINIMALISM */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="text-[11px] font-black tracking-widest text-emerald-500 uppercase flex items-center gap-2">
            <span className="w-8 h-0.5 bg-emerald-500"></span> 01 / Vibe Check
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-950 uppercase">{cms.story_title}</h2>
          <div className="space-y-6 text-stone-500 text-sm md:text-base leading-relaxed font-medium">
            <p>{cms.story_p1}</p>
            <p className="border-l-4 border-amber-400 pl-4 text-stone-900 font-bold italic">{cms.story_p2}</p>
          </div>
        </div>
        <div className="relative rounded-[40px] overflow-hidden bg-stone-100 p-8 h-[480px] flex items-center justify-center shadow-[inset_0_-2px_20px_rgba(0,0,0,0.05)] border-4 border-white">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Branding Graphic" width={400} height={400} className="max-h-80 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
        </div>
      </section>

      {/* MEDIA GALLERY - HIGH CONTRAST DARK MODE FOR POP */}
      <section className="bg-stone-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-800 pb-8">
            <div className="space-y-3">
              <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase flex items-center gap-2">
                <span className="w-8 h-0.5 bg-emerald-400"></span> 02 / The Gallery
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Sparkle in the Wild</h2>
            </div>
            <Link href="/shop" className="text-xs font-bold text-stone-400 hover:text-white uppercase tracking-widest flex items-center gap-2 pb-2">
              See All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {galleryItems.map(item => (
              <div key={item.id} className="group cursor-pointer">
                <div className="aspect-[4/5] w-full relative overflow-hidden rounded-[32px] bg-stone-900 flex items-center justify-center border-2 border-stone-800 group-hover:border-emerald-500 transition-colors duration-500">
                  {item.src ? (
                    <Image 
                      src={item.src} 
                      alt={item.title} 
                      width={400} 
                      height={500} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-700 font-black uppercase">No Asset Uploaded</div>
                  )}
                  {/* Streetwear style badge */}
                  <span className="absolute top-4 right-4 bg-white text-stone-950 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg z-10 scale-95 group-hover:scale-100 transition-transform">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-black text-sm text-stone-300 group-hover:text-white mt-4 uppercase tracking-wide transition-colors">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP SQUAD - STREETWEAR STYLE */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24 space-y-16">
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <div className="text-[11px] font-black tracking-widest text-emerald-500 uppercase justify-center flex items-center gap-2">
            03 / The Architects
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-950 uppercase">Meet The Squad</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { img: cms.team_m1_img, name: cms.team_m1_name, role: cms.team_m1_role, color: "bg-rose-100", text: "text-rose-600" },
            { img: cms.team_m2_img, name: cms.team_m2_name, role: cms.team_m2_role, color: "bg-amber-100", text: "text-amber-600" },
            { img: cms.team_m3_img, name: cms.team_m3_name, role: cms.team_m3_role, color: "bg-emerald-100", text: "text-emerald-600" },
          ].map((member, idx) => (
            <div key={idx} className="flex flex-col items-center group text-center space-y-4">
              {/* Circular, vibrant portrait frames instead of formal squares */}
              <div className={`w-64 h-64 sm:w-full sm:h-auto sm:aspect-square ${member.color} rounded-full overflow-hidden border-4 border-white shadow-xl flex items-center justify-center p-2 transition-transform duration-500 group-hover:-translate-y-2`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                  {member.img ? (
                    <Image src={member.img} alt={member.name} width={400} height={400} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 font-black uppercase text-[10px] tracking-widest bg-stone-100">
                      <UserPlus className="h-6 w-6 mb-2 opacity-50" />
                      Awaiting Pic
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-black text-lg text-stone-950 uppercase tracking-tight">{member.name}</h4>
                <p className={`text-[10px] font-black uppercase tracking-widest ${member.text} mt-1`}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOLD MINIMALIST FOOTER */}
      <footer className="bg-stone-950 text-white text-center py-12 px-4 border-t-4 border-emerald-500">
        <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={100} height={40} className="mx-auto h-8 object-contain mb-6 opacity-50 hover:opacity-100 transition-opacity" />
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
          © 2026 Sparkle Beverages Ltd. • Fueling Authentic Hustles Across Ghana.
        </p>
      </footer>
    </div>
  );
}