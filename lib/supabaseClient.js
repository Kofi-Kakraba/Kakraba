/**
 * lib/supabaseClient.js
 * -----------------------------------------------------------------------
 * BROWSER-SAFE Supabase client. Import this from Client Components only.
 *
 * This file intentionally does NOT import `next/headers` or the service
 * role key — both are server-only concerns and would break the client
 * bundle (or leak secrets) if pulled in here. See lib/supabaseServer.js
 * for the server-side / admin equivalents.
 *
 * Requires: @supabase/ssr
 *   npm install @supabase/ssr
 *
 * Env vars (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 * -----------------------------------------------------------------------
 */

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Check your .env.local file.'
  );
}

/**
 * Browser client — safe inside "use client" components.
 * Governed entirely by RLS policies on the anon role: it should only
 * ever be able to SELECT active products/variants, never write orders
 * directly (order writes go through the Server Action + RPC instead).
 *
 * Usage:
 *   import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
 *   const supabase = createBrowserSupabaseClient();
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
