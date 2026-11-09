// Template (theme) definitions and campaign helpers.
// Pure JavaScript: safe to import from both server and client code.

// ---------- Templates ----------
// palette: base colour (the "500" shade) that replaces the site's rose / emerald / amber
// across every public page. Other shades are generated automatically.
export const THEMES = {
  christmas: {
    key: 'christmas', label: 'Christmas & New Year', emoji: '🎄',
    blurb: 'Red, green and gold with falling snow and twinkling lights.',
    palette: { rose: '#c62828', emerald: '#15803d', amber: '#d4a017' },
    banner: { from: '#b91c1c', via: '#dc2626', to: '#15803d', text: '#ffffff' },
    lights: ['#ef4444', '#22c55e', '#f59e0b', '#ffffff'],
    particles: { type: 'dot', desktop: 70, mobile: 35, speed: 1 },
    flagStripe: false,
    defaults: {
      bannerText: '🎄 Merry Christmas from Sparkle! Order your festive pouches early 🎁',
      bannerLinkLabel: 'Shop now', bannerLink: '/shop',
      heroTag: '🎄 Christmas Special', showCountdown: false,
    },
  },
  independence: {
    key: 'independence', label: 'Independence Day (6 March)', emoji: '★',
    blurb: "Ghana's red, gold and green with a flag stripe and gentle confetti.",
    palette: { rose: '#ce1126', emerald: '#006b3f', amber: '#f2b705' },
    banner: { from: '#006b3f', via: '#006b3f', to: '#004d2c', text: '#ffffff' },
    lights: null,
    particles: { type: 'confetti', colors: ['#ce1126', '#fcd116', '#006b3f'], desktop: 40, mobile: 20, speed: 0.8 },
    flagStripe: true,
    defaults: {
      bannerText: '★ Happy Independence Day, Ghana! Celebrate with a Sparkle pouch ★',
      bannerLinkLabel: 'Shop now', bannerLink: '/shop',
      heroTag: '★ Ghana @ Independence', showCountdown: false,
    },
  },
  valentines: {
    key: 'valentines', label: "Valentine's Day", emoji: '💝',
    blurb: 'Pink and berry tones with floating hearts.',
    palette: { rose: '#e11d48', emerald: '#a21caf', amber: '#f472b6' },
    banner: { from: '#be123c', via: '#e11d48', to: '#db2777', text: '#ffffff' },
    lights: ['#fb7185', '#f472b6', '#ffffff'],
    particles: { type: 'emoji', emojis: ['❤️', '💗', '💕'], desktop: 22, mobile: 12, speed: 0.7 },
    flagStripe: false,
    defaults: {
      bannerText: "💝 Valentine's treat: share a Sparkle with someone special",
      bannerLinkLabel: 'Shop now', bannerLink: '/shop',
      heroTag: "💝 Valentine's Special", showCountdown: false,
    },
  },
  easter: {
    key: 'easter', label: 'Easter', emoji: '🐣',
    blurb: 'Soft spring colours with drifting flowers and eggs.',
    palette: { rose: '#a855f7', emerald: '#14b8a6', amber: '#eab308' },
    banner: { from: '#7e22ce', via: '#a855f7', to: '#0d9488', text: '#ffffff' },
    lights: null,
    particles: { type: 'emoji', emojis: ['🌷', '🌸', '🥚'], desktop: 22, mobile: 12, speed: 0.7 },
    flagStripe: false,
    defaults: {
      bannerText: '🐣 Happy Easter from Sparkle! Fresh flavours for the long weekend',
      bannerLinkLabel: 'Shop now', bannerLink: '/shop',
      heroTag: '🐣 Easter Weekend', showCountdown: false,
    },
  },
  eid: {
    key: 'eid', label: 'Eid', emoji: '🌙',
    blurb: 'Deep green and gold with a soft sparkle. Set the dates yourself each year.',
    palette: { rose: '#047857', emerald: '#0f766e', amber: '#d4a017' },
    banner: { from: '#064e3b', via: '#047857', to: '#b8860b', text: '#ffffff' },
    lights: ['#fcd34d', '#ffffff'],
    particles: { type: 'emoji', emojis: ['✨', '🌙'], desktop: 18, mobile: 10, speed: 0.6 },
    flagStripe: false,
    defaults: {
      bannerText: '🌙 Eid Mubarak from all of us at Sparkle',
      bannerLinkLabel: 'Plan your gathering', bannerLink: '/custom',
      heroTag: '🌙 Eid Mubarak', showCountdown: false,
    },
  },
  blackfriday: {
    key: 'blackfriday', label: 'Black Friday', emoji: '🔥',
    blurb: 'Black, red and yellow sale look with a live countdown.',
    palette: { rose: '#dc2626', emerald: '#18181b', amber: '#facc15' },
    banner: { from: '#09090b', via: '#18181b', to: '#b91c1c', text: '#fde047' },
    lights: null,
    particles: null,
    flagStripe: false,
    defaults: {
      bannerText: '🔥 BLACK FRIDAY at Sparkle: limited-time deals',
      bannerLinkLabel: 'Grab the deal', bannerLink: '/shop',
      heroTag: '🔥 Black Friday', showCountdown: true,
    },
  },
  mothers: {
    key: 'mothers', label: "Mother's Day", emoji: '💐',
    blurb: 'Warm pink and violet with drifting blossoms.',
    palette: { rose: '#db2777', emerald: '#7c3aed', amber: '#f59e0b' },
    banner: { from: '#be185d', via: '#db2777', to: '#7c3aed', text: '#ffffff' },
    lights: null,
    particles: { type: 'emoji', emojis: ['🌸', '🌺', '💐'], desktop: 20, mobile: 10, speed: 0.7 },
    flagStripe: false,
    defaults: {
      bannerText: "💐 Happy Mother's Day! Treat Mum to something sparkling",
      bannerLinkLabel: 'Shop now', bannerLink: '/shop',
      heroTag: "💐 Mother's Day", showCountdown: false,
    },
  },
  farmers: {
    key: 'farmers', label: "Farmers' Day", emoji: '🌾',
    blurb: 'Fresh greens and harvest gold with falling leaves.',
    palette: { rose: '#65a30d', emerald: '#15803d', amber: '#d97706' },
    banner: { from: '#3f6212', via: '#15803d', to: '#b45309', text: '#ffffff' },
    lights: null,
    particles: { type: 'emoji', emojis: ['🍃', '🌾'], desktop: 20, mobile: 10, speed: 0.8 },
    flagStripe: false,
    defaults: {
      bannerText: "🌾 Happy Farmers' Day! Honouring the hands that feed us",
      bannerLinkLabel: 'Shop now', bannerLink: '/shop',
      heroTag: "🌾 Farmers' Day", showCountdown: false,
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const getTheme = (key) => THEMES[key] || null;

// ---------- Colours ----------
const SHADES = {
  50: [6, 'white'], 100: [12, 'white'], 200: [25, 'white'], 300: [45, 'white'], 400: [70, 'white'],
  500: [100, null],
  600: [88, 'black'], 700: [74, 'black'], 800: [60, 'black'], 900: [46, 'black'], 950: [30, 'black'],
};

// CSS that re-points the site's Tailwind rose / emerald / amber colours at the template colours.
// Unlayered CSS beats Tailwind's layered theme, so this recolours every page without editing them.
export function buildThemeCss(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme || !theme.palette) return '';
  const lines = [];
  for (const [family, base] of Object.entries(theme.palette)) {
    for (const [shade, [pct, mixWith]] of Object.entries(SHADES)) {
      const value = mixWith ? `color-mix(in oklab, ${base} ${pct}%, ${mixWith})` : base;
      lines.push(`--color-${family}-${shade}:${value};`);
    }
  }
  return `:root{${lines.join('')}}`;
}

// ---------- Dates (all UTC; Ghana is on GMT all year) ----------
const pad = (n) => String(n).padStart(2, '0');
const utc = (y, m, d) => new Date(Date.UTC(y, m, d));
const addDays = (date, n) => new Date(date.getTime() + n * 86400000);
export const fmtDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const todayUTC = () => fmtDate(new Date());
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month - 1, day);
}

