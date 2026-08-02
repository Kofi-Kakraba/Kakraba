'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Resend for the automated emails
const resend = new Resend(process.env.RESEND_API_KEY);

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

/**
 * ============================================================================
 * NEW: AUTOMATED PASSWORD RESET LOGIC
 * ============================================================================
 */

/**
 * Generates a reset token and emails the magic link to the ambassador
 */
export async function requestPasswordResetAction(email) {
  try {
    const supabase = getServiceSupabaseClient();
    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Check if an active ambassador exists with this email
    const { data: profile, error: searchError } = await supabase
      .from('referral_codes')
      .select('id, code, legal_name, is_active')
      .eq('email', cleanEmail)
      .single();

    if (searchError || !profile) {
      // Return a generic success message to prevent "email fishing" by hackers
      return { success: true, message: "If that email matches an active account, a reset link has been sent." };
    }

    if (!profile.is_active) {
      return { success: false, error: "This ambassador account has been suspended. Please contact support." };
    }

    // 2. Generate a secure, random token and set a 1-hour expiration
    const resetToken = crypto.randomUUID();
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    // 3. Save the token to the database
    const { error: updateError } = await supabase
      .from('referral_codes')
      .update({ 
        reset_token: resetToken, 
        reset_token_expires: expirationTime.toISOString() 
      })
      .eq('id', profile.id);

    if (updateError) throw new Error("Failed to secure reset token.");

    // 4. Construct the Magic Link based on environment
    const siteDomainBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sparklebeverages.com' 
      : 'http://localhost:3000';
    
    const magicLink = `${siteDomainBaseUrl}/referrer/reset-password?token=${resetToken}`;

    // 5. Dispatch the email via Resend
    await resend.emails.send({
      from: 'Sparkle Admin <admin@sparklebeverages.com>',
      to: cleanEmail,
      subject: 'Sparkle Squad: Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border-radius: 10px; background-color: #FAFAFA; border: 1px solid #E5E7EB;">
          <h2 style="color: #065F46;">Password Reset Request 🔐</h2>
          <p>Hi ${profile.legal_name || 'Ambassador'},</p>
          <p>We received a request to reset the password for your Sparkle Squad portal (Tracking Code: <strong>${profile.code}</strong>).</p>
          <p>Click the secure link below to set a new password. This link will expire in exactly 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Reset My Password</a>
          </div>
          <hr style="border: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6B7280;">If you did not request this reset, you can safely ignore this email. Your portal remains secure.</p>
        </div>
      `
    });

    return { success: true, message: "If that email matches an active account, a reset link has been sent." };

  } catch (err) {
    console.error("PASSWORD RESET CRASH ->", err);
    return { success: false, error: "An internal server error occurred while processing your request." };
  }
}

/**
 * Validates a magic token and updates the password to the new input
 */
export async function resetPasswordWithTokenAction(token, newPassword) {
  try {
    if (!token || !newPassword) return { success: false, error: "Missing required security data." };

    const supabase = getServiceSupabaseClient();
    const currentTime = new Date().toISOString();

    // 1. Find the ambassador by the token, ensuring it hasn't expired
    const { data: profile, error: searchError } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('reset_token', token)
      .gt('reset_token_expires', currentTime) // gt means "greater than" (token expires must be in the future)
      .single();

    if (searchError || !profile) {
      return { success: false, error: "This reset link is invalid or has expired. Please request a new one." };
    }

    // 2. Update the password and instantly destroy the token so it can't be reused
    const { error: updateError } = await supabase
      .from('referral_codes')
      .update({ 
        password: String(newPassword).trim(),
        reset_token: null,
        reset_token_expires: null 
      })
      .eq('id', profile.id);

    if (updateError) throw new Error("Failed to secure new password.");

    return { success: true };

  } catch (err) {
    console.error("TOKEN VALIDATION CRASH ->", err);
    return { success: false, error: "An internal server error occurred. Please try again." };
  }
}