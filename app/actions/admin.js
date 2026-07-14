'use server';

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
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
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `key ${apiKey}` },
      body: JSON.stringify({ sender: senderId, text: messageContent, type: 0, destinations: [formatGhanaianPhoneNumber(targetPhone)] })
    });
    return response.ok;
  } catch (err) { return false; }
}

export async function getAllOrdersForAdmin() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateOrderStatusAdmin(orderId, targetState) {
  try {
    const supabase = getAdminClient();
    const { data: orderRecord, error: fetchOrderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (fetchOrderError || !orderRecord) return { success: false, error: "Order not found." };

    const metadata = orderRecord.metadata || {};
    const appliedCodeId = metadata.code_id;
    const isDispatchTrigger = targetState === 'completed';
    const hasAlreadyEarned = metadata.payout_processed === true;

    if (isDispatchTrigger && appliedCodeId && !hasAlreadyEarned) {
      const { data: lineItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`quantity, product_variants ( referrer_earnings )`)
        .eq('order_id', orderId);

      if (!itemsError && lineItems && lineItems.length > 0) {
        let totalPayout = 0;
        
        lineItems.forEach(item => {
          const variantEarningsBounty = Number(item.product_variants?.referrer_earnings || 1.00);
          totalPayout += variantEarningsBounty * Number(item.quantity);
        });

        if (totalPayout > 0) {
          const { data: profile } = await supabase.from('referral_codes').select('total_earnings').eq('id', appliedCodeId).single();
          await supabase.from('referral_codes').update({ total_earnings: Number(profile?.total_earnings || 0) + totalPayout }).eq('id', appliedCodeId);
          metadata.payout_processed = true;
          metadata.calculated_payout_amount = totalPayout;
        }
      }
    }
    const { error: updateError } = await supabase.from('orders').update({ status: targetState, metadata: metadata }).eq('id', orderId);
    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getAllReferralCodesAdmin() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('referral_codes').select('*').order('created_at', { ascending: false });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function createNewReferralCodeAdmin(formPayload) {
  try {
    const supabase = getAdminClient();
    const { code, campaignName } = formPayload;
    const cleanCode = code.trim().toUpperCase();
    const generatedPassword = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { error: codeInsertError } = await supabase
      .from('referral_codes').insert([{ code: cleanCode, campaign_name: campaignName.trim(), is_active: true, is_verified: true, total_earnings: 0.00, password: generatedPassword, status: 'approved' }]);

    if (codeInsertError) return { success: false, error: codeInsertError.message };
    return { success: true, generatedPassword };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function processReferrerApprovalAdminAction(profileId) {
  try {
    const supabase = getAdminClient();
    const { data: profile, error: fetchError } = await supabase.from('referral_codes').select('*').eq('id', profileId).single();
    if (fetchError || !profile) return { success: false, error: "Profile missing." };

    const APPROVAL_TEXT = `Welcome to the Sparkle Agent Network! Your account has been approved. Tracking Code (Username): ${profile.code} | Secure Password: ${profile.password}. Log in live to track your earnings.`;
    const smsFired = await fireSMSOnlineGHGateway(profile.phone_number, APPROVAL_TEXT);
    if (!smsFired) return { success: false, error: "SMS Gateway processing failure. Verify your credits." };

    await supabase.from('referral_codes').update({ is_active: true, is_verified: true, status: 'approved' }).eq('id', profileId);
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function processReferrerRejectionAdminAction(profileId) {
  try {
    const supabase = getAdminClient();
    const { data: profile, error: fetchError } = await supabase.from('referral_codes').select('*').eq('id', profileId).single();
    if (fetchError || !profile) return { success: false, error: "Profile missing." };

    const REJECTION_TEXT = `Hello ${profile.legal_name || 'there'}, thank you for your application to Sparkle Beverages. Regrettably, your request to join our Ambassador Network has been declined due to credential mismatches.`;
    const smsFired = await fireSMSOnlineGHGateway(profile.phone_number, REJECTION_TEXT);
    if (!smsFired) return { success: false, error: "SMS processing failure. Check your balance parameters." };

    await supabase.from('referral_codes').update({ is_active: false, is_verified: false, status: 'rejected' }).eq('id', profileId);
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function deleteReferrerAdminAction(profileId) {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('referral_codes').delete().eq('id', profileId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function toggleReferralStateAdmin(codeId, updatePayload) {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('referral_codes').update(updatePayload).eq('id', codeId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getStoreInventoryAdmin() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('products').select(`id, name, description, is_active, product_variants ( id, sku, size, retail_price, wholesale_price, stock_quantity, is_in_stock, size_moq_floor, moq_floor, client_discount, referrer_earnings, image_url )`).order('name', { ascending: true });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateVariantInventoryAdmin(variantId, fieldsToUpdate) {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('product_variants').update(fieldsToUpdate).eq('id', variantId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getAdminWithdrawalTicketsQueueAction() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`id, gross_amount, wht_deducted, fee_deducted, net_payout, status, created_at, referral_codes ( id, code, legal_name, phone_number, momo_number, momo_network )`)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function executePaystackMobileMoneyPayoutAdminAction(ticketId) {
  try {
    const supabase = getAdminClient();
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) return { success: false, error: "Missing server keys tokens." };

    const { data: ticket, error: ticketError } = await supabase
      .from('withdrawal_requests').select(`*, referral_codes ( phone_number, code, legal_name, momo_number, momo_network )`).eq('id', ticketId).single();

    if (ticketError || !ticket || ticket.status !== 'pending') return { success: false, error: "Ticket is no longer pending." };

    const recipientMoMoNumber = ticket.referral_codes.momo_number;
    const recipientNetworkSlug = ticket.referral_codes.momo_network === 'MTN' ? 'mtn' : ticket.referral_codes.momo_network === 'Telecel' ? 'vod' : 'tigo';
    
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${paystackSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'mobile_money', name: ticket.referral_codes.legal_name, account_number: recipientMoMoNumber, bank_code: recipientNetworkSlug, currency: 'GHS' })
    });

    const recipientJson = await recipientResponse.json();
    if (!recipientResponse.ok || !recipientJson.status) return { success: false, error: recipientJson.message };

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${paystackSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'balance', amount: Math.round(Number(ticket.net_payout) * 100), recipient: recipientJson.data.recipient_code, reason: `Sparkle Ref: ${ticket.referral_codes.code}` })
    });

    const transferJson = await transferResponse.json();
    if (!transferResponse.ok || !transferJson.status) return { success: false, error: transferJson.message };

    await supabase.from('withdrawal_requests').update({ status: 'processed' }).eq('id', ticketId);
    
    const PAID_TEXT = `Sparkle Wallet Alert: Your withdrawal has been processed! ₵${ticket.net_payout} Net has been transferred straight to your mobile wallet.`;
    await fireSMSOnlineGHGateway(ticket.referral_codes.phone_number, PAID_TEXT);

    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function processWithdrawalDeclineAndRollbackAdminAction(ticketId) {
  try {
    const supabase = getAdminClient();
    const { data: ticket, error: ticketError } = await supabase
      .from('withdrawal_requests').select('*, referral_codes(id, total_earnings, phone_number, legal_name)')
      .eq('id', ticketId).single();

    if (ticketError || !ticket || ticket.status !== 'pending') return { success: false, error: "Ticket is already finalized or missing." };

    const parentReferrerId = ticket.referral_codes.id;
    const historicalGrossValue = Number(ticket.gross_amount);
    const updatedWalletBalance = Number(ticket.referral_codes.total_earnings) + historicalGrossValue;

    await supabase.from('referral_codes').update({ total_earnings: updatedWalletBalance }).eq('id', parentReferrerId);
    await supabase.from('withdrawal_requests').update({ status: 'declined' }).eq('id', ticketId);

    const DENIED_TEXT = `Sparkle Wallet Notification: Your withdrawal request for ₵${historicalGrossValue} has been declined. The full amount has been refunded back to your available dashboard balance.`;
    await fireSMSOnlineGHGateway(ticket.referral_codes.phone_number, DENIED_TEXT);

    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getSiteSettingsAdmin() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'homepage').single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data.content };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateSiteSettingsAdmin(contentJson) {
  try {
    const supabase = getAdminClient();
    const { error: error } = await supabase.from('site_settings').update({ content: contentJson }).eq('id', 'homepage');
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function createNewProductWithVariantsAdmin(name, description) {
  try {
    const supabase = getAdminClient();
    const { data: newProduct, error: productError } = await supabase.from('products').insert([{ name: name.trim(), description: description.trim(), is_active: true }]).select('*').single();
    if (productError || !newProduct) return { success: false, error: productError.message };

    const skuSlug = name.substring(0, 3).toUpperCase().replace(/\s+/g, '');
    const standardSizes = [
      { size: '300ml', retail: 5.00, wholesale: 4.50, floor: 50 },
      { size: '500ml', retail: 8.00, wholesale: 7.00, floor: 30 },
      { size: '1.5L',  retail: 15.00, wholesale: 13.50, floor: 15 },
      { size: '5L',   retail: 45.00, wholesale: 40.00, floor: 5 }
    ];

    const variantRows = standardSizes.map(item => ({ product_id: newProduct.id, size: item.size, sku: `SPK-${skuSlug}-${item.size}`, retail_price: item.retail, wholesale_price: item.wholesale, stock_quantity: 0, size_moq_floor: 30, moq_floor: item.floor, client_discount: 1.00, referrer_earnings: 1.00, is_in_stock: false }));
    const { error: variantError } = await supabase.from('product_variants').insert(variantRows);
    if (variantError) return { success: false, error: `Product variant creation failed: ${variantError.message}` };
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function forceResetAmbassadorPasswordAdminAction(profileId, newPassword, phone, name) {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('referral_codes').update({ password: newPassword }).eq('id', profileId);
    
    if (error) return { success: false, error: error.message };

    // You can keep the SMS fallback here if you want, but the Admin UI now triggers the email!
    return { success: true };
  } catch (err) { 
    return { success: false, error: err.message }; 
  }
}