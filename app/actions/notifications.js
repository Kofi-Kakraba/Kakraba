'use server';

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configure Web Push with your generated VAPID keys
webpush.setVapidDetails(
  'mailto:info@sparklebeverages.com', // Your contact email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function getServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Saves the Admin's phone/browser device token to the database
 */
export async function subscribeAdminToPushNotifications(subscriptionPayload) {
  try {
    const supabase = getServiceSupabaseClient();
    
    // Check if this specific subscription already exists so we don't duplicate it
    const { data: existing } = await supabase
      .from('admin_push_subscriptions')
      .select('id')
      .contains('subscription', { endpoint: subscriptionPayload.endpoint })
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('admin_push_subscriptions')
        .insert([{ subscription: subscriptionPayload }]);
        
      if (error) throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('Subscription save failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fires the actual real-time alert to all registered Admin devices
 */
export async function fireAdminPushAlert(title, messageBody, redirectUrl = '/') {
  try {
    const supabase = getServiceSupabaseClient();
    
    // Get all registered admin phones/computers
    const { data: subscriptions, error } = await supabase
      .from('admin_push_subscriptions')
      .select('subscription, id');
      
    if (error || !subscriptions || subscriptions.length === 0) return;
    
    const notificationPayload = JSON.stringify({ 
      title: title, 
      body: messageBody, 
      url: redirectUrl 
    });
    
    // Blast the alert to every admin device
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, notificationPayload);
      } catch (pushError) {
        // If the push fails (e.g., admin revoked permission or changed phones), delete the dead token
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await supabase.from('admin_push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push delivery failed:', pushError);
        }
      }
    }
  } catch (err) {
    console.error('Fatal Push Execution Error:', err);
  }
}