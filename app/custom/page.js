'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Send, Phone, Mail, MessageCircle, Flame, CheckCircle } from 'lucide-react';

export default function CustomOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form States
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [estimatedGuestCount, setEstimatedGuestCount] = useState('100');
  const [customRequestDetails, setCustomRequestDetails] = useState('');

  const handleCustomOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Draft a WhatsApp message automatically for the admin
    const textMessage = encodeURIComponent(
      `🚨 *NEW CUSTOM DROP REQUEST* 🚨\n\n` +
      `👤 *Client:* ${clientName}\n` +
      `📞 *Phone:* ${clientPhone}\n` +
      `✉️ *Email:* ${clientEmail}\n` +
      `🎉 *Event Type:* ${eventType}\n` +
      `👥 *Guests:* ${estimatedGuestCount}\n` +
      `📝 *Details:* ${customRequestDetails}`
    );

    // Automatically open WhatsApp to process the inquiry directly
    window.open(`https://wa.me/233533527192?text=${textMessage}`, '_blank');
    
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4">
        <div className="max-w-md bg-white border-2 border-stone-200 rounded-[40px] p-10 text-center shadow-2xl space-y-6">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tight">Request Staged!</h2>
          <p className="text-stone-500 font-bold text-sm leading-relaxed">
            Your custom event inquiry has been packaged. WhatsApp has been launched to connect you directly with a Sparkle Event Specialist.
          </p>
          <Link href="/" className="inline-block bg-stone-950 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all text-xs">
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-950 antialiased selection:bg-rose-500 selection:text-white relative">
      
      {/* NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 text-stone-900 py-2 px-6 sticky top-0 z-50 flex justify-between items-center h-20 shadow-sm">
        <div className="flex items-center h-full">
          <Link href="/">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={180} height={70} className="h-14 sm:h-16 w-auto object-contain cursor-pointer" />
          </Link>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wide flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </div>
      </nav>

      {/* HERO / EXPLANATORY HEADER */}
      <div className="bg-stone-950 text-white py-20 px-6 text-center border-b-8 border-rose-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
            <Flame className="h-3 w-3" /> Special Events
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">Custom Sparkle Drops</h1>
          <p className="text-stone-400 text-sm md:text-base font-bold max-w-xl mx-auto leading-relaxed">
            Planning a wedding, corporate gala, or festival? Customize your pouch labels, flavors, and branding colors to make your event truly unforgettable.
          </p>
        </div>
      </div>

      {/* INQUIRY FORM SECTION */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border-2 border-stone-200 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Configure Your Drop</h2>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">Fill out the parameters to draft your custom quote</p>
          </div>

          <form onSubmit={handleCustomOrderSubmit} className="space-y-6 text-left text-xs font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Your Full Name</label>
                <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Michael Mensah" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
              </div>
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Phone Number</label>
                <input type="tel" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="e.g. 0540000000" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Email Address</label>
                <input type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="name@domain.com" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
              </div>
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Event Category</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer">
                  <option value="Wedding">Matrimony / Wedding</option>
                  <option value="Corporate Gala">Corporate Gala Catering</option>
                  <option value="Community Water">Community Water Donation</option>
                  <option value="Other Festival">Concert / Private Festival</option>
                </select>
              </div>
              <div>
                <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Estimated Guest Count</label>
                <input type="number" required value={estimatedGuestCount} onChange={(e) => setEstimatedGuestCount(e.target.value)} placeholder="e.g. 150" className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-stone-500 uppercase font-black text-[10px] mb-2 tracking-widest">Custom Requests & Branding Guidelines</label>
              <textarea rows="4" value={customRequestDetails} onChange={(e) => setCustomRequestDetails(e.target.value)} placeholder="Describe your custom labels, flavor ideas, or packaging specs..." className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3 text-stone-900 font-bold outline-none focus:border-rose-500 transition-colors resize-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40 transition-all shadow-lg hover:-translate-y-0.5">
              <span>{loading ? 'Processing Drop Parameters...' : 'Submit Custom Request via WhatsApp'}</span> <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>

      {/* =========================================
          THE BRAND CONTACT FOOTER
      ========================================= */}
      <footer className="bg-stone-950 text-white border-t-4 border-emerald-500 pt-16 pb-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-stone-900 pb-12 mb-12">
          
          <div className="md:col-span-5 space-y-4 text-left">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={140} height={50} className="h-10 w-auto object-contain brightness-110" />
            <p className="text-stone-400 text-xs font-bold leading-relaxed max-w-sm font-sans">
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
              <Link href="/" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">01 // Shop Storefront</Link>
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
        href="https://wa.me/233533527192?text=Hey%20Sparkle!%20I'm%20reaching%20out%20from%20the%2520website.%20Could%20you%20help%20me%20with%20something?" 
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