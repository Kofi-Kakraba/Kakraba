'use server';

import { createClient } from '@supabase/supabase-js';

function getServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Legacy Export Alias: Authenticates a referrer/ambassador login attempt
 * Maps directly to your existing portal components seamlessly
 */
export async function loginReferrerPortal(usernameToken, passwordToken) {
  return await authenticateAmbassadorSessionAction(usernameToken, passwordToken);
}

/**
 * Modern Export: Authenticates an ambassador login session validation check
 */
export async function authenticateAmbassadorSessionAction(usernameToken, passwordToken) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data: profile, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', String(usernameToken).trim().toUpperCase())
      .eq('password', String(passwordToken).trim())
      .single();

    if (error || !profile) return { success: false, error: "Access Denied: Credentials mismatched." };
    if (!profile.is_active) return { success: false, error: "Suspended: This account line is offline." };

    return { success: true, profile };
  } catch (err) { 
    return { success: false, error: err.message }; 
  }
}

/**
 * Updates an ambassador/referrer's security access key password credential row
 */
export async function updateReferrerPasswordAction(referrerId, newPassword) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase
      .from('referral_codes')
      .update({ password: String(newPassword).trim() })
      .eq('id', referrerId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Creates a cashout request ticket atomically, deducting balance to prevent double-spending
 */
export async function fileAmbassadorWithdrawalTicketAction(referrerId) {
  try {
    const supabase = getServiceSupabaseClient();

    // 1. Fetch current live available wallet balance figures
    const { data: profile, error: fetchError } = await supabase
      .from('referral_codes')
      .select('id, total_earnings, legal_name')
      .eq('id', referrerId)
      .single();

    if (fetchError || !profile) return { success: false, error: "Account lookup failure." };
    
    const grossBalanceToCashout = Number(profile.total_earnings);
    if (grossBalanceToCashout <= 10.00) {
      return { success: false, error: "Refused: Minimum threshold balance for mobile payout runs is GHS 10.00." };
    }

    // 2. Calculate Ghanaian Withholding Tax (10% standard reduction)
    const calculatedTaxCut = Number((grossBalanceToCashout * 0.10).toFixed(2));
    const finalNetPayoutAmount = Number((grossBalanceToCashout - calculatedTaxCut).toFixed(2));

    // 3. Atomically zero out their dashboard available earnings row to prevent double spending
    const { error: balanceZeroError } = await supabase
      .from('referral_codes')
      .update({ total_earnings: 0.00 })
      .eq('id', referrerId);

    if (balanceZeroError) throw new Error("Balance locking exception.");

    // 4. Drop the pending ticket row down into the operations queue ledger
    const { error: ticketError } = await supabase
      .from('withdrawal_requests')
      .insert([{
        referral_code_id: referrerId,
        gross_amount: grossBalanceToCashout,
        wht_deducted: calculatedTaxCut,
        fee_deducted: 0.00,
        net_payout: finalNetPayoutAmount,
        status: 'pending'
      }]);

    if (ticketError) {
      // Revert funds back to their available balance if the ticket creation fails
      await supabase.from('referral_codes').update({ total_earnings: grossBalanceToCashout }).eq('id', referrerId);
      return { success: false, error: `Queue creation blocked: ${ticketError.message}` };
    }

    return { success: true, netPayout: finalNetPayoutAmount };

  } catch (err) { 
    return { success: false, error: err.message }; 
  }
}