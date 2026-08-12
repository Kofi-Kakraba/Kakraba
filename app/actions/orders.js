'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { fireAdminPushAlert } from './notifications';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);

function getServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'x-timestamp': Date.now().toString()
      },
      fetch: (url, options) => {
        return fetch(url, { 
          ...options, 
          cache: 'no-store',
          next: { revalidate: 0 } 
        });
      }
    }
  });
}

function formatGhanaianPhoneNumber(rawPhone) {
  let formatted = rawPhone.trim().replace(/\s+/g, '');
  if (formatted.startsWith('0')) return '233' + formatted.substring(1);
  if (formatted.startsWith('+233')) return formatted.substring(1);
  if (!formatted.startsWith('233')) return '233' + formatted;
  return formatted;
}

async function fireSMSOnlineGHGateway(targetPhone, messageContent) {
  noStore();
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
      }),
      cache: 'no-store'
    });
    return response.ok;
  } catch (err) { 
    return false; 
  }
}

async function releaseAbandonedStockReservations(supabase) {
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
    
    const { data: abandonedOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'pending_payment')
      .lt('created_at', tenMinsAgo);

    if (!abandonedOrders || abandonedOrders.length === 0) return;

    for (const order of abandonedOrders) {
      await supabase.from('orders').update({ status: 'cancelled', payment_status: 'abandoned' }).eq('id', order.id);
      
      const { data: items } = await supabase.from('order_items').select('variant_id, quantity').eq('order_id', order.id);
      if (items) {
        for (const item of items) {
          const { data: variant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
          if (variant) {
            await supabase.from('product_variants').update({ stock_quantity: variant.stock_quantity + item.quantity }).eq('id', item.variant_id);
          }
        }
      }
    }
    revalidatePath('/admin', 'layout');
    revalidatePath('/shop', 'layout');
  } catch (e) {
    console.error("Auto-cleanup failed:", e);
  }
}

export async function runAutoJanitorServerAction() {
  noStore();
  const supabase = getServiceSupabaseClient();
  await releaseAbandonedStockReservations(supabase);
  return { success: true };
}

export async function cancelAbandonedOrderServerAction(orderId) {
  noStore();
  try {
    const supabase = getServiceSupabaseClient();
    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
    
    if (order && order.status === 'pending_payment') {
      await supabase.from('orders').update({ status: 'cancelled', payment_status: 'abandoned' }).eq('id', orderId);
      
      const { data: items } = await supabase.from('order_items').select('variant_id, quantity').eq('order_id', orderId);
      if (items) {
        for (const item of items) {
          const { data: variant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
          if (variant) {
            await supabase.from('product_variants').update({ stock_quantity: variant.stock_quantity + item.quantity }).eq('id', item.variant_id);
          }
        }
      }
    }
    revalidatePath('/admin', 'layout');
    revalidatePath('/shop', 'layout');
    return { success: true };
  } catch (err) {
    console.error("Cancel abandon failed:", err);
    return { success: false };
  }
}

export async function createCustomerOrderServerAction(orderPayload, cartItemsList) {
  noStore();
  const supabase = getServiceSupabaseClient();
  let successfullyReservedItems = [];
  
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      throw new Error("Server Configuration Error: Missing Paystack processing keys tokens.");
    }

    await releaseAbandonedStockReservations(supabase);

    for (const item of cartItemsList) {
      const { data: liveVariant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock_quantity, low_stock_trigger')
        .eq('id', item.variant.id)
        .single();

      if (variantError || !liveVariant) {
        throw new Error("Could not verify live inventory. Please try checking out again.");
      }

      if (item.quantity > liveVariant.stock_quantity) {
        return {
          success: false,
          errorType: 'stock_alert',
          requested: item.quantity,
          remaining: liveVariant.stock_quantity,
          productName: item.product.name,
          size: item.variant.size
        };
      }

      const previousStock = liveVariant.stock_quantity;
      const newStock = previousStock - item.quantity;
      const triggerLimit = liveVariant.low_stock_trigger !== null ? liveVariant.low_stock_trigger : 20;

      const { error: deductError } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', item.variant.id);
        
      if (deductError) {
         throw new Error("Failed to reserve inventory. Please try again.");
      }
      
      successfullyReservedItems.push(item);

      // Keep push alerts here as an immediate pre-payment warning
      if (newStock === 0) {
        fireAdminPushAlert(
          '🚨 ZERO STOCK FATAL',
          `${item.product.name} (${item.variant.size}) has completely sold out! The storefront is now empty for this drop.`
        ).catch(e => console.error(e));
      } else if (previousStock > triggerLimit && newStock <= triggerLimit) {
        fireAdminPushAlert(
          '⚠️ LOW STOCK WARNING',
          `${item.product.name} (${item.variant.size}) just dropped below your trigger limit. Only ${newStock} units left!`
        ).catch(e => console.error(e));
      }
    }

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
      }),
      cache: 'no-store'
    });

    const paystackJson = await paystackResponse.json();
    
    if (!paystackResponse.ok || !paystackJson.status) {
      throw new Error(`Paystack Initialization Rejected: ${paystackJson.message || 'Gateway connection timeout.'}`);
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/shop', 'layout');

    return { 
      success: true, 
      authorizationUrl: paystackJson.data.authorization_url,
      orderId: newOrderHeader.id 
    };

  } catch (err) {
    console.error("CRITICAL CHECKOUT SERVER ACTION CRASH ->", err);
    if (successfullyReservedItems.length > 0) {
       for (const item of successfullyReservedItems) {
          const { data: currentVariant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant.id).single();
          if (currentVariant) {
             await supabase.from('product_variants').update({ stock_quantity: currentVariant.stock_quantity + parseInt(item.quantity) }).eq('id', item.variant.id);
          }
       }
    }
    return { success: false, error: err.message };
  }
}

