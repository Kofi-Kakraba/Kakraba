'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, ShoppingBag, ChevronRight, ChevronLeft, UserPlus, Flame, Phone, Mail, MessageCircle } from 'lucide-react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export default function BrandWelcomeHomePage() {
  const supabase = createBrowserSupabaseClient();
  const [content, setContent] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState('sobolo');
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
    hero_title: "Chill Sip. Sparkle.",
    hero_subtitle: "Bold fruit flavors packed in grab-and-go spouted pouches. Made for the daily hustle.",
    story_title: "The Sparkle Vibe.",
    story_p1: "We got tired of the same old boring drinks. Sparkle was born to bring high-energy, authentic fruit flavors in a pouch that actually keeps up with your lifestyle. Slow-cooked, locally sourced, and packed with real vibes.",
    story_p2: "No mass-market chemical rules here. Just pure, striking balances of tartness and crispness. Grab a pouch, crack the cap, and upgrade your day.",
    team_m1_name: "Chief Executive Founder", "team_m1_role": "Vision & Vibe Architect", "team_m1_img": "",
    team_m2_name: "Head of Brand Architecture", "team_m2_role": "Aesthetics & Culture", "team_m2_img": "",
    team_m3_name: "Director of Operations", "team_m3_role": "Logistics & Drops", "team_m3_img": "",
    gallery_1_title: "Signature Flavors", "gallery_1_img": "",
    gallery_2_title: "Custom Matrimony Drop", "gallery_2_img": "",
    gallery_3_title: "Executive Gala Service", "gallery_3_img": "",
    gallery_4_title: "The Community Giveback", "gallery_4_img": ""
  };

  const quickProducts = {
    sobolo: {
      name: "Hibiscus Drink (Sobolo)",
      flavor: "Strawberry Twist",
      color: "from-rose-600 to-red-900",
      bgLight: "bg-rose-50",
      accentText: "text-rose-600",
      border: "border-rose-200",
      sizes: [
        { volume: "300ml", slang: "Solo", img: "/sobolo-300.png", height: "h-40" },
        { volume: "500ml", slang: "Gee", img: "/sobolo-500.png", height: "h-52" },
        { volume: "1.5L", slang: "Paddy", img: "/sobolo-1500.png", height: "h-64" },
        { volume: "5L", slang: "Link-Up", img: "/sobolo-5000.png", height: "h-76" }
      ]
    },
    lemonade: {
      name: "Sparkle Lemonade",
      flavor: "Citrus Mint Fusion",
      color: "from-amber-400 to-orange-600",
      bgLight: "bg-amber-50",
      accentText: "text-amber-600",
      border: "border-amber-200",
      sizes: [
        { volume: "300ml", slang: "Solo", img: "/lemonade-300.png", height: "h-40" },
        { volume: "500ml", slang: "Gee", img: "/lemonade-500.png", height: "h-52" },
        { volume: "1.5L", slang: "Paddy", img: "/lemonade-1500.png", height: "h-64" },
        { volume: "5L", slang: "Link-Up", img: "/lemonade-5000.png", height: "h-76" }
      ]
    },
    pinezest: {
      name: "Sparkle PineZest",
      flavor: "Tropical Pineapple Extract",
      color: "from-emerald-400 to-green-700",
      bgLight: "bg-emerald-50",
      accentText: "text-emerald-600",
      border: "border-emerald-200",
      sizes: [
        { volume: "300ml", slang: "Solo", img: "/pinezest-300.png", height: "h-40" },
        { volume: "500ml", slang: "Gee", img: "/pinezest-500.png", height: "h-52" },
        { volume: "1.5L", slang: "Paddy", img: "/pinezest-1500.png", height: "h-64" },
        { volume: "5L", slang: "Link-Up", img: "/pinezest-5000.png", height: "h-76" }
      ]
    }
  };

  const getSmartLink = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('custom') || lower.includes('gala') || lower.includes('service') || lower.includes('event')) {
      return '/custom';
    }
    return '/shop';
  };

  const galleryItems = [
    { id: 1, title: cms.gallery_1_title || "Signature Flavors", src: cms.gallery_1_img, tag: "The Drop" },
    { id: 2, title: cms.gallery_2_title || "Custom Matrimony Drop", src: cms.gallery_2_img, tag: "Lifestyle" },
    { id: 3, title: cms.gallery_3_title || "Executive Gala Service", src: cms.gallery_3_img, tag: "Events" },
    { id: 4, title: cms.gallery_4_title || "The Community Giveback", src: cms.gallery_4_img, tag: "Culture" },
  ];

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

  const activeSize = quickProducts[selectedFlavor].sizes[currentSizeIndex];

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-950 antialiased selection:bg-rose-500 selection:text-white pb-1 relative">
      
      {/* MODERN BRIGHT NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 text-stone-900 py-2 px-6 sticky top-0 z-50 flex justify-between items-center h-20 shadow-sm">
        <div className="flex items-center h-full">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={180} height={70} className="h-14 sm:h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/referrer" className="text-[11px] font-black uppercase tracking-wide text-emerald-600 hover:text-emerald-500 transition-colors hidden sm:inline-block">Become an Ambassador 🌟</Link>
          <Link href="/shop" className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wide">Shop Now</Link>
          <Link href="/custom" className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_4px_15px_rgb(225,29,72,0.3)] hover:-translate-y-0.5">
            <Flame className="h-4 w-4 text-amber-300" /> <span>Custom Drops</span>
          </Link>
        </div>
      </nav>

      {/* 🚀 HERO SECTION WITH FULL-SCREEN LIFESTYLE BACKGROUND */}
      <header className="relative bg-stone-900 overflow-hidden py-12 lg:py-0 min-h-[90vh] flex items-center px-4 md:px-8 border-b-8 border-rose-500">
        
        {/* Background lifestyle image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/sparkle-drinks.png" 
            alt="Sparkle Squad Lifestyle" 
            layout="fill" 
            objectFit="cover" 
            priority
            className="w-full h-full object-cover object-center opacity-90" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 via-stone-900/40 to-stone-900/10 z-10" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-20 relative pt-8 lg:pt-0">
          
          {/* LEFT SIDE: GLASSMORPHISM TEXT CONTAINER */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl border border-white/50 p-8 md:p-12 rounded-[40px] shadow-2xl space-y-6 text-left transform transition-all hover:scale-[1.01]">
            <div className="inline-flex items-center gap-1.5 bg-stone-950 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
              <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Real Fruit. Spouted Pouches.
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[0.95] uppercase">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500">
                Chill Sip.
              </span>
              <br />
              <span className="text-stone-900">Sparkle.</span>
            </h1>
            
            <p className="text-stone-700 text-sm md:text-lg max-w-xl font-bold leading-relaxed">
              {cms.hero_subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/shop" className="bg-stone-950 hover:bg-stone-800 text-white text-xs font-black uppercase tracking-wide px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all">
                <ShoppingBag className="h-4 w-4" /> <span>Order Batches</span> <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/referrer" className="bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-200 text-xs font-black uppercase tracking-wide px-8 py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all">
                <UserPlus className="h-4 w-4 text-emerald-500" /> <span>Ambassador Hub</span>
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: HERO PRODUCT PRESENTATION & CONTROLS */}
          <div className="lg:col-span-5 w-full flex flex-col items-center justify-center relative space-y-4">
            
            {/* FLAVOR SWAPPER MOVED ABOVE THE CARD */}
            <div className="bg-white/80 backdrop-blur-md p-3 rounded-[24px] border border-white/50 shadow-xl flex gap-2 justify-center w-full max-w-sm transform transition-all hover:scale-[1.02]">
              <button onClick={() => handleFlavorChange('sobolo')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedFlavor === 'sobolo' ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white text-stone-800 border-stone-200 hover:border-rose-400 hover:bg-rose-50'}`}>Sobolo 🍓</button>
              <button onClick={() => handleFlavorChange('lemonade')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedFlavor === 'lemonade' ? 'bg-amber-400 border-amber-400 text-stone-950 shadow-md' : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-amber-50'}`}>Lemonade 🍋</button>
              <button onClick={() => handleFlavorChange('pinezest')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedFlavor === 'pinezest' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50'}`}>PineZest 🍍</button>
            </div>

            {/* The Glass Product Card */}
            <div className={`w-full max-w-sm rounded-[40px] ${quickProducts[selectedFlavor].bgLight} border-2 ${quickProducts[selectedFlavor].border} p-6 shadow-2xl transition-all duration-500 flex flex-col justify-between relative overflow-hidden group min-h-[500px]`}>
              
              {/* Size Navigation */}
              <div className="flex justify-center z-10 w-full mb-4">
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-full p-1 shadow-sm">
                  <button onClick={handlePrevSize} className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {/* Styled typography: Bold size + Italic slang */}
                  <span className="min-w-[110px] text-center flex items-center justify-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-stone-900">{activeSize.volume}</span>
                    <span className="text-[11px] font-bold italic tracking-wider text-stone-500">{activeSize.slang}</span>
                  </span>
                  
                  <button onClick={handleNextSize} className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Image with Realistic Floor Shadow & INSTANT LOADING */}
              <div className="h-80 w-full relative flex flex-col items-center justify-end transition-all duration-500 z-10 pb-6">
                <Image 
                  key={activeSize.img} 
                  src={activeSize.img} 
                  alt={`${quickProducts[selectedFlavor].name} ${activeSize.volume}`}
                  width={400}
                  height={400}
                  priority={true}
                  className={`object-contain transition-all duration-500 transform group-hover:-translate-y-2 group-hover:scale-105 z-10 ${activeSize.height}`}
                />
                {/* The "Blue Skies" style detached floor shadow */}
                <div className="w-1/2 h-3 bg-black/40 blur-md rounded-[50%] absolute bottom-2 transition-all duration-500 group-hover:w-2/3 group-hover:opacity-60"></div>
              </div>

              {/* Badges */}
              <div className="bg-white border border-stone-100 p-4 rounded-2xl shadow-sm z-10 space-y-0.5 relative mt-auto">
                <div className={`text-[10px] font-black uppercase tracking-widest ${quickProducts[selectedFlavor].accentText}`}>{quickProducts[selectedFlavor].flavor}</div>
                <h3 className="text-xl font-black text-stone-950 tracking-tight uppercase">{quickProducts[selectedFlavor].name}</h3>
              </div>

              {/* Color Bloom Effect */}
              <div className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${quickProducts[selectedFlavor].color} opacity-20 blur-2xl pointer-events-none`} />
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
        {/* Replaced logo with Banner Image */}
        <div className="relative rounded-[40px] overflow-hidden bg-stone-100 p-2 h-[480px] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200 group">
          <Image src="/SPARKLE DRINK Banner.jpg" alt="Sparkle Branding Graphic" layout="fill" objectFit="cover" className="rounded-[36px] transition-transform duration-700 group-hover:scale-105" />
        </div>
      </section>

      {/* MEDIA GALLERY */}
      <section className="bg-[#111111] text-white py-24 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16">
          <div className="flex flex-col justify-between items-start gap-4 border-b border-stone-800 pb-8">
            <div className="text-[11px] font-black tracking-widest text-rose-500 uppercase flex items-center gap-2">
              <span className="w-8 h-0.5 bg-rose-500"></span> 02 / The Gallery
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Sparkle In The Wild</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {galleryItems.map(item => (
              <Link href={getSmartLink(item.title)} key={item.id} className="group block cursor-pointer">
                {/* Image Card Container */}
                <div className="aspect-[4/5] w-full relative overflow-hidden rounded-[32px] bg-stone-900 mb-4 border-2 border-transparent group-hover:border-rose-500 shadow-lg transition-colors duration-500">
                  {item.src ? (
                    <Image 
                      src={item.src} 
                      alt={item.title} 
                      layout="fill"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-700 font-black uppercase bg-stone-900">
                      No Image Uploaded
                    </div>
                  )}
                  
                  {/* White Tag Pill (Top Right) */}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-md z-10">
                    <span className="text-[10px] font-black text-stone-950 uppercase tracking-widest">
                      {item.tag}
                    </span>
                  </div>
                </div>
                
                {/* Title Text Below Image */}
                <h3 className="text-white font-black uppercase text-xs tracking-widest group-hover:text-rose-500 transition-colors">
                  {item.title}
                </h3>
              </Link>
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
                    <Image src={member.img} alt={member.name} layout="fill" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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

      {/* =========================================
          THE BRAND CONTACT FOOTER
      ========================================= */}
      <footer className="bg-stone-950 text-white border-t-4 border-emerald-500 pt-16 pb-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-stone-900 pb-12 mb-12">
          
          <div className="md:col-span-5 space-y-4 text-left">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={140} height={50} className="h-10 w-auto object-contain brightness-110" />
            <p className="text-stone-400 text-xs font-bold leading-relaxed max-w-sm">
              Crafting premium-grade local fruit infusions wrapped in modern, spouted hustle pouches. Disbursing hydration drops and cultural statements from Accra to the rest of the wild.
            </p>
          </div>

          <div className="md:col-span-4 space-y-4 text-left font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Hit Us Up Directly</h4>
            <div className="space-y-3 text-xs">
              <a href="tel:0533527192" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>+233 533 527 192</span>
              </a>
              <a href="mailto:sparklebeverages@outlook.com" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors truncate">
                <Mail className="h-4 w-4 text-rose-500 shrink-0" />
                <span>sparklebeverages@outlook.com</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4 text-left text-xs font-bold font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Directory Grid</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/shop" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">01 // Shop Storefront</Link>
              <Link href="/custom" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">02 // Book Custom Drops</Link>
              <Link href="/referrer" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">03 // Ambassador Hub</Link>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            © 2026 Sparkle Beverages Ltd. • Fueling Authentic Hustles Across Ghana.
          </p>
          <div className="flex gap-4 text-[9px] font-bold font-mono uppercase tracking-widest text-stone-600">
            <span>Minimum Cashout: ₵100</span>
            <span>•</span>
            <span>10% WHT Compliant</span>
          </div>
        </div>
      </footer>

      {/* =========================================
          PULSING FLOATING WHATSAPP BUTTON
      ========================================= */}
      <a 
        href="https://wa.me/233533527192?text=Hey%20Sparkle!%20I'm%20reaching%20out%20from%20the%20homepage.%20Could%20you%20help%20me%20with%20something?" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 flex items-center justify-center hover:-translate-y-1 group"
        aria-label="Contact Sparkle on WhatsApp"
      >
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-35 group-hover:opacity-0 transition-opacity" />
        <MessageCircle className="h-6 w-6 relative z-10 fill-white text-[#25D366]" />
      </a>

    </div>
  );
}
