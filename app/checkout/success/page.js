'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Camera, ArrowLeft, Receipt, Loader2, MapPin, Truck, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { verifyAndFinalizeCustomerPaymentAction } from '../../actions/orders';
import { createBrowserSupabaseClient } from '../../../lib/supabaseClient';

function SuccessReceiptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const receiptRef = useRef(null);
  
  const [orderRecord, setOrderRecord] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [verificationError, setVerificationError] = useState(null);
  const [fetching, setFetching] = useState(true);
  
  // Track which format is currently downloading
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const extractedOrderId = searchParams.get('orderId') || searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('order_id') || searchParams.get('id');

  useEffect(() => {
    if (!extractedOrderId) {
      setFetching(false);
      return;
    }
    
    async function executeLivePaystackVerification() {
      const response = await verifyAndFinalizeCustomerPaymentAction(extractedOrderId);
      
      if (response.success && response.data) {
        setOrderRecord(response.data);

        const { data: items } = await supabase
          .from('order_items')
          .select(`
            quantity,
            size,
            unit_price,
            product_variants (
              products ( name )
            )
          `)
          .eq('order_id', extractedOrderId);
          
        setOrderItems(items || []);
      } else {
        setVerificationError(response.error || "Failed to finalize payment processing tokens.");
      }
      setFetching(false);
    }
    executeLivePaystackVerification();
  }, [extractedOrderId, supabase]);

  // 🚨 UPDATED DOWNLOAD ENGINE (Handles both PNG and PDF + bypasses browser blocks)
  const handleDownloadReceipt = async (format) => {
    if (!receiptRef.current) return;
    setDownloadingFormat(format);
    
    try {
      // 1. Take the digital snapshot
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, { 
        scale: 2, 
        backgroundColor: '#1c1917', 
        useCORS: true 
      });
      
      const filePrefix = `Sparkle_Receipt_${extractedOrderId.substring(0,8)}`;

      if (format === 'png') {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `${filePrefix}.png`;
        // 🚨 CRITICAL FIX: Append to body so mobile browsers don't block it!
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      
      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const image = canvas.toDataURL('image/png');
        
        // Match the PDF size exactly to the canvas size
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(image, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${filePrefix}.pdf`);
      }

    } catch (err) {
      console.error(`Failed to download ${format} receipt`, err);
      alert("Something went wrong generating your receipt. Please screenshot the page instead!");
    } finally {
      setDownloadingFormat(null);
    }
  };

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
  const deliveryFee = orderRecord?.metadata?.delivery_fee_charged || 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans py-12 px-4 flex flex-col items-center selection:bg-emerald-500/30">
      <div className="max-w-md w-full space-y-6">
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Payment Confirmed</h1>
          <p className="text-xs text-stone-400 leading-relaxed font-mono px-4">
            Thank you, <strong className="text-emerald-400">{orderRecord?.customer_name || 'Customer'}</strong>. Your payment has been verified. You will receive an SMS confirmation once your order is processed and ready for pickup or en route for delivery.
          </p>
        </div>

        <div 
          ref={receiptRef}
          className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          <div className="bg-[#18181b] border-b border-stone-800 p-6 flex flex-col items-center justify-center text-center">
            <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Beverages Logo" className="h-14 w-auto object-contain brightness-110" />
            <p className="text-[9px] text-stone-500 font-black uppercase tracking-widest mt-3">Official Transaction Receipt</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                <span className="text-stone-500 uppercase font-bold shrink-0">Order Ref:</span>
                <span className="text-emerald-400 font-black break-all sm:text-right">{extractedOrderId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 uppercase font-bold">Date:</span>
                <span className="text-stone-300 font-bold uppercase">{new Date(orderRecord?.created_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 uppercase font-bold">Payment:</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-widest">Paid via Paystack</span>
              </div>
            </div>

            <div className="h-px bg-dashed bg-stone-800 w-full" />

            <div className="space-y-3 font-mono text-xs">
              <div className="text-[10px] text-stone-500 font-black uppercase tracking-widest border-b border-stone-800 pb-2 mb-2">Itemized Drops</div>
              
              {orderItems.map((item, idx) => {
                const productName = item.product_variants?.products?.name || 'Sparkle Drink';
                const lineTotal = item.quantity * item.unit_price;
                return (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-stone-200">{item.quantity}x {productName}</span>
                      <span className="block text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">{item.size}</span>
                    </div>
                    <span className="font-black text-stone-300">₵{lineTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-dashed bg-stone-800 w-full" />

            <div className="space-y-2 font-mono text-xs">
              {deliveryFee > 0 && (
                <div className="flex justify-between items-center text-stone-400">
                  <span className="uppercase font-bold tracking-wide">Delivery Fee</span>
                  <span className="font-bold">₵{Number(deliveryFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-300 uppercase font-black tracking-widest">Total Paid</span>
                <span className="text-xl font-black text-emerald-400">₵{Number(orderRecord?.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="h-px bg-stone-800 w-full" />

            <div className="bg-[#18181b] rounded-xl p-4 space-y-3 font-mono text-xs border border-stone-800">
              <div className="flex items-center gap-2 text-cyan-400 border-b border-stone-800 pb-2 mb-2">
                {isDelivery ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                <span className="font-bold uppercase tracking-wider">{isDelivery ? 'Delivery Logistics' : 'HQ Self-Pickup'}</span>
              </div>
              <div className="space-y-2 text-stone-400">
                <div className="flex justify-between">
                  <span className="font-bold">Client:</span>
                  <span className="text-stone-200 text-right truncate max-w-[150px]">{orderRecord?.customer_name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Phone:</span>
                  <span className="text-stone-200 text-right">{orderRecord?.customer_phone || 'N/A'}</span>
                </div>
                {isDelivery && (
                  <div className="flex justify-between">
                    <span className="font-bold">Location:</span>
                    <span className="text-stone-200 text-right truncate max-w-[150px]">{orderRecord?.landmark || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 🚨 UPDATED DOWNLOAD BUTTONS */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleDownloadReceipt('png')}
              disabled={downloadingFormat !== null}
              className="w-full bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
            >
              {downloadingFormat === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              <span>Save Image</span>
            </button>
            
            <button 
              onClick={() => handleDownloadReceipt('pdf')}
              disabled={downloadingFormat !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
            >
              {downloadingFormat === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span>Save PDF</span>
            </button>
          </div>
          
          <Link 
            href="/shop" 
            className="w-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Storefront Menu</span>
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
