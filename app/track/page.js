'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Package, Truck, CheckCircle2, Clock, AlertCircle, Phone, ArrowLeft, Calendar } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';

export default function TrackOrderPage() {
  const supabase = createBrowserSupabaseClient();

  const [orderRef, setOrderRef] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // 🚨 SMART MAGIC LINK CATCHER
  useEffect(() => {
    // Read the URL directly in the browser
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    const urlPhone = params.get('phone');

    if (urlId && urlPhone) {
      setOrderRef(urlId);
      setPhone(urlPhone);
      // Auto-trigger the search
      triggerSearch(urlId, urlPhone);
    }
  }, []);

  const triggerSearch = async (searchId, searchPhone) => {
    setLoading(true);
    setError(null);
    
    try {
      const cleanPhone = searchPhone.trim();
      const cleanRef = searchId.trim().toLowerCase();

      // 1. Fetch all orders matching the phone number first to bypass UUID strictness
      const { data: userOrders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', cleanPhone);

      if (dbError) throw dbError;

      // 2. Use JavaScript to find the order whose ID starts with the entered short-code
      const matchedOrder = userOrders?.find(order => 
        order.id.toLowerCase().startsWith(cleanRef)
      );

      if (!matchedOrder) {
        setError("Order not found. Please check your Reference ID and Phone Number.");
        setOrderData(null);
      } else {
        setOrderData(matchedOrder);
      }

    } catch (err) {
      setError("Connection error. Please try again.");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderRef && phone) triggerSearch(orderRef, phone);
  };

  // Status map to determine which steps light up
  const statusLevels = {
    'pending_payment': 0,
    'unpaid': 0,
    'cancelled': -1,
    'processing': 1,
    'ready': 2, // For pickups
    'dispatched': 2, // For deliveries
    'completed': 3
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* MINIMAL NAVBAR */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 py-4 px-6 sticky top-0 z-40 flex justify-between items-center h-20 shadow-sm">
        <Link href="/">
          <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={160} height={60} className="h-12 w-auto object-contain" />
        </Link>
        <Link href="/shop" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-16 space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-stone-900 text-emerald-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
            <Search className="h-3 w-3" /> Tracking Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-stone-950">Track Your Drop.</h1>
          <p className="text-sm text-stone-500 font-medium">Enter your details below to see the live status of your batch.</p>
        </div>

        {/* SEARCH FORM */}
        <div className="bg-white border-2 border-stone-200 rounded-[32px] p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none -mt-10 -mr-10" />
          
          <form onSubmit={handleSearch} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 ml-1">Order Reference ID</label>
              <input 
                type="text" 
                required 
                value={orderRef} 
                onChange={(e) => setOrderRef(e.target.value.toUpperCase())} 
                placeholder="e.g. C93C9CC1" 
                className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-emerald-500 rounded-2xl px-4 py-4 outline-none text-stone-950 font-black tracking-widest uppercase transition-colors" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 ml-1">Phone Number Used</label>
              <input 
                type="tel" 
                required 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="e.g. 0547664422" 
                className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-emerald-500 rounded-2xl px-4 py-4 outline-none text-stone-950 font-bold transition-colors" 
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-xs font-bold flex gap-2 items-start">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-stone-950 hover:bg-stone-800 disabled:bg-stone-300 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-2">
              {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>{loading ? 'Locating...' : 'Find My Drop'}</span>
            </button>
          </form>
        </div>

        {/* RESULTS CARD */}
        {orderData && (
          <div className="bg-stone-950 text-white border-4 border-stone-900 rounded-[32px] p-6 md:p-8 shadow-2xl space-y-8 animate-in slide-in-from-bottom-4">
            
            <div className="flex justify-between items-start border-b border-stone-800 pb-4">
              <div>
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest block mb-1">Status Found</span>
                <h3 className="text-xl font-black uppercase tracking-widest">#{orderData.id.substring(0,8)}</h3>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                  orderData.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                  orderData.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {orderData.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* VISUAL STEPPER */}
            {orderData.status !== 'cancelled' ? (
              <div className="relative pt-2">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-800 -translate-y-1/2 rounded-full z-0"></div>
                
                {/* Dynamic Progress Bar Fill */}
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000" 
                  style={{ width: `${(statusLevels[orderData.status] / 3) * 100}%` }}
                ></div>

                <div className="relative z-10 flex justify-between">
                  {/* Step 1: Received */}
                  <div className="flex flex-col items-center gap-2 bg-stone-950">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${statusLevels[orderData.status] >= 0 ? 'bg-emerald-500 border-emerald-500 text-stone-950' : 'bg-stone-900 border-stone-700 text-stone-500'}`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${statusLevels[orderData.status] >= 0 ? 'text-white' : 'text-stone-500'}`}>Received</span>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="flex flex-col items-center gap-2 bg-stone-950">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${statusLevels[orderData.status] >= 1 ? 'bg-emerald-500 border-emerald-500 text-stone-950' : 'bg-stone-900 border-stone-700 text-stone-500'}`}>
                      <Package className="h-4 w-4" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${statusLevels[orderData.status] >= 1 ? 'text-white' : 'text-stone-500'}`}>Processing</span>
                  </div>

                  {/* Step 3: Dispatched/Ready */}
                  <div className="flex flex-col items-center gap-2 bg-stone-950">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${statusLevels[orderData.status] >= 2 ? 'bg-emerald-500 border-emerald-500 text-stone-950' : 'bg-stone-900 border-stone-700 text-stone-500'}`}>
                      {orderData.delivery_type === 'pickup' ? <MapPin className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${statusLevels[orderData.status] >= 2 ? 'text-white' : 'text-stone-500'}`}>
                      {orderData.delivery_type === 'pickup' ? 'Ready' : 'Dispatched'}
                    </span>
                  </div>

                  {/* Step 4: Completed */}
                  <div className="flex flex-col items-center gap-2 bg-stone-950">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${statusLevels[orderData.status] >= 3 ? 'bg-blue-500 border-blue-500 text-stone-950 shadow-[0_0_15px_rgb(59,130,246,0.5)]' : 'bg-stone-900 border-stone-700 text-stone-500'}`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${statusLevels[orderData.status] >= 3 ? 'text-blue-400' : 'text-stone-500'}`}>Delivered</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
                <p className="text-red-400 font-bold text-xs uppercase tracking-widest">Order Cancelled</p>
                <p className="text-[10px] text-stone-400 mt-1">This order was cancelled by the system or administration.</p>
              </div>
            )}

            {/* ORDER METADATA DETAILS */}
            <div className="bg-stone-900 rounded-2xl p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <Clock className="h-3.5 w-3.5 text-stone-500" /> 
                <span>Placed: {new Date(orderData.created_at).toLocaleString('en-GB')}</span>
              </div>
              
              {/* Delivery Details */}
              {orderData.delivery_type === 'pickup' ? (
                <div className="flex items-start gap-2 text-stone-300 border-t border-stone-800 pt-3">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 mt-0.5" /> 
                  <div>
                    <span className="font-bold text-white block mb-0.5">HQ Self-Pickup</span>
                    <span className="text-[10px] text-stone-400 font-sans">Your order will be prepared for pickup at the main Sparkle Depot.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 border-t border-stone-800 pt-3">
                  <div className="flex items-center gap-2 text-stone-300">
                    <Truck className="h-3.5 w-3.5 text-blue-500" /> 
                    <span>Destination: <strong className="text-white">{orderData.landmark}</strong></span>
                  </div>
                  
                  {/* Preferred Delivery Date */}
                  {orderData.metadata && typeof orderData.metadata === 'string' 
                    ? JSON.parse(orderData.metadata).preferred_delivery_date && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Calendar className="h-3.5 w-3.5" /> 
                          <span>Req. Date: <strong>{new Date(JSON.parse(orderData.metadata).preferred_delivery_date).toLocaleDateString('en-GB')}</strong></span>
                        </div>
                      )
                    : orderData.metadata?.preferred_delivery_date && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Calendar className="h-3.5 w-3.5" /> 
                          <span>Req. Date: <strong>{new Date(orderData.metadata.preferred_delivery_date).toLocaleDateString('en-GB')}</strong></span>
                        </div>
                      )
                  }
                </div>
              )}
            </div>

            {/* LIVE RIDER DETAILS (Only shows if dispatched and rider exists) */}
            {orderData.status === 'dispatched' && orderData.delivery_type === 'delivery' && (() => {
              let meta = {};
              try { meta = typeof orderData.metadata === 'string' ? JSON.parse(orderData.metadata) : (orderData.metadata || {}); } catch(e){}
              
              if (meta.rider_name) {
                return (
                  <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-5 space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 border-b border-emerald-900/30 pb-2">
                      <Truck className="h-3 w-3" /> Out For Delivery!
                    </span>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-stone-500 block mb-0.5">Assigned Rider</span>
                        <strong className="text-white">{meta.rider_name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block mb-0.5">Vehicle</span>
                        <strong className="text-stone-300">{meta.vehicle_color} {meta.vehicle_type}</strong>
                      </div>
                      <div className="col-span-2">
                        <a href={`tel:${meta.rider_phone}`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                          <Phone className="h-3.5 w-3.5" /> Call Rider ({meta.rider_phone})
                        </a>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          </div>
        )}
      </main>
    </div>
  );
}