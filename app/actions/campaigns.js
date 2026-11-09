'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { isValidAdminAuthHeader } from '../../lib/adminAuth';
import { sanitizeCampaigns } from '../../lib/siteThemes';

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
  });
}

// Every campaign action checks the admin login itself, so it cannot be called from outside /admin.
async function requireAdmin() {
  const h = await headers();
  if (!isValidAdminAuthHeader(h.get('authorization'))) throw new Error('Not authorised. Please sign in to the admin again.');
}

export async function getCampaignsAdmin() {
  try {
    await requireAdmin();
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('site_settings').select('content').eq('id', 'campaigns').maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, data: sanitizeCampaigns(data?.content?.campaigns) };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function saveCampaignsAdmin(list) {
  try {
    await requireAdmin();
    const supabase = getAdminClient();
    const clean = sanitizeCampaigns(list);
    const content = { campaigns: clean, updatedAt: new Date().toISOString() };

    // Update the row if it exists, otherwise create it.
    const { data: updated, error: updErr } = await supabase
      .from('site_settings').update({ content }).eq('id', 'campaigns').select('id');
    if (updErr) return { success: false, error: updErr.message };
    if (!updated || updated.length === 0) {
      const { error: insErr } = await supabase.from('site_settings').insert([{ id: 'campaigns', content }]);
      if (insErr) return { success: false, error: insErr.message };
    }
    return { success: true, data: clean };
  } catch (err) { return { success: false, error: err.message }; }
}
