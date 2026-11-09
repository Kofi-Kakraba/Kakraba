import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pickActiveCampaign, publicCampaignView } from '../../../../lib/siteThemes';

export const dynamic = 'force-dynamic';

// Public endpoint: returns only the campaign that is live today (or null).
// Cached at the edge for a minute so it never slows the site down.
export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    });
    const { data } = await supabase.from('site_settings').select('content').eq('id', 'campaigns').maybeSingle();
    const active = pickActiveCampaign(data?.content?.campaigns || []);
    return NextResponse.json(
      { campaign: active ? publicCampaignView(active) : null },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch {
    return NextResponse.json({ campaign: null }, { headers: { 'Cache-Control': 'public, s-maxage=30' } });
  }
}
