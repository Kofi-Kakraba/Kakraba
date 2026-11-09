'use client';

import { useEffect, useState } from 'react';
import { getTheme, isCampaignLive, previewCampaign } from './siteThemes';

const CACHE_KEY = 'sparkleCampaignV1';
const PREVIEW_KEY = 'sparklePreviewTemplate';
let inflight = null;

// ?previewTemplate=christmas shows a template for this browser session.
// ?previewTemplate=off shows the normal look; ?previewTemplate=live ends the preview.
export function getPreviewKey() {
  try {
    const p = new URLSearchParams(window.location.search).get('previewTemplate');
    if (p === 'live') sessionStorage.removeItem(PREVIEW_KEY);
    else if (p === 'off' || (p && getTheme(p))) sessionStorage.setItem(PREVIEW_KEY, p);
    return sessionStorage.getItem(PREVIEW_KEY);
  } catch { return null; }
}
export const isPreviewing = () => { try { return !!sessionStorage.getItem(PREVIEW_KEY); } catch { return false; } };

// undefined = nothing cached; null = cached "no campaign"; object = cached live campaign
function readCachedCampaign() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const { campaign } = JSON.parse(raw);
    if (!campaign) return null;
    return isCampaignLive(campaign) ? campaign : null;
  } catch { return undefined; }
}

async function fetchActiveCampaign() {
  if (inflight) return inflight;
  inflight = fetch('/api/site/campaign')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
    .then((d) => {
      const campaign = d?.campaign && getTheme(d.campaign.template) ? d.campaign : null;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ campaign, savedAt: Date.now() })); } catch {}
      return campaign;
    })
    .catch(() => undefined) // on failure keep whatever we already show
    .finally(() => { setTimeout(() => { inflight = null; }, 5000); });
  return inflight;
}

// undefined = still loading, null = no campaign today, object = the live campaign
export function useActiveCampaign() {
  const [campaign, setCampaign] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    const preview = getPreviewKey();
    if (preview === 'off') { setCampaign(null); return; }
    if (preview) { setCampaign(previewCampaign(preview)); return; }
    const cached = readCachedCampaign();
    if (cached !== undefined) setCampaign(cached);
    fetchActiveCampaign().then((c) => { if (!cancelled && c !== undefined) setCampaign(c); });
    return () => { cancelled = true; };
  }, []);
  return campaign;
}
