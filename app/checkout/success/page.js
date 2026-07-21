'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Camera, ArrowLeft, Receipt, Loader2, MapPin, Truck } from 'lucide-react';
import { verifyAndFinalizeCustomerPaymentAction } from '../../actions/orders';

function SuccessReceiptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [orderRecord, setOrderRecord] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Catch all possible variations of the order ID from the URL
  const extractedOrderId = searchParams.get('orderId') || searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('order_id') || searchParams.get('id');

  useEffect(() => {
    if (!extractedOrderId) {
      setFetching(false);
      return;
    }
    
    async function executeLivePaystackVerification() {
      // Calls the server action to verify payment, update the DB status, and send the SMS
      const response = await verifyAndFinalizeCustomerPaymentAction(extractedOrderId);
      
      if (response.success && response.data) {
        setOrderRecord(response.data);
      } else {
        setVerificationError(response.error || "Failed to finalize payment processing tokens.");
      }
      setFetching(false);
    }
    executeLivePaystackVerification();
  }, [extractedOrderId]);

  if (fetching) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4 font-mono">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-stone-400 text-xs uppercase tracking-widest">Verifying & Generating Receipt...</p>
      </div>
    );
  }

  if (verificationError || !extractedOrderId) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 font-mono text-center space-y-4">
        <Receipt className="h-12 w-12 text-stone-700" />
        <h1 className="text-red-400 font-bold text-lg">Verification Incomplete</h1>
        <p className="text-stone-400 text-xs max-w-md">
          {verificationError || "Missing standard URL transaction parameter tokens. Return to storefront."}
        </p>
        <button onClick={() => router.push('/shop')} className="mt-4 px-6 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800">
          Return to Shop
        </button>
      </div>
    );
  }

  const isDelivery = orderRecord?.delivery_type === 'delivery';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans py-12 px-4 flex justify-center selection:bg-emerald-500/30">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Area */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Payment Confirmed</h1>
          <p className="text-xs text-stone-400 leading-relaxed font-mono px-4">
            Thank you, <strong className="text-emerald-400">{orderRecord?.customer_name || 'Customer'}</strong>. Your payment has been verified and a confirmation SMS has been sent.
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
            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                <span className="text-stone-500 uppercase font-bold shrink-0">Order Reference:</span>
                <span className="text-emerald-400 font-black break-all sm:text-right">{extractedOrderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 uppercase font-bold">Order Status:</span>
                <span className="text-stone-300 font-bold uppercase">{orderRecord?.status || 'Processing'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 uppercase font-bold">Payment Status:</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">Paid via MoMo</span>
              </div>
            </div>

            <div className="h-px bg-dashed bg-stone-800 w-full" />

            {/* Financial Totals */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-300 uppercase font-black tracking-widest">Total Paid</span>
                <span className="text-lg font-black text-emerald-400">₵{Number(orderRecord?.total_amount || 0).toFixed(2)}</span>
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
                  <span className="text-stone-200 text-right">{orderRecord?.customer_name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Phone:</span>
                  <span className="text-stone-200 text-right">{orderRecord?.customer_phone || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 text-center">
          <Link 
            href="/shop" 
            className="text-stone-500 hover:text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Storefront Menu
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <SuccessReceiptContent />
    </Suspense>
  );
}