// month is 0-based, weekday 0 = Sunday
function nthWeekday(year, month, weekday, n) {
  const first = utc(year, month, 1);
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return utc(year, month, 1 + offset + (n - 1) * 7);
}

// Suggested window for a template in a given year, or null when it has to be set by hand (Eid).
export function suggestWindow(key, year) {
  switch (key) {
    case 'christmas': return { start: `${year}-12-01`, end: `${year + 1}-01-02` };
    case 'independence': return { start: `${year}-03-01`, end: `${year}-03-07` };
    case 'valentines': return { start: `${year}-02-07`, end: `${year}-02-15` };
    case 'easter': { const e = easterSunday(year); return { start: fmtDate(addDays(e, -5)), end: fmtDate(addDays(e, 1)) }; }
    case 'blackfriday': { const bf = addDays(nthWeekday(year, 10, 4, 4), 1); return { start: fmtDate(addDays(bf, -4)), end: fmtDate(addDays(bf, 3)) }; }
    case 'mothers': { const d = nthWeekday(year, 4, 0, 2); return { start: fmtDate(addDays(d, -7)), end: fmtDate(d) }; }
    case 'farmers': { const d = nthWeekday(year, 11, 5, 1); return { start: fmtDate(addDays(d, -3)), end: fmtDate(addDays(d, 1)) }; }
    default: return null;
  }
}

