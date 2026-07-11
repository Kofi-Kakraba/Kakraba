'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Validates transaction status with Paystack, updates database master records, and fires SMS notifications via smsonlinegh.
 * @param {string} reference - The unique tracking token passed back from Paystack payload hooks.
 */
export async function verifyPaymentTransaction(reference) {
  try {
    if (!reference) return { success: false, error: "No transaction reference token found to process validation." };

    // Initialize standalone secure server client instance
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Double check transaction directly with Paystack API Core
    const gatewayResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const gatewayData = await gatewayResponse.json();

    if (!gatewayResponse.ok || !gatewayData.status || gatewayData.data.status !== 'success') {
      return { success: false, error: "Paystack engine cannot verify or confirm this transaction clearing successfully." };
    }

    // 2. Fetch the corresponding order row from Supabase to prevent duplicate processing
    const { data: matchedOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (fetchError || !matchedOrder) {
      return { success: false, error: "Transaction verified on Paystack, but matching order identifier was missing in Supabase." };
    }

    // If the order has already been processed and marked paid, close thread successfully without re-sending SMS
    if (matchedOrder.payment_status === 'paid') {
      return { success: true, orderDetails: matchedOrder };
    }

    // 3. Complete database update commit flag to 'paid' status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing' })
      .eq('id', matchedOrder.id)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: "Failed to update internal payment status configuration flags." };
    }

    // 4. FIRE COMPACT SMS NOTIFICATION VIA SMSONLINEGH GATEWAY (1,900 Paid Credits)
    const targetCustomerPhone = updatedOrder.customer_phone;
    const customerFirstName = updatedOrder.customer_name.split(' ')[0];
    const totalPaidGHS = Number(updatedOrder.total_amount).toFixed(2);
    
    const plainSmsMessageText = `Hello ${customerFirstName}, your payment of GHS ${totalPaidGHS} for order reference ${reference} has been received successfully! Thank you for choosing Sparkle Beverages.`;

    if (process.env.SMS_ONLINE_GH_KEY) {
      try {
        // Construct standard safe URL structure according to smsonlinegh platform protocol parameters
        const smsGatewayUrl = `https://api.smsonlinegh.com/v5/message/sms/send?key=${encodeURIComponent(
          process.env.SMS_ONLINE_GH_KEY
        )}&text=${encodeURIComponent(plainSmsMessageText)}&type=0&sender=${encodeURIComponent(
          process.env.SMS_ONLINE_GH_SENDER_ID || 'Sparkle Bev'
        )}&to=${encodeURIComponent(targetCustomerPhone)}`;

        await fetch(smsGatewayUrl, { method: 'GET' });
      } catch (smsNetworkError) {
        console.error("SMSONLINEGH GATEWAY EXCEPTION -> Communication timed out:", smsNetworkError.message);
      }
    }

    return { success: true, orderDetails: updatedOrder };

  } catch (fatalException) {
    console.error("VERIFICATION RUNTIME EXCEPTION ->", fatalException);
    return { success: false, error: fatalException.message };
  }
}