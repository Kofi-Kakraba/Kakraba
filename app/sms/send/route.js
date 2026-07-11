import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to sanitize phone strings into international 233 standards for SMSOnlineGH
function formatGhanaianPhoneNumber(rawPhone) {
  let formatted = rawPhone.trim().replace(/\s+/g, '');
  if (formatted.startsWith('0')) return '233' + formatted.substring(1);
  if (formatted.startsWith('+233')) return formatted.substring(1);
  if (!formatted.startsWith('233')) return '233' + formatted;
  return formatted;
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { 
      orderId, deliveryType, customerPhone, customerName, 
      riderName, riderPhone, vehicleType, vehicleColor, plateNumber 
    } = payload;

    // 1. Initialize administrative server-side client to bypass browser RLS constraints completely
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
      console.error("❌ SMS PROXY CRASH: SUPABASE_SERVICE_ROLE_KEY is completely missing inside your env logs.");
      return NextResponse.json({ success: false, error: 'Server configuration key missing.' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing metadata block to merge properties safely
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

    if (deliveryType === 'delivery') {
      updatedMetadata.rider_name = riderName.trim();
      updatedMetadata.rider_phone = riderPhone.trim();
      updatedMetadata.vehicle_type = vehicleType;
      updatedMetadata.vehicle_color = vehicleColor.trim();
      updatedMetadata.plate_number = plateNumber.trim().toUpperCase();

      messagePayload = `Payment Confirmed! 🌟 Your Sparkle Beverages order has been packed by our team and is on the way. Rider: ${riderName.trim()} (${riderPhone.trim()}) on a ${vehicleColor.trim()} ${vehicleType} [${plateNumber.trim().toUpperCase()}]. Thank you for choosing Sparkle!`;
    } else {
      updatedMetadata.pickup_confirmed = true;
      messagePayload = `Payment Confirmed! 🌟 Please call 0533527192 when coming to pickup your order, use SPK-${orderCodeToken} as your pickup code. Thank you for choosing Sparkle!`;
    }

    // 2. Commit the completed state variables directly via privileged server channels
    const { error: dbError } = await supabase
      .from('orders')
      .update({ status: 'completed', metadata: updatedMetadata })
      .eq('id', orderId);

    if (dbError) throw dbError;
    console.log(`📦 Database successfully updated Order #${orderCodeToken} to COMPLETED.`);

    // 3. Fire the outgoing text notification using the required legacy GET parameters
    const apiKey = process.env.SMS_ONLINE_GH_KEY;
    const senderId = process.env.SMS_ONLINE_GH_SENDER_ID || 'SPARKLE';

    if (!apiKey) {
      return NextResponse.json({ success: true, warning: 'Fulfillment saved to database, but SMS_ONLINE_GH_KEY is missing.' });
    }

    const cleanInternationalPhone = formatGhanaianPhoneNumber(customerPhone);
    const smsGatewayUrl = `https://api.smsonlinegh.com/v5/message/sms/send?key=${encodeURIComponent(
      apiKey
    )}&text=${encodeURIComponent(messagePayload)}&type=0&sender=${encodeURIComponent(
      senderId
    )}&to=${encodeURIComponent(cleanInternationalPhone)}`;

    console.log(`📡 Dispatching logistics text to carrier server: ${cleanInternationalPhone}`);
    
    const smsResponse = await fetch(smsGatewayUrl, { method: 'GET' });

    if (smsResponse.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: true, warning: 'Fulfillment saved to database, but text carrier rejected message authorization.' });
    }

  } catch (err) {
    console.error('💥 SYSTEM LOGISTICS PROXIED API EXCEPTION:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}