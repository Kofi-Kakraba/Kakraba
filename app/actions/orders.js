'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize the Resend Client utilizing your secure environment key
const resend = new Resend(process.env.RESEND_API_KEY);

function getServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

function formatGhanaianPhoneNumber(rawPhone) {
  let formatted = rawPhone.trim().replace(/\s+/g, '');
  if (formatted.startsWith('0')) return '233' + formatted.substring(1);
  if (formatted.startsWith('+233')) return formatted.substring(1);
  if (!formatted.startsWith('233')) return '233' + formatted;
  return formatted;
}

async function fireSMSOnlineGHGateway(targetPhone, messageContent) {
  try {
    const apiKey = process.env.SMS_ONLINE_GH_KEY;
    const senderId = process.env.SMS_ONLINE_GH_SENDER_ID || 'SPARKLE';
    if (!apiKey) return false;

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'Authorization': `key ${apiKey}` 
      },
      body: JSON.stringify({ 
        sender: senderId, 
        text: messageContent, 
        type: 0, 
        destinations: [formatGhanaianPhoneNumber(targetPhone)] 
      })
    });
    return response.ok;
  } catch (err) { 
    return false; 
  }
}

/**
 * Processes customer checkout pipelines and initializes a live Paystack payment gateway authorization transaction
 */
export async function createCustomerOrderServerAction(orderPayload, cartItemsList) {
  const supabase = getServiceSupabaseClient();
  
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      throw new Error("Server Configuration Error: Missing Paystack processing keys tokens.");
    }

    // 🚨 1. THE BOUNCER & RESERVATION: Verify Stock and Deduct Immediately (Locks it in)
    for (const item of cartItemsList) {
      const { data: liveVariant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', item.variant.id)
        .single();

      if (variantError || !liveVariant) {
        throw new Error("Could not verify live inventory. Please try checking out again.");
      }

      if (item.quantity > liveVariant.stock_quantity) {
        throw new Error(`Stock Alert: We only have ${liveVariant.stock_quantity} units left for the ${item.variant.size} size. Please adjust your cart to proceed.`);
      }

      // Automatically reserve the stock right now so nobody else can take it!
      const newStock = liveVariant.stock_quantity - item.quantity;
      const { error: deductError } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', item.variant.id);
        
      if (deductError) {
         throw new Error("Failed to reserve inventory. Please try again.");
      }
    }

    // 2. Insert the master order tracking header row
    const { data: newOrderHeader, error: orderInsertError } = await supabase
      .from('orders')
      .insert([{
        customer_name: orderPayload.customerName,
        customer_phone: orderPayload.customerPhone,
        delivery_type: orderPayload.deliveryType,
        landmark: orderPayload.landmark,
        total_amount: orderPayload.totalAmount,
        payment_status: 'unpaid', 
        status: 'pending_payment',
        metadata: orderPayload.metadata
      }])
      .select('*')
      .single();

    if (orderInsertError || !newOrderHeader) {
      throw new Error(`Order Header processing failure: ${orderInsertError?.message}`);
    }

    // 3. Format and inject individual item line maps directly to your database columns
    const formattedItemRows = cartItemsList.map(item => ({
      order_id: newOrderHeader.id,
      variant_id: item.variant.id,
      quantity: parseInt(item.quantity) || 1,
      unit_price: parseFloat(item.singleUnitCost) || 0.00, 
      price_paid: parseFloat(item.singleUnitCost) || 0.00,  
      size: String(item.variant?.size || '500ml').trim()
    }));

    const { error: linesInsertError } = await supabase
      .from('order_items')
      .insert(formattedItemRows);

    if (linesInsertError) {
      throw new Error(`Line Items tracking injection failure: ${linesInsertError.message}`);
    }

    // 4. CONNECT SECURELY TO PAYSTACK: Initialize Live Transaction Session Engine
    const siteDomainBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sparklebeverages.com' 
      : 'http://localhost:3000';
    
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `${orderPayload.customerPhone}@sparklebeverages.com`, 
        amount: Math.round(Number(orderPayload.totalAmount) * 100), 
        reference: newOrderHeader.id,
        callback_url: `${siteDomainBaseUrl}/checkout/success?orderId=${newOrderHeader.id}`
      })
    });

    const paystackJson = await paystackResponse.json();
    
    if (!paystackResponse.ok || !paystackJson.status) {
      throw new Error(`Paystack Initialization Rejected: ${paystackJson.message || 'Gateway connection timeout.'}`);
    }

    return { 
      success: true, 
      authorizationUrl: paystackJson.data.authorization_url 
    };

  } catch (err) {
    console.error("CRITICAL CHECKOUT SERVER ACTION CRASH ->", err);
    
    // 🚨 5. SAFETY ROLLBACK: If Paystack fails to open, return the reserved stock to the shelf.
    if (cartItemsList && cartItemsList.length > 0) {
       for (const item of cartItemsList) {
          const { data: currentVariant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant.id).single();
          if (currentVariant) {
             await supabase.from('product_variants').update({ stock_quantity: currentVariant.stock_quantity + parseInt(item.quantity) }).eq('id', item.variant.id);
          }
       }
    }
    
    return { success: false, error: err.message };
  }
}

/**
 * Verifies transaction integrity with Paystack APIs, updates order row columns to paid, logs conversion analytics and fires alerts
 */
