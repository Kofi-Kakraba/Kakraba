/**
 * lib/supabaseServer.js
 * -----------------------------------------------------------------------
 * SERVER-ONLY Supabase clients. Never import this file from a component
 * marked "use client" — it pulls in `next/headers` and (optionally) the
 * service role key, both of which must stay out of the browser bundle.
 *
 * Safe to import from:
 *   - Server Components
 *   - Route Handlers (app/api/**\/route.js)
 *   - Server Actions (files with a top-level 'use server' directive)
 *
 * Env vars (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (server-only, never NEXT_PUBLIC_)
 * -----------------------------------------------------------------------
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

/**
 * Cookie-aware server client — for Server Components / Server Actions
 * that need to respect a logged-in session (e.g. ambassador dashboard).
 * Not needed for anonymous checkout, but here for the rest of the app.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a context that can't mutate cookies — safe to
          // ignore if middleware is refreshing the session elsewhere.
        }
      },
    },
  });
}

/**
 * Admin client — SERVICE ROLE key, bypasses Row Level Security.
 * Use ONLY inside Server Actions / Route Handlers that never run in the
 * browser: order submission, Paystack webhook verification, ambassador
 * credentialing, commission payouts.
 */
export function createAdminSupabaseClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This must only be set on the ' +
        'server and never prefixed with NEXT_PUBLIC_.'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
