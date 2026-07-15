'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, ShoppingBag, Trash2, Plus, Minus, CheckCircle, 
  Sparkles, Flame, ShieldCheck, Truck, MapPin, Tag, Phone, Mail, MessageCircle 
} from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';

export default function ShopStorefrontPage() {
  const supabase = createBrowserSupabaseClient();

  // Inventory & UI State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState(false); // false = browsing, true = checkout form
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Discount & Code States
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCodeRecord, setAppliedCodeRecord] = useState(null);
  const [codeMessage, setCodeMessage] = useState('');
  const [manualClientDiscountMap, setManualClientDiscountMap] = useState({});

  // Checkout Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); // delivery or pickup
  const [landmark, setLandmark] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Load live products and variants from Supabase
  useEffect(() => {
    async function loadShopInventory() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, description, is_active,
            product_variants (
              id, sku, size, retail_price, wholesale_price, 
              stock_quantity, is_in_stock, size_moq_floor, 
              moq_floor, client_discount, image_url
            )
          `)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error && data) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load shop inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShopInventory();
  }, []);

  // Sync local storage cart if it exists
  useEffect(() => {
    const savedCart = localStorage.getItem('SPARKLE_STORE_CART');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  const saveCartToStorage = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('SPARKLE_STORE_CART', JSON.stringify(updatedCart));
  };

  // Add to Cart Logic
  const handleAddToCart = (product, variant) => {
    const existingIndex = cart.findIndex(item => item.variantId === variant.id);
    const updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        variantId: variant.id,
        sku: variant.sku,
        name: product.name,
        size: variant.size,
        price: Number(variant.retail_price),
        wholesalePrice: Number(variant.wholesale_price),
        moqFloor: Number(variant.moq_floor || 50),
        defaultDiscount: Number(variant.client_discount || 0),
        imageUrl: variant.image_url,
        quantity: 1
      });
    }
    saveCartToStorage(updatedCart);
  };

  const handleUpdateQuantity = (variantId, amount) => {
    const updatedCart = cart.map(item => {
      if (item.variantId === variantId) {
        const newQty = item.quantity + amount;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    }).filter(item => item.quantity > 0);
    saveCartToStorage(updatedCart);
  };

  const handleRemoveItem = (variantId) => {
    const updatedCart = cart.filter(item => item.variantId !== variantId);
    saveCartToStorage(updatedCart);
  };

  // Check and Apply Discount Codes (Promo / Ambassador codes)
  const handleApplyDiscountCode = async (e) => {
    e.preventDefault();
    setCodeMessage('');
    setAppliedCodeRecord(null);
    setManualClientDiscountMap({});

    if (!discountCode.trim()) return;

    const targetCode = discountCode.trim().toUpperCase();

    try {
      // 1. Look up the code in Supabase
      const { data: codeData, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', targetCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !codeData) {
        setCodeMessage('❌ Invalid or inactive code.');
        return;
      }

      setAppliedCodeRecord(codeData);
      setCodeMessage(`✅ Code ${targetCode} applied!`);

      // 2. Fetch custom discount rules if this is a custom promo code
      const { data: discountRules } = await supabase
        .from('referral_discounts')
        .select('*')
        .eq('referral_code_id', codeData.id);

      if (discountRules && discountRules.length > 0) {
        const ruleMap = {};
        discountRules.forEach(rule => {
          ruleMap[rule.size.toLowerCase()] = Number(rule.client_discount);
        });
        setManualClientDiscountMap(ruleMap);
      }

    } catch (err) {
      setCodeMessage('❌ Failed to verify code.');
    }
  };

  // Helper calculation values
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate prices per item dynamically
  const getCalculatedPriceDetails = (item) => {
    const isWholesaleActive = item.quantity >= item.moqFloor;
    const basePrice = isWholesaleActive ? item.wholesalePrice : item.price;
    
    // Calculate discounts
    let discountPerUnit = 0;
    if (appliedCodeRecord) {
      const sizeKey = item.size.toLowerCase();
      if (manualClientDiscountMap[sizeKey] !== undefined) {
        discountPerUnit = manualClientDiscountMap[sizeKey];
      } else {
        discountPerUnit = item.defaultDiscount;
      }
    }

    const finalUnitPrice = Math.max(0, basePrice - discountPerUnit);
    return {
      isWholesaleActive,
      finalUnitPrice,
      subtotal: finalUnitPrice * item.quantity
    };
  };

  const grandTotalBill = cart.reduce((acc, item) => {
    const { subtotal } = getCalculatedPriceDetails(item);
    return acc + subtotal;
  }, 0);

  // Place Order Action
  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmittingOrder) return;

    setIsSubmittingOrder(true);

    try {
      // 1. Create the base order record
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_type: deliveryType,
        landmark: deliveryType === 'delivery' ? landmark.trim() : 'HQ Self-Pickup Depot',
        total_amount: grandTotalBill,
        payment_status: 'pending',
        status: 'pending',
        metadata: {
          applied_code: appliedCodeRecord ? appliedCodeRecord.code : null,
          code_id: appliedCodeRecord ? appliedCodeRecord.id : null,
          payout_processed: false
        }
      };

      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select('*')
        .single();

      if (orderErr || !newOrder) throw orderErr;

      // 2. Insert order line items
      const orderItemsPayload = cart.map(item => {
        const { finalUnitPrice } = getCalculatedPriceDetails(item);
        return {
          order_id: newOrder.id,
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: finalUnitPrice,
          size: item.size
        };
      });

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsErr) throw itemsErr;

      // 3. Clear cart
      saveCartToStorage([]);
      setOrderPlaced(true);

    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4">
        <div className="max-w-md bg-white border-2 border-stone-200 rounded-[40px] p-10 text-center shadow-2xl space-y-6">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tight">Order Placed!</h2>
          <p className="text-stone-500 font-bold text-sm leading-relaxed">
            Your order has been staged in our fulfillment database. Our logistical dispatch team will call or WhatsApp your contact number shortly to confirm payment and delivery coordinates!
          </p>
          <Link href="/" className="inline-block bg-stone-950 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all text-xs">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-stone-950 antialiased selection:bg-rose-500 selection:text-white relative">
      
      {/* NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-stone-200 text-stone-900 py-2 px-6 sticky top-0 z-50 flex justify-between items-center h-20 shadow-sm">
        <div className="flex items-center h-full">
          <Link href="/">
            <Image src="/SPARKLE BEV. LOGO A No BG.png" alt="Sparkle Master Logo" width={180} height={70} className="h-14 sm:h-16 w-auto object-contain cursor-pointer" />
          </Link>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-wide flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Storefront
          </Link>
        </div>
      </nav>

      {/* HEADER HERO */}
      <div className="bg-stone-950 text-white py-16 px-6 text-center border-b-8 border-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
            <ShoppingBag className="h-3 w-3" /> Digital Storefront
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">The Official Store</h1>
          <p className="text-stone-400 text-sm md:text-base font-bold max-w-xl mx-auto leading-relaxed">
            Order fresh batches of our high-vibe fruit pouches. Free pickup from our HQ depot or direct door-to-door courier dispatch straight to your location.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PRODUCT INVENTORY LISTING (8 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {loading ? (
            <div className="text-center py-16 text-xs uppercase font-black tracking-widest text-stone-400">Loading shop list...</div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="bg-white border-2 border-stone-200 rounded-[32px] p-6 space-y-6 shadow-sm text-left">
                <div className="border-b border-stone-100 pb-3">
                  <h2 className="text-xl font-black text-stone-950 uppercase tracking-tight">{product.name}</h2>
                  <p className="text-stone-500 text-xs mt-1 font-bold">{product.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.product_variants?.map((variant) => (
                    <div key={variant.id} className="bg-[#FDFBF7] border border-stone-200 p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-stone-950 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">{variant.size}</span>
                        {variant.stock_quantity <= 0 ? (
                          <span className="text-[9px] text-stone-400 border border-stone-200 px-2 py-0.5 rounded font-black uppercase tracking-widest">Out of stock</span>
                        ) : (
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-black uppercase tracking-widest">In Stock</span>
                        )}
                      </div>

                      {variant.image_url && (
                        <div className="h-32 w-full relative flex items-center justify-center p-1 bg-white rounded-xl border border-stone-100 shadow-inner">
                          <img src={variant.image_url} alt={variant.sku} className="h-full object-contain" />
                        </div>
                      )}

                      <div className="space-y-1 font-mono text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        <div className="flex justify-between"><span>Retail Price:</span><strong className="text-stone-900">₵{Number(variant.retail_price).toFixed(2)}</strong></div>
                        <div className="flex justify-between text-blue-600"><span>Wholesale Rate:</span><strong>₵{Number(variant.wholesale_price).toFixed(2)}</strong></div>
                        <div className="flex justify-between text-stone-400 text-[10px]"><span>MOQ wholesale:</span><span>{variant.moq_floor || 50} units</span></div>
                      </div>

                      <button 
                        onClick={() => handleAddToCart(product, variant)}
                        disabled={variant.stock_quantity <= 0}
                        className="w-full bg-stone-950 hover:bg-stone-850 text-white font-black py-2.5 rounded-xl uppercase text-[10px] tracking-widest disabled:opacity-30 transition-all shadow-md"
                      >
                        Add To Basket
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: BASKET & CHECKOUT GATE (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-white border-2 border-stone-200 rounded-[32px] p-6 md:p-8 shadow-xl space-y-6 text-left">
            <h3 className="text-sm font-black text-stone-950 uppercase tracking-widest flex items-center gap-2 border-b border-stone-100 pb-4">
              <ShoppingBag className="h-4 w-4 text-emerald-500" /> 
              <span>Your Basket ({totalItemsCount})</span>
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-stone-400 font-bold text-xs uppercase tracking-widest bg-stone-50 rounded-[24px]">
                Your basket is empty
              </div>
            ) : (
              <>
                {/* Cart list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const { isWholesaleActive, finalUnitPrice, subtotal } = getCalculatedPriceDetails(item);
                    return (
                      <div key={item.variantId} className="bg-[#FDFBF7] p-3 rounded-2xl border border-stone-200 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <div className="h-12 w-12 bg-white rounded-lg border p-0.5 shrink-0 flex items-center justify-center">
                              <img src={item.imageUrl} alt={item.name} className="h-full object-contain" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-black text-[12px] text-stone-900 leading-tight uppercase">{item.name}</h4>
                            <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{item.size}</span>
                            {isWholesaleActive && (
                              <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.2 rounded font-black uppercase ml-1.5 tracking-wider">Wholesale Tier</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                          <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-0.5">
                            <button onClick={() => handleUpdateQuantity(item.variantId, -1)} className="p-1 hover:bg-stone-50 rounded text-stone-400"><Minus className="h-3 w-3" /></button>
                            <span className="min-w-6 text-center font-black">{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(item.variantId, 1)} className="p-1 hover:bg-stone-50 rounded text-stone-400"><Plus className="h-3 w-3" /></button>
                          </div>
                          
                          <div className="text-right">
                            <strong className="text-stone-950 block">₵{subtotal.toFixed(2)}</strong>
                            <span className="text-[9px] text-stone-400 block font-bold">₵{finalUnitPrice.toFixed(2)} ea</span>
                          </div>

                          <button onClick={() => handleRemoveItem(item.variantId)} className="text-stone-300 hover:text-rose-500 transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Apply Code Form */}
                <form onSubmit={handleApplyDiscountCode} className="pt-2 border-t border-stone-100 font-mono text-xs">
                  <label className="block text-stone-500 uppercase font-black text-[9px] mb-2 tracking-widest">Apply Ambassador Code / Promo Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={discountCode} 
                      onChange={(e) => setDiscountCode(e.target.value)} 
                      placeholder="e.g. SPK-6J5R6" 
                      className="flex-1 bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-black uppercase tracking-widest outline-none focus:border-emerald-500" 
                    />
                    <button type="submit" className="bg-stone-950 text-white font-black uppercase tracking-widest text-[9px] px-4 py-2 rounded-xl">Apply</button>
                  </div>
                  {codeMessage && <div className="text-[10px] font-black uppercase tracking-wider mt-2">{codeMessage}</div>}
                </form>

                {/* Total Billing */}
                <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200 font-mono text-xs text-stone-500 font-bold space-y-1.5">
                  <div className="flex justify-between items-center"><span>Standard Items:</span><span className="text-stone-900 font-black">{totalItemsCount} units</span></div>
                  <div className="flex justify-between items-center border-t border-stone-200 pt-3 mt-2 font-black text-emerald-600 text-sm uppercase tracking-widest">
                    <span>Grand Total:</span>
                    <span>GHS {grandTotalBill.toFixed(2)}</span>
                  </div>
                </div>

                {/* Next Step Control */}
                {!checkoutStep ? (
                  <button 
                    onClick={() => setCheckoutStep(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-center transition-all uppercase text-xs tracking-widest shadow-lg"
                  >
                    Proceed To Checkout
                  </button>
                ) : (
                  <form onSubmit={handlePlaceOrderSubmit} className="pt-4 border-t border-stone-100 space-y-4 font-mono text-xs text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Checkout Dispatch Information</h4>
                    
                    <div>
                      <label className="block text-stone-500 uppercase font-black text-[9px] mb-1.5 tracking-widest">Your Full Name</label>
                      <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Kwame Mensah" className="w-full bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold outline-none" />
                    </div>

                    <div>
                      <label className="block text-stone-500 uppercase font-black text-[9px] mb-1.5 tracking-widest">Active Mobile Line</label>
                      <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0540000000" className="w-full bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold outline-none" />
                    </div>

                    <div>
                      <label className="block text-stone-500 uppercase font-black text-[9px] mb-1.5 tracking-widest">Fulfillment Class</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button" 
                          onClick={() => setDeliveryType('delivery')}
                          className={`py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deliveryType === 'delivery' ? 'bg-stone-950 border-stone-950 text-white shadow-md' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                        >
                          Courier Delivery
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setDeliveryType('pickup')}
                          className={`py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deliveryType === 'pickup' ? 'bg-stone-950 border-stone-950 text-white shadow-md' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                        >
                          HQ Self-Pickup
                        </button>
                      </div>
                    </div>

                    {deliveryType === 'delivery' ? (
                      <div>
                        <label className="block text-stone-500 uppercase font-black text-[9px] mb-1.5 tracking-widest">Delivery Address / Landmark</label>
                        <input type="text" required value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Airport Shell, Accra" className="w-full bg-[#FDFBF7] border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold outline-none" />
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-[9px] text-emerald-800 font-sans leading-relaxed">
                        Pickup from our HQ depot is completely free. We will prepare your spouted pouch batches and contact you once they are ready for pickup at our facility.
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setCheckoutStep(false)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-black uppercase tracking-widest text-[10px] px-4 py-3 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmittingOrder}
                        className="flex-1 bg-stone-950 hover:bg-stone-850 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-40"
                      >
                        {isSubmittingOrder ? 'Placing Order...' : 'Confirm Order placement'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

        </div>
      </main>

      {/* =========================================
          THE BRAND CONTACT FOOTER
      ========================================= */}
      <footer className="bg-stone-950 text-white border-t-4 border-emerald-500 pt-16 pb-12 px-6 sm:px-12">
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

          <div className="md:col-span-3 space-y-4 text-left text-xs font-bold font-mono">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Directory Grid</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">01 // Shop Storefront</Link>
              <Link href="/custom" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">02 // Book Custom Drops</Link>
              <Link href="/referrer" className="text-stone-400 hover:text-white transition-colors uppercase tracking-wider text-[10px]">03 // Ambassador Hub</Link>
            </div>
          </div>

        </div>

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

      {/* =========================================
          PULSING FLOATING WHATSAPP BUTTON
      ========================================= */}
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