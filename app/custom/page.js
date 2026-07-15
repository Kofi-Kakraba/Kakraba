'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, CheckCircle2, ArrowRight, Flame, 
  Crown, Star, HeartHandshake, Info, MessageCircle, ArrowLeft, Phone, Mail
} from 'lucide-react';

export default function CustomDropsPage() {

  const packages = [
    {
      id: "bronze",
      name: "Bronze Package",
      tagline: "Perfect for intimate gatherings, small birthdays, and private celebrations.",
      minOrder: 100,
      hlPrice: "10.00",
      pzPrice: "12.00",
      theme: { bg: "bg-white", border: "border-stone-200", text: "text-stone-900", accent: "text-stone-500", badge: "bg-stone-100 text-stone-600" },
      icon: <HeartHandshake className="h-6 w-6 text-stone-400" />,
      features: [
        "Personalised event label (names, date, details)",
        "1 pack of branded water bottles (12 bottles)",
        "Choice of Hibiscus, Lemonade, or PineZest",
        "Standard Sparkle recipe"
      ]
    },
    {
      id: "silver",
      name: "Silver Package",
      tagline: "Ideal for traditional engagements, corporate networking sessions, and milestone celebrations.",
      minOrder: 200,
      hlPrice: "9.50",
      pzPrice: "11.50",
      theme: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-900", accent: "text-slate-500", badge: "bg-slate-200 text-slate-700" },
      icon: <Sparkles className="h-6 w-6 text-slate-500" />,
      features: [
        "Personalised event label (names, date, details)",
        "2 packs of branded water bottles (24 bottles)",
        "Choice of Hibiscus, Lemonade, or PineZest",
        "Custom branding on label design"
      ]
    },
    {
      id: "gold",
      name: "Gold Package",
      isPopular: true,
      tagline: "Tailored for large weddings, multi-day conferences, and high-profile corporate events.",
      minOrder: 300,
      hlPrice: "9.00",
      pzPrice: "11.00",
      theme: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-950", accent: "text-amber-600", badge: "bg-amber-200 text-amber-800" },
      icon: <Star className="h-6 w-6 text-amber-500" />,
      features: [
        "Personalised event label (names, date, details)",
        "3 packs of branded water bottles (36 bottles)",
        "Choice of Hibiscus, Lemonade, PineZest, or Dates Hibiscus",
        "Premium custom label design",
        "Mixed flavour orders available"
      ]
    },
    {
      id: "platinum",
      name: "Platinum Package",
      tagline: "Our ultimate tier for mega-weddings, large festivals, and high-volume corporate retreats.",
      minOrder: 400,
      hlPrice: "8.50",
      pzPrice: "10.50",
      theme: { bg: "bg-stone-950", border: "border-stone-800", text: "text-white", accent: "text-stone-400", badge: "bg-stone-800 text-stone-300" },
      icon: <Crown className="h-6 w-6 text-rose-500" />,
      features: [
        "Personalised event label (names, date, details)",
        "4 packs of branded water bottles (48 bottles)",
        "Full range available (incl. Dates Hibiscus)",
        "Premium custom label design",
        "Mixed flavour orders available",
        "Dedicated event coordinator contact",
        "Custom MOQ options available for massive orders"
      ]
    }
  ];

  // Unified WhatsApp Number
  const whatsappNumber = "233533527192"; 
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hey!%20I'm%20interested%20in%20booking%20a%20Custom%20Sparkle%20Drop%20for%20my%20event.`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 antialiased font-sans pb-1 selection:bg-rose-500 selection:text-white relative">
      
      {/* BRAND NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 py-3 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center h-20">
        <div className="flex items-center h-full">
          <Link href="/">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={220} height={90} className="h-16 sm:h-20 w-auto object-contain cursor-pointer" priority />
          </Link>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/shop" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Store</span>
          </Link>

          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-full hover:bg-rose-700 transition-all shadow-xl group"
          >
            <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black tracking-widest uppercase">Chat Now</span>
          </a>
        </div>
      </nav>

      {/* HEADER */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          <Flame className="h-3.5 w-3.5" /> Event Exclusives
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-stone-950 leading-[0.95]">
          Make Your Event <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Unforgettable.</span>
        </h1>
        <p className="text-stone-500 text-sm md:text-base font-bold max-w-2xl mx-auto leading-relaxed">
          Custom branded beverages for weddings, corporate events, and special occasions across Ghana. Every package includes personalised labels featuring your event details and complimentary branded water packs.
        </p>
      </header>

      {/* GALLERY: EMOTION BEFORE LOGIC */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[250px]">
          {/* Main Hero Shot (Kept as cover because it's a lifestyle photo) */}
          <div className="md:col-span-8 md:row-span-2 relative rounded-[32px] overflow-hidden group shadow-xl bg-white">
            <Image src="/finidi-wedding.jpg" alt="Finidi Wedding Custom Sparkle Pouches" layout="fill" objectFit="cover" className="transition-transform duration-700 group-hover:scale-105" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/30">The Finidi Wedding</span>
            </div>
          </div>
          
          {/* Supporting Shots (Changed to contain with white backgrounds to show full product) */}
          <div className="md:col-span-4 md:row-span-1 relative rounded-[32px] overflow-hidden group shadow-md hidden md:block bg-white">
            <Image src="/rev-osai-1.jpg" alt="Rev Osai Retirement Custom Pouch" layout="fill" objectFit="contain" className="transition-transform duration-700 group-hover:scale-105 p-2" />
          </div>
          <div className="md:col-span-4 md:row-span-1 relative rounded-[32px] overflow-hidden group shadow-md hidden md:block bg-white">
            <Image src="/rev-osai-2.jpg" alt="Rev Osai Retirement Details" layout="fill" objectFit="contain" className="transition-transform duration-700 group-hover:scale-105 p-2" />
          </div>
          <div className="md:col-span-6 md:row-span-1 relative rounded-[32px] overflow-hidden group shadow-md bg-white">
            <Image src="/water-1.jpg" alt="Custom Branded Water" layout="fill" objectFit="contain" className="transition-transform duration-700 group-hover:scale-105 p-2" />
            <div className="absolute bottom-4 left-4 z-10">
              <span className="bg-stone-950/50 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Branded Water Included</span>
            </div>
          </div>
          <div className="md:col-span-6 md:row-span-1 relative rounded-[32px] overflow-hidden group shadow-md bg-white">
            <Image src="/water-2.jpg" alt="Custom Branded Water Close Up" layout="fill" objectFit="contain" className="transition-transform duration-700 group-hover:scale-105 p-2" />
          </div>
        </div>
      </section>

      {/* PRODUCTION PACKAGES */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-stone-200 flex-1" />
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-stone-900">Select Your Tier</h2>
          <div className="h-px bg-stone-200 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`relative flex flex-col justify-between border-2 rounded-[40px] p-8 transition-all duration-300 hover:-translate-y-2 shadow-xl ${pkg.theme.bg} ${pkg.theme.border}`}>
              
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10">
                  <Flame className="h-3 w-3" /> Most Requested
                </div>
              )}

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${pkg.theme.badge}`}>
                    {pkg.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${pkg.theme.accent}`}>Min. {pkg.minOrder}</span>
                </div>

                <div>
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${pkg.theme.text}`}>{pkg.name}</h3>
                  <p className={`text-xs mt-2 font-medium leading-relaxed ${pkg.theme.accent}`}>{pkg.tagline}</p>
                </div>

                {/* Pricing Block */}
                <div className={`p-4 rounded-[24px] space-y-2 border ${pkg.id === 'platinum' ? 'bg-stone-900 border-stone-800' : 'bg-white/50 border-white'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${pkg.theme.accent}`}>Hibiscus/Lemonade</span>
                    <span className={`text-sm font-black ${pkg.theme.text}`}>GH₵{pkg.hlPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${pkg.theme.accent}`}>PineZest</span>
                    <span className={`text-sm font-black ${pkg.theme.text}`}>GH₵{pkg.pzPrice}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 pt-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-bold">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${pkg.id === 'platinum' ? 'text-rose-500' : pkg.isPopular ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span className={pkg.id === 'platinum' ? 'text-stone-300' : 'text-stone-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING NOTE */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 pb-20 text-center">
        <div className="bg-stone-100/50 border border-stone-200 p-6 rounded-[32px] flex flex-col items-center gap-3 text-stone-500 text-xs font-bold leading-relaxed">
          <Info className="h-5 w-5 text-stone-400" />
          <p>
            PineZest carries a small premium reflecting the cost of fresh pineapple. All prices are per 300ml pouch. Higher tiers offer a lower per-unit rate — the more you order, the more you save.
          </p>
        </div>
      </section>

      {/* THE SINGLE MASTER CTA */}
      <section className="max-w-xl mx-auto px-4 md:px-8 text-center pb-24">
        <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 mb-6">Ready to Lock It In?</h2>
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-5 rounded-[24px] text-sm font-black uppercase tracking-widest shadow-[0_8px_30px_rgb(16,185,129,0.3)] transition-transform hover:-translate-y-1"
        >
          <MessageCircle className="h-6 w-6" /> Talk to our Event Planners
        </a>
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-4">Average response time: Under 10 minutes</p>
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
        href="https://wa.me/233533527192?text=Hey%20Sparkle!%20I'm%20reaching%20out%20from%20the%20custom%20orders%20page.%20Could%20you%20help%20me%20with%20something?" 
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