'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { isValidAdminAuthHeader } from '../../lib/adminAuth';
import { sanitizeBlocks } from '../../lib/pageBlocks';

const ROW_ID = 'homepage_layout';
const MAX_HISTORY = 10;

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
  });
}

async function requireAdmin() {
  const h = await headers();
  if (!isValidAdminAuthHeader(h.get('authorization'))) throw new Error('Not authorised. Please sign in to the admin again.');
}

async function loadContent(supabase) {
  const { data, error } = await supabase.from('site_settings').select('content').eq('id', ROW_ID).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.content && typeof data.content === 'object' ? data.content : {};
}

async function saveContent(supabase, content) {
  const { data: updated, error } = await supabase.from('site_settings').update({ content }).eq('id', ROW_ID).select('id');
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    const { error: insErr } = await supabase.from('site_settings').insert([{ id: ROW_ID, content }]);
    if (insErr) throw new Error(insErr.message);
  }
}

// Everything the builder screen needs.
export async function getPageBuilderState() {
  try {
    await requireAdmin();
    const c = await loadContent(getAdminClient());
    return {
      success: true,
      data: {
        published: c.published?.blocks ? sanitizeBlocks(c.published.blocks) : null,
        publishedAt: c.published?.publishedAt || null,
        draft: c.draft?.blocks ? sanitizeBlocks(c.draft.blocks) : null,
        draftSavedAt: c.draft?.savedAt || null,
        history: (Array.isArray(c.history) ? c.history : []).map((h) => ({ publishedAt: h.publishedAt, blocks: sanitizeBlocks(h.blocks) })),
      },
    };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function savePageDraft(blocks) {
  try {
    await requireAdmin();
    const supabase = getAdminClient();
    const c = await loadContent(supabase);
    const clean = sanitizeBlocks(blocks);
    c.draft = { blocks: clean, savedAt: new Date().toISOString() };
    await saveContent(supabase, c);
    return { success: true, blocks: clean, savedAt: c.draft.savedAt };
  } catch (err) { return { success: false, error: err.message }; }
}

// Makes the given blocks live. The previous live version is kept in history.
export async function publishPageLayout(blocks) {
  try {
    await requireAdmin();
    const supabase = getAdminClient();
    const c = await loadContent(supabase);
    const clean = sanitizeBlocks(blocks);
    const history = Array.isArray(c.history) ? c.history : [];
    if (c.published?.blocks) history.unshift({ blocks: c.published.blocks, publishedAt: c.published.publishedAt || null });
    c.history = history.slice(0, MAX_HISTORY);
    c.published = { blocks: clean, publishedAt: new Date().toISOString() };
    c.draft = null;
    await saveContent(supabase, c);
    return { success: true, blocks: clean, publishedAt: c.published.publishedAt, history: c.history.map((h) => ({ publishedAt: h.publishedAt, blocks: sanitizeBlocks(h.blocks) })) };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function discardPageDraft() {
  try {
    await requireAdmin();
    const supabase = getAdminClient();
    const c = await loadContent(supabase);
    c.draft = null;
    await saveContent(supabase, c);
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}
