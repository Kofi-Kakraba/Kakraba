'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { verifyAndFinalizeCustomerPaymentAction } from '../../actions/orders';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [orderRecord, setOrderRecord] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [fetching, setFetching] = useState(true);

  const extractedOrderId = searchParams.get('orderId') || searchParams.get('order') || searchParams.get('id');

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
      <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border shadow-xl space-y-4 mx-auto font-mono text-xs text-stone-500">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
        <p className="font-bold">Verifying payment with Paystack...</p>
        <p className="text-[10px] text-stone-400 font-light">Please do not close this window or refresh the page.</p>
      </div>
    );
  }

  if (verificationError || !extractedOrderId) {
    return (
      <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border shadow-xl space-y-4 mx-auto">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="font-serif font-black text-lg uppercase text-stone-900 tracking-tight">Verification Incomplete</h3>
        <p className="text-xs text-stone-500 font-light leading-relaxed">
          {verificationError || "Missing standard URL transaction parameter tokens. Return to menu workspace lines below."}
        </p>
        <Link href="/shop" className="w-full bg-stone-900 text-white font-mono text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1">Return to Storefront <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[36px] p-6 md:p-8 max-w-md w-full text-center border border-stone-200/60 shadow-2xl space-y-6 mx-auto">
      <div className="space-y-2">
        <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100 shadow-inner">
          <CheckCircle2 className="h-9 w-9 fill-emerald-600/10" />
        </div>
        <h2 className="text-2xl font-serif font-black uppercase text-emerald-950 tracking-tight mt-3">Payment Confirmed!</h2>
        <p className="text-xs text-stone-500 font-light leading-relaxed">
          Thank you, <strong className="text-stone-800 font-bold">{orderRecord?.customer_name || 'Customer'}</strong>. Your payment has been verified, your order status is active, and a confirmation message has been sent via SMS.
        </p>
      </div>

      <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 text-left font-mono text-xs space-y-3 text-stone-500 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:justify-between border-b border-stone-200/40 pb-2 gap-1">
          <span className="text-[10px] text-stone-400 uppercase shrink-0">Transaction ID:</span>
          {/* Replaced truncate with break-all to show the full ID */}
          <strong className="text-stone-900 font-bold break-all sm:text-right">{extractedOrderId}</strong>
        </div>
        <div className="flex justify-between items-center"><span className="text-[10px] text-stone-400 uppercase">Order Status:</span><strong className="text-emerald-600 uppercase font-bold">{orderRecord?.status || 'processing'}</strong></div>
        <div className="flex justify-between items-center border-t border-stone-200/40 pt-2 text-stone-800 font-bold"><span>Total Paid Amount:</span><strong className="text-emerald-700 text-sm font-black">₵{Number(orderRecord?.total_amount || 0).toFixed(2)}</strong></div>
      </div>

      <Link href="/shop" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-serif font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all uppercase tracking-wide">
        <ShoppingBag className="h-4 w-4" /> <span>Back to Storefront Menu</span>
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans antialiased flex flex-col justify-between">
      <header className="bg-stone-950 border-b border-stone-900 py-4 px-6 flex justify-between items-center shadow-lg">
        <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" className="h-10 object-contain" />
        <Link href="/shop" className="text-[10px] font-mono font-bold text-stone-400 hover:text-white flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Back to Storefront</Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <Suspense fallback={
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            <p className="text-xs text-stone-400 font-mono">Loading App Context...</p>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>

      <footer className="text-center py-6 text-[11px] text-stone-400 font-medium border-t border-stone-200 bg-stone-50">
        © 2026 Sparkle Beverages Ltd. All rights reserved.
      </footer>
    </div>
  );
}
