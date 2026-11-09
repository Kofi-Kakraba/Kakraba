'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useActiveCampaign, isPreviewing } from '../lib/campaignClient';
import { getTheme, buildThemeCss } from '../lib/siteThemes';

// The admin hub and the payment flow stay clean and fast.
const EXCLUDED_PREFIXES = ['/admin', '/checkout'];
const STYLE_ID = 'sparkle-theme-style';
const CSS_CACHE_KEY = 'sparkleThemeCss';

function Countdown({ endDate }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const end = Date.parse(`${endDate}T23:59:59Z`);
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endDate]);
  if (left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return (
    <span className="rounded-full bg-black/30 px-3 py-0.5 text-[11px] font-black tabular-nums tracking-wider">
      Ends in {d > 0 ? `${d}d ` : ''}{p(h)}:{p(m)}:{p(sec)}
    </span>
  );
}

export default function CampaignLayer() {
  const pathname = usePathname();
  const campaign = useActiveCampaign();
  const canvasRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  const hidden = EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p));
  const theme = campaign ? getTheme(campaign.template) : null;
  const showing = !!campaign && !!theme && !hidden;

  // Recolour the whole public site for the live template.
  useEffect(() => {
    if (campaign === undefined) return; // still loading: keep what the early script painted
    const existing = document.getElementById(STYLE_ID);
    if (!showing) { existing?.remove(); return; }
    const css = buildThemeCss(theme.key);
    if (css) {
      const el = existing || document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = css;
      if (!existing) document.head.appendChild(el);
    } else {
      existing?.remove();
    }
    // Remember the colours so the next full page load paints them immediately (no flash).
    try {
      if (!campaign.preview) {
        if (css) localStorage.setItem(CSS_CACHE_KEY, JSON.stringify({ start: campaign.startDate, end: campaign.endDate, css }));
        else localStorage.removeItem(CSS_CACHE_KEY);
      }
    } catch {}
  }, [campaign, showing, theme]);

  // No campaign today: forget any cached colours.
  useEffect(() => {
    if (campaign === null && !isPreviewing()) {
      try { localStorage.removeItem(CSS_CACHE_KEY); } catch {}
    }
  }, [campaign]);

  // Banner dismissal is remembered per campaign for this browser session.
  useEffect(() => {
    if (!campaign) return;
    try { setDismissed(sessionStorage.getItem(`sparkleBannerDismissed:${campaign.id}`) === '1'); } catch {}
  }, [campaign]);

  // Falling particles (snow, confetti, hearts, flowers...). Skipped for reduced-motion visitors.
  const particleCfg = showing && campaign.particles !== false ? theme.particles : null;
  useEffect(() => {
    if (!particleCfg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, rafId = null;
    const resize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const count = window.innerWidth < 640 ? particleCfg.mobile : particleCfg.desktop;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const make = (anywhere) => {
      const t = particleCfg.type;
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -20,
        size: t === 'emoji' ? Math.random() * 10 + 12 : t === 'confetti' ? Math.random() * 4 + 5 : Math.random() * 2.2 + 0.8,
        speed: (Math.random() * 0.8 + 0.4) * (particleCfg.speed || 1),
        drift: Math.random() * 0.6 - 0.3,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.06,
        color: particleCfg.colors ? pick(particleCfg.colors) : '#ffffff',
        emoji: particleCfg.emojis ? pick(particleCfg.emojis) : '',
      };
    };
    const items = Array.from({ length: count }, () => make(true));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const f of items) {
        f.y += f.speed; f.phase += 0.01; f.rot += f.vr;
        f.x += f.drift + Math.sin(f.phase) * 0.4;
        if (f.y > height + 20 || f.x < -20 || f.x > width + 20) Object.assign(f, make(false));
        if (particleCfg.type === 'dot') {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 3;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2); ctx.fill();
        } else if (particleCfg.type === 'confetti') {
          ctx.shadowBlur = 0; ctx.fillStyle = f.color;
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
          ctx.fillRect(-f.size / 2, -f.size / 4, f.size, f.size / 2); ctx.restore();
        } else {
          ctx.shadowBlur = 0; ctx.font = `${f.size}px serif`; ctx.globalAlpha = 0.9;
          ctx.fillText(f.emoji, f.x, f.y); ctx.globalAlpha = 1;
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
      else if (!rafId) rafId = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVisibility);
    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [particleCfg]);

  if (!showing) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(`sparkleBannerDismissed:${campaign.id}`, '1'); } catch {}
  };
  const b = theme.banner;
  const href = campaign.bannerLink;
  const linkLabel = campaign.bannerLinkLabel || 'Shop now';
  const linkCls = 'underline underline-offset-2 hover:opacity-80';

  return (
    <>
      {particleCfg && (
        <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-40 pointer-events-none" />
      )}

      {campaign.bannerText && !dismissed && (
        <div
          role="region"
          aria-label="Seasonal announcement"
          className="relative w-full overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${b.from}, ${b.via}, ${b.to})`, color: b.text }}
        >
          {theme.lights && (
            <div aria-hidden="true" className="flex justify-between px-1 pt-0.5">
              {Array.from({ length: 36 }).map((_, i) => {
                const color = theme.lights[i % theme.lights.length];
                return (
                  <span
                    key={i}
                    className="festive-bulb block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color, color, animationDelay: `${(i % 6) * 0.35}s` }}
                  />
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-10 py-2 text-center">
            {campaign.preview && (
              <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Preview</span>
            )}
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest">{campaign.bannerText}</p>
            {campaign.showCountdown && campaign.endDate && <Countdown endDate={campaign.endDate} />}
            {href && (
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest">
                {href.startsWith('/')
                  ? <Link href={href} className={linkCls}>{linkLabel}</Link>
                  : <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{linkLabel}</a>}
              </span>
            )}
          </div>
          {theme.flagStripe && (
            <div aria-hidden="true" className="flex h-1 w-full">
              <span className="flex-1" style={{ background: '#ce1126' }} />
              <span className="flex-1" style={{ background: '#fcd116' }} />
              <span className="flex-1" style={{ background: '#006b3f' }} />
            </div>
          )}
          <button
            onClick={dismiss}
            aria-label="Close announcement"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 text-lg leading-none opacity-80 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
