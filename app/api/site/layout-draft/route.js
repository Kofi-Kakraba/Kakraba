import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeBlocks } from '../../../../lib/pageBlocks';
import { isValidAdminAuthHeader } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// Admin only (also protected in proxy.ts): the unpublished draft, for the "Preview draft" button.
export async function GET(request) {
  if (!isValidAdminAuthHeader(request.headers.get('authorization'))) {
    return new NextResponse('Authentication Required.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Secure Admin Dashboard"' } });
  }
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    });
    const { data } = await supabase.from('site_settings').select('content').eq('id', 'homepage_layout').maybeSingle();
    const c = data?.content || {};
    const raw = c.draft?.blocks || c.published?.blocks || null;
    return NextResponse.json({ blocks: raw ? sanitizeBlocks(raw) : null, isDraft: !!c.draft?.blocks }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ blocks: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
