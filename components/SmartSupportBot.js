'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, ChevronRight, HelpCircle } from 'lucide-react';

export default function SmartSupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [hasBeenOpened, setHasBeenOpened] = useState(false); 
  const pathname = usePathname(); 

  const WHATSAPP_NUMBER = "233533527192"; 

  const faqs = {
    shop: [
      { id: 1, question: "How long does delivery take?", answer: "We typically deliver within Accra in 24-48 hours. Orders placed before 2 PM often qualify for same-day delivery!" },
      { id: 2, question: "Do you have wholesale pricing?", answer: "Yes! Wholesale pricing automatically applies when you hit the trigger limit (e.g., 50+ units). The price updates automatically in your cart." },
      { id: 3, question: "How do I use an Ambassador Code?", answer: "Click 'Unlock The Drop' at the top of the page, enter your ambassador's code, and click apply. Your VIP discount will calculate instantly." },
      { id: 4, question: "What payment methods do you accept?", answer: "We accept all major Mobile Money networks (MTN, Telecel, AT) and credit/debit cards via our secure Paystack checkout." },
      { id: 5, question: "How long do the drinks stay fresh?", answer: "Keep them refrigerated! Unopened, Hibiscus lasts up to 3 months (6 months frozen), Lemonade lasts 2 months, and Pinezest lasts 1 month. Once opened, please consume within a few days." },
      { id: 6, question: "Can I mix flavors in a single order?", answer: "Absolutely. You can add as many different variants (Sobolo, Lemonade, PineZest) and sizes to your Drop Zone cart as you like before checking out." }
    ],
    custom: [
      { id: 1, question: "How will the customization be done?", answer: "We design a custom label wrap for your pouches featuring your event theme, names, or corporate logo. You will approve the digital proof before we print!" },
      { id: 2, question: "What is the minimum order for custom drops?", answer: "Custom batches require a minimum order of 100 units to cover the dedicated printing and design setup." },
      { id: 3, question: "How far in advance should I book?", answer: "Please book at least 7-10 days before your event to allow time for design revisions, printing, and batch brewing." },
      { id: 4, question: "Can I taste the flavors before booking?", answer: "Definitely. We recommend placing a standard small order through our Shop page to do a tasting session before locking in your event tier!" },
      { id: 5, question: "Do you deliver to the event venue?", answer: "Yes! Just input your venue as the delivery location during checkout. We will coordinate the dispatch timing with your event planners." }
    ],
    referrer: [
      { id: 1, question: "How do I get paid?", answer: "Once your wallet reaches the ₵100.00 GHS minimum, you can request a cashout. Funds are routed directly to your registered Mobile Money (MoMo) account." },
      { id: 2, question: "When does my dashboard update?", answer: "Instantly! The moment a customer pays for an order using your code, the bounty is added to your secure conversion log." },
      { id: 3, question: "How much do I earn per sale?", answer: "Your earnings depend on the specific product and size sold. You can view the exact bounty breakdown for each item in your portal." },
      { id: 4, question: "What if a customer forgets my code?", answer: "Because our system is fully automated, codes must be applied at checkout to trigger the bounty. Remind your network to click 'Unlock The Drop' before they pay!" }
    ]
  };

  let currentFaqs = faqs.shop;
  if (pathname?.includes('/custom')) currentFaqs = faqs.custom;
  if (pathname?.includes('/referrer')) currentFaqs = faqs.referrer;

  const handleToggleBot = () => {
    setIsOpen(!isOpen);
    setHasBeenOpened(true); 
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-[90] font-sans flex flex-col items-end">
      
      {isOpen && (
        <div className="mb-4 w-[320px] bg-white border border-stone-200 rounded-[24px] shadow-2xl overflow-hidden flex flex-col transform origin-bottom-right transition-all">
          <div className="bg-stone-950 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-400" />
              <span className="font-black uppercase tracking-widest text-xs">Sparkle Support</span>
            </div>
            <button onClick={() => { setIsOpen(false); setActiveQuestion(null); }} className="text-stone-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 bg-[#FDFBF7] min-h-[250px] max-h-[350px] overflow-y-auto scrollbar-thin">
            {!activeQuestion ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-500 mb-4">Hi there! How can we help you today?</p>
                {currentFaqs.map((faq) => (
                  <button 
                    key={faq.id}
                    onClick={() => setActiveQuestion(faq)}
                    className="w-full text-left bg-white border border-stone-200 p-3 rounded-xl hover:border-emerald-500 transition-colors flex justify-between items-center group shadow-sm"
                  >
                    <span className="text-xs font-bold text-stone-800 pr-2">{faq.question}</span>
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-emerald-500 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-inner">
                  <h4 className="text-xs font-black text-emerald-900 mb-2 uppercase tracking-wide">{activeQuestion.question}</h4>
                  <p className="text-xs font-bold text-emerald-800/80 leading-relaxed">{activeQuestion.answer}</p>
                </div>
                <button 
                  onClick={() => setActiveQuestion(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 flex items-center gap-1"
                >
                  ← Back to questions
                </button>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-stone-100">
            <p className="text-[10px] text-center font-bold text-stone-400 mb-2 uppercase tracking-widest">Still need help?</p>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hey%20Sparkle!%20I%20need%20some%20help%20from%20the%20${pathname === '/' ? 'home' : pathname}%20page.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageCircle className="h-4 w-4" /> Chat with an Agent
            </a>
          </div>
        </div>
      )}

      {/* 🚨 THE NEW SHAPE-SHIFTING TOGGLE BUTTON */}
      <button 
        onClick={handleToggleBot}
        className={`bg-stone-950 hover:bg-stone-800 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-300 relative ml-auto ${
          isOpen 
            ? 'w-14 h-14' 
            : `px-5 py-3.5 sm:px-6 sm:py-4 ${!hasBeenOpened ? 'animate-bounce' : ''}`
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="flex items-center gap-2 font-black uppercase text-[10px] sm:text-xs tracking-widest whitespace-nowrap">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            <span>Need Help?</span>
          </div>
        )}
      </button>

    </div>
  );
}