// The next window that has not finished yet.
export function upcomingWindow(key, today = todayUTC()) {
  const y = Number(today.slice(0, 4));
  for (const year of [y - 1, y, y + 1]) {
    const w = suggestWindow(key, year);
    if (w && w.end >= today) return w;
  }
  return suggestWindow(key, y + 1);
}

// ---------- Campaigns ----------
export const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function makeCampaign(key, year) {
  const theme = THEMES[key];
  const w = year ? suggestWindow(key, year) : upcomingWindow(key);
  const label = w ? `${theme.label} ${w.start.slice(0, 4)}` : theme.label;
  return {
    id: newId(), name: label, template: key,
    startDate: w ? w.start : '', endDate: w ? w.end : '',
    enabled: true,
    bannerText: theme.defaults.bannerText,
    bannerLinkLabel: theme.defaults.bannerLinkLabel,
    bannerLink: theme.defaults.bannerLink,
    heroTag: theme.defaults.heroTag,
    showCountdown: theme.defaults.showCountdown,
    particles: true,
  };
}

// 'disabled' | 'incomplete' | 'live' | 'scheduled' | 'ended'
export function campaignStatus(c, today = todayUTC()) {
  if (!c.enabled) return 'disabled';
  if (!DATE_RE.test(c.startDate || '') || !DATE_RE.test(c.endDate || '') || c.endDate < c.startDate) return 'incomplete';
  if (today < c.startDate) return 'scheduled';
  if (today > c.endDate) return 'ended';
  return 'live';
}
export const isCampaignLive = (c, today = todayUTC()) => !!c && !!THEMES[c.template] && campaignStatus(c, today) === 'live';

// If campaigns overlap, the one that started most recently wins (then the shorter one).
export function pickActiveCampaign(list, today = todayUTC()) {
  const live = (Array.isArray(list) ? list : []).filter((c) => isCampaignLive(c, today));
  if (!live.length) return null;
  const span = (c) => Date.parse(c.endDate) - Date.parse(c.startDate);
  live.sort((a, b) => (a.startDate === b.startDate ? span(a) - span(b) : a.startDate < b.startDate ? 1 : -1));
  return live[0];
}

// Only these fields are ever sent to visitors.
export function publicCampaignView(c) {
  return {
    id: c.id, template: c.template, startDate: c.startDate, endDate: c.endDate,
    bannerText: c.bannerText, bannerLinkLabel: c.bannerLinkLabel, bannerLink: c.bannerLink,
    heroTag: c.heroTag, showCountdown: !!c.showCountdown, particles: c.particles !== false,
  };
}

// Preview of a template with its default wording (used by ?previewTemplate=key).
export function previewCampaign(key) {
  const theme = THEMES[key];
  if (!theme) return null;
  const today = todayUTC();
  return { ...publicCampaignView({ ...makeCampaign(key), id: 'preview', startDate: today, endDate: fmtDate(addDays(new Date(), 3)) }), preview: true };
}

// ---------- Validation (used on the server before saving) ----------
const cleanStr = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
function cleanLink(v) {
  const s = cleanStr(v, 300);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  if (/^https:\/\//i.test(s)) return s;
  return '';
}
const cleanDate = (v) => (typeof v === 'string' && DATE_RE.test(v) ? v : '');

export function sanitizeCampaign(c) {
  if (!c || typeof c !== 'object' || !THEMES[c.template]) return null;
  return {
    id: cleanStr(c.id, 64) || newId(),
    name: cleanStr(c.name, 80) || THEMES[c.template].label,
    template: c.template,
    startDate: cleanDate(c.startDate),
    endDate: cleanDate(c.endDate),
    enabled: c.enabled !== false,
    bannerText: cleanStr(c.bannerText, 160),
    bannerLinkLabel: cleanStr(c.bannerLinkLabel, 30),
    bannerLink: cleanLink(c.bannerLink),
    heroTag: cleanStr(c.heroTag, 40),
    showCountdown: !!c.showCountdown,
    particles: c.particles !== false,
  };
}
export const sanitizeCampaigns = (list) => (Array.isArray(list) ? list : []).slice(0, 60).map(sanitizeCampaign).filter(Boolean);
