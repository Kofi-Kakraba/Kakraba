import { createClient } from '@supabase/supabase-js';

// --- SUPABASE INITIALIZATION FOR ADMIN ---
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

// --- SMS ONLINE GH HELPERS ---
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

// --- THE UPDATED ADMIN FULFILLMENT ACTION ---
export async function updateOrderStatusAdmin(orderId, targetState) {
  try {
    const supabase = getAdminSupabaseClient();

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
        
        // Formulate the SMS message
        const smsMessage = `Hi ${firstName}, your Sparkle Beverages order #${orderRef} is packed and READY for pickup at our HQ Depot! See you soon.`;

        // Fire the SMS
        const smsSent = await fireSMSOnlineGHGateway(orderData.customer_phone, smsMessage);
        
        if (smsSent) {
          console.log(`[SMS LOG] Pickup SMS fired successfully to ${orderData.customer_phone}`);
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
