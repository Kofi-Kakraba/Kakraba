'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronRight, ChevronLeft, Phone, Mail } from 'lucide-react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import Navbar from '../components/Navbar'; 
import SmartSupportBot from '../components/SmartSupportBot'; 

const carouselSlides = [
  {
    id: 'sobolo',
    videoSrc: '/videos/sobolo.mp4', 
    title: 'THE ORIGINAL.',
    subtitle: 'Classic Strawberry Hibiscus',
    buttonColor: 'bg-rose-600 hover:bg-rose-500 shadow-[0_8px_30px_rgb(225,29,72,0.4)]'
  },
  {
    id: 'lemonade',
    videoSrc: '/videos/lemonade.mp4',
    title: 'THE ZEST.',
    subtitle: 'Fresh Citrus Lemonade',
    buttonColor: 'bg-amber-500 hover:bg-amber-400 shadow-[0_8px_30px_rgb(245,158,11,0.4)]'
  },
  {
    id: 'pinezest',
    videoSrc: '/videos/pinezest.mp4',
    title: 'THE TROPIC.',
    subtitle: 'Premium Pinezest Fusion',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_8px_30px_rgb(5,150,105,0.4)]'
  }
];

export default function BrandWelcomeHomePage() {
  const supabase = createBrowserSupabaseClient();
  const [content, setContent] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadWebpageContent() {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'homepage').single();
      if (data?.content) {
        setContent(data.content);
      }
    }
    loadWebpageContent();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
    }, 6000); 
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));

  // Left the team fields in the CMS payload so your Admin panel doesn't throw a missing field error,
  // but they are no longer rendered on the frontend.
  const cms = content || {
    story_title: "The Sparkle Vibe.",
    story_p1: "We got tired of the same old boring drinks. Sparkle was born to bring high-energy, authentic fruit flavors in a pouch that actually keeps up with your lifestyle. Slow-cooked, locally sourced, and packed with real vibes.",
    story_p2: "No mass-market chemical rules here. Just pure, striking balances of tartness and crispness. Grab a pouch, crack the cap, and upgrade your day.",
    team_m1_name: "Chief Executive Founder", team_m1_role: "Vision & Vibe Architect", team_m1_img: "",
    team_m2_name: "Head of Brand Architecture", team_m2_role: "Aesthetics & Culture", team_m2_img: "",
    team_m3_name: "Director of Operations", team_m3_role: "Logistics & Drops", team_m3_img: "",
    gallery_1_title: "Signature Flavors", gallery_1_img: "",
    gallery_2_title: "Custom Matrimony Drop", gallery_2_img: "",
    gallery_3_title: "Executive Gala Service", gallery_3_img: "",
    gallery_4_title: "The Community Giveback", gallery_4_img: "",
    story_img: "" 
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

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-950 antialiased selection:bg-rose-500 selection:text-white pb-1 relative">
      <Navbar />

      <section className="relative w-full h-[75vh] md:h-[85vh] bg-stone-950 overflow-hidden">
        {carouselSlides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          >
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={slide.videoSrc} type="video/mp4" />
            </video>

            <div className="absolute inset-0 flex flex-col justify-end pb-20 px-6 md:px-12 max-w-7xl mx-auto text-left">
              <div className="animate-in slide-in-from-bottom-8 duration-700">
                <div className="inline-block bg-white text-stone-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl">
                  {slide.subtitle}
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase text-white mb-6 leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                  {slide.title}
                </h1>
                
                <Link href={`/shop?focus=${slide.id}`}>
                  <button className={`${slide.buttonColor} text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 group drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]`}>
                    Shop The Drop <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-6 right-6 z-20 flex gap-2">
          <button onClick={prevSlide} className="bg-white/10 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition-all drop-shadow-md"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={nextSlide} className="bg-white/10 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition-all drop-shadow-md"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 mt-24 mb-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-stone-950">
            CHILL. SIP. <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">SPARKLE.</span>
          </h2>
          <p className="text-stone-500 font-medium max-w-xl mx-auto text-sm">
            From cold-pressed premium hibiscus blends to custom-tailored branding architectures. Explore refreshing authenticity made entirely to order.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/shop?focus=sobolo" className="group relative rounded-[40px] overflow-hidden bg-stone-100 h-96 shadow-xl hover:-translate-y-2 transition-transform duration-500">
            <Image src="/Sparkle 500ml high-def ad.jpeg" alt="Sobolo" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-white font-black uppercase text-2xl tracking-tighter">Sobolo</h3>
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-1">Shop Original</p>
            </div>
          </Link>

          <Link href="/shop?focus=lemonade" className="group relative rounded-[40px] overflow-hidden bg-stone-100 h-96 shadow-xl hover:-translate-y-2 transition-transform duration-500">
            <Image src="/lemonade 500ml 2.jpeg" alt="Lemonade" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-white font-black uppercase text-2xl tracking-tighter">Lemonade</h3>
              <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mt-1">Shop Citrus</p>
            </div>
          </Link>

          <Link href="/shop?focus=pinezest" className="group relative rounded-[40px] overflow-hidden bg-stone-100 h-96 shadow-xl hover:-translate-y-2 transition-transform duration-500">
            <Image src="/pinezest.jpeg" alt="Pinezest" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-8">
              <h3 className="text-white font-black uppercase text-2xl tracking-tighter">Pinezest</h3>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">Shop Tropic</p>
            </div>
          </Link>
        </div>
      </section>

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
        
        <div className="relative rounded-[40px] overflow-hidden bg-stone-100 p-2 h-[480px] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200 group">
          <Image 
            src={cms.story_img || "/SPARKLE DRINK Banner.jpg"} 
            alt="Sparkle Branding Graphic" 
            layout="fill" 
            objectFit="cover" 
            className="rounded-[36px] transition-transform duration-700 group-hover:scale-105" 
          />
        </div>
      </section>

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
                <div className="aspect-[4/5] w-full relative overflow-hidden rounded-[32px] bg-stone-900 mb-4 border-2 border-transparent group-hover:border-rose-500 shadow-lg transition-colors duration-500">
                  {item.src ? (
                    <Image src={item.src} alt={item.title} layout="fill" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-700 font-black uppercase bg-stone-900">
                      No Image Uploaded
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-md z-10">
                    <span className="text-[10px] font-black text-stone-950 uppercase tracking-widest">{item.tag}</span>
                  </div>
                </div>
                
                <h3 className="text-white font-black uppercase text-xs tracking-widest group-hover:text-rose-500 transition-colors">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
              <a href="mailto:info@sparklebeverages.com" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors truncate">
                <Mail className="h-4 w-4 text-rose-500 shrink-0" />
                <span>info@sparklebeverages.com</span>
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

      <SmartSupportBot />

    </div>
  );
}
