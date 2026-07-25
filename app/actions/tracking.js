'use server';

import { createClient } from '@supabase/supabase-js';

export async function fetchOrderForTracking(orderRef, phoneNum) {
  try {
    // Use service role to bypass RLS safely, since we enforce strict matching
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cleanRef = orderRef.trim().toLowerCase();
    const cleanPhone = phoneNum.trim().replace(/\s+/g, '');

    // Query the database looking for a match on BOTH fields
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, delivery_type, landmark, created_at, metadata')
      .ilike('id', `${cleanRef}%`) // Allows them to just type the first 8 characters
      .eq('customer_phone', cleanPhone)
      .single();

    if (error || !order) {
      return { success: false, error: "Order not found. Please check your Reference ID and Phone Number." };
    }

    return { success: true, data: order };
  } catch (err) {
    return { success: false, error: "System error. Please try again later." };
  }
}
