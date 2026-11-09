'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_BLOCKS, sanitizeBlocks } from './pageBlocks';

const CACHE_KEY = 'sparkleLayoutV1';
const PREVIEW_KEY = 'sparklePreviewLayout';

// Returns { blocks, preview }. Until the saved layout arrives the page shows the default
// (today's) layout, so nothing ever looks broken. ?previewDraft=on shows the unpublished draft
// to a signed-in admin; ?previewDraft=off ends it.
export function usePageLayout() {
  const [state, setState] = useState({ blocks: DEFAULT_BLOCKS, preview: false });

  useEffect(() => {
    let cancelled = false;
    let previewing = false;
    try {
      const p = new URLSearchParams(window.location.search).get('previewDraft');
      if (p === 'on') sessionStorage.setItem(PREVIEW_KEY, '1');
      if (p === 'off') sessionStorage.removeItem(PREVIEW_KEY);
      previewing = sessionStorage.getItem(PREVIEW_KEY) === '1';
    } catch {}

    if (previewing) {
      fetch('/api/site/layout-draft', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not allowed'))))
        .then((d) => { if (!cancelled && d?.blocks) setState({ blocks: sanitizeBlocks(d.blocks), preview: true }); })
        .catch(() => {});
      return () => { cancelled = true; };
    }

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { blocks } = JSON.parse(raw);
        if (Array.isArray(blocks)) setState({ blocks: sanitizeBlocks(blocks), preview: false });
      }
    } catch {}

    fetch('/api/site/layout')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((d) => {
        const blocks = d?.blocks ? sanitizeBlocks(d.blocks) : DEFAULT_BLOCKS;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ blocks })); } catch {}
        if (!cancelled) setState({ blocks, preview: false });
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return state;
}
