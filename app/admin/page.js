'use client';

import { useEffect, useState } from 'react';
import { 
  CheckCircle2, Clock, Truck, MapPin, Phone, User, Search, Calendar, ToggleLeft, ToggleRight,
  ShieldAlert, PackageCheck, RefreshCw, AlertCircle, Download, FileSpreadsheet, Camera, CreditCard,
  Tag, PlusCircle, ListFilter, Landmark, Layers, Edit3, Save, LayoutGrid, FileText, Upload, ShieldCheck, Eye, XCircle, Trash2, Info, Coins, Printer, X, AlertTriangle, Navigation
} from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { 
  getAllOrdersForAdmin, updateOrderStatusAdmin,
  getAllReferralCodesAdmin, toggleReferralStateAdmin,
  getStoreInventoryAdmin, updateVariantInventoryAdmin,
  getSiteSettingsAdmin, updateSiteSettingsAdmin,
  createNewProductWithVariantsAdmin, processReferrerApprovalAdminAction,
  processReferrerRejectionAdminAction, deleteReferrerAdminAction,
  getAdminWithdrawalTicketsQueueAction
} from '../actions/admin';
import { confirmDispatchLogisticsServerAction } from '../actions/logistics';

export default function AdminDashboardPage() {
  const supabase = createBrowserSupabaseClient();

  // =========================================================================
  // 1. ALL SYSTEM STATE CORES (DECLARED AT ABSOLUTE TOP BOUNDARY LAYER)
  // =========================================================================
  const [activeTab, setActiveTab] = useState('orders'); 
  const [orders, setOrders] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [cashouts, setCashouts] = useState([]);
  const [products, setProducts] = useState([]);
  const [cmsContent, setCmsContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active'); 
  
  const [orderSearchText, setOrderSearchText] = useState('');
  const [orderDateText, setOrderDateText] = useState('');
  const [orderLocationText, setOrderLocationText] = useState(''); 

  const [selectedAmbassadorDetails, setSelectedAmbassadorDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [promoDiscountsMap, setPromoDiscountsMap] = useState({});
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);
  const [printOrderItems, setPrintOrderItems] = useState([]);
  const [loadingPrintItems, setLoadingPrintItems] = useState(false);

  // LOGISTICS DISPATCH MODAL STATES
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorbike');
  const [vehicleColor, setVehicleColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // Forms Binding Controllers States
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCampaign, setNewCampaign] = useState('');
  
  const [newAmbassadorName, setNewAmbassadorName] = useState('');
  const [newAmbassadorPhone, setNewAmbassadorPhone] = useState('');
  const [newAmbassadorMomo, setNewAmbassadorMomo] = useState('');
  const [newAmbassadorNetwork, setNewAmbassadorNetwork] = useState('MTN');
  const [newAmbassadorPortrait, setNewAmbassadorPortrait] = useState(''); 
  const [newAmbassadorCard, setNewAmbassadorCard] = useState(''); 

  const [promo300mlDiscount, setPromo300mlDiscount] = useState('0.50');
  const [promo500mlDiscount, setPromo500mlDiscount] = useState('1.00');
  const [promo15LDiscount, setPromo15LDiscount] = useState('2.00');
  const [promo5LDiscount, setPromo5LDiscount] = useState('5.00');

  const [editingPromoId, setEditingPromoId] = useState(null);
  const [editPromo300ml, setEditPromo300ml] = useState('0.50');
  const [editPromo500ml, setEditPromo500ml] = useState('1.00');
  const [editPromo15L, setEditPromo15L] = useState('2.00');
  const [editPromo5L, setEditPromo5L] = useState('5.00');

  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editStock, setEditStock] = useState(0);
  const [editRetail, setEditRetail] = useState(0);
  const [editWholesale, setEditWholesale] = useState(0);
  const [editSizeMoqFloor, setEditSizeMoqFloor] = useState(0); 
  const [editWholesaleTrigger, setEditWholesaleTrigger] = useState(0); 
  const [editClientDiscount, setEditClientDiscount] = useState(0); 
  const [editReferrerEarnings, setEditReferrerEarnings] = useState(0); 

  const [globalOrderLinesMap, setGlobalOrderLinesMap] = useState({});

  // =========================================================================
  // 2. HOISTED COMPUTATION MATRIX (PREVENTS REACT BUNDLER RENDERING ERRORS)
  // =========================================================================
  const humanAmbassadorsList = referrals.filter(r => r.legal_name && r.legal_name.trim() !== '');
  const purePromoCodesList = referrals.filter(r => !r.legal_name || r.legal_name.trim() === '');
  
  const filteredOrders = orders.filter(order => {
    const textMatch = orderSearchText.trim() === '' || 
      order.customer_name.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      order.id.toLowerCase().includes(orderSearchText.toLowerCase());

    const dateMatch = orderDateText.trim() === '' ||
      new Date(order.created_at).toLocaleDateString('en-GH').includes(orderDateText);

    const locationMatch = orderLocationText.trim() === '' ||
      (order.landmark && order.landmark.toLowerCase().includes(orderLocationText.toLowerCase()));

    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' && order.status !== 'completed') ||
      (filterStatus === 'paid' && order.payment_status === 'paid') ||
      (filterStatus === 'processing' && order.status === 'processing') ||
      (filterStatus === 'completed' && order.status === 'completed');

    return textMatch && dateMatch && locationMatch && statusMatch;
  });

  const lowStockAlertInventoryBin = products.flatMap(flavor => 
    (flavor.product_variants || []).map(variant => ({
      ...variant,
      flavorName: flavor.name
    }))
  ).filter(variant => variant.stock_quantity <= 20);

  // =========================================================================
  // 3. LIFECYCLE DISPATCH HOOKS
  // =========================================================================
  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (orders.length === 0 || products.length === 0) return;

    async function batchFetchAllOrderItems() {
      const orderIds = orders.map(o => o.id);
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (!error && data) {
        const structuralMap = {};
        orders.forEach(o => { structuralMap[o.id] = []; });

        data.forEach(item => {
          let resolvedFlavorName = "Sparkle Juice Pouch";
          const matchVar = products.find(p => p.product_variants?.some(v => v.id === item.variant_id));
          if (matchVar) resolvedFlavorName = matchVar.name;
          structuralMap[item.order_id].push(`${item.quantity}x ${resolvedFlavorName} (${item.size || '500ml'})`);
        });
        setGlobalOrderLinesMap(structuralMap);
      }
    }
    batchFetchAllOrderItems();
  }, [orders, products]);

  useEffect(() => {
    if (!selectedPrintOrder) {
      setPrintOrderItems([]); 
      return;
    }

    async function pullChildInvoiceLineItems() {
      setLoadingPrintItems(true);
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', selectedPrintOrder.id);

      if (!error && data) {
        const enrichedItems = data.map(item => {
          let resolvedFlavorName = "Sparkle Fresh Beverage";
          let resolvedSizeGroup = item.size || "500ml";

          for (const prod of products) {
            const targetVariant = prod.product_variants?.find(v => v.id === item.variant_id);
            if (targetVariant) {
              resolvedFlavorName = prod.name;
              resolvedSizeGroup = targetVariant.size;
              break;
            }
          }

          return { ...item, flavor_title: resolvedFlavorName, size_title: resolvedSizeGroup };
        });
        setPrintOrderItems(enrichedItems);
      }
      setLoadingPrintItems(false);
    }
    pullChildInvoiceLineItems();
  }, [selectedPrintOrder, products]);

  // =========================================================================
  // 4. SECURE ADMINISTRATIVE CORE WORKACTION HANDLERS
  // =========================================================================
  async function loadDashboardData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const ordersRes = await getAllOrdersForAdmin();
      const referralsRes = await getAllReferralCodesAdmin();
      const inventoryRes = await getStoreInventoryAdmin();
      const cmsRes = await getSiteSettingsAdmin();

      const { data: discountRows } = await supabase.from('referral_discounts').select('*');
      if (discountRows) {
        const builtPromoMap = {};
        discountRows.forEach(row => {
          if (!builtPromoMap[row.referral_code_id]) {
            builtPromoMap[row.referral_code_id] = { '300ml': 0.50, '500ml': 1.00, '1.5L': 2.00, '5L': 5.00 };
          }
          builtPromoMap[row.referral_code_id][row.size] = row.client_discount;
        });
        setPromoDiscountsMap(builtPromoMap);
      }

      const { data: directClientCashoutsLog, error: directQueryErr } = await supabase
        .from('cashouts')
        .select('*, referral_codes(*)')
        .order('created_at', { ascending: false });

      if (ordersRes.success && referralsRes.success && inventoryRes.success && cmsRes.success) {
        setOrders(ordersRes.data || []);
        setReferrals(referralsRes.data || []);
        setProducts(inventoryRes.data || []);
        setCmsContent(cmsRes.data || {});
        
        if (!directQueryErr && directClientCashoutsLog) {
          setCashouts(directClientCashoutsLog);
        } else {
          const cashoutsRes = await getAdminWithdrawalTicketsQueueAction();
          setCashouts(cashoutsRes.data || []);
        }
      } else {
        setErrorMessage(ordersRes.error || referralsRes.error || inventoryRes.error || "Data sync error.");
      }
    } catch (err) { setErrorMessage(err.message); }
    setLoading(false);
  }

  const handleImageUploadEngine = (e, targetKey, contextType, variantId = null) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`File Hook Loaded: Selected "${file.name}" for ${targetKey}.`);
    }
  };

  // Invokes our new server action securely to handle state changes and SMS dispatch loops
  const handleConfirmDispatchLogistics = async (e) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    
    const isDelivery = dispatchOrder.delivery_type === 'delivery';

    if (isDelivery && (!riderName || !riderPhone || !vehicleColor || !plateNumber)) {
      alert("Validation Error: Please fill out all vehicle and rider details sheets.");
      return;
    }

    setUpdatingId(`dispatch-${dispatchOrder.id}`);

    try {
      const jsonResult = await confirmDispatchLogisticsServerAction({
        orderId: dispatchOrder.id,
        deliveryType: dispatchOrder.delivery_type,
        customerPhone: dispatchOrder.customer_phone,
        customerName: dispatchOrder.customer_name,
        riderName: riderName,
        riderPhone: riderPhone,
        vehicleType: vehicleType,
        vehicleColor: vehicleColor,
        plateNumber: plateNumber
      });

      if (jsonResult.success) {
        alert("🌟 LOGISTICS MANIFEST CONFIRMED AND NOTIFIED LIVE!");
      } else {
        alert(`Fulfillment Error: ${jsonResult.error || 'Server rejected processing actions.'}`);
      }

      setDispatchOrder(null);
      await loadDashboardData(); 
    } catch (err) {
      alert(`Network Error: ${err.message}`);
    } finally { 
      setUpdatingId(null);
    }
  };

  const handleCreatePromoCodeManualSubmit = async (e) => {
    e.preventDefault();
    if (!newCode || !newCampaign) return;
    setUpdatingId('creating-code');
    try {
      const { data: promoHeader, error: codeError } = await supabase
        .from('referral_codes')
        .insert([{
          code: newCode.trim().toUpperCase(),
          campaign_name: newCampaign.trim(),
          total_earnings: 0.00,
          is_active: true,
          is_verified: true,
          status: 'approved',
          password: 'PROMO_CAMPAIGN_KEY'
        }])
        .select('*')
        .single();

      if (codeError || !promoHeader) throw codeError;

      const multiTierRulesPayload = [
        { referral_code_id: promoHeader.id, size: '300ml', client_discount: parseFloat(promo300mlDiscount) || 0, referrer_earnings: 0 },
        { referral_code_id: promoHeader.id, size: '500ml', client_discount: parseFloat(promo500mlDiscount) || 0, referrer_earnings: 0 },
        { referral_code_id: promoHeader.id, size: '1.5L',  client_discount: parseFloat(promo15LDiscount) || 0, referrer_earnings: 0 },
        { referral_code_id: promoHeader.id, size: '5L',   client_discount: parseFloat(promo5LDiscount) || 0, referrer_earnings: 0 }
      ];

      await supabase.from('referral_discounts').insert(multiTierRulesPayload);
      alert(`PROMO CAMPAIGN NODE ${newCode.toUpperCase()} LAUNCHED LIVE!`);
      setNewCode(''); setNewCampaign('');
      await loadDashboardData();
    } catch (err) { alert(`Failed: ${err.message}`); }
    setUpdatingId(null);
  };

  const handleCreateAmbassadorManualSubmit = async (e) => {
    e.preventDefault();
    if (!newCode || !newAmbassadorName || !newAmbassadorPhone) return;
    setUpdatingId('creating-ambassador');
    
    const generatedPassToken = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { error } = await supabase.from('referral_codes').insert([{
      code: newCode.trim().toUpperCase(),
      campaign_name: `${newAmbassadorName.trim()} [Ambassador]`,
      legal_name: newAmbassadorName.trim(),
      phone_number: newAmbassadorPhone.trim(),
      momo_number: newAmbassadorMomo.trim(),
      momo_network: newAmbassadorNetwork,
      portrait_url: newAmbassadorPortrait || null, 
      ghana_card_url: newAmbassadorCard || null,    
      total_earnings: 0.00,
      is_active: true,
      is_verified: true,
      status: 'approved',
      password: generatedPassToken
    }]);

    if (!error) {
      alert(`AMBASSADOR ACCOUNT ALLOCATED LIVE!\nCode handle: #${newCode.trim().toUpperCase()}`);
      setNewCode(''); setNewAmbassadorName(''); setNewAmbassadorPhone(''); setNewAmbassadorMomo('');
      await loadDashboardData();
    } else { alert(`Database rejected entry: ${error.message}`); }
    setUpdatingId(null);
  };

  const handleAddNewProductFlavor = async (e) => {
    e.preventDefault();
    if (!newProductName) return;
    setUpdatingId('creating-product');
    const result = await createNewProductWithVariantsAdmin(newProductName, newProductDesc);
    if (result.success) {
      setNewProductName(''); setNewProductDesc('');
      const inventoryRes = await getStoreInventoryAdmin();
      if (inventoryRes.success) setProducts(inventoryRes.data || []);
      alert("New flavor line deployed successfully!");
    } else { alert(`Failed: ${result.error}`); }
    setUpdatingId(null);
  };

  const handleUpdateFulfillmentState = async (orderId, targetState) => {
    setUpdatingId(orderId);
    const result = await updateOrderStatusAdmin(orderId, targetState);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: targetState } : o));
    } else { alert(`Fulfillment Error: ${result.error}`); }
    setUpdatingId(null);
  };

  const handleSavePromoCodeOverride = async (codeId) => {
    setUpdatingId(`promo-save-${codeId}`); 
    try {
      await supabase.from('referral_discounts').delete().eq('referral_code_id', codeId);

      const payloadBatch = [
        { referral_code_id: codeId, size: '300ml', client_discount: parseFloat(editPromo300ml) || 0, referrer_earnings: 0 },
        { referral_code_id: codeId, size: '500ml', client_discount: parseFloat(editPromo500ml) || 0, referrer_earnings: 0 },
        { referral_code_id: codeId, size: '1.5L',  client_discount: parseFloat(editPromo15L) || 0, referrer_earnings: 0 },
        { referral_code_id: codeId, size: '5L',   client_discount: parseFloat(editPromo5L) || 0, referrer_earnings: 0 }
      ];

      const { error } = await supabase.from('referral_discounts').insert(payloadBatch);
      if (error) throw error;

      alert("Campaign Parameters custom discounts overrides modified live!");
      setEditingPromoId(null);
      await loadDashboardData();
    } catch (err) { alert(`Override failure: ${err.message}`); }
    setUpdatingId(null);
  };

  const handleApproveAmbassadorKYC = async (profileId) => {
    setUpdatingId(`kyc-${profileId}`);
    const result = await processReferrerApprovalAdminAction(profileId);
    if (result.success) {
      alert("Verification Cleared: Account status set to approved.");
      await loadDashboardData();
    } else { alert(`Gateway Refusal: ${result.error}`); }
    setUpdatingId(null);
  };

  const handleDeclineAmbassadorKYC = async (profileId) => {
    setUpdatingId(`kyc-${profileId}`);
    const result = await processReferrerRejectionAdminAction(profileId);
    if (result.success) {
      alert("Application Declined: Rejection advisory log fired.");
      await loadDashboardData();
    } else { alert(`Gateway Refusal: ${result.error}`); }
    setUpdatingId(null);
  };

  const handleSaveVariantChanges = async (variantId) => {
    setUpdatingId(variantId);
    const updates = { 
      stock_quantity: parseInt(editStock) || 0, 
      retail_price: parseFloat(editRetail) || 0, 
      wholesale_price: parseFloat(editWholesale) || 0, 
      size_moq_floor: parseInt(editSizeMoqFloor) || 0, 
      moq_floor: parseInt(editWholesaleTrigger) || 0, 
      client_discount: parseFloat(editClientDiscount) || 0,
      referrer_earnings: parseFloat(editReferrerEarnings) || 0,
      is_in_stock: parseInt(editStock) > 0 
    };
    const result = await updateVariantInventoryAdmin(variantId, updates);
    if (result.success) {
      setProducts(prev => prev.map(p => ({ 
        ...p, 
        product_variants: p.product_variants.map(v => v.id === variantId ? { ...v, ...updates } : v) 
      })));
      setEditingVariantId(null);
    } else { alert(`Update failed: ${result.error}`); }
    setUpdatingId(null);
  };

  const handleTriggerPaystackMoMoTransfer = async (ticketId) => {
    if (!confirm("Execute Live Payout and close pending balance records?")) return;
    setUpdatingId(`payout-${ticketId}`);
    
    const { error } = await supabase
      .from('cashouts')
      .update({ status: 'completed' })
      .eq('id', ticketId);

    if (!error) {
      alert("PAYMENT PROCESSED AND DISBURSED STRINGS LOGGED!");
      window.location.reload(); 
    } else {
      alert(`LEDGER EXCEPTION: ${error.message}`);
    }
    setUpdatingId(null);
  };

  const handleTriggerCashoutDeclineRollback = async (ticketId, name) => {
    if (!confirm(`Decline and refund ticket from ${name}?`)) return;
    setUpdatingId(`payout-${ticketId}`);
    try {
      const { data: ticket, error: fetchErr } = await supabase
        .from('cashouts')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (fetchErr || !ticket) throw new Error("Ticket record unresolvable.");

      const { data: profile } = await supabase
        .from('referral_codes')
        .select('total_earnings')
        .eq('id', ticket.referral_code_id)
        .single();

      const currentBalance = Number(profile?.total_earnings || 0);
      const rollbackGross = Number(ticket.gross_amount || 0);

      await supabase
        .from('referral_codes')
        .update({ total_earnings: currentBalance + rollbackGross })
        .eq('id', ticket.referral_code_id);

      await supabase
        .from('cashouts')
        .update({ status: 'declined' })
        .eq('id', ticketId);

      alert("TICKET SEPARATION VOIDED: Funds successfully rolled back into wallet.");
      window.location.reload(); 
    } catch(err) {
      alert(`ROLLBACK REJECTION ERROR: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const triggerExcelSpreadsheetDownloadAction = (datasetType, dataArray) => {
    let csvStringContent = '';
    let downloadFileName = `Sparkle_${datasetType}_Report.csv`;

    if (datasetType === 'Orders') {
      csvStringContent = 'Order ID,Customer Name,Phone Number,Delivery Option,Fulfillment Location Address,Total Amount (GHS),Payment Status,Fulfillment Status,Date Placed\r\n';
      dataArray.forEach(row => {
        csvStringContent += `"${row.id}","${row.customer_name}","${row.customer_phone}","${row.delivery_type}","${row.landmark || 'Self-Pickup'}",${row.total_amount},"${row.payment_status}","${row.status}","${new Date(row.created_at).toLocaleString('en-GH')}"\r\n`;
      });
    } else if (datasetType === 'Ambassadors') {
      csvStringContent = 'Code Account,Legal Representative,Contact Line,MoMo Wallet,Network Route,Wallet Balance (GHS),Account Verified\r\n';
      dataArray.forEach(row => {
        csvStringContent += `"${row.code}","${row.legal_name || 'Manual'}","${row.phone_number || 'None'}","${row.momo_number || 'None'}","${row.momo_network || 'None'}",${row.total_earnings},${row.is_verified}\r\n`;
      });
    }
    const blob = new Blob([csvStringContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', downloadFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMasterDeleteReferrerRecord = async (profileId, codeLabel) => {
    if (!confirm("Permanently wipe " + codeLabel + " from system logs?")) return;
    setUpdatingId(`deleting-${profileId}`);
    const result = await deleteReferrerAdminAction(profileId);
    if (result.success) {
      alert("DELETED successfully.");
      await loadDashboardData();
    }
    setUpdatingId(null);
  };

  const resolveItemManifestLines = (orderRow) => {
    const preJoinedItems = orderRow.order_items || orderRow.items;
    if (Array.isArray(preJoinedItems) && preJoinedItems.length > 0) {
      return preJoinedItems.map(item => {
        let label = item.name || item.flavor_title || "Sparkle Drink";
        return `${item.quantity || 1}x ${label} (${item.size || 'Standard'})`;
      });
    }

    const stateLines = globalOrderLinesMap[orderRow.id];
    if (stateLines && stateLines.length > 0) return stateLines;

    let meta = orderRow.metadata;
    if (meta) {
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch (e) { meta = null; }
      }
      if (meta && typeof meta === 'object') {
        if (meta.order_summary && typeof meta.order_summary === 'string' && meta.order_summary.trim() !== '') {
          return [meta.order_summary];
        }
        const cartArray = meta.items || meta.cart || meta.basket || meta.products || meta.line_items;
        if (Array.isArray(cartArray) && cartArray.length > 0) {
          return cartArray.map(i => {
            const q = i.quantity || i.qty || i.count || 1;
            const n = i.name || i.flavor || i.title || 'Sparkle Drink';
            const s = i.size || i.volume || 'Standard';
            return `${q}x ${n} (${s})`;
          });
        }
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-stone-955 text-stone-100 font-sans antialiased pb-12 print:bg-white print:text-stone-900">
      
      <nav className="bg-stone-900 border-b border-stone-800 py-4 px-6 flex flex-col xl:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" className="h-12 w-auto object-contain brightness-110" />
          <div className="h-6 w-px bg-stone-800 hidden xl:block" />
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase font-mono text-white flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-emerald-500" /> Sparkle Operations Hub</h1>
            <p className="text-[10px] text-stone-400 font-medium">Unified Fulfillment, KYC Onboarding & Paystack MoMo Payouts</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end text-xs font-bold font-mono">
          <div className="bg-stone-955 p-1 rounded-xl border border-stone-800 flex gap-1">
            <button onClick={() => setActiveTab('orders')} className={`px-2.5 py-1.5 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Orders ({orders.length})</button>
            <button onClick={() => setActiveTab('ambassadors')} className={`px-2.5 py-1.5 rounded-lg transition-all ${activeTab === 'ambassadors' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Ambassadors ({humanAmbassadorsList.length})</button>
            <button onClick={() => setActiveTab('promocodes')} className={`px-2.5 py-1.5 rounded-lg transition-all ${activeTab === 'promocodes' ? 'bg-stone-800 text-white text-cyan-400' : 'text-stone-400'}`}>Promo Codes ({purePromoCodesList.length})</button>
            <button onClick={() => setActiveTab('cashouts')} className={`px-2.5 py-1.5 rounded-lg transition-all ${activeTab === 'cashouts' ? 'bg-stone-800 text-white text-emerald-400' : 'text-stone-400'}`}>Cashouts ({cashouts.filter(c => c.status === 'pending').length})</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-2.5 py-1.5 rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>
              Stock {lowStockAlertInventoryBin.length > 0 && <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[9px] rounded-full animate-pulse">!</span>}
            </button>
            <button onClick={() => setActiveTab('cms')} className={`px-2.5 py-1.5 rounded-lg transition-all ${activeTab === 'cms' ? 'bg-stone-800 text-white' : 'text-stone-400'}`}>Web CMS</button>
          </div>
          <button onClick={loadDashboardData} className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 print:p-0">

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6 print:hidden">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs shadow-md">
              <div>
                <label className="block text-stone-500 uppercase text-[9px] mb-1 font-bold flex items-center gap-1"><Search className="h-3 w-3" /> Search Customer / Ref ID</label>
                <input type="text" value={orderSearchText} onChange={(e) => setOrderSearchText(e.target.value)} placeholder="e.g. Benjamin..." className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none" />
              </div>
              <div>
                <label className="block text-stone-500 uppercase text-[9px] mb-1 font-bold flex items-center gap-1"><Calendar className="h-3 w-3" /> Filter By Date</label>
                <input type="text" value={orderDateText} onChange={(e) => setOrderDateText(e.target.value)} placeholder="e.g. 10/07/2026" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none" />
              </div>
              <div>
                <label className="block text-cyan-400 uppercase text-[9px] mb-1 font-bold flex items-center gap-1"><MapPin className="h-3 w-3 text-cyan-400" /> Filter By Landmark Location</label>
                <input type="text" value={orderLocationText} onChange={(e) => setOrderLocationText(e.target.value)} placeholder="e.g. Airport Shell" className="w-full bg-stone-955 border border-cyan-900/40 rounded-xl px-3 py-2 text-cyan-400 outline-none" />
              </div>
              <div>
                <label className="block text-stone-500 uppercase text-[9px] mb-1 font-bold flex items-center gap-1"><ListFilter className="h-3 w-3" /> Fulfill State Group</label>
                <div className="bg-stone-955 p-0.5 rounded-xl border border-stone-800 grid grid-cols-5 gap-0.5 text-[9px] font-bold text-center h-9 items-center">
                  {['active', 'all', 'paid', 'processing', 'completed'].map((st) => (
                    <button key={st} onClick={() => setFilterStatus(st)} className={`py-1.5 rounded-lg capitalize ${filterStatus === st ? 'bg-emerald-600 text-white' : 'text-stone-400'}`}>{st}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => {
                const isPaid = order.payment_status === 'paid'; const isProcessing = order.status === 'processing'; const isCompleted = order.status === 'completed'; const referralTrack = order.metadata?.applied_code;
                const manifestLines = resolveItemManifestLines(order);
                const hasRiderAssigned = order.metadata?.rider_name;
                
                return (
                  <div key={order.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-bold font-mono text-stone-200 flex items-center gap-1"><User className="h-3.5 w-3.5 text-stone-500" /> {order.customer_name}</h4>
                          <p className="text-[9px] text-stone-500 font-mono mt-0.5">Ref: {order.id.substring(0,8).toUpperCase()}... {referralTrack && <span className="text-emerald-400 bg-emerald-955 px-1 py-0.5 rounded ml-1 font-bold">Code: {referralTrack}</span>}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{order.payment_status}</span>
                          <span className={`inline-block text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${isCompleted ? 'bg-blue-500/10 text-blue-400 border border-blue-900/30' : isProcessing ? 'bg-amber-500/10 text-amber-400 border border-amber-900/30' : 'bg-stone-800 text-stone-400'}`}>
                            {order.status}
                          </span>
                          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">₵{Number(order.total_amount).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-stone-500 font-mono font-bold bg-stone-955 px-2 py-1 rounded border border-stone-850/40 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-stone-500" />
                        <span>Placed: {new Date(order.created_at).toLocaleString('en-GH')}</span>
                      </div>

                      <div className="bg-stone-955 border border-stone-800/85 rounded-xl p-3 text-[11px] font-mono space-y-1.5 text-stone-300">
                        <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-stone-500" /><span>{order.customer_phone}</span></div>
                        <div className="flex items-center gap-2">{order.delivery_type === 'delivery' ? <Truck className="h-3.5 w-3.5 text-blue-400" /> : <MapPin className="h-3.5 w-3.5 text-amber-400" />}<span>{order.delivery_type} Option</span></div>
                        <div className="text-[10px] text-cyan-400/90 truncate pt-1 border-t border-stone-900 flex items-center gap-1"><MapPin className="h-3 w-3 text-cyan-500" /> <span>Dest: {order.landmark || 'HQ Self-Pickup Depot'}</span></div>
                      </div>

                      <div className="bg-stone-955 border border-stone-800 p-3 rounded-xl space-y-1.5 shadow-inner">
                        <span className="text-[8px] text-emerald-400 uppercase font-mono font-bold block border-b border-stone-850 pb-1 tracking-wider">Client Purchase Breakdown Manifest</span>
                        {manifestLines.length === 0 ? (
                          <span className="text-[10px] text-amber-500 font-mono flex items-center gap-1 italic"><AlertTriangle className="h-3.5 w-3.5" /> No items tracked under client session payload</span>
                        ) : (
                          manifestLines.map((strText, idx) => (
                            <div key={idx} className="text-[11px] text-white font-mono font-black flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold text-xs">•</span> {strText}
                            </div>
                          ))
                        )}
                      </div>

                      {isCompleted && order.delivery_type === 'delivery' && hasRiderAssigned && (
                        <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl text-[10px] font-mono text-emerald-400 space-y-1 mt-2">
                          <span className="uppercase font-bold tracking-wider border-b border-emerald-900/50 pb-0.5 block flex items-center gap-1"><Navigation className="h-3 w-3" /> Active Logistics Profile</span>
                          <div className="flex justify-between text-emerald-300"><span>Rider:</span><strong>{order.metadata.rider_name}</strong></div>
                          <div className="flex justify-between text-emerald-300"><span>Contact:</span><strong>{order.metadata.rider_phone}</strong></div>
                          <div className="flex justify-between text-emerald-300"><span>Vehicle:</span><strong>{order.metadata.vehicle_color || ''} {order.metadata.vehicle_type || 'Vehicle'}</strong></div>
                          <div className="flex justify-between text-emerald-300"><span>License Plate:</span><strong className="tracking-wider">{order.metadata.plate_number || 'N/A'}</strong></div>
                        </div>
                      )}
                      {isCompleted && order.delivery_type === 'pickup' && (
                        <div className="bg-blue-950/20 border border-blue-900/30 p-2.5 rounded-xl text-[10px] font-mono text-blue-400 space-y-1 mt-2 shadow-inner">
                          <span className="uppercase font-bold tracking-wider border-b border-blue-900/50 pb-0.5 block flex items-center gap-1"><MapPin className="h-3 w-3" /> HQ Pickup Complete</span>
                          <p className="text-blue-300 leading-tight">Order securely handed over to client at the depot.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-stone-800 pt-3 flex items-center justify-between gap-2">
                      <button type="button" onClick={() => setSelectedPrintOrder(order)} className="bg-stone-955 hover:bg-stone-800 border border-stone-800 text-stone-300 font-mono text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1"><Printer className="h-3.5 w-3.5 text-cyan-400" /> <span>Print Slip</span></button>
                      
                      {!isCompleted && isPaid && (
                        <button 
                          type="button" 
                          disabled={updatingId === order.id} 
                          onClick={() => {
                            if (order.status === 'processing') {
                              setDispatchOrder(order);
                              setRiderName('');
                              setRiderPhone('');
                              setVehicleType('Motorbike');
                              setVehicleColor('');
                              setPlateNumber('');
                            } else {
                              handleUpdateFulfillmentState(order.id, 'processing');
                            }
                          }} 
                          className="bg-stone-800 hover:bg-stone-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded-lg border border-stone-700 flex items-center gap-1"
                        >
                          <PackageCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{order.status === 'processing' ? 'Dispatch Cargo' : 'Verify Handshake'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AMBASSADORS */}
        {activeTab === 'ambassadors' && (
          <div className="space-y-6">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
              <h3 className="text-xs font-bold font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5"><PlusCircle className="h-4 w-4 text-emerald-500" /> Onboard Human Ambassador Row</h3>
              <form onSubmit={handleCreateAmbassadorManualSubmit} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-stone-500 mb-1 font-bold text-[9px] uppercase">Ambassador Name</label><input type="text" required placeholder="e.g. Benjamin Baah Amoakwa" value={newAmbassadorName} onChange={(e) => setNewAmbassadorName(e.target.value)} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white font-bold outline-none" /></div>
                  <div><label className="block text-stone-500 mb-1 font-bold text-[9px] uppercase">Unique Code Handle</label><input type="text" required placeholder="e.g. SPK-BEN7" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white font-bold outline-none uppercase tracking-widest" /></div>
                  <div><label className="block text-stone-500 mb-1 font-bold text-[9px] uppercase">Contact Phone Line</label><input type="tel" required placeholder="e.g. 0547664422" value={newAmbassadorPhone} onChange={(e) => setNewAmbassadorPhone(e.target.value)} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none" /></div>
                  <div><label className="block text-stone-500 mb-1 font-bold text-[9px] uppercase">MoMo Wallet Number</label><input type="tel" placeholder="e.g. 0547664422" value={newAmbassadorMomo} onChange={(e) => setNewAmbassadorMomo(e.target.value)} className="w-full bg-stone-955 border border-stone-850 rounded-xl px-3 py-2 text-white outline-none" /></div>
                </div>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center uppercase text-[10px]">Deploy Partner Profile</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {humanAmbassadorsList.map((ref) => (
                <div key={ref.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide truncate max-w-[160px]">{ref.legal_name}</h4>
                        <span className="text-[10px] text-emerald-400 font-mono block mt-0.5 font-bold tracking-wider">Code: {ref.code}</span>
                      </div>
                      <button onClick={() => handleToggleCodeFlag(ref.id, 'is_active', ref.is_active)} className="text-stone-400 hover:text-white transition-colors">
                        {ref.is_active ? <ToggleRight className="h-6 w-6 text-emerald-500 fill-emerald-500/10" /> : <ToggleLeft className="h-6 w-6 text-stone-600" />}
                      </button>
                    </div>
                    <div className="bg-stone-955 border border-stone-800/60 rounded-xl p-3 text-[11px] font-mono space-y-1 text-stone-400">
                      <div className="flex justify-between"><span>Phone Line:</span><strong className="text-stone-200">{ref.phone_number}</strong></div>
                      <div className="flex justify-between"><span>Wallet Route:</span><strong className="text-stone-300">{ref.momo_number} ({ref.momo_network})</strong></div>
                      <div className="flex justify-between"><span>Ghana Card NIA ID:</span><strong className="text-stone-100 tracking-wider font-bold">{ref.ghana_card_number || 'MANUAL_LOG'}</strong></div>
                      <div className="flex justify-between border-t border-stone-900 pt-1 mt-1 font-bold"><span>Total Earnings:</span><strong className="text-emerald-400">₵{Number(ref.total_earnings).toFixed(2)}</strong></div>
                    </div>

                    {(ref.portrait_url || ref.ghana_card_url) && (
                      <div className="bg-stone-955 p-2.5 rounded-xl border border-stone-850/60 space-y-2">
                        <span className="text-[8px] text-stone-500 uppercase font-mono font-bold block border-b border-stone-900 pb-1">KYC Visual Attachments</span>
                        <div className="grid grid-cols-2 gap-2 text-[9px] text-center font-bold">
                          {ref.portrait_url ? (
                            <a href={ref.portrait_url} target="_blank" rel="noreferrer" className="p-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-lg text-stone-300 flex items-center justify-center gap-1.5 transition-colors"><Camera className="h-3.5 w-3.5 text-emerald-400" /> Live Selfie</a>
                          ) : <div className="p-2 bg-stone-900 text-stone-600 rounded-lg italic font-sans">No Face Pic</div>}
                          {ref.ghana_card_url ? (
                            <a href={ref.ghana_card_url} target="_blank" rel="noreferrer" className="p-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-lg text-stone-300 flex items-center justify-center gap-1.5 transition-colors"><CreditCard className="h-3.5 w-3.5 text-blue-400" /> Ghana Card</a>
                          ) : <div className="p-2 bg-stone-900 text-stone-600 rounded-lg italic font-sans">No Card Scan</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {!ref.is_verified && ref.status === 'pending_review' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      <button type="button" onClick={() => handleDeclineAmbassadorKYC(ref.id)} className="bg-red-955/40 hover:bg-red-900/40 text-red-400 border border-red-900/20 py-2 rounded-xl font-bold uppercase text-[9px] tracking-wider">Decline</button>
                      <button type="button" onClick={() => handleApproveAmbassadorKYC(ref.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-bold uppercase text-[9px] tracking-wider shadow-md">Approve KYC</button>
                    </div>
                  )}

                  <div className="border-t border-stone-800/60 pt-3 flex items-center justify-between gap-2">
                    <button onClick={() => handleMasterDeleteReferrerRecord(ref.id, ref.code)} className="p-2 text-stone-600 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROMO CODES */}
        {activeTab === 'promocodes' && (
          <div className="space-y-6">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
              <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5"><Tag className="h-4 w-4" /> Deploy Independent Promo Code Campaign</h3>
              <form onSubmit={handleCreatePromoCodeManualSubmit} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold uppercase text-[9px]">Promo Code Token</label>
                    <input type="text" required placeholder="e.g. BEMYVAL26" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white font-bold outline-none uppercase tracking-widest" />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-1 font-bold uppercase text-[9px]">Campaign Context Brief</label>
                    <input type="text" required placeholder="e.g. Valentine Day 2026 Special Pool" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white text-stone-200 outline-none" />
                  </div>
                </div>

                <div className="bg-stone-955 p-4 border border-stone-850 rounded-xl space-y-3">
                  <span className="font-bold text-cyan-400 text-[9px] uppercase tracking-wider block border-b border-stone-900 pb-1">Define Client Markdown Values (GHS Off Retail Price)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-stone-400">
                    <div><label className="text-[8px] font-bold block mb-1">300ml Discount</label><input type="number" step="0.01" value={promo300mlDiscount} className="w-full bg-stone-900 border text-white rounded px-2 py-1" /></div>
                    <div><label className="text-[8px] font-bold block mb-1">500ml Discount</label><input type="number" step="0.01" value={promo500mlDiscount} className="w-full bg-stone-900 border text-white rounded px-2 py-1" /></div>
                    <div><label className="text-[8px] font-bold block mb-1">1.5L Discount</label><input type="number" step="0.01" value={promo15LDiscount} className="w-full bg-stone-900 border text-white rounded px-2 py-1" /></div>
                    <div><label className="text-[8px] font-bold block mb-1">5L Discount</label><input type="number" step="0.01" value={promo5LDiscount} className="w-full bg-stone-900 border text-white rounded px-2 py-1" /></div>
                  </div>
                </div>

                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center uppercase text-[10px]">Launch Campaign Token</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purePromoCodesList.map((ref) => {
                const isEditingPromo = editingPromoId === ref.id;
                const discounts = promoDiscountsMap[ref.id] || { '300ml': 0.50, '500ml': 1.00, '1.5L': 2.00, '5L': 5.00 };
                return (
                  <div key={ref.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-black font-mono text-cyan-400 tracking-widest uppercase">#{ref.code}</span>
                        <button onClick={() => handleToggleCodeFlag(ref.id, 'is_active', ref.is_active)} className="text-stone-500">
                          {ref.is_active ? <span className="text-[8px] font-bold bg-cyan-955 text-cyan-400 border border-cyan-900 px-2 py-0.5 rounded">Active</span> : <span className="text-[8px] font-bold bg-stone-955 text-stone-600 border border-stone-850 px-2 py-0.5 rounded">Disabled</span>}
                        </button>
                      </div>
                      <p className="text-xs text-stone-400 font-mono mt-2 leading-relaxed"><strong className="text-stone-300">Context:</strong> {ref.campaign_name}</p>

                      <div className="mt-3 bg-stone-955 border border-stone-850 rounded-xl p-3 text-[10px] font-mono space-y-2 shadow-inner">
                        <div className="flex justify-between items-center border-b border-stone-900 pb-1">
                          <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider">Multi-Tier Parameter Overrides (GHS Off)</span>
                          {!isEditingPromo && (
                            <button type="button" onClick={() => {
                              setEditingPromoId(ref.id);
                              setEditPromo300ml(discounts['300ml'] || '0.50'); 
                              setEditPromo500ml(discounts['500ml'] || '1.00'); 
                              setEditPromo15L(discounts['1.5L'] || '2.00'); 
                              setEditPromo5L(discounts['5L'] || '5.00');
                            }} className="text-cyan-400 hover:underline font-bold text-[9px] flex items-center gap-0.5"><Edit3 className="h-2.5 w-2.5" /> Edit</button>
                          )}
                        </div>
                        {isEditingPromo ? (
                          <div className="space-y-2 pt-1">
                            <div className="grid grid-cols-2 gap-2 text-stone-400">
                              <div>300ml: <input type="number" step="0.01" value={editPromo300ml} className="w-16 bg-stone-900 border rounded text-center text-white" /></div>
                              <div>500ml: <input type="number" step="0.01" value={editPromo500ml} className="w-16 bg-stone-900 border rounded text-center text-white" /></div>
                              <div>1.5L: <input type="number" step="0.01" value={editPromo15L} className="w-16 bg-stone-900 border rounded text-center text-white" /></div>
                              <div>5L: <input type="number" step="0.01" value={editPromo5L} className="w-16 bg-stone-900 border rounded text-center text-white" /></div>
                            </div>
                            <button type="button" onClick={() => handleSavePromoCodeOverride(ref.id)} className="w-full bg-cyan-600 text-white font-bold py-1 rounded flex items-center justify-center gap-1 shadow-md uppercase text-[9px] tracking-wider"><Save className="h-3 w-3" /> Save Changes</button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-y-1 text-stone-400">
                            <div>300ml: <strong className="text-white">₵{Number(discounts['300ml']).toFixed(2)}</strong></div>
                            <div>500ml: <strong className="text-white">₵{Number(discounts['500ml']).toFixed(2)}</strong></div>
                            <div>1.5L: <strong className="text-white">₵{Number(discounts['1.5L']).toFixed(2)}</strong></div>
                            <div>5L: <strong className="text-white">₵{Number(discounts['5L']).toFixed(2)}</strong></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-stone-800 pt-3 flex justify-between items-center text-[10px] font-mono text-stone-500">
                      <span>Linked Campaign Node</span>
                      <button onClick={() => handleMasterDeleteReferrerRecord(ref.id, ref.code)} className="text-stone-600 hover:text-red-400 p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: CASHOUTS */}
        {activeTab === 'cashouts' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="border-b border-stone-800 pb-2 flex items-center justify-between text-emerald-400 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Paystack Mobile Money Cashout Ledger Queue ({cashouts.filter(c => c.status === 'pending').length})</h2>
              </div>
              <button onClick={() => triggerExcelSpreadsheetDownloadAction('Cashouts', cashouts)} className="text-emerald-400 hover:underline flex items-center gap-1 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl font-bold text-[10px]"><Download className="h-3.5 w-3.5" /> <span>Export Cashouts CSV Ledger</span></button>
            </div>
            {cashouts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-800 rounded-2xl bg-stone-900/10 text-stone-500">No active withdrawal requests requests in the ledger queue.</div>
            ) : (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-500 font-bold uppercase text-[9px] pb-2">
                      <th className="pb-2">Ambassador Name</th>
                      <th className="pb-2">MoMo Route Details</th>
                      <th className="pb-2 text-right">Gross Amount</th>
                      <th className="pb-2 text-right">10% Tax Cut</th>
                      <th className="pb-2 text-right">Net Payout</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-center">Action Framework</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 text-stone-300">
                    {cashouts.map((ticket) => {
                      const isPending = ticket.status === 'pending';
                      return (
                        <tr key={ticket.id} className="hover:bg-stone-955/40">
                          <td className="py-3.5">
                            <div className="font-bold text-white uppercase">{ticket.referral_codes?.legal_name || 'System Admin'}</div>
                            <div className="text-[10px] text-emerald-400 font-bold">{ticket.referral_codes?.code}</div>
                          </td>
                          <td className="py-3.5 text-stone-400">
                            <div>Line: {ticket.referral_codes?.momo_number}</div>
                            <div className="text-[10px] text-stone-500 uppercase">Provider: {ticket.referral_codes?.momo_network}</div>
                          </td>
                          <td className="py-3.5 text-right font-bold">₵{Number(ticket.gross_amount).toFixed(2)}</td>
                          <td className="py-3.5 text-right text-red-400/80">₵{Number(ticket.wht_deducted).toFixed(2)}</td>
                          <td className="py-3.5 text-right font-black text-emerald-400 text-sm">₵{Number(ticket.net_payout).toFixed(2)}</td>
                          <td className="py-3.5 text-center"><span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${isPending ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{ticket.status}</span></td>
                          <td className="py-3.5 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleTriggerCashoutDeclineRollback(ticket.id, ticket.referral_codes?.legal_name)} disabled={updatingId === `payout-${ticket.id}`} className="bg-red-955/40 hover:bg-red-900/40 text-red-400 border border-red-900/20 px-2 py-1.5 rounded-lg font-bold">Decline & Refund</button>
                                <button onClick={() => handleTriggerPaystackMoMoTransfer(ticket.id)} disabled={updatingId === `payout-${ticket.id}`} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-md">
                                  Release Payout
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-600 font-medium tracking-wide capitalize">{ticket.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STOCK MATRIX */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {lowStockAlertInventoryBin.length > 0 && (
              <div className="bg-red-955/20 border-2 border-red-900/40 rounded-[24px] p-5 space-y-3 font-mono text-xs shadow-xl animate-pulse">
                <div className="flex items-center gap-2 text-red-400 font-black tracking-wider uppercase text-[10px]">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <span>⚠️ System Critical: Automated Low Stock Alerts Threshold Tripped</span>
                </div>
                <p className="text-stone-400 font-sans text-[11px] font-light leading-relaxed">
                  The following flavor variations are at or below the minimum system safety ceiling (**20 units remaining**).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {lowStockAlertInventoryBin.map(variant => (
                    <div key={`alert-card-${variant.id}`} className="bg-stone-950 border border-red-900/30 p-3 rounded-xl flex justify-between items-center text-[11px] font-bold">
                      <div className="space-y-0.5">
                        <span className="text-white uppercase truncate block max-w-[120px]">{variant.flavorName}</span>
                        <span className="text-[9px] bg-stone-900 text-stone-455 border px-1.5 py-0.2 rounded uppercase inline-block">{variant.size}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-stone-500 uppercase block font-black">Remaining:</span>
                        <span className="text-sm font-black text-red-400">{variant.stock_quantity} Btls</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
              <h3 className="text-xs font-bold font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5"><PlusCircle className="h-4 w-4 text-emerald-500" /> Launch New Flavor Line Natively</h3>
              <form onSubmit={handleAddNewProductFlavor} className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" required placeholder="Flavor Name" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white outline-none" />
                  <input type="text" placeholder="Description Copy" value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 outline-none" />
                </div>
                <button type="submit" className="bg-emerald-600 text-white font-mono text-[10px] font-bold py-2 px-4 rounded-xl">Deploy Flavor</button>
              </form>
            </div>

            <div className="space-y-6">
              {products.map((product) => (
                <div key={product.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex justify-between items-baseline border-b border-stone-800/60 pb-2"><h3 className="font-serif font-serif font-bold text-base text-white">{product.name}</h3></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {product.product_variants?.map((variant) => {
                      const isEditing = editingVariantId === variant.id;
                      const isLowStock = variant.stock_quantity <= 20;
                      return (
                        <div key={variant.id} className={`bg-stone-955 border ${isLowStock ? 'border-red-950 bg-gradient-to-b from-stone-955 to-red-950/10' : 'border-stone-800'} rounded-xl p-5 flex flex-col justify-between space-y-3`}>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] bg-stone-800 text-stone-200 px-2 py-0.5 rounded font-mono font-bold uppercase">{variant.size}</span>
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${isLowStock ? 'bg-red-500/10 text-red-400 border-red-900/30 animate-pulse' : 'bg-stone-900 text-stone-500 border-stone-800'}`}>{isLowStock ? 'Low Stock' : 'Stable'}</span>
                          </div>

                          {variant.image_url && (
                            <div className="h-24 w-full bg-stone-950 rounded-xl border border-stone-850 p-1 flex items-center justify-center overflow-hidden">
                              <img src={variant.image_url} alt={variant.sku} className="h-full object-contain" />
                            </div>
                          )}

                          <div className="border-t border-stone-900 pt-2 space-y-1.5 text-[11px] font-mono">
                            {isEditing ? (
                              <div className="space-y-2 text-stone-400">
                                <div><label className="text-[8px] font-bold uppercase">Stock Count</label><input type="number" value={editStock} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                                <div><label className="text-[8px] text-cyan-400 font-bold uppercase">Base Size MOQ Floor</label><input type="number" value={editSizeMoqFloor} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                                <div><label className="text-[8px] text-blue-400 font-bold uppercase">Wholesale Volume Trigger</label><input type="number" value={editWholesaleTrigger} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                                <div><label className="text-[8px] text-red-400 font-bold uppercase">Default Referral Discount</label><input type="number" step="0.01" value={editClientDiscount} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                                <div><label className="text-[8px] text-purple-400 font-bold uppercase">Ambassador Bonus Earning</label><input type="number" step="0.01" value={editReferrerEarnings} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                                <div><label className="text-[8px] text-emerald-400 font-bold uppercase">Retail Price (₵)</label><input type="number" step="0.01" value={editRetail} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                                <div><label className="text-[8px] text-amber-500 font-bold uppercase">Wholesale Price (₵)</label><input type="number" step="0.01" value={editWholesale} className="w-full bg-stone-900 border text-white px-2 py-0.5 rounded" /></div>
                              </div>
                            ) : (
                              <div className="space-y-1.5 text-stone-400 font-medium">
                                <div className="flex justify-between"><span>Stock Remaining:</span><strong className={isLowStock ? 'text-red-400 font-black' : 'text-white'}>{variant.stock_quantity} units</strong></div>
                                <div className="flex justify-between text-cyan-400/90"><span>Base Size MOQ:</span><strong>{variant.size_moq_floor || 30} units</strong></div>
                                <div className="flex justify-between text-blue-400/90"><span>Wholesale Trigger:</span><strong>{variant.moq_floor || 50} units</strong></div>
                                <div className="flex justify-between text-red-400/90 border-t border-stone-900 pt-1"><span>Referral Discount:</span><strong>₵{Number(variant.client_discount || 0).toFixed(2)}</strong></div>
                                <div className="flex justify-between text-purple-400/90"><span>Ambassador Bonus:</span><strong>₵{Number(variant.referrer_earnings || 0).toFixed(2)}</strong></div>
                                <div className="flex justify-between border-t border-stone-900 pt-1"><span>Retail Cost:</span><strong className="text-emerald-400">₵{Number(variant.retail_price).toFixed(2)}</strong></div>
                                <div className="flex justify-between"><span>Wholesale Cost:</span><strong className="text-amber-400">₵{Number(variant.wholesale_price).toFixed(2)}</strong></div>
                                
                                <div className="pt-2 border-t border-stone-900 flex flex-col gap-1">
                                  <span className="text-[8px] text-stone-500 uppercase font-bold">Variant Graphic:</span>
                                  <label className="cursor-pointer bg-stone-900 hover:bg-stone-850 border border-stone-800 px-2 py-1.5 rounded text-center flex items-center justify-center gap-1 text-[10px] text-stone-300 font-bold">
                                    <Upload className="h-3 w-3 text-emerald-400" />
                                    <span>Upload Graphic</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => handleImageUploadEngine(e, `${variant.id}-img`, 'inventory', variant.id)} 
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="pt-2">
                            {isEditing ? (
                              <button onClick={() => handleSaveVariantChanges(variant.id)} className="w-full bg-emerald-600 text-white font-mono text-[10px] font-bold py-1 rounded-lg">Save</button>
                            ) : (
                              <button onClick={() => { 
                                setEditingVariantId(variant.id); 
                                setEditStock(variant.stock_quantity); 
                                setEditRetail(variant.retail_price); 
                                setEditWholesale(variant.wholesale_price);
                                setEditSizeMoqFloor(variant.size_moq_floor || 30);
                                setEditWholesaleTrigger(variant.moq_floor || 50);
                                setEditClientDiscount(variant.client_discount || 0);
                                setEditReferrerEarnings(variant.referrer_earnings || 0);
                              }} className="w-full bg-stone-800 text-stone-300 font-mono text-[10px] font-bold py-1 rounded-lg border border-stone-750">Edit</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Web CMS */}
        {activeTab === 'cms' && (
          <form onSubmit={(e) => { e.preventDefault(); updateSiteSettingsAdmin(cmsContent).then(() => alert("All Web CMS Content Published Live Successfully!")); }} className="space-y-8 max-w-4xl mx-auto font-mono text-xs text-left">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider flex items-center gap-1"><Printer className="h-4 w-4" /> Receipt Header Brand Configurations</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={cmsContent.receipt_name || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, receipt_name: e.target.value }))} placeholder="Receipt Company Header Title" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white font-bold" />
                  <input type="text" value={cmsContent.receipt_subtitle || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, receipt_subtitle: e.target.value }))} placeholder="Fulfillment Node Subtitle Address" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-stone-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="email" value={cmsContent.receipt_email || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, receipt_email: e.target.value }))} placeholder="Support Desk Email Line" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white" />
                  <input type="text" value={cmsContent.receipt_phone || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, receipt_phone: e.target.value }))} placeholder="Hotline Dispatch Contact Number" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div className="pt-1.5 space-y-1">
                  <label className="text-[9px] text-stone-400 uppercase block font-bold">Dynamic Receipt Brand Logo Graphic</label>
                  <label className="cursor-pointer bg-stone-955 hover:bg-stone-850 border border-stone-800/80 rounded-xl p-3 text-center flex items-center justify-center gap-1.5 font-bold text-stone-300 transition-colors shadow-inner">
                    <Upload className="h-4 w-4 text-emerald-500" />
                    <span>{cmsContent.receipt_logo ? 'Receipt Custom Logo Loaded ✓' : 'Upload Receipt Slip Branding Image'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUploadEngine(e, 'receipt_logo', 'cms')} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1"><LayoutGrid className="h-3.5 w-3.5" /> Section 1: Hero Cover Elements</h3>
              <div className="space-y-3">
                <input type="text" required placeholder="Main Heading Title Text" value={cmsContent.hero_title || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, hero_title: e.target.value }))} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white font-bold" />
                <textarea rows="2" required placeholder="Hero Subtext Subtitle Paragraph Copy..." value={cmsContent.hero_subtitle || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, hero_subtitle: e.target.value }))} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 outline-none" />
                <label className="w-full bg-stone-955 hover:bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-stone-300 text-center flex items-center justify-center gap-2 font-bold cursor-pointer">
                  <Upload className="h-4 w-4 text-emerald-500" />
                  <span>Browse & Upload Background Cover Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUploadEngine(e, 'hero_image', 'cms')} 
                  />
                </label>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Section 2: Founders Narrative Block</h3>
              <div className="space-y-3">
                <input type="text" required placeholder="Story Block Headline Title" value={cmsContent.story_title || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, story_title: e.target.value }))} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white font-bold" />
                <textarea rows="3" required placeholder="Paragraph 1 Body Copy Text..." value={cmsContent.story_p1 || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, story_p1: e.target.value }))} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 outline-none" />
                <textarea rows="3" required placeholder="Paragraph 2 Body Copy Text..." value={cmsContent.story_p2 || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, story_p2: e.target.value }))} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-stone-300 outline-none" />
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1"><User className="h-3.5 w-3.5" /> Section 3: Executive Leadership Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="bg-stone-955 p-4 border border-stone-850 rounded-xl space-y-2.5">
                    <span className="font-bold text-stone-400 text-[9px] uppercase tracking-wide block border-b border-stone-900 pb-1">Leader Profile #{num}</span>
                    <input type="text" required placeholder="Full Legal Name" value={cmsContent[`team_m${num}_name`] || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, [`team_m${num}_name`]: e.target.value }))} className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-white" />
                    <input type="text" required placeholder="Corporate Role / Title" value={cmsContent[`team_m${num}_role`] || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, [`team_m${num}_role`]: e.target.value }))} className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-stone-400" />
                    <label className="cursor-pointer bg-stone-900 border border-stone-800 py-1 rounded text-center text-[10px] font-bold flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3 text-emerald-500" />
                      <span>Upload Portrait Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUploadEngine(e, `team_m${num}_img`, 'cms')} 
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Section 4: Curated Media Gallery Framework</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((gNum) => (
                  <div key={gNum} className="bg-stone-955 p-3 border border-stone-850 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-cyan-400 text-[8px] uppercase tracking-wider block">Gallery Item {gNum}</span>
                      <input type="text" required placeholder="Artwork Caption" value={cmsContent[`gallery_${gNum}_title`] || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, [`gallery_${gNum}_title`]: e.target.value }))} className="w-full bg-stone-900 border border-stone-850 rounded px-2 py-1 text-white text-[10px] mt-1" />
                    </div>
                    <label className="cursor-pointer bg-stone-900 border border-stone-800 py-1 rounded text-center text-[9px] font-bold flex items-center justify-center gap-1">
                      <Upload className="h-3 w-3 text-emerald-500" />
                      <span>Upload File</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUploadEngine(e, `gallery_${gNum}_img`, 'cms')} 
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white uppercase text-[10px] tracking-wider text-emerald-400 flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Section 5: Custom Event Packaging Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((pkgNum) => (
                  <div key={pkgNum} className="bg-stone-955 p-4 border border-stone-850 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <span className="font-bold text-emerald-400 text-[10px] block border-b border-stone-900 pb-1 uppercase tracking-wider">Custom Option Tier {pkgNum}</span>
                      <input type="text" placeholder="Package Display Title" value={cmsContent[`pkg_${pkgNum}_title`] || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, [`pkg_${pkgNum}_title`]: e.target.value }))} className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-white" />
                      <textarea rows="2" placeholder="Package Scope Brief Copy Details..." value={cmsContent[`pkg_${pkgNum}_desc`] || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, [`pkg_${pkgNum}_desc`]: e.target.value }))} className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1 text-stone-300 outline-none" />
                      <input type="text" placeholder="Estimated Unit Pricing Note" value={cmsContent[`pkg_${pkgNum}_price`] || ''} onChange={(e) => setCmsContent(prev => ({ ...prev, [`pkg_${pkgNum}_price`]: e.target.value }))} className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-blue-400 font-bold" />
                    </div>
                    <label className="cursor-pointer bg-stone-900 border border-stone-800 py-2 rounded text-center text-[10px] font-bold flex items-center justify-center gap-1 mt-2 shadow-inner">
                      <Upload className="h-3 w-3 text-emerald-500" />
                      <span>Upload Custom Sample Mockup Graphic</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUploadEngine(e, `pkg_${pkgNum}_img`, 'cms')} 
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right pt-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-md text-[11px]">Publish Live Settings Modules</button>
            </div>
          </form>
        )}
      </main>

      {/* RIDER DISPATCH MODAL OVERLAY */}
      {dispatchOrder && (
        <div className="fixed inset-0 bg-stone-955/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-[32px] max-w-sm w-full p-6 space-y-6 shadow-2xl relative font-sans">
            <button type="button" onClick={() => setDispatchOrder(null)} className="absolute right-4 top-4 p-1 rounded-lg bg-stone-955 hover:bg-stone-850 text-stone-400 border border-stone-800"><X className="h-4 w-4" /></button>
            
            <div className="space-y-1">
              <h2 className="text-sm font-black uppercase text-emerald-400 tracking-wider">
                {dispatchOrder.delivery_type === 'delivery' ? 'Assign Dispatch Logistics' : 'Complete HQ Handover'}
              </h2>
              <p className="text-[10px] text-stone-400 font-mono">Ref: #{dispatchOrder.id.substring(0,8).toUpperCase()} • Client: {dispatchOrder.customer_name}</p>
            </div>

            <form onSubmit={handleConfirmDispatchLogistics} className="space-y-4 font-mono text-xs">
              
              {dispatchOrder.delivery_type === 'delivery' ? (
                <>
                  <div>
                    <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Rider Full Name</label>
                    <input type="text" required value={riderName} onChange={(e) => setRiderName(e.target.value)} placeholder="e.g. Samuel Osei" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 outline-none text-white focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Rider Contact Line</label>
                    <input type="tel" required value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="e.g. 0244123456" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 outline-none text-white focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Vehicle Type</label>
                      <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 appearance-none">
                        <option value="Motorbike">Motorbike</option>
                        <option value="Car">Car</option>
                        <option value="Van/Truck">Van/Truck</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Vehicle Color</label>
                      <input type="text" required value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="e.g. Blue" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 outline-none text-white focus:border-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">License Plate Number</label>
                    <input type="text" required value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="e.g. GT-1234-21" className="w-full bg-stone-955 border border-stone-800 rounded-xl px-3 py-2 outline-none text-white focus:border-emerald-500 uppercase tracking-widest" />
                  </div>

                  <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/40 text-[9px] text-emerald-400 leading-relaxed font-sans mt-2 shadow-inner">
                    <Info className="h-3 w-3 inline mr-1 mb-0.5" />
                    Submitting this logs the rider details for internal tracking and prepares the payload string for the customer's SMS notification.
                  </div>
                </>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl text-center space-y-2">
                  <MapPin className="h-6 w-6 text-emerald-500 mx-auto" />
                  <h4 className="text-emerald-400 font-bold uppercase text-[10px]">HQ Self-Pickup</h4>
                  <p className="text-[9px] text-emerald-200/70 font-sans leading-relaxed">This customer selected self-pickup. Click confirm below once the cargo has been securely handed over at the depot.</p>
                </div>
              )}

              <button type="submit" disabled={updatingId === `dispatch-${dispatchOrder.id}`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-wide py-3 rounded-xl shadow-md disabled:opacity-40">
                {dispatchOrder.delivery_type === 'delivery' ? 'Confirm Dispatch & Notify' : 'Confirm Handover & Notify'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINT DIALOG SLIP MODAL DISPLAY */}
      {selectedPrintOrder && (
        <div className="fixed inset-0 bg-stone-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white text-stone-950 rounded-[32px] border border-stone-200 max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative print:border-0 print:shadow-none print:p-0 font-sans">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3 print:hidden">
              <span className="font-bold text-xs font-mono">LOGISTICAL MANIFEST SLIP</span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="bg-emerald-600 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded-xl uppercase shadow-sm">Print</button>
                <button onClick={() => setSelectedPrintOrder(null)} className="p-1 text-stone-400 hover:text-stone-750 bg-stone-50 rounded-lg border"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-6 text-xs text-stone-800">
              <div className="flex justify-between items-start border-b-2 border-stone-950 pb-4">
                <div className="flex items-center gap-2.5">
                  {cmsContent.receipt_logo && (
                    <img src={cmsContent.receipt_logo} alt="Receipt Logo" className="h-12 w-12 object-contain rounded-xl border bg-stone-50 p-1 shadow-inner" />
                  )}
                  <div className="space-y-0.5">
                    <h2 className="text-base font-black uppercase text-emerald-955">{cmsContent.receipt_name || 'Sparkle Beverages Ltd.'}</h2>
                    <p className="text-[10px] text-stone-500 font-mono font-medium">{cmsContent.receipt_subtitle || 'Accra, Ghana'}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-black text-stone-955">#SPK-{selectedPrintOrder.id.substring(0, 8).toUpperCase()}</div>
                  <div className="text-[9px] text-stone-400">{new Date(selectedPrintOrder.created_at).toLocaleString('en-GH')}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border font-mono text-[11px]">
                <div>
                  <span className="text-[8px] text-stone-400 font-bold block uppercase">Client Details</span>
                  <div className="font-bold text-stone-900">{selectedPrintOrder.customer_name}</div>
                  <div>Phone: {selectedPrintOrder.customer_phone}</div>
                </div>
                <div>
                  <span className="text-[8px] text-stone-400 font-bold block uppercase">Logistics Route</span>
                  <div className="text-cyan-800 font-black">{selectedPrintOrder.landmark || 'HQ Self-Pickup Depot'}</div>
                </div>
              </div>
              <div className="border border-stone-200 rounded-xl overflow-hidden font-mono text-[11px]">
                <div className="bg-stone-955 text-white font-bold grid grid-cols-4 p-2.5 uppercase text-[9px] print:bg-stone-900 text-center">
                  <div className="col-span-2 text-left">Fulfillment Package Selection</div>
                  <div>Sizing</div>
                  <div className="text-right">Price Allocation</div>
                </div>
                <div className="divide-y divide-stone-100 px-1 text-stone-700">
                  {printOrderItems.length === 0 ? (
                    <div className="grid grid-cols-4 py-3 text-center items-center font-sans font-medium text-stone-900 px-2">
                      <div className="col-span-2 text-left font-bold uppercase text-emerald-955 flex flex-col">
                        <span>Sparkle Fresh Mixed Beverages</span>
                        <span className="text-[9px] font-mono text-stone-400 font-light">Custom Storefront Checkout Manifest Batch</span>
                      </div>
                      <div className="font-mono text-stone-500 uppercase">Batch</div>
                      <div className="text-right font-mono font-black text-emerald-800">₵{Number(selectedPrintOrder.total_amount).toFixed(2)}</div>
                    </div>
                  ) : (
                    printOrderItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 py-2.5 text-center items-center font-sans font-medium text-stone-900 text-[11px] px-2">
                        <div className="col-span-2 text-left font-bold uppercase text-emerald-955 flex flex-col">
                          <span>{item.flavor_title}</span>
                          <span className="text-[9px] font-mono text-stone-400 font-light">ID: #{item.id.substring(0,6).toUpperCase()}</span>
                        </div>
                        <div className="font-mono text-stone-500 uppercase">{item.size_title}</div>
                        <div className="text-right font-mono font-black text-emerald-800">{item.quantity} units / ₵{(Number(item.unit_price) * parseInt(item.quantity)).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="bg-stone-50 p-3 border-t-2 border-stone-950 font-mono text-right flex justify-between text-xs font-black text-stone-950 uppercase">
                  <span>Grand Total Bill:</span>
                  <span className="text-emerald-800">GHS {Number(selectedPrintOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}