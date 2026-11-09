'use client';

import Link from 'next/link';
import { useActiveCampaign } from '../lib/campaignClient';
import { getTheme } from '../lib/siteThemes';

// Small promo pill on the homepage hero, shown while a campaign with a hero tag is live.
export default function CampaignHeroTag() {
  const campaign = useActiveCampaign();
  const theme = campaign ? getTheme(campaign.template) : null;
  if (!campaign || !theme || !campaign.heroTag) return null;

  const href = campaign.bannerLink || '/shop';
  const style = {
    background: `linear-gradient(90deg, ${theme.banner.from}, ${theme.banner.via}, ${theme.banner.to})`,
    color: theme.banner.text,
  };
  const cls = 'absolute top-5 left-6 md:left-12 z-20 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-xl';
  return href.startsWith('/')
    ? <Link href={href} className={cls} style={style}>{campaign.heroTag}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>{campaign.heroTag}</a>;
}
