'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, ShoppingBag, ChevronRight, ChevronLeft, UserPlus, Flame } from 'lucide-react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export default function BrandWelcomeHomePage() {
  const supabase = createBrowserSupabaseClient();
  const [content, setContent] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState('sobolo');
  
  // NEW: State to control the interactive size slider
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);

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
    hero_title: "Premium Taste. Zero Boring.",
    hero_subtitle: "Bold fruit flavors packed in grab-and-go spouted pouches. Made for the daily hustle.",
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

  // FIXED: Added %20 to replace spaces so the browser can read the images properly
  const quickProducts = {
    sobolo: {
      name: "Hibiscus Drink (Sobolo)",
      flavor: "Strawberry Twist",
      color: "from-rose-600 to-red-900",
      bgLight: "bg-rose-50",
      accentText: "text-rose-600",
      border: "border-rose-200",
      image: "/Hibiscus%20Drink%20500ml%20No%20Background.jpg", 
      sizes: ["300ml Mini", "500ml Midi"]
    },
    lemonade: {
      name: "Sparkle Lemonade",
      flavor: "Citrus Mint Fusion",
      color: "from-amber-400 to-orange-600",
      bgLight: "bg-amber-50",
      accentText: "text-amber-600",
      border: "border-amber-200",
      image: "/Lemonade%20500ml%20No%20Background.jpg", 
      sizes: ["300ml", "500ml", "1.5L Handle", "5L Party"]
    },
    pinezest: {
      name: "Sparkle PineZest",
      flavor: "Tropical Pineapple Extract",
      color: "from-emerald-400 to-green-700",
      bgLight: "bg-emerald-50",
      accentText: "text-emerald-600",
      border: "border-emerald-200",
      image: "/PineZest%20500ml%20No%20Background.jpg", 
      sizes: ["300ml", "500ml", "1.5L", "5L Max"]
    }
  };

  const galleryItems = [
    { id: 1, title: cms.gallery_1_title, src: cms.gallery_1_img, tag: "The Drop" },
    { id: 2, title: cms.gallery_2_title, src: cms.gallery_2_img, tag: "Lifestyle" },
    { id: 3, title: cms.gallery_3_title, src: cms.gallery_3_img, tag: "Events" },
    { id: 4, title: cms.gallery_4_title, src: cms.gallery_4_img, tag: "Culture" },
  ];

  // Reset the size slider back to the first size whenever the user clicks a new flavor
  const handleFlavorChange = (flavorKey) => {
    setSelectedFlavor(flavorKey);
    setCurrentSizeIndex(0);
  };

  const handleNextSize = () => {
    setCurrentSizeIndex((prev) => 
      prev < quickProducts[selectedFlavor].sizes.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevSize = () => {
    setCurrentSizeIndex((prev) => 
      prev > 0 ? prev - 1 : quickProducts[selectedFlavor].sizes.length - 1
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-950 antialiased selection:bg-rose-500 selection:text-white">
      
      {/* MODERN BRIGHT NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 text-stone-900 py-2 px-6 sticky top-0 z-50 flex justify-between items-center h-20 shadow-sm">
        <div className="flex items-center h-full">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={180} height={70} className="h-14 sm:h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/referrer" className="text-[11px] font-black uppercase tracking-wide text-emerald-600 hover:text-emerald-500 transition-colors hidden sm:inline-block">Become an Ambassador 🌟</Link>
          <Link href="/shop" className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wide">Shop Now</Link>
          
          {/* FIXED: Vibrant, unmissable Custom Drops button using brand colors */}
          <Link href="/custom" className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_4px_15px_rgb(225,29,72,0.3)] hover:-translate-y-0.5">
            <Flame className="h-4 w-4 text-amber-300" /> <span>Custom Drops</span>
          </Link>
        </div>
      </nav>

      {/* 🚀 HERO SECTION */}
      <header className="relative bg-[#FDFBF7] text-stone-900 overflow-hidden py-12 lg:py-0 min-h-[90vh] flex items-center border-b border-stone-200 px-4 md:px-8">
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-multiply">
          <Image 
            src={cms.hero_image} 
            alt="Cover Banner Graphic" 
            width={1920} 
            height={1080} 
            priority
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent z-10" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-20 relative">
          
          {/* LEFT SIDE: BRAND ACTION COMPONENT */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
              <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Real Fruit. Spouted Pouches.
            </div>
            
            {/* BRAND COLORS: Vibrant gradient injected into the text! */}
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.95] uppercase">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500">
                Premium Taste.
              </span>
              <br />
              <span className="text-stone-900">Zero Boring.</span>
            </h1>
            
            <p className="text-stone-500 text-sm md:text-lg max-w-xl font-medium leading-relaxed">
              {cms.hero_subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/shop" className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-black uppercase tracking-wide px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all">
                <ShoppingBag className="h-4 w-4" /> <span>Order Batches</span> <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/referrer" className="bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-200 text-xs font-black uppercase tracking-wide px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all">
                <UserPlus className="h-4 w-4 text-emerald-500" /> <span>Ambassador Hub</span>
              </Link>
            </div>

            <div className="pt-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">Tap to Switch Flavor Showcase:</span>
              <div className="flex gap-2">
                <button onClick={() => handleFlavorChange('sobolo')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${selectedFlavor === 'sobolo' ? 'bg-rose-600 border-rose-600 text-white shadow-md scale-102' : 'bg-white text-stone-600 border-stone-200 hover:border-rose-300'}`}>Sobolo 🍓</button>
                <button onClick={() => handleFlavorChange('lemonade')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${selectedFlavor === 'lemonade' ? 'bg-amber-400 border-amber-400 text-stone-950 shadow-md scale-102' : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'}`}>Lemonade 🍋</button>
                <button onClick={() => handleFlavorChange('pinezest')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${selectedFlavor === 'pinezest' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-102' : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300'}`}>PineZest 🍍</button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: HERO PRODUCT PRESENTATION */}
          <div className="lg:col-span-5 w-full flex flex-col items-center justify-center relative">
            <div className={`w-full max-w-sm rounded-[40px] ${quickProducts[selectedFlavor].bgLight} border-2 ${quickProducts[selectedFlavor].border} p-6 space-y-6 shadow-xl transition-all duration-500 flex flex-col justify-between relative overflow-hidden group min-h-[55vh]`}>
              
              {/* NEW: Interactive Size Arrow Slider */}
              <div className="flex justify-center z-10 w-full">
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-full p-1 shadow-sm">
                  <button onClick={handlePrevSize} className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-800 min-w-[90px] text-center">
                    {quickProducts[selectedFlavor].sizes[currentSizeIndex]}
                  </span>
                  <button onClick={handleNextSize} className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Center Pouch Graphic */}
              <div className="h-64 w-full relative flex items-center justify-center transition-all duration-500 transform group-hover:scale-105 z-10">
                <img 
                  src={quickProducts[selectedFlavor].image} 
                  alt={quickProducts[selectedFlavor].name}
                  className="h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.2)]"
                />
              </div>

              {/* Text Badge Info Container */}
              <div className="bg-white border border-stone-100 p-4 rounded-2xl shadow-sm z-10 space-y-0.5 relative">
                <div className={`text-[10px] font-black uppercase tracking-widest ${quickProducts[selectedFlavor].accentText}`}>{quickProducts[selectedFlavor].flavor}</div>
                <h3 className="text-xl font-black text-stone-950 tracking-tight uppercase">{quickProducts[selectedFlavor].name}</h3>
              </div>

              {/* Decorative dynamic background blast circle */}
              <div className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${quickProducts[selectedFlavor].color} opacity-15 blur-2xl pointer-events-none`} />
            </div>
          </div>

        </div>
      </header>

      {/* BRAND STORY */}
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
        <div className="relative rounded-[40px] overflow-hidden bg-white p-8 h-[480px] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Branding Graphic" width={400} height={400} className="max-h-80 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
        </div>
      </section>

      {/* MEDIA GALLERY */}
      <section className="bg-stone-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-800 pb-8">
            <div className="space-y-3">
              <div className="text-[11px] font-black tracking-widest text-rose-500 uppercase flex items-center gap-2">
                <span className="w-8 h-0.5 bg-rose-500"></span> 02 / The Gallery
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
                <div className="aspect-[4/5] w-full relative overflow-hidden rounded-[32px] bg-stone-900 flex items-center justify-center border-2 border-stone-800 group-hover:border-amber-400 transition-colors duration-500">
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

      {/* LEADERSHIP SQUAD */}
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

      {/* FOOTER */}
      <footer className="bg-stone-950 text-white text-center py-12 px-4 border-t-4 border-emerald-500">
        <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={100} height={40} className="mx-auto h-8 object-contain mb-6 opacity-50 hover:opacity-100 transition-opacity" />
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
          © 2026 Sparkle Beverages Ltd. • Fueling Authentic Hustles Across Ghana.
        </p>
      </footer>
    </div>
  );
}