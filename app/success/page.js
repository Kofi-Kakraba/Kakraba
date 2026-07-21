'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { CheckCircle2, Package, MapPin, Truck, Camera, ArrowLeft, Receipt } from 'lucide-react';

function SuccessReceiptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Paystack redirects with a 'reference' in the URL. We can also catch 'order_id' if passed manually.
    const reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('order_id');

    if (!reference) {
      setError("No order reference found in the URL.");
      setLoading(false);
      return;
    }

    async function fetchOrderDetails() {
      try {
        // Find the order using either the paystack reference or the order ID
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .or(`id.eq.${reference},metadata->>paystack_reference.eq.${reference}`)
          .single();

        if (orderError || !orderData) throw new Error("Could not locate order details.");

        setOrder(orderData);

        // Fetch the line items for the receipt
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderData.id);

        if (!itemsError && itemsData) {
          setOrderItems(itemsData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [searchParams, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4 font-mono">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-400 text-xs uppercase tracking-widest">Generating Digital Receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 font-mono text-center space-y-4">
        <Receipt className="h-12 w-12 text-stone-700" />
        <h1 className="text-red-400 font-bold text-lg">Receipt Unresolvable</h1>
        <p className="text-stone-400 text-xs max-w-md">{error || "We couldn't load this receipt, but if your payment went through, your order is in our system."}</p>
        <button onClick={() => router.push('/shop')} className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800">
          Return to Shop
        </button>
      </div>
    );
  }

  const isDelivery = order.delivery_type === 'delivery';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans py-12 px-4 flex justify-center selection:bg-emerald-500/30">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Area */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Payment Secured</h1>
          <p className="text-xs text-stone-400 leading-relaxed font-mono px-4">
            We are preparing your batch. You will receive an SMS to <strong className="text-emerald-400">{order.customer_phone}</strong> as soon as your order is dispatched/ready for pickup.
          </p>
        </div>

        {/* Screenshot Advisory */}
        <div className="bg-blue-950/20 border border-blue-900/30 p-3 rounded-xl flex items-center justify-center gap-2 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
          <Camera className="h-4 w-4" />
          <span>Please screenshot this receipt for your records</span>
        </div>

        {/* Digital Receipt Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Brand Header */}
          <div className="bg-stone-955 border-b border-stone-800 p-6 flex flex-col items-center text-center space-y-1.5">
            <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Beverages Logo" className="h-14 w-auto object-contain brightness-110 mb-2" />
            <h2 className="font-black text-lg text-white uppercase tracking-widest">Sparkle Beverages</h2>
            <p className="text-[10px] font-mono text-stone-500">Chill. Sip. Sparkle.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Meta */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-start">
                <span className="text-stone-500 uppercase font-bold">Order Reference:</span>
                <span className="text-emerald-400 font-black text-right break-all ml-4">{order.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 uppercase font-bold">Date Placed:</span>
                <span className="text-stone-300 font-bold">{new Date(order.created_at).toLocaleString('en-GH')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 uppercase font-bold">Payment Status:</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">Paid via MoMo</span>
              </div>
            </div>

            <div className="h-px bg-dashed bg-stone-800 w-full" />

            {/* Itemized Cart */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Items Purchased</span>
              {orderItems.length === 0 ? (
                <div className="text-stone-400 italic">Custom Cart Batch Loaded</div>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 font-bold">{item.quantity}x</span>
                        <span className="text-stone-200 font-bold uppercase">{item.name || 'Sparkle Drink'} <span className="text-stone-500 text-[10px]">({item.size || 'Standard'})</span></span>
                      </div>
                      <span className="text-stone-300 font-bold">₵{(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-dashed bg-stone-800 w-full" />

            {/* Financial Totals */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-stone-400">
                <span>Subtotal</span>
                <span>₵{(order.total_amount - (order.metadata?.delivery_fee || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>Delivery/Handling Fee</span>
                <span>₵{Number(order.metadata?.delivery_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-300 uppercase font-black tracking-widest">Total Paid</span>
                <span className="text-lg font-black text-emerald-400">₵{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="h-px bg-stone-800 w-full" />

            {/* Logistics Footer */}
            <div className="bg-stone-955 rounded-xl p-4 space-y-3 font-mono text-xs border border-stone-800">
              <div className="flex items-center gap-2 text-cyan-400 border-b border-stone-800 pb-2 mb-2">
                {isDelivery ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                <span className="font-bold uppercase tracking-wider">{isDelivery ? 'Delivery Logistics' : 'HQ Self-Pickup'}</span>
              </div>
              <div className="space-y-1 text-stone-400">
                <div className="flex justify-between">
                  <span className="font-bold">Client:</span>
                  <span className="text-stone-200 text-right">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Destination:</span>
                  <span className="text-stone-200 text-right">{order.landmark || 'Sparkle Fulfillment Center'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 text-center">
          <button 
            onClick={() => router.push('/shop')} 
            className="text-stone-500 hover:text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Storefront
          </button>
        </div>

      </div>
    </div>
  );
}

// Wrap the content in a Suspense boundary as required by Next.js App Router for useSearchParams
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SuccessReceiptContent />
    </Suspense>
  );
}
