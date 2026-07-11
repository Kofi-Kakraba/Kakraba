'use server';

import { createClient } from '@supabase/supabase-js';

// Global size-based fallback discount rules as defined in your blueprint matrix
const GLOBAL_FALLBACK_DISCOUNTS = {
  '300ml': 0.50,
  '500ml': 1.00,
  '1.5L': 3.00,
  '5L': 5.00
};

/**
 * Validates cart configuration constraints, dynamically calculates size-based fixed referral 
 * deductions, logs provisional order data, and generates a secure checkout route with Paystack.
 * @param {Object} orderPayload - Customer parameters passed down from the frontend shop UI.
 */
export async function submitOrder(orderPayload) {
  try {
    const { customerName, customerPhone, deliveryType, landmark, promoCode, items } = orderPayload;

    if (!items || items.length === 0) {
      return { success: false, error: "Your shopping cart container is currently empty." };
    }

    // Initialize standalone secure administrative server client instance
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let cleanPromoCode = promoCode ? promoCode.trim().toUpperCase() : null;
    let verifiedCodeId = null;
    let totalDiscountAccumulated = 0;
    let baseOrderSubtotal = 0;

    // 1. RE-CALCULATE BASE PRE-DISCOUNTED SUB-TOTAL FROM THE CART ITEMS
    items.forEach(item => {
      baseOrderSubtotal += Number(item.unitPrice) * Number(item.qty);
    });

    // 2. RUN REFERRAL SYSTEM RULES BLOCK IF A CODE IS ENTERED AT CHECKOUT
    if (cleanPromoCode) {
      // Query the database to verify the code is both active and verified
      const { data: promoRecord, error: promoError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', cleanPromoCode)
        .eq('is_active', true)
        .eq('is_verified', true)
        .single();

      if (!promoError && promoRecord) {
        verifiedCodeId = promoRecord.id;

        // Fetch custom override rules for this specific code if they exist
        const { data: customDiscounts } = await supabase
          .from('referral_discounts')
          .select('size, client_discount')
          .eq('referral_code_id', verifiedCodeId);

        // Map overrides to an easily queryable object dictionary
        const discountMap = {};
        customDiscounts?.forEach(d => {
          discountMap[d.size] = Number(d.client_discount);
        });

        // Run stacking volume calculation loop across line items
        items.forEach(item => {
          // Look for a custom code discount rule first, fallback to standard global matrix if missing
          const perUnitDeduction = discountMap[item.size] !== undefined 
            ? discountMap[item.size] 
            : (GLOBAL_FALLBACK_DISCOUNTS[item.size] || 0);

          totalDiscountAccumulated += perUnitDeduction * Number(item.qty);
        });
      } else {
        console.warn(`Referral input rejected: Code "${cleanPromoCode}" is either invalid or inactive.`);
      }
    }

    // 3. APPLY DISCOUNTS AND ENSURE ORDER VALUE NEVER DROPS BELOW ZERO
    const finalSecuredTotalGHS = Math.max(1.00, baseOrderSubtotal - totalDiscountAccumulated);

    // 4. WRITE THE PROVISIONAL RESERVATION ENTRY INTO YOUR SUPABASE ORDERS TABLE
    const { data: insertedOrder, error: dbInsertError } = await supabase
      .from('orders')
      .insert([{
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_type: deliveryType,
        landmark: landmark ? landmark.trim() : null,
        total_amount: finalSecuredTotalGHS,
        payment_status: 'unpaid',
        status: 'pending',
        metadata: {
          applied_code: cleanPromoCode,
          code_id: verifiedCodeId,
          raw_subtotal: baseOrderSubtotal,
          discount_deducted: totalDiscountAccumulated
        }
      }])
      .select('*')
      .single();

    if (dbInsertError || !insertedOrder) {
      console.error("Database Write Aborted ->", dbInsertError);
      return { success: false, error: "Failed to generate internal master sequence parameters." };
    }

    // 5. COMMENCE THE ORDER LOGS CONNECTING INDIVIDUAL PURCHASE ITEMS
    const lineItemRows = items.map(item => ({
      order_id: insertedOrder.id,
      variant_id: item.variantId,
      quantity: item.qty,
      unit_price: item.unitPrice
    }));

    const { error: lineItemsWriteError } = await supabase
      .from('order_items')
      .insert(lineItemRows);

    if (lineItemsWriteError) {
      console.error("Database Order Items Write Aborted ->", lineItemsWriteError);
    }

    // 6. GENERATE PAYSTACK SECURE GATEWAY ROUTING PARAMETERS
    const paystackPayload = {
      email: `${customerPhone.trim()}@sparklebev.com`,
      amount: Math.round(finalSecuredTotalGHS * 100),
      reference: `SPK-${Date.now()}-${insertedOrder.id.substring(0, 4).toUpperCase()}`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
      metadata: {
        order_id: insertedOrder.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim()
      }
    };

    const gatewayResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackPayload)
    });

    const gatewayData = await gatewayResponse.json();

    if (!gatewayResponse.ok || !gatewayData.status) {
      return { success: false, error: gatewayData.message || "Failed to initialize standard authorization handshakes." };
    }

    await supabase
      .from('orders')
      .update({ paystack_reference: paystackPayload.reference })
      .eq('id', insertedOrder.id);

    return { success: true, authorization_url: gatewayData.data.authorization_url };

  } catch (fatalException) {
    console.error("CRITICAL CHECKOUT HANDSHAKE RUNTIME EXCEPTION ->", fatalException);
    return { success: false, error: fatalException.message };
  }
}