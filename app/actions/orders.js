'use server';

import { createServerSupabaseClient } from '../../lib/supabase-server'; 

// Helper to ensure SMSOnlineGH gets the correct 233 format
function formatGhanaianPhoneNumber(rawPhone) {
  let formatted = rawPhone.trim().replace(/\s+/g, '');
  if (formatted.startsWith('0')) return '233' + formatted.substring(1);
  if (formatted.startsWith('+233')) return formatted.substring(1);
  if (!formatted.startsWith('233')) return '233' + formatted;
  return formatted;
}

export async function updateOrderStatusAdmin(orderId, targetState) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Update the database state
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: targetState })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 2. TRIGGER THE SMS IF THE NEW STATE IS 'ready'
    if (targetState === 'ready') {
      
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_name, customer_phone')
        .eq('id', orderId)
        .single();

      if (orderData && orderData.customer_phone) {
        const firstName = orderData.customer_name.split(' ')[0] || 'Customer';
        const orderRef = orderId.substring(0, 8).toUpperCase();
        
        // The SMS message body
        const smsMessage = `Hi ${firstName}, your Sparkle Beverages order #${orderRef} is packed and READY for pickup at our HQ Depot! See you soon.`;

        // 🚨 SMSONLINEGH GATEWAY INTEGRATION 🚨
        const apiKey = process.env.SMS_ONLINE_GH_KEY;
        const senderId = process.env.SMS_ONLINE_GH_SENDER_ID || 'SPARKLE';
        
        if (apiKey) {
          const smsResponse = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Accept': 'application/json', 
              'Authorization': `key ${apiKey}` 
            },
            body: JSON.stringify({ 
              sender: senderId, 
              text: smsMessage, 
              type: 0, 
              destinations: [formatGhanaianPhoneNumber(orderData.customer_phone)] 
            })
          });
          
          if (!smsResponse.ok) {
            console.error("[SMS LOG] SMSOnlineGH Gateway rejected the pickup notification.");
          } else {
            console.log(`[SMS LOG] Pickup SMS successfully fired to ${orderData.customer_phone}`);
          }
        } else {
          console.error("[SMS LOG] Missing SMS_ONLINE_GH_KEY in environment variables. Cannot send text.");
        }
      }
    }

    return { success: true };

  } catch (error) {
    console.error("Status Update Failed:", error);
    return { success: false, error: error.message };
  }
}
