import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Helper function to sanitize phone strings into international 233 standards for SMSOnlineGH
function formatGhanaianPhoneNumber(rawPhone) {
  let formatted = rawPhone.trim().replace(/\s+/g, '');
  if (formatted.startsWith('0')) return '233' + formatted.substring(1);
  if (formatted.startsWith('+233')) return formatted.substring(1);
  if (!formatted.startsWith('233')) return '233' + formatted;
  return formatted;
}

/**
 * Next.js POST API Route Handler to listen for secure, automated background 
 * event transmissions directly from Paystack payment clusters.
 */
export async function POST(request) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Missing security key environment tokens' }, { status: 500 });
    }

    // 1. READ RAW STRING DATA TO EXECUTE ENCRYPTED SIGNATURE VALIDATION
    const rawBody = await request.text();
    const paystackSignatureHeader = request.headers.get('x-paystack-signature');

    if (!paystackSignatureHeader) {
      return NextResponse.json({ error: 'Missing security signature hash' }, { status: 401 });
    }

    // Generate secure local hash using your server's unique Secret Key
    const locallyCalculatedHash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    // FIXED: Added strict inequality operator (!==) to resolve the compiler parsing crash
    if (locallyCalculatedHash !== paystackSignatureHeader) {
      return NextResponse.json({ error: 'Signature verification mismatch' }, { status: 401 });
    }

    // 2. PARSE THE VERIFIED SYSTEM EVENT PAYLOAD
    const eventPayload = JSON.parse(rawBody);

    // We are only listening for successful transaction clearings
    if (eventPayload.event !== 'charge.success') {
      return NextResponse.json({ received: true, message: 'Event ignored' }, { status: 200 });
    }

    const transactionData = eventPayload.data;
    const uniqueReference = transactionData.reference; // This holds our Supabase master Order ID string

    if (!uniqueReference) {
      return NextResponse.json({ error: 'Missing tracking reference payload metadata' }, { status: 400 });
    }

    // 3. INITIALIZE SECURE SUPABASE ADMINISTRATIVE ENGINE DIRECTLY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // FIXED LOOKUP: Queries the unique reference directly against the 'id' column to match your storefront payload
    const { data: matchedOrder, error: orderFetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', uniqueReference)
      .maybeSingle();

    if (orderFetchError || !matchedOrder) {
      return NextResponse.json({ error: 'Matching order record not found in system database' }, { status: 404 });
    }

    // FAIL-SAFE CHECK: If the customer already loaded the success page, the database is updated.
    // Exit thread gracefully to prevent double-deducting stock or double-sending SMS.
    if (matchedOrder.payment_status === 'paid') {
      return NextResponse.json({ received: true, message: 'Order was already processed successfully via frontend callback loop.' }, { status: 200 });
    }

    // 4. RETRIEVE ORDER LINE ITEMS TO EXECUTE INVENTORY DEDUCTION
    const { data: lineItems, error: itemsFetchError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', matchedOrder.id);

    if (itemsFetchError || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: 'Failed to retrieve order items for processing inventory updates' }, { status: 500 });
    }

    // Loop through individual line item purchases to safely reduce product stock quantities
    for (const item of lineItems) {
      const { data: variantRecord, error: variantFetchError } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', item.variant_id)
        .single();

      if (!variantFetchError && variantRecord) {
        const structuralCalculatedNewStock = Math.max(0, variantRecord.stock_quantity - item.quantity);
        
        // Commit the new stock count back to your product database row
        await supabase
          .from('product_variants')
          .update({ 
            stock_quantity: structuralCalculatedNewStock,
            is_in_stock: structuralCalculatedNewStock > 0
          })
          .eq('id', item.variant_id);
      }
    }

    // 5. UPDATE MASTER ORDER STATE TARGETS TO PAID STATUS
    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing' })
      .eq('id', matchedOrder.id)
      .select('*')
      .single();

    if (orderUpdateError) throw orderUpdateError;

    // =========================================================================
    // ✨ AMBASSADOR WALLET EARNINGS PROCESSING PIPELINE INTEGRATION
    // =========================================================================
    const orderMetadata = updatedOrder.metadata || {};
    const appliedPartnerCodeId = orderMetadata.code_id;

    if (appliedPartnerCodeId && !orderMetadata.payout_processed) {
      const { data: itemLineRows } = await supabase
        .from('order_items')
        .select(`quantity, product_variants ( id, referrer_earnings )`)
        .eq('order_id', matchedOrder.id);

      if (itemLineRows && itemLineRows.length > 0) {
        let accumulatedPartnerBountyTotal = 0;
        
        itemLineRows.forEach(line => {
          const singleUnitEarningCut = Number(line.product_variants?.referrer_earnings || 1.00);
          accumulatedPartnerBountyTotal += singleUnitEarningCut * Number(line.quantity || 1);
        });

        if (accumulatedPartnerBountyTotal > 0) {
          const { data: currentWalletRecord } = await supabase
            .from('referral_codes')
            .select('total_earnings')
            .eq('id', appliedPartnerCodeId)
            .single();

          const optimizedWalletSumResult = Number(currentWalletRecord?.total_earnings || 0) + accumulatedPartnerBountyTotal;

          await supabase
            .from('referral_codes')
            .update({ total_earnings: optimizedWalletSumResult })
            .eq('id', appliedPartnerCodeId);

          orderMetadata.payout_processed = true;
          orderMetadata.calculated_payout_amount = accumulatedPartnerBountyTotal;

          await supabase
            .from('orders')
            .update({ metadata: orderMetadata })
            .eq('id', matchedOrder.id);
        }
      }
    }

    // =========================================================================
    // 🛑 6. SILENCED EARLY CHECKOUT CONFIRMATION ALERTS
    // Moved completely to the manual Admin Hub Dispatch/Pickup controls.
    // =========================================================================
    /*
    const targetCustomerPhone = matchedOrder.customer_phone;
    const totalPaidGHS = Number(matchedOrder.total_amount).toFixed(2);
    const plainSmsMessageText = `Hi ${matchedOrder.customer_name}, your Sparkle Beverages order #${matchedOrder.id.substring(0, 8).toUpperCase()} of GHS ${totalPaidGHS} has been confirmed and paid successfully! We are preparing your order now. Thank you!`;

    if (process.env.SMS_ONLINE_GH_KEY) {
      try {
        const cleanInternationalPhone = formatGhanaianPhoneNumber(targetCustomerPhone);

        const smsGatewayUrl = `https://api.smsonlinegh.com/v5/message/sms/send?key=${encodeURIComponent(
          process.env.SMS_ONLINE_GH_KEY
        )}&text=${encodeURIComponent(plainSmsMessageText)}&type=0&sender=${encodeURIComponent(
          process.env.SMS_ONLINE_GH_SENDER_ID || 'SPARKLE'
        )}&to=${encodeURIComponent(cleanInternationalPhone)}`;

        await fetch(smsGatewayUrl, { method: 'GET' });
      } catch (smsNetworkError) {
        console.error("WEBHOOK SMS DISPATCH NETWORK ERROR ->", smsNetworkError.message);
      }
    }
    */

    // FIXED: Formatted response correctly to return standard Next.js Response layouts cleanly
    return NextResponse.json({ received: true, status: 'success' }, { status: 200 });

  } catch (globalException) {
    console.error('CRITICAL SYSTEM WEBHOOK EXCEPTION ROUTINE ->', globalException);
    return NextResponse.json({ error: `Internal Runtime Error: ${globalException.message}` }, { status: 500 });
  }
}