'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Wallet, History, RefreshCw, Package, Search, Printer, X, Sparkles, ArrowLeft, User } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../../lib/supabaseClient';

export default function AmbassadorDashboardPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [partnerProfile, setPartnerProfile] = useState(null);
  const [payoutLogs, setPayoutLogs] = useState([]);
  const [salesPipeline, setSalesPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const [customWithdrawInput, setCustomWithdrawInput] = useState('');
  const [selectedReceiptTicket, setSelectedReceiptTicket] = useState(null);

  const [auditSearchText, setAuditSearchText] = useState('');
  const [sizeFilterText, setSizeFilterText] = useState('all');

  useEffect(() => {
    async function verifySessionAndLoadMetrics() {
      const storedCode = localStorage.getItem('SPARKLE_AMBASSADOR_CODE');
      
      if (!storedCode) {
        router.push('/referrer');
        return;
      }

      const { data: profile, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', storedCode.toUpperCase())
        .maybeSingle();

      if (error || !profile) {
        localStorage.removeItem('SPARKLE_AMBASSADOR_CODE');
        router.push('/referrer');
        return; 
      }

      setPartnerProfile(profile);

      const { data: tickets } = await supabase
        .from('cashouts')
        .select('*')
        .eq('referral_code_id', profile.id)
        .order('created_at', { ascending: false });

      setPayoutLogs(tickets || []);

      const { data: allPaidOrders } = await supabase
        .from('orders')
        .select('id, customer_name, total_amount, created_at, metadata')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (allPaidOrders && allPaidOrders.length > 0) {
        const targetCodeString = profile.code.trim().toUpperCase();

        const matchedOrders = allPaidOrders.filter(order => {
          const m = order.metadata;
          if (!m) return false;
          
          const extractedCode = String(
            m.applied_code || m.code || m.referral_code || m.promo_code || m.discount_code || m.promo || ''
          ).trim().toUpperCase();
          
          return extractedCode === targetCodeString;
        });

        if (matchedOrders.length > 0) {
          const orderIds = matchedOrders.map(o => o.id);
          
          const { data: rawLines } = await supabase
            .from('order_items')
            .select('order_id, quantity, size, variant_id')
            .in('order_id', orderIds);

          const { data: products } = await supabase.from('products').select('id, name');
          const { data: variants } = await supabase.from('product_variants').select('id, product_id');

          const calculatedPipeline = matchedOrders.map(order => {
            const itemLines = rawLines?.filter(l => l.order_id === order.id) || [];
            
            const summaryText = itemLines.map(l => {
              let flavName = "Juice Pouch";
              const vMatch = variants?.find(v => v.id === l.variant_id);
              const pMatch = products?.find(p => p.id === vMatch?.product_id);
              if (pMatch) flavName = pMatch.name;
              return `${l.quantity}x ${flavName} (${l.size || '500ml'})`;
            }).join(', ');
            
            return {
              id: order.id,
              customerName: order.customer_name,
              initials: order.customer_name.substring(0, 2).toUpperCase(),
              date: new Date(order.created_at).toLocaleDateString('en-GH'),
              itemsSummary: summaryText || 'Sparkle Assorted Selection',
              rawSizesArray: itemLines.map(l => (l.size || '').toLowerCase()), 
              bountyEarned: parseFloat(order.metadata?.calculated_payout_amount) || (1.00 * itemLines.reduce((acc, curr) => acc + (curr.quantity || 0), 0))
            };
          });

          setSalesPipeline(calculatedPipeline);
        }
      }

      setLoading(false);
    }
    verifySessionAndLoadMetrics();
  }, []);

  const grossRequestAmount = parseFloat(customWithdrawInput) || 0;
  const liveTaxDeduction = grossRequestAmount * 0.10;
  const paystackGatewayFee = grossRequestAmount > 0 ? 2.50 : 0.00; 
  const liveNetPayoutEstimation = Math.max(0, grossRequestAmount - liveTaxDeduction - paystackGatewayFee);

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const availableBalance = Number(partnerProfile?.total_earnings || 0);

    if (isNaN(grossRequestAmount) || grossRequestAmount < 100) {
      alert("Withdrawal Denied:\n\nMinimum cashout amount is ₵100.00.");
      return;
    }

    if (grossRequestAmount > availableBalance) {
      alert(`Withdrawal Denied:\n\nInsufficient funds. Your wallet balance is ₵${availableBalance.toFixed(2)}.`);
      return;
    }

    if (!confirm(`Confirm Mobile Money Cashout?\n\nGross Request: ₵${grossRequestAmount.toFixed(2)}\n10% WHT Tax: ₵${liveTaxDeduction.toFixed(2)}\nGateway Fee: ₵${paystackGatewayFee.toFixed(2)}\nNet Received: ₵${liveNetPayoutEstimation.toFixed(2)}`)) return;

    setWithdrawing(true);

    try {
      const { error: ticketError } = await supabase
        .from('cashouts')
        .insert([{
          referral_code_id: partnerProfile.id,
          gross_amount: grossRequestAmount,
          wht_deducted: liveTaxDeduction,
          net_payout: liveNetPayoutEstimation,
          status: 'pending'
        }]);

      if (ticketError) throw ticketError;

      await supabase
        .from('referral_codes')
        .update({ total_earnings: availableBalance - grossRequestAmount })
        .eq('id', partnerProfile.id);

      alert("Cashout request dispatched! Sent to pending administrative approvals queue.");
      window.location.reload();
    } catch (err) {
      alert(`Transaction aborted: ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSignOutSession = () => {
    localStorage.removeItem('SPARKLE_AMBASSADOR_CODE');
    router.push('/referrer');
  };

  const filteredAuditSalesLog = salesPipeline.filter(sale => {
    const matchesSearch = auditSearchText.trim() === '' || 
      sale.customerName.toLowerCase().includes(auditSearchText.toLowerCase()) ||
      sale.id.toLowerCase().includes(auditSearchText.toLowerCase()) ||
      sale.itemsSummary.toLowerCase().includes(auditSearchText.toLowerCase());

    const matchesSize = sizeFilterText === 'all' || 
      sale.rawSizesArray.includes(sizeFilterText.toLowerCase());

    return matchesSearch && matchesSize;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center font-black text-xs uppercase tracking-widest text-stone-400 gap-4">
        <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
        <span>Syncing Ledger...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans antialiased pb-12 relative selection:bg-emerald-500 selection:text-white">
      
      {/* BRAND NAVIGATION WITH HOME LINK */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 py-3 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center h-20">
        <div className="flex items-center gap-4 h-full">
          <Link href="/">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={180} height={70} className="h-14 sm:h-16 w-auto object-contain cursor-pointer hover:scale-105 transition-transform" priority />
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full hidden sm:inline-flex border border-stone-200 shadow-sm">
            Backstage Access
          </span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Storefront</span>
          </Link>
          
          <button onClick={handleSignOutSession} className="text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-950 flex items-center gap-1.5 bg-white border border-stone-200 hover:border-stone-400 px-4 py-2.5 rounded-full transition-all shadow-sm">
            <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        
        <header className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-stone-950">
            Welcome Back, <span className="text-emerald-600">{partnerProfile?.legal_name?.split(' ')[0] || 'Partner'}</span>.
          </h1>
          <p className="text-stone-500 font-bold">Track your conversions and manage your drops.</p>
        </header>

        {/* UPPER SUMMARY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PROFILE CARD */}
          <div className="bg-white border-2 border-stone-200 rounded-[40px] p-8 shadow-xl lg:col-span-1 flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-stone-100 rounded-full blur-3xl opacity-50 pointer-events-none -mr-10 -mt-10" />
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black flex items-center gap-1.5"><User className="h-3 w-3" /> Ambassador Profile</span>
              <h2 className="text-2xl font-black text-stone-950 uppercase tracking-tight truncate pt-2">{partnerProfile?.legal_name || 'Ambassador'}</h2>
              <span className="text-xs text-emerald-600 font-black uppercase tracking-wider block">ID: #{partnerProfile?.code || '----'}</span>
            </div>
            <div className="bg-[#FDFBF7] border border-stone-200 p-4 rounded-2xl text-[11px] font-bold space-y-2 relative z-10 text-stone-600 uppercase tracking-wide mt-6">
              <div className="flex justify-between items-center"><span>Payout Route:</span><strong className="text-stone-950">{partnerProfile?.momo_number || 'None'}</strong></div>
              <div className="flex justify-between items-center"><span>Network:</span><strong className="text-stone-950">{partnerProfile?.momo_network || 'MTN'}</strong></div>
            </div>
          </div>

          {/* DYNAMIC WALLET & WITHDRAWAL CARD */}
          <div className="bg-white border-2 border-stone-200 rounded-[40px] p-8 shadow-xl lg:col-span-2 relative overflow-hidden">
            
            {/* HIGH-VISIBILITY WALLET */}
            <div className="mb-6 p-6 bg-stone-950 rounded-[24px] shadow-2xl relative overflow-hidden text-white">
              <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 pointer-events-none -mr-20 -mt-20" />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500/20 pointer-events-none hidden sm:block">
                <Wallet className="h-24 w-24" />
              </div>
              
              <div className="relative z-10">
                <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Available Balance
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black tracking-tighter">
                    ₵{Number(partnerProfile?.total_earnings || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase font-black tracking-widest">GHS</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleRequestWithdrawal} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3 flex flex-col justify-end">
                <label className="text-[10px] text-stone-500 uppercase font-black tracking-widest block">Amount to cashout (GHS)</label>
                <input type="number" required min="100" step="0.01" max={partnerProfile?.total_earnings || 0} placeholder="Minimum ₵100.00..." value={customWithdrawInput} onChange={(e) => setCustomWithdrawInput(e.target.value)} className="w-full bg-[#FDFBF7] border-2 border-stone-200 rounded-2xl px-4 py-3.5 text-stone-900 font-black outline-none focus:border-emerald-500 transition-colors placeholder:text-stone-300" />
                <button type="submit" disabled={withdrawing || grossRequestAmount < 100} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-center transition-all uppercase text-xs tracking-widest disabled:opacity-30 shadow-[0_8px_30px_rgb(16,185,129,0.3)] disabled:shadow-none mt-auto">
                  Request Funds
                </button>
              </div>

              <div className="bg-[#FDFBF7] rounded-[24px] border border-stone-200 p-5 space-y-2 text-stone-500 text-xs font-bold shadow-inner">
                <span className="text-[10px] text-stone-400 uppercase font-black block tracking-widest border-b border-stone-200 pb-2 mb-3">Audit Breakdown Preview</span>
                <div className="flex justify-between items-center"><span>Gross Request:</span><span className="text-stone-900 font-black">₵{grossRequestAmount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-rose-500"><span>10% WHT Tax Cut:</span><span>-₵{liveTaxDeduction.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-stone-400"><span>Gateway API Fee:</span><span>-₵{paystackGatewayFee.toFixed(2)}</span></div>
                <div className="flex justify-between items-center border-t border-stone-200 pt-3 mt-2 font-black text-emerald-600 text-sm uppercase tracking-wide"><span>Net Disbursal:</span><span>₵{liveNetPayoutEstimation.toFixed(2)}</span></div>
              </div>
            </form>
          </div>
        </div>

        {/* BOTTOM GRIDS: SALES LOG & WITHDRAWAL HISTORY */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* DYNAMIC SALES PIPELINE */}
          <div className="xl:col-span-2 bg-white border-2 border-stone-200 rounded-[40px] p-6 sm:p-8 shadow-xl">
            <div className="border-b border-stone-100 pb-5 space-y-4 mb-4">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2"><Package className="h-4 w-4 text-emerald-500" /> Conversion Log</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input type="text" value={auditSearchText} onChange={(e) => setAuditSearchText(e.target.value)} placeholder="Search by Client name, ID..." className="w-full bg-[#FDFBF7] border border-stone-200 rounded-2xl pl-11 pr-4 py-3 text-stone-900 font-bold text-xs outline-none focus:border-emerald-500 placeholder:text-stone-400" />
                </div>
                <div className="relative">
                  <select value={sizeFilterText} onChange={(e) => setSizeFilterText(e.target.value)} className="w-full bg-[#FDFBF7] border border-stone-200 rounded-2xl px-4 py-3 text-stone-600 font-bold text-xs outline-none cursor-pointer focus:border-emerald-500 uppercase tracking-wide">
                    <option value="all">All Sizes</option>
                    <option value="300ml">300ml Pack</option>
                    <option value="500ml">500ml Pack</option>
                    <option value="1.5L">1.5L Bottles</option>
                    <option value="5L">5L Carboys</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredAuditSalesLog.length === 0 ? (
              <div className="text-center py-16 text-stone-400 font-bold text-sm uppercase tracking-widest bg-stone-50 rounded-[24px]">No conversions found.</div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredAuditSalesLog.map((sale) => (
                  <div key={sale.id} className="bg-[#FDFBF7] p-4 rounded-[24px] border border-stone-200 flex justify-between items-center gap-4 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white border border-stone-200 text-stone-900 font-black flex items-center justify-center rounded-xl uppercase text-xs shadow-sm shrink-0">{sale.initials}</div>
                      <div>
                        <div className="font-black text-stone-900 text-sm leading-tight uppercase flex flex-wrap items-center gap-2">
                          <span>{sale.customerName}</span>
                          <span className="text-[9px] bg-stone-200/50 px-2 py-0.5 rounded-full text-stone-500">#{sale.id.substring(0,8)}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 font-bold">{sale.itemsSummary}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-600 font-black text-lg block tracking-tight">+₵{Number(sale.bountyEarned).toFixed(2)}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mt-0.5">{sale.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WITHDRAWAL HISTORY */}
          <div className="bg-white border-2 border-stone-200 rounded-[40px] p-6 sm:p-8 shadow-xl xl:col-span-1">
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2 border-b border-stone-100 pb-5 mb-4"><History className="h-4 w-4 text-stone-400" /> Withdrawals</h3>
            {payoutLogs.length === 0 ? (
              <div className="text-center py-12 text-stone-400 font-bold text-xs uppercase tracking-widest bg-stone-50 rounded-[24px]">No cashouts yet.</div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                {payoutLogs.map((ticket) => {
                  const isReadyForSlipReceipt = ticket.status === 'completed' || ticket.status === 'approved';
                  return (
                    <div key={ticket.id} className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 flex justify-between items-center gap-2">
                      <div>
                        <div className="font-black text-stone-900 text-sm tracking-tight">₵{Number(ticket.net_payout).toFixed(2)} Net</div>
                        <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest block mt-0.5">Gross: ₵{Number(ticket.gross_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border shadow-sm text-center ${ticket.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                          {ticket.status}
                        </span>
                        {isReadyForSlipReceipt && (
                          <button type="button" onClick={() => setSelectedReceiptTicket(ticket)} className="text-[9px] text-stone-500 hover:text-stone-950 flex items-center gap-1 font-black uppercase tracking-widest bg-white px-2 py-1 rounded border border-stone-200 shadow-sm transition-colors">
                            <Printer className="h-3 w-3" /> Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* RECEIPT MODAL OVERLAY */}
      {selectedReceiptTicket && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-[40px] max-w-sm w-full p-8 space-y-6 shadow-2xl relative font-sans text-center border border-stone-200">
            <button type="button" onClick={() => setSelectedReceiptTicket(null)} className="absolute right-6 top-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"><X className="h-4 w-4" /></button>
            
            <div className="space-y-2 text-center pt-2">
              <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Logo" width={120} height={50} className="h-12 mx-auto object-contain" />
              <h2 className="text-sm font-black uppercase text-stone-950 tracking-widest pt-2">Disbursal Manifest</h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Fulfillment Settlement Handshake</p>
            </div>

            <div className="border-y-2 border-dashed border-stone-200 py-4 text-left text-xs font-bold space-y-2 text-stone-500 uppercase tracking-wider">
              <div className="flex justify-between"><span>Ref:</span><strong className="text-stone-950">#DISB-{selectedReceiptTicket.id.substring(0,8)}</strong></div>
              <div className="flex justify-between"><span>Date:</span><strong className="text-stone-950">{new Date(selectedReceiptTicket.created_at).toLocaleDateString('en-GH')}</strong></div>
              <div className="flex justify-between"><span>Recipient:</span><strong className="text-stone-950 truncate max-w-[150px] text-right">{partnerProfile?.legal_name}</strong></div>
              <div className="flex justify-between"><span>MoMo/Route:</span><strong className="text-stone-950">{partnerProfile?.momo_number}</strong></div>
            </div>

            <div className="bg-[#FDFBF7] p-5 rounded-[24px] border border-stone-200 text-xs font-bold space-y-2.5 text-left text-stone-500 shadow-inner">
              <div className="flex justify-between"><span>Gross Payout:</span><strong className="text-stone-950 font-black">₵{Number(selectedReceiptTicket.gross_amount).toFixed(2)}</strong></div>
              <div className="flex justify-between text-rose-500"><span>10% WHT Tax:</span><strong>-₵{Number(selectedReceiptTicket.wht_deducted).toFixed(2)}</strong></div>
              <div className="flex justify-between text-stone-400"><span>Gateway Fee:</span><strong>-₵2.50</strong></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 mt-2 font-black text-emerald-600 text-sm uppercase tracking-widest"><span>Net Disbursed:</span><span>₵{Number(selectedReceiptTicket.net_payout).toFixed(2)}</span></div>
            </div>

            <div className="text-center font-bold text-[9px] text-stone-400 leading-relaxed uppercase tracking-widest max-w-[220px] mx-auto">
              This statement confirms Paystack Mobile Money dispatch is approved and cleared. Sparkle Beverages Ltd.
            </div>

            <button type="button" onClick={() => window.print()} className="w-full bg-stone-950 hover:bg-stone-800 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 transition-all"><Printer className="h-4 w-4" /> Print Statement</button>
          </div>
        </div>
      )}
    </div>
  );
}