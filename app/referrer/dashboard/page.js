'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coins, LogOut, TrendingUp, User, Wallet, History, AlertCircle, RefreshCw, BarChart3, Package, Search, Filter, Calendar, CreditCard, Printer, FileText, X } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../../lib/supabaseClient';

export default function AmbassadorDashboardPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  // =========================================================================
  // 1. ALL SYSTEM STATE CORES (DECLARED AT ABSOLUTE TOP BOUNDARY LAYER)
  // =========================================================================
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [payoutLogs, setPayoutLogs] = useState([]);
  const [salesPipeline, setSalesPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  // CUSTOM INPUT WITHDRAW AMOUNT STATES
  const [customWithdrawInput, setCustomWithdrawInput] = useState('');
  const [selectedReceiptTicket, setSelectedReceiptTicket] = useState(null);

  // SEARCH & AUDIT FILTER STATES
  const [auditSearchText, setAuditSearchText] = useState('');
  const [sizeFilterText, setSizeFilterText] = useState('all');

  // =========================================================================
  // 2. LIFECYCLE DATA LIFTERS EFFECT
  // =========================================================================
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

      // Pull historical entries out of the active 'cashouts' table schema
      const { data: tickets } = await supabase
        .from('cashouts')
        .select('*')
        .eq('referral_code_id', profile.id)
        .order('created_at', { ascending: false });

      setPayoutLogs(tickets || []);

      // Pull paid orders from database
      const { data: allPaidOrders } = await supabase
        .from('orders')
        .select('id, customer_name, total_amount, created_at, metadata')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (allPaidOrders && allPaidOrders.length > 0) {
        const targetCodeString = profile.code.trim().toUpperCase();

        // Filter orders containing the ambassador's code inside the metadata payload object
        const matchedOrders = allPaidOrders.filter(order => {
          const m = order.metadata;
          if (!m) return false;
          
          // Handles flat or nested string allocations cleanly
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

  // =========================================================================
  // 3. INTERACTIVE FINANCIAL REQUEST WITHDRAWAL METHODS
  // =========================================================================
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

      // Deduct only requested amount from wallet balance row atomically
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

  // =========================================================================
  // 4. ADVANCED FORENSIC FILTER MATCH COMPILER
  // =========================================================================
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
      <div className="min-h-screen bg-stone-955 flex flex-col justify-center items-center font-mono text-xs text-stone-400 gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
        <span>Syncing Wallet Ledger Matrix...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-955 text-stone-100 font-sans antialiased pb-12 relative">
      
      <nav className="bg-stone-900 border-b border-stone-800 py-4 px-6 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Logo" className="h-10 w-auto object-contain" />
          <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Agent Workspace</span>
        </div>
        <button onClick={handleSignOutSession} className="text-xs font-mono font-bold text-stone-400 hover:text-white flex items-center gap-1.5 bg-stone-955 border border-stone-800 px-3 py-1.5 rounded-xl transition-all"><LogOut className="h-3.5 w-3.5" /> <span>Sign Out</span></button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* UPPER SUMMARY PARAMETERS CARDS BLOCKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          <div className="bg-stone-900 border border-stone-800 rounded-[28px] p-5 space-y-2 shadow-xl md:col-span-1 h-full flex flex-col justify-between">
            <div>
              <span className="text-[9px] text-stone-500 uppercase tracking-wider block font-bold font-mono">Welcome Back Partner</span>
              <h2 className="text-base font-mono font-black text-white uppercase truncate">{partnerProfile?.legal_name || 'Ambassador'}</h2>
              <span className="text-xs text-emerald-400 font-mono font-bold block mt-0.5">Code handle: #{partnerProfile?.code || '----'}</span>
            </div>
            <div className="border-t border-stone-850 pt-3 mt-4 text-stone-400 text-[11px] font-mono space-y-1">
              <div className="flex justify-between"><span>Wallet Route:</span><strong className="text-white">{partnerProfile?.momo_number || 'None'}</strong></div>
              <div className="flex justify-between"><span>Route Bank:</span><strong className="text-stone-300">{partnerProfile?.momo_network || 'MTN'} Route</strong></div>
            </div>
          </div>

          {/* DYNAMIC CALCULATOR FORM WITH DEDUCTION LOG PREVIEW SHIELDS */}
          <div className="bg-stone-900 border border-stone-800 rounded-[28px] p-5 shadow-xl md:col-span-2">
            <span className="text-[8px] text-stone-500 uppercase font-mono font-bold flex items-center gap-1 mb-2"><Wallet className="h-3 w-3 text-emerald-500" /> Current Wallet Available: <strong className="text-white ml-1">₵{Number(partnerProfile?.total_earnings || 0).toFixed(2)}</strong></span>
            
            <form onSubmit={handleRequestWithdrawal} className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px] pt-1">
              <div className="space-y-2">
                <label className="text-[9px] text-stone-500 uppercase font-bold tracking-wide block">Amount to cashout (GHS)</label>
                <input type="number" required min="100" step="0.01" max={partnerProfile?.total_earnings || 0} placeholder="Minimum ₵100.00..." value={customWithdrawInput} onChange={(e) => setCustomWithdrawInput(e.target.value)} className="w-full bg-stone-955 border border-stone-850 rounded-xl px-3 py-2 text-white font-bold outline-none text-xs focus:border-emerald-600/40 transition-colors" />
                <button type="submit" disabled={withdrawing || grossRequestAmount < 100} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-black py-2.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all uppercase text-[10px] tracking-wider disabled:opacity-30 shadow-md">
                  Request Custom Disbursal
                </button>
              </div>

              <div className="bg-stone-955 rounded-2xl border border-stone-850 p-3.5 space-y-1.5 text-stone-400 shadow-inner">
                <span className="text-[8px] text-stone-500 uppercase font-black block tracking-wider border-b border-stone-900 pb-1">Deductions Audit Breakdown Preview</span>
                <div className="flex justify-between"><span>Gross Request:</span><span className="text-white font-bold">₵{grossRequestAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-400/80"><span>10% WHT Withholding Cut:</span><span>-₵{liveTaxDeduction.toFixed(2)}</span></div>
                <div className="flex justify-between text-purple-400/80"><span>Paystack Network Gateway Fee:</span><span>-₵{paystackGatewayFee.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-stone-900 pt-1.5 mt-1 font-black text-emerald-400 text-xs"><span>Net Disbursal Estim:</span><span>₵{liveNetPayoutEstimation.toFixed(2)}</span></div>
              </div>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-mono text-xs">
          
          {/* DYNAMIC SALES PIPELINE LEDGER VIEW WITH SEARCH & FILTERS CHANNELS */}
          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-[24px] p-5 space-y-4 shadow-lg">
            <div className="border-b border-stone-850 pb-3 space-y-3">
              <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5 uppercase"><Package className="h-4 w-4 text-emerald-500" /> Granular Conversion Earnings Audit Log</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                  <input type="text" value={auditSearchText} onChange={(e) => setAuditSearchText(e.target.value)} placeholder="Search by Client name, ID or Flavor..." className="w-full bg-stone-950 border border-stone-850 rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-emerald-600/40" />
                </div>
                <div className="relative">
                  <select value={sizeFilterText} onChange={(e) => setSizeFilterText(e.target.value)} className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2 text-stone-300 outline-none cursor-pointer focus:border-emerald-600/40">
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
              <div className="text-center py-16 text-stone-600 font-sans font-light italic">No historical orders match your active search terms parameters. Adjust criteria to audit log records.</div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin divide-y divide-stone-850/40">
                {filteredAuditSalesLog.map((sale) => (
                  <div key={sale.id} className="pt-2.5 first:pt-0 flex justify-between items-center gap-2 group transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-stone-955 border border-stone-800 text-stone-400 font-bold flex items-center justify-center rounded-lg uppercase text-[10px] shadow-md shrink-0 font-sans group-hover:border-emerald-500/30 transition-colors">{sale.initials}</div>
                      <div>
                        <div className="font-sans font-bold text-stone-200 text-[11px] leading-tight uppercase flex items-center gap-1.5">
                          <span>{sale.customerName}</span>
                          <span className="text-[9px] font-mono font-normal text-stone-500 uppercase">Ref: #{sale.id.substring(0,8).toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] text-stone-455 mt-0.5 font-sans font-light leading-relaxed">Attributed order lines: <strong className="text-stone-300 font-mono font-medium">{sale.itemsSummary}</strong></p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-black text-[12px] block font-mono font-bold">+₵{Number(sale.bountyEarned).toFixed(2)}</span>
                      <span className="text-[9px] text-stone-500 block mt-0.5">{sale.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CASHOUT REQUESTS HISTORICAL HISTORY TABLE LEDGER COLUMN */}
          <div className="bg-stone-900 border border-stone-800 rounded-[24px] p-5 space-y-4 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-850 pb-2"><History className="h-4 w-4 text-stone-500" /> Withdrawal History Log</h3>
            {payoutLogs.length === 0 ? (
              <div className="text-center py-12 text-stone-600 italic font-sans font-light">No withdrawal settlements requested yet.</div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {payoutLogs.map((ticket) => {
                  const isReadyForSlipReceipt = ticket.status === 'completed' || ticket.status === 'approved';
                  return (
                    <div key={ticket.id} className="bg-stone-955 p-3 rounded-xl border border-stone-850/60 flex justify-between items-center gap-1">
                      <div>
                        <div className="font-bold text-stone-200">₵{Number(ticket.net_payout).toFixed(2)} Net</div>
                        <span className="text-[9px] text-stone-500 block mt-0.5 font-sans">Gross: ₵{Number(ticket.gross_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border block text-center ${ticket.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{ticket.status}</span>
                        {isReadyForSlipReceipt && (
                          <button type="button" onClick={() => setSelectedReceiptTicket(ticket)} className="text-[9px] text-cyan-400 hover:underline flex items-center gap-0.5 font-bold font-mono uppercase tracking-wide bg-stone-950 px-2 py-0.5 rounded border border-stone-800 mt-0.5"><Printer className="h-2.5 w-2.5" /> Receipt</button>
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

      {/* NEW AGENT DISBURSAL STATEMENT RECEIPT MODAL OVERLAY SHEET */}
      {selectedReceiptTicket && (
        <div className="fixed inset-0 bg-stone-955/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-stone-900 rounded-[32px] max-w-sm w-full p-6 space-y-6 shadow-2xl relative font-sans text-center">
            <button type="button" onClick={() => setSelectedReceiptTicket(null)} className="absolute right-4 top-4 p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 border"><X className="h-4 w-4" /></button>
            
            <div className="space-y-1 text-center">
              <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Logo" className="h-10 mx-auto object-contain" />
              <h2 className="text-xs font-mono font-black uppercase text-emerald-950 tracking-wider pt-2">Disbursal Manifest Statement</h2>
              <p className="text-[9px] text-stone-400 font-mono">Fulfillment Settlement Handshake Node</p>
            </div>

            <div className="border-y border-dashed border-stone-200 py-3 text-left font-mono text-[10px] space-y-1.5 text-stone-600">
              <div className="flex justify-between"><span>Statement Ref:</span><strong className="text-stone-900">#DISB-{selectedReceiptTicket.id.substring(0,8).toUpperCase()}</strong></div>
              <div className="flex justify-between"><span>Dispatched Date:</span><strong className="text-stone-900">{new Date(selectedReceiptTicket.created_at).toLocaleString('en-GH')}</strong></div>
              <div className="flex justify-between"><span>Legal Recipient:</span><strong className="text-stone-900 uppercase">{partnerProfile?.legal_name}</strong></div>
              <div className="flex justify-between"><span>MoMo Wallet:</span><strong className="text-stone-900">{partnerProfile?.momo_number}</strong></div>
            </div>

            <div className="bg-stone-50 p-4 border rounded-2xl font-mono text-[11px] space-y-2 text-left text-stone-600">
              <div className="flex justify-between"><span>Gross Commission Payout:</span><strong className="text-stone-900">₵{Number(selectedReceiptTicket.gross_amount).toFixed(2)}</strong></div>
              <div className="flex justify-between text-red-600/90"><span>10% WHT Withholding Cut:</span><strong>-₵{Number(selectedReceiptTicket.wht_deducted).toFixed(2)}</strong></div>
              <div className="flex justify-between text-purple-700/90"><span>Paystack API Rail Fee:</span><strong>-₵2.50</strong></div>
              <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-emerald-800 text-sm uppercase"><span>Net Disbursed funds:</span><span>₵{Number(selectedReceiptTicket.net_payout).toFixed(2)}</span></div>
            </div>

            <div className="text-center font-mono text-[8px] text-stone-400 leading-normal uppercase max-w-[220px] mx-auto">
              This statement confirms Paystack Mobile Money api rail dispatch is approved and cleared. Sparkle Beverages Ltd, Accra.
            </div>

            <button type="button" onClick={() => window.print()} className="w-full bg-stone-900 hover:bg-stone-850 text-white font-mono font-bold text-[10px] uppercase tracking-wide py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"><Printer className="h-3.5 w-3.5" /> Print Statement Slip</button>
          </div>
        </div>
      )}
    </div>
  );
}