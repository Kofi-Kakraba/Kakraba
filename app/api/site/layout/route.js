import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeBlocks } from '../../../../lib/pageBlocks';

export const dynamic = 'force-dynamic';

// Public: the published homepage layout (or null = use the built-in default). Cached for a minute.
export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    });
    const { data } = await supabase.from('site_settings').select('content').eq('id', 'homepage_layout').maybeSingle();
    const blocks = data?.content?.published?.blocks ? sanitizeBlocks(data.content.published.blocks) : null;
    return NextResponse.json({ blocks }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch {
    return NextResponse.json({ blocks: null }, { headers: { 'Cache-Control': 'public, s-maxage=30' } });
  }
}