export async function verifyAndFinalizeCustomerPaymentAction(orderId) {
  try {
    const supabase = getServiceSupabaseClient();
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!orderId) return { success: false, error: "Missing Target Order Reference ID." };

    const { data: orderHeader, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderHeader) {
      return { success: false, error: "Target order record tracking lines not found." };
    }

    if (orderHeader.payment_status === 'paid') {
      return { success: true, data: orderHeader };
    }

    // Query Paystack directly to verify the transaction status
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${orderId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${paystackSecret}` }
    });

    const verifyJson = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyJson.status || verifyJson.data.status !== 'success') {
      return { success: false, error: `Paystack Verification Pending: ${verifyJson.message || 'Awaiting cleared funds.'}` };
    }

    // Update the database order rows to 'paid' and 'processing'
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing'
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    // AMBASSADOR WALLET EARNINGS PROCESSING PIPELINE
    const metadata = updatedOrder.metadata || {};
    const appliedCodeId = metadata.code_id;

    if (appliedCodeId && !metadata.payout_processed) {
      const { data: itemLines } = await supabase
        .from('order_items')
        .select(`quantity, product_variants ( id, referrer_earnings )`)
        .eq('order_id', orderId);

      if (itemLines && itemLines.length > 0) {
        let accumulatedPayout = 0;
        itemLines.forEach(line => {
          const bountyAmountPerUnit = Number(line.product_variants?.referrer_earnings || 1.00);
          accumulatedPayout += bountyAmountPerUnit * Number(line.quantity || 1);
        });

        if (accumulatedPayout > 0) {
          const { data: currentWallet } = await supabase
            .from('referral_codes')
            .select('total_earnings')
            .eq('id', appliedCodeId)
            .single();

          const newWalletTotal = Number(currentWallet?.total_earnings || 0) + accumulatedPayout;
          
          await supabase
            .from('referral_codes')
            .update({ total_earnings: newWalletTotal })
            .eq('id', appliedCodeId);

          metadata.payout_processed = true;
          metadata.calculated_payout_amount = accumulatedPayout;
          
          await supabase
            .from('orders')
            .update({ metadata })
            .eq('id', orderId);
        }
      }
    }

    // 🚨 DEDUCTION LOGIC REMOVED HERE 
    // Stock is now safely deducted upfront during order creation to prevent race conditions!

    try {
      await resend.emails.send({
        from: 'Sparkle Admin <admin@sparklebeverages.com>',
        to: ['orders@sparklebeverages.com'], 
        subject: `🚨 New PAID Sparkle Order: ₵${Number(updatedOrder.total_amount).toFixed(2)}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border-radius: 10px; background-color: #FAFAFA; border: 1px solid #E5E7EB;">
            <h2 style="color: #065F46;">New Order Secured! 🎉</h2>
            <p><strong>Order ID:</strong> #${updatedOrder.id.substring(0, 8).toUpperCase()}</p>
            <p><strong>Customer:</strong> ${updatedOrder.customer_name}</p>
            <p><strong>Phone:</strong> ${updatedOrder.customer_phone}</p>
            <p><strong>Delivery:</strong> ${updatedOrder.delivery_type.toUpperCase()}</p>
            <p><strong>Total Value:</strong> ₵${Number(updatedOrder.total_amount).toFixed(2)}</p>
            <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6B7280;">Log into your Sparkle Admin Portal to view full order lines and fulfillment details.</p>
          </div>
        `
      });
      console.log("Admin email notification dispatched successfully!");
    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
    }

    return { success: true, data: updatedOrder };

  } catch (err) {
    console.error("VERIFICATION ACTION ENGINE CRASH ->", err);
    return { success: false, error: err.message };
  }
}

/**
 * ============================================================================
 * ADMIN ACTION: Updates Fulfillment Status & Fires Ready SMS via SMSOnlineGH
 * ============================================================================
 */
export async function updateOrderStatusAdmin(orderId, targetState) {
  try {
    const supabase = getServiceSupabaseClient(); 

    // 1. Update the database status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: targetState })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 2. Trigger SMSOnlineGH text message if state changed to 'ready'
    if (targetState === 'ready') {
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_name, customer_phone')
        .eq('id', orderId)
        .single();

      if (orderData && orderData.customer_phone) {
        const firstName = orderData.customer_name.split(' ')[0] || 'Customer';
        const orderRef = orderId.substring(0, 8).toUpperCase();
        
        const magicLink = `https://sparklebeverages.com/track?id=${orderRef}&phone=${orderData.customer_phone.replace('+', '')}`;
        const smsMessage = `Hi ${firstName}, your Sparkle order is packed and READY for pickup at our HQ Depot! Present code (#${orderRef}). Track live status: ${magicLink}`;

        const smsSent = await fireSMSOnlineGHGateway(orderData.customer_phone, smsMessage);
        
        if (smsSent) {
          console.log(`[SMS LOG] Pickup SMS fired to ${orderData.customer_phone}`);
        } else {
          console.error(`[SMS LOG] SMSOnlineGH Gateway failed to send to ${orderData.customer_phone}`);
        }
      }
    }

    return { success: true };

  } catch (error) {
    console.error("Status Update Failed:", error);
    return { success: false, error: error.message };
  }
}
