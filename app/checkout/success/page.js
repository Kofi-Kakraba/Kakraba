'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, Receipt, Loader2, MapPin, Truck, Download, FileText, Image as ImageIcon } from 'lucide-react';
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

  const handleDownloadReceipt = async (format) => {
    if (!receiptRef.current) return;
    setDownloadingFormat(format);
    
    try {
      const htmlToImage = await import('html-to-image');
      
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { 
        pixelRatio: 3, 
        backgroundColor: '#ffffff', 
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          boxShadow: 'none',
          borderRadius: '0px',
          border: 'none'
        }
      });
      
      const filePrefix = `Sparkle_Receipt_${extractedOrderId.substring(0,8)}`;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${filePrefix}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      
      if (format === 'pdf') {
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default?.jsPDF || jsPDFModule.default;

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [img.width / 3, img.height / 3] 
        });
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 3, img.height / 3);
        pdf.save(`${filePrefix}.pdf`);
      }

    } catch (err) {
      console.error(`Failed to download ${format} receipt`, err);
      alert(`Generation Error: ${err.message || err}\n\nPlease screenshot the page instead!`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center space-y-4 font-mono text-stone-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-stone-400 text-xs uppercase tracking-widest font-black">Verifying & Generating Receipt...</p>
      </div>
    );
  }

  if (verificationError || !extractedOrderId) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 font-mono text-center space-y-4 text-stone-900">
        <Receipt className="h-12 w-12 text-stone-300" />
        <h1 className="text-red-500 font-black text-xl uppercase tracking-widest">Verification Incomplete</h1>
        <p className="text-stone-500 text-xs max-w-md font-bold leading-relaxed">
          {verificationError || "Missing standard URL transaction parameter tokens. Return to storefront."}
        </p>
        <button onClick={() => router.push('/shop')} className="mt-4 px-8 py-3 bg-stone-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-xl">
          Return to Shop
        </button>
      </div>
    );
  }

  const isDelivery = orderRecord?.delivery_type === 'delivery';
  const deliveryFee = orderRecord?.metadata?.delivery_fee_charged || 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans py-12 px-4 flex flex-col items-center selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* Decorative Brand Background Blurs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Header Area */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-200 mb-2 shadow-inner">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-stone-950">Payment Confirmed</h1>
          <p className="text-xs text-stone-500 leading-relaxed font-bold px-4">
            Thank you, <strong className="text-emerald-600">{orderRecord?.customer_name || 'Customer'}</strong>. Your payment is secure. You will receive an SMS confirmation once your batch is processed and ready for the drop.
          </p>
        </div>

        {/* 🚨 THE RECEIPT CARD (Styled to match the brand) */}
        <div 
          ref={receiptRef}
          className="bg-white border-2 border-stone-200 rounded-[40px] overflow-hidden shadow-2xl relative text-stone-950"
        >
          {/* Receipt Header */}
          <div className="bg-stone-50 border-b-2 border-dashed border-stone-200 p-8 flex flex-col items-center justify-center text-center">
            <img src="/SPARKLE%20BEV.%20LOGO%20A%20No%20BG.png" crossOrigin="anonymous" alt="Sparkle Beverages Logo" className="h-10 w-auto object-contain brightness-0 opacity-80" />
            <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest mt-4">Official Transaction Receipt</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Order Meta */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1">
                <span className="text-stone-400 uppercase font-bold shrink-0">Order Ref:</span>
                <span className="font-black break-all text-stone-900 sm:text-right">{extractedOrderId.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 uppercase font-bold">Date:</span>
                <span className="font-bold uppercase text-stone-900">{new Date(orderRecord?.created_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 uppercase font-bold">Payment:</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase tracking-widest">Paid / Gateway</span>
              </div>
            </div>

            <div className="h-px bg-dashed bg-stone-200 w-full" />

            {/* Itemized Cart Breakdown */}
            <div className="space-y-4 font-mono text-xs">
              <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Itemized Drops</div>
              
              {orderItems.map((item, idx) => {
                const productName = item.product_variants?.products?.name || 'Sparkle Drink';
                const lineTotal = item.quantity * item.unit_price;
                return (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-stone-950">{item.quantity}x {productName}</span>
                      <span className="block text-[9px] text-stone-500 uppercase tracking-widest mt-0.5">{item.size}</span>
                    </div>
                    <span className="font-black text-stone-950">₵{lineTotal.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-dashed bg-stone-200 w-full" />

            {/* Financial Totals */}
            <div className="space-y-2 font-mono text-xs">
              {deliveryFee > 0 && (
                <div className="flex justify-between items-center text-stone-500">
                  <span className="uppercase font-bold tracking-wide">Delivery Fee</span>
                  <span className="font-bold text-stone-900">₵{Number(deliveryFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3">
                <span className="text-stone-400 uppercase font-black tracking-widest">Total Paid</span>
                <span className="text-2xl font-black text-emerald-600">₵{Number(orderRecord?.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="h-px bg-stone-200 w-full" />

            {/* Logistics Footer */}
            <div className="bg-stone-50 rounded-2xl p-5 space-y-3 font-mono text-xs border border-stone-200">
              <div className="flex items-center gap-2 text-stone-950 border-b border-stone-200 pb-3 mb-3">
                {isDelivery ? <Truck className="h-4 w-4 text-emerald-500" /> : <MapPin className="h-4 w-4 text-rose-500" />}
                <span className="font-black uppercase tracking-widest">{isDelivery ? 'Delivery Logistics' : 'HQ Self-Pickup'}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-stone-400">Client:</span>
                  <span className="font-bold text-stone-900 text-right truncate max-w-[150px]">{orderRecord?.customer_name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-stone-400">Phone:</span>
                  <span className="font-bold text-stone-900 text-right">{orderRecord?.customer_phone || 'N/A'}</span>
                </div>
                {isDelivery && (
                  <div className="flex justify-between">
                    <span className="font-bold text-stone-400">Location:</span>
                    <span className="font-bold text-stone-900 text-right truncate max-w-[150px]">{orderRecord?.landmark || 'N/A'}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 w-full">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleDownloadReceipt('png')}
              disabled={downloadingFormat !== null}
              className="w-full bg-stone-950 hover:bg-stone-800 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
            >
              {downloadingFormat === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              <span>Save Image</span>
            </button>
            
            <button 
              onClick={() => handleDownloadReceipt('pdf')}
              disabled={downloadingFormat !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_30px_rgb(5,150,105,0.3)] flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
            >
              {downloadingFormat === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span>Save PDF</span>
            </button>
          </div>
          
          <Link 
            href="/shop" 
            className="w-full bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-200 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest mt-4"
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
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <SuccessReceiptContent />
    </Suspense>
  );
}
