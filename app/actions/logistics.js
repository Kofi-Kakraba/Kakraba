'use server';

import { createClient } from '@supabase/supabase-js';

// Returns a Ghana number in 233XXXXXXXXX form, or null if it is not a valid number.
function normalizeGhanaPhone(raw) {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('233')) { /* already international */ }
  else if (d.startsWith('0')) d = '233' + d.slice(1);
  else d = '233' + d;
  return /^233\d{9}$/.test(d) ? d : null;
}

// Sends one SMS and reports what really happened (the old code ignored the gateway's reply).
async function sendSms(to, text) {
  const apiKey = process.env.SMS_ONLINE_GH_KEY;
  const senderId = process.env.SMS_ONLINE_GH_SENDER_ID || 'SPARKLE';
  if (!apiKey) return { ok: false, error: 'SMS_ONLINE_GH_KEY is not set on the server' };
  try {
    const res = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `key ${apiKey}` },
      body: JSON.stringify({ sender: senderId, text, type: 0, destinations: [to] }),
      cache: 'no-store',
    });
    const raw = await res.text();
    let body = null;
    try { body = JSON.parse(raw); } catch {}
    const hs = body?.handshake;
    const rejected = hs && hs.label !== 'HSHK_OK' && hs.id !== 0;
    if (!res.ok || rejected) {
      console.error('📵 SMS gateway rejected the message:', res.status, raw.slice(0, 500));
      return { ok: false, error: (hs && hs.label) || `gateway replied ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('📵 SMS gateway unreachable:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Marks an order as dispatched/completed and texts the customer.
 * The customer's name and phone are read from the order itself, not from the browser.
 * Returns { success, smsSent, smsError }.
 */
export async function confirmDispatchLogisticsServerAction(payload) {
  try {
    const { orderId, deliveryType, riderName, riderPhone, vehicleType, vehicleColor, plateNumber } = payload;

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment configuration.');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

    // 1. Load the order (name, phone and existing metadata come from the database)
    const { data: order, error: loadError } = await supabase
      .from('orders')
      .select('customer_name, customer_phone, metadata')
      .eq('id', orderId)
      .single();
    if (loadError || !order) throw new Error('Could not find this order.');

    // 2. Check the phone number BEFORE changing anything
    const toPhone = normalizeGhanaPhone(order.customer_phone);
    if (!toPhone) {
      return { success: false, error: `This order has no valid phone number (found "${order.customer_phone || ''}"), so no SMS can be sent.` };
    }

    const currentMetadata = order.metadata && typeof order.metadata === 'object' ? order.metadata : {};
    const updatedMetadata = { ...currentMetadata, dispatched_at: new Date().toISOString() };

    const orderCodeToken = orderId.substring(0, 8).toUpperCase();
    const firstName = (order.customer_name || 'Customer').trim().split(' ')[0];
    const urlPhone = String(order.customer_phone).replace('+', '').replace(/\s+/g, '');
    const magicLink = `https://sparklebeverages.com/track?id=${orderCodeToken}&phone=${urlPhone}`;

    let message;
    if (deliveryType === 'delivery') {
      const rName = (riderName || '').trim();
      const rPhone = (riderPhone || '').trim();
      const vType = vehicleType || '';
      const vColor = (vehicleColor || '').trim();
      Object.assign(updatedMetadata, {
        rider_name: rName, rider_phone: rPhone, vehicle_type: vType,
        vehicle_color: vColor, plate_number: (plateNumber || '').trim().toUpperCase(),
      });
      message = `Hi ${firstName}, payment confirmed! Your Sparkle order is out for delivery. Rider: ${rName} (${rPhone}) on a ${vColor} ${vType}. Track live: ${magicLink}`;
    } else {
      updatedMetadata.pickup_confirmed = true;
      message = `Hi ${firstName}, payment confirmed! Call 0533527192 upon arrival for pickup. Code: SPK-${orderCodeToken}. Track here: ${magicLink}`;
    }

    // 3. Save the new status
    const { error: dbError } = await supabase
      .from('orders')
      .update({ status: 'completed', metadata: updatedMetadata })
      .eq('id', orderId);
    if (dbError) throw dbError;

    // 4. Text the customer and report honestly whether it worked
    const sms = await sendSms(toPhone, message);
    return { success: true, smsSent: sms.ok, smsError: sms.ok ? null : sms.error };
  } catch (err) {
    console.error('💥 SYSTEM LOGISTICS SERVER ACTION FAULT:', err.message);
    return { success: false, error: err.message };
  }
}
