'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, Tag, Trash2, Plus, Minus, ArrowRight, 
  Leaf, Sparkles, CheckCircle2, AlertCircle, Loader2, Info, Lock, ArrowLeft, X, Zap, Key, Phone, Mail, MessageCircle
} from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { createCustomerOrderServerAction } from '../actions/orders';

export default function ShopPage() {
  const supabase = createBrowserSupabaseClient();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [gatewayStage, setGatewayStage] = useState('question');
  const [gatewayInput, setGatewayInput] = useState('');
  const [gatewayError, setGatewayError] = useState(null);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); 

  const [localQuantities, setLocalQuantities] = useState({});
  const [buttonStatuses, setButtonStatuses] = useState({});

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); 
  const [landmark, setLandmark] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

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

  // Dynamic brand slang dictionary helper
  const getSizeSlang = (size) => {
    const cleanSize = size.toLowerCase().trim();
    if (cleanSize.includes('300ml')) return 'Solo ⚡';
    if (cleanSize.includes('500ml')) return 'Gee ✊';
    if (cleanSize.includes('1.5l')) return 'Paddy 🤝';
    if (cleanSize.includes('5l')) return 'Link-Up 🔊';
    return '';
  };

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

  const handleAddItemToCartChannel = (product, variant, continuousQuantity) => {
    if (continuousQuantity <= 0) return;

    setButtonStatuses(prev => ({ ...prev, [variant.id]: 'adding' }));

    setTimeout(() => {
      setCart(prevCart => {
        const existingLineIndex = prevCart.findIndex(item => item.variant.id === variant.id);
        if (existingLineIndex > -1) {
          const updatedCart = [...prevCart];
          updatedCart[existingLineIndex].quantity += continuousQuantity;
          return updatedCart;
        }
        return [...prevCart, { product, variant, quantity: continuousQuantity }];
      });

      setButtonStatuses(prev => ({ ...prev, [variant.id]: 'added' }));

      setTimeout(() => {
        setButtonStatuses(prev => ({ ...prev, [variant.id]: 'idle' }));
      }, 1200);

    }, 600);
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
      finalOrderBillTotal: orderGrossSubtotal,
      combinedQuantityMapBySizeGroup
    };
  };

  const { compiledItemsList, finalOrderBillTotal, combinedQuantityMapBySizeGroup } = computeItemizedCartSummaryValues();
  const globalTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLaunchPaystackPaymentPortalGateway = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Checkout Halted: Your shopping cart container lines are empty.");
    if (!customerName || !customerPhone) return alert("Checkout Halted: Please fill out your contact details sheets.");

    for (const line of compiledItemsList) {
      if (!line.isMixedMoqSatisfiedForThisSize) {
        alert(`Almost there! You need at least ${line.requiredMoqSizeFloorValue} packs of the ${line.variant.size} size to checkout.\n\nYou have ${line.currentTotalUnitsInThisSizeGroup} in your cart now. Please add ${line.requiredMoqSizeFloorValue - line.currentTotalUnitsInThisSizeGroup} more!`);
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

  const getFlavorTheme = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('sobolo')) return { bg: 'bg-rose-50/30', border: 'border-rose-100', text: 'text-rose-600', shadow: 'shadow-rose-100/50' };
    if (name.includes('lemonade')) return { bg: 'bg-amber-50/30', border: 'border-amber-100', text: 'text-amber-500', shadow: 'shadow-amber-100/50' };
    if (name.includes('pinezest')) return { bg: 'bg-emerald-50/30', border: 'border-emerald-100', text: 'text-emerald-500', shadow: 'shadow-emerald-100/50' };
    return { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-600', shadow: 'shadow-stone-200/50' };
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 antialiased font-sans pb-1 selection:bg-rose-500 selection:text-white relative">
      
      {/* BRAND NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 py-3 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center h-20">
        <div className="flex items-center h-full">
          <Link href="/">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={220} height={90} className="h-16 sm:h-20 w-auto object-contain cursor-pointer" priority />
          </Link>
          {appliedCoupon && (
            <span className="text-[10px] bg-stone-900 text-emerald-400 font-mono font-bold px-3 py-1 rounded-full ml-4 hidden sm:inline-block shadow-sm">
              Promo Link Active: {appliedCoupon.profile.code}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            type="button" 
            onClick={() => { setAppliedCoupon(null); setGatewayInput(''); setGatewayStage('question'); setCart([]); }} 
            className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Reset Access</span>
          </button>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-stone-950 text-white px-5 py-2.5 rounded-full hover:bg-stone-800 transition-all shadow-xl group relative"
          >
            <div className="relative flex items-center">
              <ShoppingBag className="h-4 w-4 text-stone-100 group-hover:scale-105 transition-transform" />
              <span className="absolute -bottom-2 -right-2 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-stone-900">
                {globalTotalItemsCount}
              </span>
            </div>
            <span className="text-xs font-black ml-1 tracking-wide">
              ₵{finalOrderBillTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </nav>

      {/* DROP ZONE HEADER */}
      <header className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          <Sparkles className="h-3.5 w-3.5" /> Official Storefront
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-stone-950">
          The Drop <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Zone.</span>
        </h1>
        <p className="text-stone-500 font-medium max-w-xl mx-auto">Secure your batches. Real fruit flavors packed for the daily hustle.</p>
      </header>

      {/* SNEAKER-STORE PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => 
            product.product_variants?.map((variant) => {
              const isOutOfStock = !variant.is_in_stock || variant.stock_quantity <= 0;
              const theme = getFlavorTheme(product.name);
              
              const activeUnitDiscount = appliedCoupon 
                ? (appliedCoupon.customDiscountsMap[variant.size] !== undefined ? Number(appliedCoupon.customDiscountsMap[variant.size]) : Number(variant.client_discount || 0))
                : 0;
              const displayedCostPaidPerBottle = Number(variant.retail_price) - activeUnitDiscount;

              const cartItem = cart.find(item => item.variant.id === variant.id);
              const currentPickerCount = cartItem ? cartItem.quantity : (localQuantities[variant.id] || 1);
              
              const handleMinusClick = () => {
                if (cartItem) {
                  handleAdjustCartQuantityIndex(variant.id, -1);
                } else {
                  setLocalQuantities(prev => ({ ...prev, [variant.id]: Math.max(1, currentPickerCount - 1) }));
                }
              };

              const handlePlusClick = () => {
                if (cartItem) {
                  handleAdjustCartQuantityIndex(variant.id, 1);
                } else {
                  setLocalQuantities(prev => ({ ...prev, [variant.id]: currentPickerCount + 1 }));
                }
              };

              const cumulativeUnitsInThisSizeGroup = combinedQuantityMapBySizeGroup[variant.size] || 0;
              const requiredMoqSizeLimit = parseInt(variant.size_moq_floor) || 1;
              const isCardGroupMoqSatisfied = cumulativeUnitsInThisSizeGroup >= requiredMoqSizeLimit;

              const activeBtnStatus = buttonStatuses[variant.id] || 'idle';

              return (
                <div key={variant.id} className={`bg-white border-2 ${theme.border} rounded-[40px] p-6 flex flex-col justify-between space-y-6 shadow-xl ${theme.shadow} hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group`}>
                  
                  {/* Subtle Background Glow */}
                  <div className={`absolute top-0 right-0 w-64 h-64 ${theme.bg} rounded-full blur-3xl opacity-50 pointer-events-none -mr-20 -mt-20`} />

                  {/* Header: Title & Stock */}
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className="font-black text-stone-950 uppercase text-lg leading-tight tracking-tight pr-2">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Upgraded layout displays both container volume and culture slang name */}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>
                          {variant.size} {getSizeSlang(variant.size) && `// ${getSizeSlang(variant.size)}`}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase shrink-0 shadow-sm ${isOutOfStock ? 'bg-stone-100 text-stone-400' : 'bg-stone-950 text-white'}`}>
                      {isOutOfStock ? 'Sold Out' : 'In Stock'}
                    </span>
                  </div>

                  {/* Giant Floating Image */}
                  {variant.image_url && (
                    <div className="h-64 w-full relative flex flex-col items-center justify-end transition-all duration-500 z-10 py-4">
                      <Image 
                        src={variant.image_url} 
                        alt={variant.sku} 
                        width={400} 
                        height={400} 
                        priority={true} 
                        className="h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)] transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2 z-10" 
                      />
                      {/* Floor Shadow */}
                      <div className="w-1/2 h-2.5 bg-black/20 blur-md rounded-[50%] absolute bottom-2 transition-all duration-500 group-hover:w-2/3 group-hover:opacity-40"></div>
                    </div>
                  )}

                  <div className="space-y-4 relative z-10 mt-auto">
                    {/* Pricing Block */}
                    <div className="bg-[#FDFBF7] border border-stone-200 p-4 rounded-2xl text-xs font-medium space-y-1.5 text-stone-500">
                      {appliedCoupon ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-stone-400 line-through"><span>Standard Retail:</span><span>₵{Number(variant.retail_price).toFixed(2)}</span></div>
                          <div className="flex justify-between text-emerald-600 font-black text-sm"><span>Promo Access Rate:</span><span>₵{displayedCostPaidPerBottle.toFixed(2)}</span></div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-stone-600"><span>Standard Retail:</span><strong className="text-stone-950 font-black">₵{Number(variant.retail_price).toFixed(2)}</strong></div>
                          <div className="flex justify-between text-emerald-600 font-bold"><span>Wholesale Trigger:</span><span>₵{Number(variant.wholesale_price).toFixed(2)}</span></div>
                        </div>
                      )}
                    </div>

                    {/* MOQ Alerts */}
                    {requiredMoqSizeLimit > 1 && (
                      <div className={`p-3 rounded-2xl border flex items-start gap-2 text-[10px] leading-snug font-bold uppercase tracking-wide transition-colors ${
                        isCardGroupMoqSatisfied 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        <AlertCircle className={`h-4 w-4 shrink-0 ${!isCardGroupMoqSatisfied && 'text-amber-500'}`} />
                        <div>
                          {isCardGroupMoqSatisfied 
                            ? `✓ Minimum reached for ${variant.size} batch.` 
                            : `Add ${requiredMoqSizeLimit - cumulativeUnitsInThisSizeGroup} more ${variant.size} to unlock checkout.`}
                        </div>
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center border-2 rounded-2xl overflow-hidden h-14 shadow-sm shrink-0 w-28 transition-colors ${cartItem ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}>
                        <button 
                          type="button"
                          disabled={activeBtnStatus !== 'idle'}
                          onClick={handleMinusClick}
                          className={`flex-1 h-full transition-colors flex items-center justify-center disabled:opacity-20 ${cartItem ? 'text-emerald-700 hover:bg-emerald-100' : 'text-stone-500 hover:bg-stone-50'}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className={`font-black text-sm w-8 text-center ${cartItem ? 'text-emerald-950' : 'text-stone-950'}`}>{currentPickerCount}</span>
                        <button 
                          type="button"
                          disabled={activeBtnStatus !== 'idle'}
                          onClick={handlePlusClick}
                          className={`flex-1 h-full transition-colors flex items-center justify-center disabled:opacity-20 ${cartItem ? 'text-emerald-700 hover:bg-emerald-100' : 'text-stone-500 hover:bg-stone-50'}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button 
                        type="button" 
                        disabled={isOutOfStock || activeBtnStatus !== 'idle' || !!cartItem}
                        onClick={() => handleAddItemToCartChannel(product, variant, currentPickerCount)}
                        className={`flex-1 font-black text-xs h-14 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all duration-300 shadow-lg ${
                          isOutOfStock 
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none' 
                            : !!cartItem
                              ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200 shadow-none'
                              : activeBtnStatus === 'adding'
                                ? 'bg-stone-800 text-stone-300 cursor-wait'
                                : activeBtnStatus === 'added'
                                  ? 'bg-emerald-500 text-white animate-pulse'
                                  : 'bg-stone-950 hover:bg-stone-800 text-white hover:-translate-y-0.5'
                        }`}
                      >
                        {!!cartItem ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>In Your Drop</span>
                          </>
                        ) : activeBtnStatus === 'idle' ? (
                          <span>Add To Cart</span>
                        ) : activeBtnStatus === 'adding' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsCartOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out">
              
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-3 text-stone-950 font-black uppercase text-lg tracking-tight">
                  <ShoppingBag className="h-5 w-5 text-rose-500" />
                  <h3>Your Drop ({globalTotalItemsCount})</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="bg-white border border-stone-200 hover:border-stone-400 p-2 rounded-full text-stone-500 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                {cart.length === 0 ? (
                  <div className="text-center py-20 bg-[#FDFBF7] rounded-[32px] font-medium text-stone-400 text-xs space-y-3">
                    <ShoppingBag className="h-10 w-10 mx-auto text-stone-300" />
                    <p className="uppercase tracking-widest font-black">Your bag is empty.</p>
                  </div>
                ) : (
                  compiledItemsList.map((item) => (
                    <div key={item.variant.id} className="bg-[#FDFBF7] p-4 rounded-[24px] border border-stone-200 flex flex-col justify-between space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className="font-black text-stone-950 uppercase text-sm leading-tight tracking-tight">{item.product.name}</h5>
                          <div className="flex gap-2 mt-1.5">
                            {/* Drawer list item size badges updated with matching slang names */}
                            <span className="text-[10px] bg-stone-200/50 text-stone-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                              {item.variant.size} {getSizeSlang(item.variant.size) && `// ${getSizeSlang(item.variant.size)}`}
                            </span>
                            {item.isWholesaleTierTriggered && !appliedCoupon && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Wholesale</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleRemoveLineItemFromCart(item.variant.id)} className="text-stone-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm border border-stone-100"><Trash2 className="h-4 w-4" /></button>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-stone-200/50">
                        <div className="flex items-center bg-white border border-stone-200 rounded-xl h-10 shadow-sm overflow-hidden">
                          <button onClick={() => handleAdjustCartQuantityIndex(item.variant.id, -1)} className="px-3 text-stone-500 hover:bg-stone-50 h-full"><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center font-black text-xs text-stone-950">{item.quantity}</span>
                          <button onClick={() => handleAdjustCartQuantityIndex(item.variant.id, 1)} className="px-3 text-stone-500 hover:bg-stone-50 h-full"><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="font-black text-stone-950 text-lg">₵{item.lineTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}

                {cart.length > 0 && (
                  <form onSubmit={handleLaunchPaystackPaymentPortalGateway} className="space-y-5 pt-6 border-t border-stone-200">
                    <span className="text-[11px] uppercase font-black tracking-widest text-stone-400 block mb-2">Checkout Details</span>
                    
                    <div className="space-y-4">
                      <div>
                        <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full legal name" className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-rose-500 rounded-2xl px-4 py-3 outline-none text-stone-900 font-bold placeholder:text-stone-400 transition-colors" />
                      </div>
                      <div>
                        <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Mobile Money Number (e.g. 054...)" className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-rose-500 rounded-2xl px-4 py-3 outline-none text-stone-900 font-bold placeholder:text-stone-400 transition-colors" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 bg-[#FDFBF7] p-1.5 border-2 border-stone-200 rounded-2xl text-center">
                        <button type="button" onClick={() => setDeliveryType('delivery')} className={`py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${deliveryType === 'delivery' ? 'bg-white text-stone-950 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`}>Dispatch</button>
                        <button type="button" onClick={() => setDeliveryType('pickup')} className={`py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${deliveryType === 'pickup' ? 'bg-white text-stone-950 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`}>HQ Pickup</button>
                      </div>
                      
                      {deliveryType === 'delivery' && (
                        <div>
                          <input type="text" required value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Delivery Landmark / Address" className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-rose-500 rounded-2xl px-4 py-3 outline-none text-stone-900 font-bold placeholder:text-stone-400 transition-colors" />
                        </div>
                      )}
                    </div>

                    <div className="bg-stone-950 p-5 rounded-[24px] space-y-3 text-stone-400 text-xs shadow-xl mt-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
                      
                      <div className="flex justify-between items-center relative z-10">
                        <span className="font-bold">Subtotal:</span>
                        <span className="text-white font-black">₵{finalOrderBillTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-400 relative z-10">
                        <span className="font-bold">Delivery Fee:</span>
                        <span className="font-black uppercase">Calculated Post-Checkout</span>
                      </div>
                      
                      {compiledItemsList.map(line => {
                        if (!line.isMixedMoqSatisfiedForThisSize) {
                          return (
                            <div key={`moq-alert-${line.variant.id}`} className="text-[10px] text-amber-400 bg-amber-950/50 p-3 border border-amber-900/50 rounded-xl flex gap-2 leading-tight font-bold relative z-10">
                              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                              <span>Missing: Add {line.requiredMoqSizeFloorValue - line.currentTotalUnitsInThisSizeGroup} more {line.variant.size} packs to checkout.</span>
                            </div>
                          );
                        }
                        return null;
                      })}

                      {appliedCoupon && (
                        <div className="text-[10px] text-emerald-400 bg-emerald-950/50 p-3 border border-emerald-900/50 rounded-xl flex gap-2 leading-snug font-bold relative z-10">
                          <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
                          <span>Promo Link Active. Applying exclusive rates.</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-end border-t border-stone-800 pt-4 mt-2 text-white relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Total</span>
                        <span className="text-2xl font-black">₵{finalOrderBillTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      type="submit" disabled={isSubmittingOrder || cart.length === 0}
                      className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-stone-200 text-white disabled:text-stone-400 font-black text-sm py-4 rounded-2xl transition-all uppercase tracking-widest shadow-[0_8px_30px_rgb(225,29,72,0.3)] disabled:shadow-none"
                    >
                      <span>{isSubmittingOrder ? 'Processing...' : 'Secure Order'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMO GATEWAY MODAL */}
      {gatewayStage !== 'unlocked' && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xl z-50 flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-[40px] p-8 shadow-2xl border border-stone-200 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500 rounded-full blur-3xl opacity-10 -mr-20 -mt-20 pointer-events-none"></div>

            <div className="space-y-3 relative z-10">
              
              {/* GIANT, INTERACTIVE, CLICKABLE LOGO */}
              <Link href="/" className="block transform transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <Image 
                  src="/SPARKLE BEV. LOGO A No BG.png" 
                  alt="Sparkle Logo" 
                  width={320} 
                  height={180} 
                  className="h-32 mx-auto object-contain drop-shadow-xl mb-6" 
                  priority 
                />
              </Link>

              <div className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                <Key className="h-3 w-3" /> Promo Access
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-stone-950 uppercase">Unlock The Drop.</h2>
              <p className="text-sm text-stone-500 font-medium px-4">Got a promo code? Drop it here to score a sweet discount on your batch.</p>
            </div>

            {gatewayStage === 'question' && (
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <button 
                  type="button" 
                  onClick={() => setGatewayStage('input_form')}
                  className="bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-2xl shadow-xl transition-all font-black text-xs uppercase tracking-widest"
                >
                  Yes, I Do
                </button>
                <button 
                  type="button" 
                  onClick={() => setGatewayStage('unlocked')}
                  className="bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-200 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                >
                  No, Skip
                </button>
              </div>
            )}

            {gatewayStage === 'input_form' && (
              <form onSubmit={handleVerifyGatewayCode} className="space-y-5 text-left relative z-10">
                <div>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input 
                      type="text" required autoFocus value={gatewayInput} 
                      onChange={(e) => setGatewayInput(e.target.value.toUpperCase())} 
                      placeholder="ENTER PROMO CODE" 
                      className="w-full bg-white border-2 border-stone-200 focus:border-rose-500 rounded-2xl pl-12 pr-4 py-4 outline-none text-stone-950 font-black tracking-widest text-center text-lg uppercase transition-colors placeholder:text-stone-300" 
                    />
                  </div>
                </div>

                {gatewayError && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{gatewayError}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setGatewayStage('question'); setGatewayError(null); }}
                    className="w-1/3 bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-600 font-black rounded-2xl transition-all text-center uppercase text-[10px] tracking-widest py-4"
                  >
                    Back
                  </button>
                  <button type="submit" className="w-2/3 bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_30px_rgb(225,29,72,0.3)] flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                    <span>Verify Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* THE BRAND CONTACT FOOTER */}
      <footer className="bg-stone-950 text-white border-t-4 border-emerald-500 pt-16 pb-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-stone-900 pb-12 mb-12">
          
          {/* Brand Vision Side */}
          <div className="md:col-span-5 space-y-4 text-left">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={140} height={50} className="h-10 w-auto object-contain brightness-110" />
            <p className="text-stone-400 text-xs font-bold leading-relaxed max-w-sm font-sans">
              Crafting premium-grade local fruit infusions wrapped in modern, spouted hustle pouches. Disbursing hydration drops and cultural statements from Accra to the rest of the wild.
            </p>
          </div>

          {/* Hit Us Up / Contact Details Column */}
          <div className="md:col-span-4 space-y-4 text-left font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Hit Us Up Directly</h4>
            <div className="space-y-3 text-xs">
              <a href="tel:0533527192" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>+233 533 527 192</span>
              </a>
              <a href="mailto:sparklebeverages@outlook.com" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors truncate">
                <Mail className="h-4 w-4 text-rose-500 shrink-0" />
                <span>sparklebeverages@outlook.com</span>
              </a>
            </div>
          </div>

          {/* Quick Platform Directory Links */}
          <div className="md:col-span-3 space-y-4 text-left text-xs font-bold font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Directory Grid</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">01 // Shop Storefront</Link>
              <Link href="/custom" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">02 // Book Custom Drops</Link>
              <Link href="/referrer" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">03 // Ambassador Hub</Link>
            </div>
          </div>

        </div>

        {/* Legal & Final Copy Block */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
            © 2026 Sparkle Beverages Ltd. • Fueling Authentic Hustles Across Ghana.
          </p>
          <div className="flex gap-4 text-[9px] font-bold font-mono uppercase tracking-widest text-stone-600">
            <span>Minimum Cashout: ₵100</span>
            <span>•</span>
            <span>10% WHT Compliant</span>
          </div>
        </div>
      </footer>

      {/* PULSING FLOATING WHATSAPP BUTTON */}
      <a 
        href="https://wa.me/233533527192?text=Hey%20Sparkle!%20I'm%20reaching%20out%20from%20the%20shop%20page.%20Could%20you%20help%20me%20with%20something?" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 flex items-center justify-center hover:-translate-y-1 group"
        aria-label="Contact Sparkle on WhatsApp"
      >
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-35 group-hover:opacity-0 transition-opacity" />
        <MessageCircle className="h-6 w-6 relative z-10 fill-white text-[#25D366]" />
      </a>

    </div>
  );
}