export async function verifyAndFinalizeCustomerPaymentAction(orderId) {
  noStore();
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

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${orderId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${paystackSecret}` },
      cache: 'no-store'
    });

    const verifyJson = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyJson.status || verifyJson.data.status !== 'success') {
      return { success: false, error: `Paystack Verification Pending: ${verifyJson.message || 'Awaiting cleared funds.'}` };
    }

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

    const metadata = updatedOrder.metadata || {};
    const appliedCodeId = metadata.code_id;

    // 🚨 FETCH ALL ITEMS: Needed for BOTH payout logic and stock email alerts
    const { data: itemLines } = await supabase
      .from('order_items')
      .select(`
        quantity, 
        size,
        product_variants ( 
          id, 
          referrer_earnings,
          stock_quantity,
          low_stock_trigger,
          products ( name )
        )
      `)
      .eq('order_id', orderId);

    // 1. Ambassador Payout Logic
    if (appliedCodeId && !metadata.payout_processed && itemLines && itemLines.length > 0) {
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

    // 2. Build Low Stock Email Alert String
    let lowStockAlertsHTML = '';
    if (itemLines && itemLines.length > 0) {
      itemLines.forEach(line => {
        const variant = line.product_variants;
        if (variant) {
          const currentStock = variant.stock_quantity;
          const triggerLimit = variant.low_stock_trigger !== null ? variant.low_stock_trigger : 20;
          
          // Format product name safely handling Supabase relation arrays/objects
          const productName = Array.isArray(variant.products) 
            ? variant.products[0]?.name 
            : variant.products?.name || 'Sparkle Drink';

          if (currentStock <= 0) {
            lowStockAlertsHTML += `<p style="color: #DC2626; font-weight: bold; margin: 8px 0; font-size: 14px;">🚨 ZERO STOCK: ${productName} (${line.size}) has completely sold out!</p>`;
          } else if (currentStock <= triggerLimit) {
            lowStockAlertsHTML += `<p style="color: #D97706; font-weight: bold; margin: 8px 0; font-size: 14px;">⚠️ LOW STOCK: ${productName} (${line.size}) is down to ${currentStock} units.</p>`;
          }
        }
      });
    }

    try {
      fireAdminPushAlert(
        '💰 NEW PAID ORDER SECURED',
        `A payment of ₵${Number(updatedOrder.total_amount).toFixed(2)} just cleared for ${updatedOrder.customer_name}.`
      ).catch(e => console.error(e));

      // SEND 1: The standard "New Order" notification
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

      // SEND 2: The guaranteed Low Stock Email Fallback
      if (lowStockAlertsHTML !== '') {
        await resend.emails.send({
          from: 'Sparkle Admin <admin@sparklebeverages.com>',
          to: ['orders@sparklebeverages.com'], 
          subject: `⚠️ INVENTORY ALERT: Low Stock Detected!`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border-radius: 10px; background-color: #FFFBEB; border: 1px solid #FCD34D;">
              <h2 style="color: #B45309; margin-top: 0;">Inventory Threshold Reached</h2>
              <p style="color: #4B5563;">Following the recent payment from ${updatedOrder.customer_name}, the system verified the following inventory alerts:</p>
              
              <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; margin: 15px 0;">
                ${lowStockAlertsHTML}
              </div>
              
              <p style="font-size: 12px; color: #6B7280; margin-bottom: 0;">Please log into the Sparkle Operations Hub to update your stock matrix.</p>
            </div>
          `
        });
      }

    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/shop', 'layout');
    revalidatePath('/', 'layout');

    return { success: true, data: updatedOrder };

  } catch (err) {
    console.error("VERIFICATION ACTION ENGINE CRASH ->", err);
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatusAdmin(orderId, targetState) {
  noStore();
  try {
    const supabase = getServiceSupabaseClient(); 

    if (targetState === 'cancelled') {
      const { data: items } = await supabase.from('order_items').select('variant_id, quantity').eq('order_id', orderId);
      if (items) {
        for (const item of items) {
          const { data: variant } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
          if (variant) {
            await supabase.from('product_variants').update({ stock_quantity: variant.stock_quantity + item.quantity }).eq('id', item.variant_id);
          }
        }
      }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: targetState })
      .eq('id', orderId);

    if (updateError) throw updateError;

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

        await fireSMSOnlineGHGateway(orderData.customer_phone, smsMessage);
      }
    }

    revalidatePath('/admin', 'layout');
    return { success: true };

  } catch (error) {
    console.error("Status Update Failed:", error);
    return { success: false, error: error.message };
  }
}
