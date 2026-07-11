'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, Tag, Trash2, Plus, Minus, ArrowRight, 
  Leaf, Sparkles, CheckCircle2, AlertCircle, Loader2, Info, Lock, ArrowLeft
} from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { createCustomerOrderServerAction } from '../actions/orders';

export default function ShopPage() {
  const supabase = createBrowserSupabaseClient();

  // Core Store Architecture States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Binary Gateway Choice Interface States
  const [gatewayStage, setGatewayStage] = useState('question'); // 'question', 'input_form', 'unlocked'
  const [gatewayInput, setGatewayInput] = useState('');
  const [gatewayError, setGatewayError] = useState(null);

  // Active Cart Tracking State
  const [cart, setCart] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null); 

  // Customer Profile Fields States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); 
  const [landmark, setLandmark] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Sync Store Catalog from Supabase on Mount
  useEffect(() => {
    async function fetchStoreCatalog() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, description, is_active,
            product_variants ( id, sku, size, retail_price, wholesale_price, stock_quantity, is_in_stock, size_moq_floor, moq_floor, client_discount, referrer_earnings, image_url )
          `)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreCatalog();
  }, []);

  const handleVerifyGatewayCode = async (e) => {
    e.preventDefault();
    if (!gatewayInput) return;

    setLoading(true);
    setGatewayError(null);

    try {
      const cleanInputCode = gatewayInput.trim().toUpperCase();

      const { data: couponProfile, error: queryError } = await supabase
        .from('referral_codes')
        .select('id, code, is_active, is_verified, campaign_name')
        .eq('code', cleanInputCode)
        .single();

      if (queryError || !couponProfile) {
        throw new Error("Invalid Code: Code spelling mismatched or unrecognized.");
      }

      if (!couponProfile.is_active || !couponProfile.is_verified) {
        throw new Error("Suspended Link: This promotional campaign matrix is currently offline.");
      }

      // Query relational rules table to gather specific custom sizing discount vectors overrides if created
      const { data: customDiscountRules } = await supabase
        .from('referral_discounts')
        .select('size, client_discount')
        .eq('referral_code_id', couponProfile.id);

      const ruleMappingDictionary = {};
      customDiscountRules?.forEach(rule => {
        ruleMappingDictionary[rule.size] = Number(rule.client_discount || 0);
      });

      setAppliedCoupon({ 
        profile: couponProfile,
        customDiscountsMap: ruleMappingDictionary
      });
      setGatewayStage('unlocked'); 

    } catch (err) {
      setGatewayError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemToCartChannel = (product, variant) => {
    setCart(prevCart => {
      const existingLineIndex = prevCart.findIndex(item => item.variant.id === variant.id);
      if (existingLineIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingLineIndex].quantity += 1;
        return updatedCart;
      }
      return [...prevCart, { product, variant, quantity: 1 }];
    });
  };

  const handleAdjustCartQuantityIndex = (variantId, adjustmentFactor) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.variant.id === variantId) {
          const calculatedNewQty = item.quantity + adjustmentFactor;
          return calculatedNewQty > 0 ? { ...item, quantity: calculatedNewQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveLineItemFromCart = (variantId) => {
    setCart(prevCart => prevCart.filter(item => item.variant.id !== variantId));
  };

  // =========================================================================
  // DYNAMIC PRICING & CART CALCULATOR MODULE
  // =========================================================================
  const computeItemizedCartSummaryValues = () => {
    let orderGrossSubtotal = 0;
    const combinedQuantityMapBySizeGroup = {};

    cart.forEach(item => {
      const sizeKey = item.variant.size;
      combinedQuantityMapBySizeGroup[sizeKey] = (combinedQuantityMapBySizeGroup[sizeKey] || 0) + Number(item.quantity);
    });

    const formattedListOutput = cart.map(item => {
      const quantityCount = Number(item.quantity);
      const sizeKey = item.variant.size;

      const runningSizeMoqFloorLimit = parseInt(item.variant.size_moq_floor) || 1;
      const singleItemWholesaleTriggerLimit = parseInt(item.variant.moq_floor) || 50;

      const isWholesalePriceTriggered = quantityCount >= singleItemWholesaleTriggerLimit;
      const isMixedMoqSatisfiedForThisSize = (combinedQuantityMapBySizeGroup[sizeKey] || 0) >= runningSizeMoqFloorLimit;
      
      let baseUnitPriceToCalculate = Number(item.variant.retail_price);
      let discountAllowedPerUnit = 0;

      if (appliedCoupon) {
        baseUnitPriceToCalculate = Number(item.variant.retail_price);
        const hasCustomOverrideVal = appliedCoupon.customDiscountsMap && appliedCoupon.customDiscountsMap[sizeKey] !== undefined;
        discountAllowedPerUnit = hasCustomOverrideVal 
          ? Number(appliedCoupon.customDiscountsMap[sizeKey]) 
          : Number(item.variant.client_discount || 0);
      } else if (isWholesalePriceTriggered) {
        baseUnitPriceToCalculate = Number(item.variant.wholesale_price);
        discountAllowedPerUnit = 0;
      }

      const computedLineUnitCost = baseUnitPriceToCalculate - discountAllowedPerUnit;
      const computedLineTotalAmount = computedLineUnitCost * quantityCount;

      orderGrossSubtotal += computedLineTotalAmount;

      return {
        ...item,
        isWholesaleTierTriggered: isWholesalePriceTriggered,
        isMixedMoqSatisfiedForThisSize,
        requiredMoqSizeFloorValue: runningSizeMoqFloorLimit,
        currentTotalUnitsInThisSizeGroup: combinedQuantityMapBySizeGroup[sizeKey] || 0,
        singleUnitCost: computedLineUnitCost,
        discountAllowedPerUnit,
        lineTotal: computedLineTotalAmount
      };
    });

    return {
      compiledItemsList: formattedListOutput,
      finalOrderBillTotal: orderGrossSubtotal
    };
  };

  const { compiledItemsList, finalOrderBillTotal } = computeItemizedCartSummaryValues();

  const handleLaunchPaystackPaymentPortalGateway = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Checkout Halted: Your shopping cart container lines are empty.");
    if (!customerName || !customerPhone) return alert("Checkout Halted: Please fill out your contact details sheets.");

    // GLOBAL MOQ VALIDATION FILTER CHECKPOINT
    for (const line of compiledItemsList) {
      if (!line.isMixedMoqSatisfiedForThisSize) {
        alert(`Minimum Order Quantity Not Met:\n\nTo purchase items in our ${line.variant.size} selection package, you must order a combined mixed batch of at least ${line.requiredMoqSizeFloorValue} total units across any combination of flavors in that size group.\n\nYour current mixed basket total for ${line.variant.size} stands at: ${line.currentTotalUnitsInThisSizeGroup} units.`);
        return;
      }
    }

    setIsSubmittingOrder(true);

    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType: deliveryType,
      landmark: landmark.trim(),
      totalAmount: finalOrderBillTotal,
      metadata: {
        applied_code: appliedCoupon?.profile?.code || null,
        code_id: appliedCoupon?.profile?.id || null,
        payout_processed: false,
        calculated_payout_amount: 0
      }
    };
    
    const response = await createCustomerOrderServerAction(orderPayload, compiledItemsList);
    
    if (response.success && response.authorizationUrl) {
      window.location.href = response.authorizationUrl; 
    } else {
      alert(`Transaction Refusal: ${response.error || 'Gateway connection error'}`);
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased font-sans pb-24 selection:bg-emerald-600 selection:text-white">
      
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/60 py-4 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Logo" className="h-12 object-contain" />
          <div className="h-6 w-px bg-stone-200 hidden sm:block" />
          <span className="text-xs font-serif font-black text-emerald-950 uppercase tracking-tight hidden sm:inline-block">Storefront Menu</span>
          {appliedCoupon && (
            <span className="text-[10px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded-lg border border-emerald-700 shadow-sm ml-2">Active Link: {appliedCoupon.profile.code}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => { setAppliedCoupon(null); setGatewayInput(''); setGatewayStage('question'); setCart([]); }} 
            className="text-[11px] font-mono font-bold text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> <span>Reset Profile</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <section className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {products.map((product) => 
            product.product_variants?.map((variant) => {
              const isOutOfStock = !variant.is_in_stock || variant.stock_quantity <= 0;
              
              const activeUnitDiscount = appliedCoupon 
                ? (appliedCoupon.customDiscountsMap[variant.size] !== undefined ? Number(appliedCoupon.customDiscountsMap[variant.size]) : Number(variant.client_discount || 0))
                : 0;
              const displayedCostPaidPerBottle = Number(variant.retail_price) - activeUnitDiscount;

              return (
                <div key={variant.id} className="bg-white border border-stone-200/60 rounded-[28px] p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif font-black text-emerald-955 uppercase text-md leading-tight">{product.name}</h4>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono font-bold uppercase mt-1 inline-block">{variant.size}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${isOutOfStock ? 'bg-red-50 border-red-100 text-red-500' : 'bg-green-50 border-green-100 text-emerald-600'}`}>{isOutOfStock ? 'Sold Out' : 'Active Stock'}</span>
                  </div>

                  {variant.image_url && (
                    <div className="h-40 w-full bg-stone-50 rounded-xl border border-stone-100 p-2 overflow-hidden flex items-center justify-center">
                      <img src={variant.image_url} alt={variant.sku} className="h-full object-contain" />
                    </div>
                  )}

                  <div className="bg-stone-50/60 border border-stone-200/40 p-3 rounded-xl text-[11px] font-mono space-y-1 text-stone-500 shadow-inner">
                    {appliedCoupon ? (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-stone-400 line-through"><span>Standard Price:</span><span>₵{Number(variant.retail_price).toFixed(2)}</span></div>
                        <div className="flex justify-between text-emerald-700 font-bold"><span>Your Discount Rate:</span><strong>₵{displayedCostPaidPerBottle.toFixed(2)}</strong></div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="flex justify-between"><span>Retail Price:</span><strong className="text-stone-800">₵{Number(variant.retail_price).toFixed(2)}</strong></div>
                        <div className="flex justify-between text-emerald-600 font-bold"><span>Wholesale Tier:</span><strong>₵{Number(variant.wholesale_price).toFixed(2)}</strong></div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button" disabled={isOutOfStock}
                    onClick={() => handleAddItemToCartChannel(product, variant)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 text-white disabled:text-stone-400 font-mono font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 uppercase transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> <span>Add To Basket</span>
                  </button>
                </div>
              );
            })
          )}
        </section>

        <section className="bg-white border border-stone-200/80 rounded-[32px] p-5 md:p-6 shadow-xl space-y-6 lg:sticky lg:top-24">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2 text-emerald-955 font-serif font-black uppercase text-base">
            <ShoppingBag className="h-5 w-5 text-emerald-600 fill-emerald-600/10" />
            <h3>Your Cart</h3>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-stone-200 rounded-2xl bg-stone-50/60 font-mono text-stone-400 text-xs space-y-1">
              <ShoppingBag className="h-6 w-6 mx-auto text-stone-300" />
              <p>Your shopping basket is empty.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 border-b border-stone-100 pb-4">
              {compiledItemsList.map((item) => (
                <div key={item.variant.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200/40 flex flex-col justify-between space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h5 className="font-serif font-bold text-emerald-955 uppercase text-[11px] leading-snug">{item.product.name}</h5>
                      <span className="text-[10px] bg-stone-200 px-1.5 py-0.2 rounded font-bold uppercase">{item.variant.size}</span>
                      {item.isWholesaleTierTriggered && !appliedCoupon && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-1 rounded font-bold ml-1 uppercase">Wholesale Applied</span>
                      )}
                    </div>
                    <button onClick={() => handleRemoveLineItemFromCart(item.variant.id)} className="text-stone-400 hover:text-red-500 p-0.5"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-stone-200/40">
                    <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-0.5">
                      <button onClick={() => handleAdjustCartQuantityIndex(item.variant.id, -1)} className="p-1 text-stone-500 hover:bg-stone-100 rounded"><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center font-bold text-[11px] text-stone-800">{item.quantity}</span>
                      <button onClick={() => handleAdjustCartQuantityIndex(item.variant.id, 1)} className="p-1 text-stone-500 hover:bg-stone-100 rounded"><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="font-black text-emerald-700 text-[13px]">₵{item.lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleLaunchPaystackPaymentPortalGateway} className="space-y-4 font-mono text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Your Full Name</label>
                <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full legal name" className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 rounded-xl px-3 py-2 outline-none text-stone-800" />
              </div>
              <div>
                <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Mobile Money Number</label>
                <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g., 0547664422" className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 rounded-xl px-3 py-2 outline-none text-stone-800 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-1.5 border border-stone-200 rounded-xl text-center">
                <button type="button" onClick={() => setDeliveryType('delivery')} className={`py-1.5 rounded-lg font-bold transition-all ${deliveryType === 'delivery' ? 'bg-white text-emerald-955 shadow-sm border border-stone-200/40' : 'text-stone-400'}`}>Dispatch Cargo</button>
                <button type="button" onClick={() => setDeliveryType('pickup')} className={`py-1.5 rounded-lg font-bold transition-all ${deliveryType === 'pickup' ? 'bg-white text-emerald-955 shadow-sm border border-stone-200/40' : 'text-stone-400'}`}>HQ Self Pickup</button>
              </div>
              {deliveryType === 'delivery' && (
                <div>
                  <label className="block text-stone-500 font-bold uppercase text-[9px] mb-1">Delivery Landmark Address</label>
                  <input type="text" required value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Near Airport Shell, Accra" className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 rounded-xl px-3 py-2 outline-none text-stone-800" />
                </div>
              )}
            </div>

            <div className="bg-stone-950 p-4 border border-stone-800 rounded-2xl space-y-1.5 text-stone-400 text-[11px] shadow-2xl relative">
              <div className="flex justify-between"><span>Subtotal Processing Gross:</span><span className="text-white font-bold">₵{finalOrderBillTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-blue-400"><span>Fulfillment Cargo Toll:</span><span className="font-bold">₵0.00 FREE</span></div>
              
              {compiledItemsList.map(line => {
                if (!line.isMixedMoqSatisfiedForThisSize) {
                  return (
                    <div key={`moq-alert-${line.variant.id}`} className="text-[9px] text-amber-400/90 bg-amber-955/20 p-2 border border-amber-900/20 rounded-lg flex gap-1.5 mt-1.5 leading-tight font-sans">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Minimum Order Quantity Not Met: Your cart features {line.currentTotalUnitsInThisSizeGroup} units of the {line.variant.size} tier. Please add at least {line.requiredMoqSizeFloorValue - line.currentTotalUnitsInThisSizeGroup} more combined items in this size group to qualify.</span>
                    </div>
                  );
                }
                return null;
              })}

              {appliedCoupon && (
                <div className="text-[9px] text-emerald-400 bg-emerald-955/40 p-2 border border-emerald-900/30 rounded-lg flex gap-1.5 mt-2 leading-normal font-sans">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Win-Win Strategy Applied: This order is tracked under a partner link session. The ambassador earns a direct conversion bounty.</span>
                </div>
              )}
              
              <div className="flex justify-between border-t border-stone-800 pt-2 mt-2 text-emerald-400 text-sm font-black uppercase">
                <span>Grand Final Order Bill:</span>
                <span>₵{finalOrderBillTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* 🚀 FIXED TEXT LAYER: Corrected text variables map perfectly without ellipsis or paths omissions */}
            <button 
              type="submit" disabled={isSubmittingOrder || cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-800 text-white disabled:text-stone-400 font-serif font-black text-xs py-3.5 rounded-xl transition-all uppercase tracking-wide shadow-md disabled:opacity-40"
            >
              <span>{isSubmittingOrder ? 'Making Payment' : 'Make Payment'}</span>
            </button>
          </form>
        </section>

      </main>
      
      {gatewayStage !== 'unlocked' && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white rounded-[36px] p-6 md:p-8 shadow-2xl border border-stone-200 text-center space-y-6">
            <div className="space-y-2">
              <img src="/SPARKLE BEV. LOGO A No BG.png" alt="Logo" className="h-20 mx-auto object-contain drop-shadow-sm" />
              <h2 className="text-xl font-serif font-black tracking-tight text-emerald-955 uppercase mt-2">Welcome to Sparkle Beverages</h2>
              <p className="text-xs text-stone-500 leading-relaxed font-light">Choose your entry profile route below to unlock our live production catalog panels.</p>
            </div>

            {gatewayStage === 'question' && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-mono font-bold text-emerald-955 text-center uppercase tracking-wide">Do you have a referral / promo code?</p>
                <div className="grid grid-cols-2 gap-4 pt-1 font-serif font-black text-xs uppercase tracking-wide">
                  <button 
                    type="button" 
                    onClick={() => setGatewayStage('input_form')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl shadow-md transition-all font-bold"
                  >
                    <span>Yes</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setGatewayStage('unlocked')}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 py-3.5 rounded-2xl transition-all font-bold"
                  >
                    <span>No</span>
                  </button>
                </div>
              </div>
            )}

            {gatewayStage === 'input_form' && (
              <form onSubmit={handleVerifyGatewayCode} className="space-y-4 font-mono text-xs text-left pt-1">
                <div>
                  <label className="block text-emerald-955 font-bold text-[9px] uppercase tracking-wide mb-1.5">Enter Code</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700" />
                    <input 
                      type="text" required autoFocus value={gatewayInput} 
                      onChange={(e) => setGatewayInput(e.target.value.toUpperCase())} 
                      placeholder="e.g., SPK-XY7F8" 
                      className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 outline-none text-stone-900 font-bold tracking-widest text-sm uppercase" 
                    />
                  </div>
                </div>

                {gatewayError && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-[11px] font-medium text-red-700 flex gap-2 font-sans leading-relaxed">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{gatewayError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button 
                    type="button" 
                    onClick={() => { setGatewayStage('question'); setGatewayError(null); }}
                    className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl transition-all text-center uppercase text-[10px]"
                  >
                    Back
                  </button>
                  <button type="submit" className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase text-[11px] tracking-wide">
                    <span>Verify Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}