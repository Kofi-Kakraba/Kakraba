'use server';

import { createClient } from '@supabase/supabase-js';

// Helper function to sanitize phone strings into international 233 standards for SMSOnlineGH
function formatGhanaianPhoneNumber(rawPhone) {
  let formatted = rawPhone.trim().replace(/\s+/g, '');
  if (formatted.startsWith('0')) return '233' + formatted.substring(1);
  if (formatted.startsWith('+233')) return formatted.substring(1);
  if (!formatted.startsWith('233')) return '233' + formatted;
  return formatted;
}

/**
 * High-privilege server-side action to process order completions and handle SMS dispatches
 */
export async function confirmDispatchLogisticsServerAction(payload) {
  try {
    const { 
      orderId, deliveryType, customerPhone, customerName, 
      riderName, riderPhone, vehicleType, vehicleColor, plateNumber 
    } = payload;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment configuration.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch current metadata block to merge properties safely
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('metadata')
      .eq('id', orderId)
      .single();

    const currentMetadata = existingOrder?.metadata && typeof existingOrder.metadata === 'object' ? existingOrder.metadata : {};
    
    const updatedMetadata = {
      ...currentMetadata,
      dispatched_at: new Date().toISOString()
    };

    let messagePayload = '';
    const orderCodeToken = orderId.substring(0, 8).toUpperCase();
    const cleanCustomerName = customerName ? customerName.trim() : 'Customer';

    // 🚀 PERSONALIZED & EMOJI-FREE LOGISTICS TEMPLATES
    if (deliveryType === 'delivery') {
      updatedMetadata.rider_name = riderName.trim();
      updatedMetadata.rider_phone = riderPhone.trim();
      updatedMetadata.vehicle_type = vehicleType;
      updatedMetadata.vehicle_color = vehicleColor.trim();
      updatedMetadata.plate_number = plateNumber.trim().toUpperCase();

      messagePayload = `Hi ${cleanCustomerName}, payment confirmed! Your Sparkle Beverages order has been packed by our team and is on the way. Rider: ${riderName.trim()} (${riderPhone.trim()}) on a ${vehicleColor.trim()} ${vehicleType} [${plateNumber.trim().toUpperCase()}]. Thank you for choosing Sparkle!`;
    } else {
      updatedMetadata.pickup_confirmed = true;
      messagePayload = `Hi ${cleanCustomerName}, payment confirmed! Please call 0533527192 when coming to pickup your order, use SPK-${orderCodeToken} as your pickup code. Thank you for choosing Sparkle!`;
    }

    // 2. Commit status changes to Supabase securely using administrative role access
    const { error: dbError } = await supabase
      .from('orders')
      .update({ status: 'completed', metadata: updatedMetadata })
      .eq('id', orderId);

    if (dbError) throw dbError;

    // 3. Fire outbound text message using standard legacy GET parameters
    const apiKey = process.env.SMS_ONLINE_GH_KEY;
    const senderId = process.env.SMS_ONLINE_GH_SENDER_ID || 'SPARKLE';

    if (apiKey) {
      const cleanInternationalPhone = formatGhanaianPhoneNumber(customerPhone);
      const smsGatewayUrl = `https://api.smsonlinegh.com/v5/message/sms/send?key=${encodeURIComponent(
        apiKey
      )}&text=${encodeURIComponent(messagePayload)}&type=0&sender=${encodeURIComponent(
        senderId
      )}&to=${encodeURIComponent(cleanInternationalPhone)}`;

      await fetch(smsGatewayUrl, { method: 'GET' });
    }

    return { success: true };

  } catch (err) {
    console.error('💥 SYSTEM LOGISTICS SERVER ACTION FAULT:', err.message);
    return { success: false, error: err.message };
  }
}