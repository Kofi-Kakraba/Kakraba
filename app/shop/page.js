'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  ShoppingBag, Tag, Trash2, Plus, Minus, ArrowRight, 
  Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowLeft, X, Zap, Key, Phone, Mail, MessageCircle
} from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { createCustomerOrderServerAction, runAutoJanitorServerAction } from '../actions/orders';
import { calculateDeliveryFee } from '../actions/delivery';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import Navbar from '../../components/Navbar';
import SmartSupportBot from '../../components/SmartSupportBot'; 

const MAPS_LIBRARIES = ['places'];

function ShopStorefront() {
  const supabase = createBrowserSupabaseClient();
  const searchParams = useSearchParams();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: MAPS_LIBRARIES,
  });
  
  const [autocompleteInstance, setAutocompleteInstance] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [gatewayStage, setGatewayStage] = useState('question');
  const [gatewayInput, setGatewayInput] = useState('');
  const [gatewayError, setGatewayError] = useState(null);

  const [cart, setCart] = useState([]);
  
  const [activeFilter, setActiveFilter] = useState('All Drops');
  const [selectedVariantIds, setSelectedVariantIds] = useState({});

  useEffect(() => {
    sessionStorage.setItem('sparkle_cart', JSON.stringify(cart));
  }, [cart]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [localQuantities, setLocalQuantities] = useState({});
  const [buttonStatuses, setButtonStatuses] = useState({});

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); 
  const [landmark, setLandmark] = useState('');
  const [preferredDate, setPreferredDate] = useState(''); 
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkoutAlert, setCheckoutAlert] = useState(null); 
  
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        setIsSubmittingOrder(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const verifyAndApplyCode = async (codeToVerify, isAutoFill = false) => {
    setLoading(true);
    setGatewayError(null);

    try {
      const cleanInputCode = codeToVerify.trim().toUpperCase();

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
      
      if (isAutoFill) {
        setShowSuccessBanner(true);
      }

    } catch (err) {
      setGatewayError(err.message);
      if (isAutoFill) {
        localStorage.removeItem('sparkle_active_promo');
        setGatewayStage('question'); 
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAutoJanitorServerAction();

    async function fetchStoreCatalog() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, description, is_active,
            product_variants ( id, sku, size, retail_price, wholesale_price, stock_quantity, is_in_stock, moq_floor, client_discount, referrer_earnings, image_url )
          `)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        
        if (data) {
          const initialVariants = {};
          const sizeOrder = { '300ml': 1, '500ml': 2, '1.5l': 3, '5l': 4 };
          data.forEach(p => {
            if (p.product_variants && p.product_variants.length > 0) {
              p.product_variants.sort((a, b) => {
                const aVal = sizeOrder[a.size.toLowerCase().trim()] || 99;
                const bVal = sizeOrder[b.size.toLowerCase().trim()] || 99;
                return aVal - bVal;
              });
              initialVariants[p.id] = p.product_variants[0].id;
            }
          });
          setSelectedVariantIds(initialVariants);
        }
        setProducts(data || []);
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    const paymentReference = searchParams.get('reference');
    const paymentTrxRef = searchParams.get('trxref');
    
    if (paymentReference || paymentTrxRef) {
      setCheckoutAlert(<span>Payment Successful! 🎉<br/><br/>Your drop has been securely logged. You will receive an SMS with your dispatch details shortly.</span>);
      window.history.replaceState(null, '', window.location.pathname);
      setCart([]);
      sessionStorage.removeItem('sparkle_cart');
      sessionStorage.removeItem('sparkle_checkout_handoff');
      sessionStorage.removeItem('sparkle_pending_order');
      setGatewayStage('question');
      fetchStoreCatalog();
      return;
    }

    const isHandoff = sessionStorage.getItem('sparkle_checkout_handoff');
    const pendingOrderId = sessionStorage.getItem('sparkle_pending_order');

    if (isHandoff === 'true') {
      sessionStorage.removeItem('sparkle_checkout_handoff');
      
      const savedCart = sessionStorage.getItem('sparkle_cart');
      if (savedCart) {
        try { setCart(JSON.parse(savedCart)); } catch (e) {}
      }
      
      const savedPromo = localStorage.getItem('sparkle_active_promo');
      if (savedPromo) {
        verifyAndApplyCode(savedPromo, true);
      } else if (sessionStorage.getItem('sparkle_promo_skipped')) {
        setGatewayStage('unlocked');
      }

      if (pendingOrderId) {
        import('../actions/orders').then(async (m) => {
          await m.cancelAbandonedOrderServerAction(pendingOrderId);
          sessionStorage.removeItem('sparkle_pending_order');
          fetchStoreCatalog(); 
        });
      } else {
        fetchStoreCatalog();
      }

    } else {
      const urlPromo = searchParams.get('promo');
      if (urlPromo) {
        const cleanPromo = urlPromo.trim().toUpperCase();
        localStorage.setItem('sparkle_active_promo', cleanPromo);
        verifyAndApplyCode(cleanPromo, true);
        supabase.from('campaign_scans').insert([{ promo_code: cleanPromo }]).then();
      } else {
        setCart([]);
        sessionStorage.removeItem('sparkle_cart');
        sessionStorage.removeItem('sparkle_promo_skipped');
        localStorage.removeItem('sparkle_active_promo');
        setGatewayStage('question');
        setAppliedCoupon(null);
      }
      fetchStoreCatalog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, supabase]);

  const handlePlaceSelected = async () => {
    if (autocompleteInstance !== null) {
      const place = autocompleteInstance.getPlace();
      const address = place.formatted_address || place.name;
      
      if (address) {
        setLandmark(address);
        setIsCalculatingFee(true);
        
        const result = await calculateDeliveryFee(address);
        
        if (result.success) {
          setDeliveryFee(result.fee);
        } else {
          setDeliveryFee(0);
          setCheckoutAlert("We couldn't calculate the exact distance. A base fare will be applied.");
        }
        setIsCalculatingFee(false);
      }
    }
  };

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
    await verifyAndApplyCode(gatewayInput, false);
  };

  const handleAddItemToCartChannel = (product, variant, continuousQuantity) => {
    if (continuousQuantity <= 0 || continuousQuantity === '') return; 

    setButtonStatuses(prev => ({ ...prev, [variant.id]: 'adding' }));

    setTimeout(() => {
      setCart(prevCart => {
        const existingLineIndex = prevCart.findIndex(item => item.variant.id === variant.id);
        if (existingLineIndex > -1) {
          const updatedCart = [...prevCart];
          const newQty = updatedCart[existingLineIndex].quantity + continuousQuantity;
          updatedCart[existingLineIndex].quantity = Math.min(newQty, variant.stock_quantity);
          return updatedCart;
        }
        return [...prevCart, { product, variant, quantity: Math.min(continuousQuantity, variant.stock_quantity) }];
      });

      setButtonStatuses(prev => ({ ...prev, [variant.id]: 'added' }));

      setTimeout(() => {
        setButtonStatuses(prev => ({ ...prev, [variant.id]: 'idle' }));
      }, 1200);

    }, 600);
  };

  const handleManualQuantityChange = (variantId, isCartItem, value, maxStock) => {
    if (value === '') {
      if (!isCartItem) setLocalQuantities(prev => ({ ...prev, [variantId]: '' }));
      return;
    }
    let newQty = parseInt(value, 10);
    if (!isNaN(newQty) && newQty > 0) {
      if (maxStock !== undefined && newQty > maxStock) {
        newQty = maxStock; 
        setCheckoutAlert(`Inventory Limit Reached!\n\nWe currently only have ${maxStock} units of this specific drop available in stock.`);
      }
      if (isCartItem) {
        handleSetCartQuantityIndex(variantId, newQty, maxStock);
      } else {
        setLocalQuantities(prev => ({ ...prev, [variantId]: newQty }));
      }
    }
  };

  const handleSetCartQuantityIndex = (variantId, absoluteQuantity, maxStock) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.variant.id === variantId) {
        let finalQty = absoluteQuantity;
        if (maxStock !== undefined && absoluteQuantity > maxStock) {
          finalQty = maxStock;
          setCheckoutAlert(`Inventory Limit Reached!\n\nWe currently only have ${maxStock} units of this specific drop available in stock.`);
        }
        return finalQty > 0 ? { ...item, quantity: finalQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleQuantityBlur = (variantId, isCartItem, currentValue) => {
    if (currentValue === '' || currentValue < 1) {
      if (isCartItem) {
        handleSetCartQuantityIndex(variantId, 1);
      } else {
        setLocalQuantities(prev => ({ ...prev, [variantId]: 1 }));
      }
    }
  };

  const handleAdjustCartQuantityIndex = (variantId, adjustmentFactor, maxStock) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.variant.id === variantId) {
          let calculatedNewQty = item.quantity + adjustmentFactor;
          if (maxStock !== undefined && calculatedNewQty > maxStock) {
            calculatedNewQty = maxStock; 
            setCheckoutAlert(`Inventory Limit Reached!\n\nWe currently only have ${maxStock} units of this specific drop available in stock.`);
          }
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

    const formattedListOutput = cart.map(item => {
      const quantityCount = Number(item.quantity);
      const sizeKey = item.variant.size;
      const singleItemWholesaleTriggerLimit = parseInt(item.variant.moq_floor) || 50;

      const isWholesalePriceTriggered = quantityCount >= singleItemWholesaleTriggerLimit;
      
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
  const globalTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const grandTotal = deliveryType === 'delivery' ? finalOrderBillTotal + deliveryFee : finalOrderBillTotal;

  const handleLaunchPaystackPaymentPortalGateway = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return setCheckoutAlert("Your drop zone is empty. Add some drinks to your cart first!");
    
    if (!customerName || !customerPhone) return setCheckoutAlert("Please fill out your name and active contact number in the checkout details.");

    const MINIMUM_CART_VALUE = 30.00;

    if (finalOrderBillTotal < MINIMUM_CART_VALUE) {
      return setCheckoutAlert(`The minimum order value is ₵${MINIMUM_CART_VALUE.toFixed(2)}.\n\nYour current total is ₵${finalOrderBillTotal.toFixed(2)}. Please add a few more items to unlock checkout!`);
    }

    if (deliveryType === 'delivery' && deliveryFee === 0) {
      return setCheckoutAlert("Please search and select a valid delivery location from the dropdown map so we can calculate your fare.");
    }

    setIsSubmittingOrder(true);

    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryType: deliveryType,
      landmark: landmark.trim(),
      totalAmount: grandTotal, 
      metadata: {
        applied_code: appliedCoupon?.profile?.code || null,
        code_id: appliedCoupon?.profile?.id || null,
        payout_processed: false,
        calculated_payout_amount: 0,
        preferred_delivery_date: deliveryType === 'delivery' ? preferredDate : 'HQ Pickup',
        delivery_fee_charged: deliveryType === 'delivery' ? deliveryFee : 0 
      }
    };
    
    const response = await createCustomerOrderServerAction(orderPayload, compiledItemsList);
    
    if (response.success && response.authorizationUrl) {
      sessionStorage.setItem('sparkle_checkout_handoff', 'true');
      sessionStorage.setItem('sparkle_pending_order', response.orderId);
      window.location.href = response.authorizationUrl; 
    } else {
      
      if (response.errorType === 'stock_alert') {
        if (response.remaining === 0) {
          setCheckoutAlert(
            <>
              Someone just snatched up the last of the <strong>{response.productName} ({response.size})</strong>.<br/><br/>
              Live Stock Remaining: <strong className="text-rose-600">0</strong><br/>
              Your Cart: <strong>{response.requested}</strong><br/><br/>
              Please <strong>remove it from your cart</strong> to continue.
            </>
          );
        } else {
          setCheckoutAlert(
            <>
              We only have <strong>{response.remaining}</strong> units left for the <strong>{response.productName} ({response.size})</strong>.<br/><br/>
              Live Stock Remaining: <strong className="text-emerald-600">{response.remaining}</strong><br/>
              Your Cart: <strong>{response.requested}</strong><br/><br/>
              Please <strong>adjust your cart quantity</strong> to match the remaining stock to continue.
            </>
          );
        }
      } else {
        setCheckoutAlert(<span>Transaction Refusal: {response.error || 'Gateway connection error'}</span>);
      }
      setIsSubmittingOrder(false);
    }
  };

  const getFlavorTheme = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('sobolo') || name.includes('hibiscus')) return { 
      bg: 'bg-rose-50/30', border: 'border-rose-100', shadow: 'shadow-rose-100/50',
      sizeActive: 'bg-rose-600 text-white border-rose-600 shadow-md',
      sizeInactive: 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300',
      title: 'text-rose-600',
      stockBadge: 'bg-rose-600 text-white',
      price: 'text-rose-600',
      addBtn: 'bg-rose-600 hover:bg-rose-500 shadow-[0_8px_30px_rgb(225,29,72,0.3)]'
    };
    if (name.includes('lemonade')) return { 
      bg: 'bg-amber-50/30', border: 'border-amber-100', shadow: 'shadow-amber-100/50',
      sizeActive: 'bg-amber-500 text-white border-amber-500 shadow-md',
      sizeInactive: 'bg-white text-amber-500 border-amber-200 hover:bg-amber-50 hover:border-amber-300',
      title: 'text-amber-500', 
      stockBadge: 'bg-amber-500 text-white',
      price: 'text-amber-500',
      addBtn: 'bg-amber-500 hover:bg-amber-400 shadow-[0_8px_30px_rgb(245,158,11,0.3)]'
    };
    if (name.includes('pinezest')) return { 
      bg: 'bg-emerald-50/30', border: 'border-emerald-100', shadow: 'shadow-emerald-100/50',
      sizeActive: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
      sizeInactive: 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300',
      title: 'text-emerald-600',
      stockBadge: 'bg-emerald-600 text-white',
      price: 'text-emerald-600',
      addBtn: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_8px_30px_rgb(5,150,105,0.3)]'
    };
    return { 
      bg: 'bg-stone-50', border: 'border-stone-200', shadow: 'shadow-stone-200/50',
      sizeActive: 'bg-stone-950 text-white border-stone-950 shadow-md',
      sizeInactive: 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300',
      title: 'text-stone-950',
      stockBadge: 'bg-stone-950 text-white',
      price: 'text-stone-950',
      addBtn: 'bg-stone-950 hover:bg-stone-800 shadow-lg'
    };
  };

  const filteredProducts = products.filter(p => {
    if (activeFilter === 'All Drops') return true;
    const productNameLower = p.name.toLowerCase();
    const filterLower = activeFilter.toLowerCase();
    if (filterLower === 'sobolo' && productNameLower.includes('hibiscus')) {
      return true;
    }
    return productNameLower.includes(filterLower);
  });

  const getFilterClasses = (filter, isActive) => {
    const base = "w-full sm:w-auto px-3 sm:px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center text-center leading-none";
    if (isActive) {
      if (filter === 'All Drops') return `${base} bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 text-white border-transparent shadow-md`;
      if (filter === 'Sobolo') return `${base} bg-rose-600 text-white border-rose-600 shadow-md`;
      if (filter === 'Lemonade') return `${base} bg-amber-500 text-white border-amber-500 shadow-md`;
      if (filter === 'Pinezest') return `${base} bg-emerald-600 text-white border-emerald-600 shadow-md`;
    } else {
      if (filter === 'All Drops') return `${base} bg-white border-stone-200 hover:border-stone-300 text-stone-900`;
      if (filter === 'Sobolo') return `${base} bg-white text-rose-500 border-rose-200 hover:bg-rose-50`;
      if (filter === 'Lemonade') return `${base} bg-white text-amber-500 border-amber-200 hover:bg-amber-50`;
      if (filter === 'Pinezest') return `${base} bg-white text-emerald-500 border-emerald-200 hover:bg-emerald-50`;
    }
    return base;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 antialiased font-sans pb-24 selection:bg-rose-500 selection:text-white relative">
      
      {showSuccessBanner && appliedCoupon && (
        <div className="bg-emerald-50 border-b border-emerald-100 py-3 px-4 flex justify-between items-center shadow-sm relative z-[80]">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 w-full text-emerald-800 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wide">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>🎉 VIP Promo <strong className="font-black text-emerald-950 px-1">{appliedCoupon.profile.code}</strong> Auto-Applied!</span>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="text-emerald-600 hover:text-emerald-900 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="sticky top-0 z-[70] bg-white/95 shadow-sm border-b border-stone-200">
        <div className="flex justify-between items-center w-full pr-6">
          <div className="flex-1">
             <Navbar />
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6 ml-4">
            {appliedCoupon ? (
              <button 
                type="button" 
                onClick={() => { 
                  setAppliedCoupon(null); 
                  setGatewayInput(''); 
                  setGatewayStage('question'); 
                  setCart([]); 
                  setShowSuccessBanner(false);
                  localStorage.removeItem('sparkle_active_promo');
                  sessionStorage.removeItem('sparkle_promo_skipped');
                }} 
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Reset Access</span>
              </button>
            ) : gatewayStage === 'unlocked' ? (
              <button 
                type="button" 
                onClick={() => { 
                  sessionStorage.removeItem('sparkle_promo_skipped');
                  setGatewayStage('input_form'); 
                }} 
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <Key className="h-4 w-4" /> <span className="hidden sm:inline">Add Promo</span>
              </button>
            ) : null}

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
              <span className="text-xs font-black ml-1 tracking-wide hidden sm:inline-block">
                ₵{grandTotal.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </div>

      <header className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          <Sparkles className="h-3.5 w-3.5" /> Official Storefront
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-stone-950">
          The Drop <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Zone.</span>
        </h1>
        <p className="text-stone-500 font-medium max-w-xl mx-auto">Secure your batches. Real fruit flavors packed for the daily hustle.</p>
      </header>

      <div className="sticky top-20 z-30 bg-[#FDFBF7]/95 backdrop-blur-md py-4 mb-8 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 pb-2">
            {['All Drops', 'Sobolo', 'Lemonade', 'Pinezest'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={getFilterClasses(filter, activeFilter === filter)}
              >
                {filter === 'All Drops' && activeFilter !== 'All Drops' ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500">All Drops</span>
                ) : (
                  filter
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-20 relative z-10">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const activeVariant = product.product_variants?.find(v => v.id === selectedVariantIds[product.id]) || product.product_variants?.[0];
            
            if (!activeVariant) return null;

            const isOutOfStock = !activeVariant.is_in_stock || activeVariant.stock_quantity <= 0;
            const theme = getFlavorTheme(product.name);
            
            const activeUnitDiscount = appliedCoupon 
              ? (appliedCoupon.customDiscountsMap[activeVariant.size] !== undefined ? Number(appliedCoupon.customDiscountsMap[activeVariant.size]) : Number(activeVariant.client_discount || 0))
              : 0;
            const displayedCostPaidPerBottle = Number(activeVariant.retail_price) - activeUnitDiscount;

            const cartItem = cart.find(item => item.variant.id === activeVariant.id);
            
            const currentPickerCount = cartItem 
              ? cartItem.quantity 
              : (localQuantities[activeVariant.id] !== undefined ? localQuantities[activeVariant.id] : 1);
            
            const handleMinusClick = () => {
              if (cartItem) {
                handleAdjustCartQuantityIndex(activeVariant.id, -1, activeVariant.stock_quantity);
              } else {
                setLocalQuantities(prev => ({ ...prev, [activeVariant.id]: Math.max(1, (Number(currentPickerCount) || 1) - 1) }));
              }
            };

            const handlePlusClick = () => {
              if (cartItem) {
                handleAdjustCartQuantityIndex(activeVariant.id, 1, activeVariant.stock_quantity);
              } else {
                const currentVal = Number(currentPickerCount) || 1;
                const newVal = currentVal + 1;
                setLocalQuantities(prev => ({ ...prev, [activeVariant.id]: Math.min(newVal, activeVariant.stock_quantity) }));
              }
            };

            const activeBtnStatus = buttonStatuses[activeVariant.id] || 'idle';

            return (
              <div key={product.id} className={`bg-white border-2 ${theme.border} rounded-[40px] p-6 flex flex-col justify-between space-y-6 shadow-xl ${theme.shadow} ${isOutOfStock ? 'bg-stone-50' : 'hover:-translate-y-1'} transition-transform duration-300 relative overflow-hidden group`}>
                
                <div className={`absolute top-0 right-0 w-64 h-64 ${theme.bg} rounded-full blur-3xl opacity-50 pointer-events-none -mr-20 -mt-20 ${isOutOfStock ? 'grayscale' : ''}`} />

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h4 className={`font-black uppercase text-lg leading-tight tracking-tight pr-2 ${theme.title} ${isOutOfStock ? 'opacity-50' : ''}`}>{product.name}</h4>
                  </div>
                  <span className={`text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase shrink-0 shadow-sm ${isOutOfStock ? 'bg-stone-200 text-stone-500' : theme.stockBadge}`}>
                    {isOutOfStock ? 'Sold Out' : 'In Stock'}
                  </span>
                </div>

                <div className="relative z-20 flex flex-wrap gap-2">
                  {product.product_variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantIds(prev => ({ ...prev, [product.id]: v.id }))}
                      className={`px-3 py-2 text-xs font-black uppercase tracking-widest rounded-lg border-2 transition-all ${
                        activeVariant.id === v.id ? theme.sizeActive : theme.sizeInactive
                      }`}
                    >
                      {v.size} {getSizeSlang(v.size) && `// ${getSizeSlang(v.size)}`}
                    </button>
                  ))}
                </div>

                {/* 🚨 REMOVED grayscale FROM PARENT DIV SO RED STAMP STAYS VIBRANT */}
                {activeVariant.image_url && (
                  <div className="h-56 w-full relative flex flex-col items-center justify-end transition-all duration-500 z-10 py-4">
                    <Image 
                      src={activeVariant.image_url} 
                      alt={activeVariant.sku} 
                      width={400} 
                      height={400} 
                      priority={true} 
                      className={`h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.3)] transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2 z-10 ${isOutOfStock ? 'grayscale opacity-60' : ''}`} 
                    />
                    <div className={`w-1/2 h-2.5 bg-black/20 blur-md rounded-[50%] absolute bottom-2 transition-all duration-500 group-hover:w-2/3 group-hover:opacity-40 ${isOutOfStock ? 'opacity-30' : ''}`}></div>
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div className="bg-red-600 text-white font-black text-3xl px-6 py-2 rounded-2xl transform -rotate-12 uppercase tracking-widest animate-pulse border-4 border-white shadow-2xl">
                          Sold Out
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`space-y-4 relative z-10 mt-auto ${isOutOfStock ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                  <div className="bg-[#FDFBF7] border border-stone-200 p-4 rounded-2xl text-xs font-medium space-y-1.5 transition-all duration-300">
                    {appliedCoupon ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-stone-400 line-through"><span>Standard Retail:</span><span>₵{Number(activeVariant.retail_price).toFixed(2)}</span></div>
                        <div className="flex justify-between text-emerald-600 font-black text-sm"><span>Promo Access Rate:</span><span>₵{displayedCostPaidPerBottle.toFixed(2)}</span></div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-stone-600">
                          <span>Standard Retail:</span>
                          <strong className={`font-black text-sm ${theme.price}`}>₵{Number(activeVariant.retail_price).toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-emerald-600 font-bold text-[10px] uppercase">
                          <span>Wholesale Trigger:</span>
                          <span>₵{Number(activeVariant.wholesale_price).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

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
                      
                      <input 
                        type="number"
                        min="1"
                        max={activeVariant.stock_quantity}
                        value={currentPickerCount}
                        onChange={(e) => handleManualQuantityChange(activeVariant.id, !!cartItem, e.target.value, activeVariant.stock_quantity)}
                        onBlur={(e) => handleQuantityBlur(activeVariant.id, !!cartItem, currentPickerCount)}
                        className={`font-black text-sm w-10 text-center bg-transparent outline-none appearance-none ${cartItem ? 'text-emerald-950' : 'text-stone-950'}`}
                        style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                      />

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
                      disabled={isOutOfStock || activeBtnStatus !== 'idle' || !!cartItem || currentPickerCount === ''}
                      onClick={() => handleAddItemToCartChannel(product, activeVariant, currentPickerCount)}
                      className={`flex-1 font-black text-xs h-14 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all duration-300 ${
                        isOutOfStock 
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none' 
                          : !!cartItem
                            ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200 shadow-none'
                            : activeBtnStatus === 'adding'
                              ? 'bg-stone-800 text-stone-300 cursor-wait'
                              : activeBtnStatus === 'added'
                                ? 'bg-emerald-500 text-white animate-pulse'
                                : `${theme.addBtn} text-white hover:-translate-y-0.5`
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
          })}
        </section>
      </main>

      {cart.length > 0 && !isCartOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 z-[90] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block">Your Drop ({globalTotalItemsCount})</span>
            <span className="text-lg font-black text-stone-950">₵{grandTotal.toFixed(2)}</span>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-md transition-colors">
            Checkout
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
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
                          <button onClick={() => handleAdjustCartQuantityIndex(item.variant.id, -1, item.variant.stock_quantity)} className="px-3 text-stone-500 hover:bg-stone-50 h-full"><Minus className="h-3 w-3" /></button>
                          
                          <input 
                            type="number"
                            min="1"
                            max={item.variant.stock_quantity}
                            value={item.quantity}
                            onChange={(e) => handleManualQuantityChange(item.variant.id, true, e.target.value, item.variant.stock_quantity)}
                            onBlur={(e) => handleQuantityBlur(item.variant.id, true, e.target.value)}
                            className="w-10 text-center font-black text-xs text-stone-950 bg-transparent outline-none appearance-none"
                            style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                          />

                          <button onClick={() => handleAdjustCartQuantityIndex(item.variant.id, 1, item.variant.stock_quantity)} className="px-3 text-stone-500 hover:bg-stone-50 h-full"><Plus className="h-3 w-3" /></button>
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
                      
                      <div className="space-y-1.5">
                        <input 
                          type="tel" 
                          required 
                          pattern="0[0-9]{9}" 
                          title="Please enter a valid 10-digit Ghanaian phone number starting with 0 (e.g., 0547664422)"
                          value={customerPhone} 
                          onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').substring(0, 10))} 
                          placeholder="Active Contact Number (e.g. 054...)" 
                          className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-rose-500 rounded-2xl px-4 py-3 outline-none text-stone-900 font-bold placeholder:text-stone-400 transition-colors" 
                        />
                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest pl-1 leading-snug">
                          * Please provide a number we can reach you on (Not a MoMo Vendor's number).
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 bg-[#FDFBF7] p-1.5 border-2 border-stone-200 rounded-2xl text-center">
                        <button type="button" onClick={() => { setDeliveryType('delivery'); setDeliveryFee(0); setLandmark(''); }} className={`py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${deliveryType === 'delivery' ? 'bg-white text-stone-950 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`}>Dispatch</button>
                        <button type="button" onClick={() => { setDeliveryType('pickup'); setDeliveryFee(0); }} className={`py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${deliveryType === 'pickup' ? 'bg-white text-stone-950 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`}>HQ Pickup</button>
                      </div>
                      
                      {deliveryType === 'delivery' && (
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2 px-1">Delivery Location</span>
                            {isLoaded ? (
                              <Autocomplete
                                onLoad={(autocomplete) => setAutocompleteInstance(autocomplete)}
                                onPlaceChanged={handlePlaceSelected}
                                options={{ componentRestrictions: { country: "gh" } }}
                              >
                                <input 
                                  type="text" 
                                  required 
                                  value={landmark} 
                                  onChange={(e) => { setLandmark(e.target.value); setDeliveryFee(0); }} 
                                  placeholder="Search neighborhood or landmark..." 
                                  className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-rose-500 rounded-2xl px-4 py-3 outline-none text-stone-900 font-bold placeholder:text-stone-400 transition-colors" 
                                />
                              </Autocomplete>
                            ) : (
                              <input 
                                type="text" 
                                required 
                                value={landmark} 
                                onChange={(e) => setLandmark(e.target.value)} 
                                placeholder="Loading map search..." 
                                className="w-full bg-stone-100 border-2 border-stone-200 rounded-2xl px-4 py-3 outline-none text-stone-400 font-bold" 
                                disabled 
                              />
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2 px-1">Select Delivery Date</span>
                            <input 
                              type="date" 
                              required 
                              value={preferredDate} 
                              onChange={(e) => setPreferredDate(e.target.value)} 
                              min={(() => {
                                const now = new Date();
                                if (now.getHours() >= 14) {
                                  now.setDate(now.getDate() + 1);
                                }
                                return now.toISOString().split('T')[0];
                              })()} 
                              className="w-full bg-[#FDFBF7] border-2 border-stone-200 focus:border-rose-500 rounded-2xl px-4 py-3 outline-none text-stone-900 font-bold text-sm transition-colors" 
                            />
                            {new Date().getHours() >= 14 && !preferredDate && (
                              <p className="text-[9px] text-amber-600 font-bold mt-1.5 ml-1 flex gap-1 items-start">
                                <span>⏱️</span> <span>Past 2:00 PM: Same-day delivery is closed. Please select tomorrow or later.</span>
                              </p>
                            )}
                          </div>
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
                        <span className="font-black uppercase">
                          {deliveryType === 'pickup' ? (
                            'GH₵0.00 (Pickup)' 
                          ) : isCalculatingFee ? (
                            <span className="animate-pulse text-amber-400 flex items-center gap-1.5">
                              <Loader2 className="h-4 w-4 animate-spin" /> Calculating...
                            </span>
                          ) : deliveryFee > 0 ? (
                            `₵${deliveryFee.toFixed(2)}` 
                          ) : (
                            'Search location to calculate'
                          )}
                        </span>
                      </div>

                      {appliedCoupon && (
                        <div className="text-[10px] text-emerald-400 bg-emerald-950/50 p-3 border border-emerald-900/50 rounded-xl flex gap-2 leading-snug font-bold relative z-10">
                          <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
                          <span>Promo Link Active. Applying exclusive rates.</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-end border-t border-stone-800 pt-4 mt-2 text-white relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Total</span>
                        <span className="text-2xl font-black">₵{grandTotal.toFixed(2)}</span>
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

      {gatewayStage !== 'unlocked' && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xl z-[60] flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-[40px] p-8 shadow-2xl border border-stone-200 text-center space-y-8 relative overflow-hidden mt-20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500 rounded-full blur-3xl opacity-10 -mr-20 -mt-20 pointer-events-none"></div>

            <div className="space-y-3 relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                <Key className="h-3 w-3" /> Promo Access
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-stone-950 uppercase">Unlock The Drop.</h2>
              <p className="text-sm text-stone-500 font-medium px-4">Got a promo code? Drop it here to score a sweet discount on your batch.</p>
            </div>

            {gatewayStage === 'question' && (
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <button type="button" onClick={() => setGatewayStage('input_form')} className="bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-2xl shadow-xl transition-all font-black text-xs uppercase tracking-widest">
                  Yes, I Do
                </button>
                <button type="button" onClick={() => { setGatewayStage('unlocked'); sessionStorage.setItem('sparkle_promo_skipped', 'true'); }} className="bg-white hover:bg-stone-50 text-stone-900 border-2 border-stone-200 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest">
                  No, Skip
                </button>
              </div>
            )}

            {gatewayStage === 'input_form' && (
              <form onSubmit={handleVerifyGatewayCode} className="space-y-5 text-left relative z-10">
                <div>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input type="text" required autoFocus value={gatewayInput} onChange={(e) => setGatewayInput(e.target.value.toUpperCase())} placeholder="ENTER PROMO CODE" className="w-full bg-white border-2 border-stone-200 focus:border-rose-500 rounded-2xl pl-12 pr-4 py-4 outline-none text-stone-950 font-black tracking-widest text-center text-lg uppercase transition-colors placeholder:text-stone-300" />
                  </div>
                </div>
                {gatewayError && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{gatewayError}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setGatewayStage('question'); setGatewayError(null); }} className="w-1/3 bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-600 font-black rounded-2xl transition-all text-center uppercase text-[10px] tracking-widest py-4">Back</button>
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

      <footer className="bg-stone-950 text-white border-t-4 border-emerald-500 pt-16 pb-12 px-6 sm:px-12 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-stone-900 pb-12 mb-12">
          <div className="md:col-span-5 space-y-4 text-left">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Logo" width={140} height={50} className="h-10 w-auto object-contain brightness-110" />
            <p className="text-stone-400 text-xs font-bold leading-relaxed max-w-sm font-sans">
              Crafting premium-grade local fruit infusions wrapped in modern, spouted hustle pouches. Disbursing hydration drops and cultural statements from Accra to the rest of the wild.
            </p>
          </div>
          <div className="md:col-span-4 space-y-4 text-left font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Hit Us Up Directly</h4>
            <div className="space-y-3 text-xs">
              <a href="tel:0533527192" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors"><Phone className="h-4 w-4 text-emerald-500 shrink-0" /><span>+233 533 527 192</span></a>
              <a href="mailto:info@sparklebeverages.com" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors truncate"><Mail className="h-4 w-4 text-rose-500 shrink-0" /><span>info@sparklebeverages.com</span></a>
            </div>
          </div>
          <div className="md:col-span-3 space-y-4 text-left text-xs font-bold font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Directory Grid</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">01 // Shop Storefront</Link>
              <Link href="/custom" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">02 // Book Custom Drops</Link>
              <Link href="/referrer" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">03 // Ambassador Hub</Link>
            </div>
          </div>
        </div>
      </footer>

      <SmartSupportBot />

      {checkoutAlert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] border border-rose-200 w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 pointer-events-none"></div>
            <div className="mx-auto w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-2 shadow-inner border border-rose-200"><AlertCircle className="h-6 w-6" /></div>
            <h3 className="font-black text-xl text-stone-950 uppercase tracking-tight">Hold Up!</h3>
            
            <p className="text-stone-500 text-xs font-medium leading-relaxed px-2">
              {checkoutAlert}
            </p>

            <div className="pt-2"><button onClick={() => setCheckoutAlert(null)} className="w-full bg-stone-950 hover:bg-stone-800 text-white font-black py-3.5 rounded-2xl uppercase tracking-widest text-[10px] transition-colors shadow-lg">Got it</button></div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="h-20 bg-stone-50 w-full animate-pulse border-b border-stone-200 flex items-center justify-center text-xs font-bold text-stone-400 uppercase tracking-widest">Loading Storefront...</div>}>
      <ShopStorefront />
    </Suspense>
  );
}
