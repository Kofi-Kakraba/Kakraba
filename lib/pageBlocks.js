// Homepage block definitions and validation. Pure JavaScript: safe on server and client.

export const BUILTIN = {
  hero: { label: 'Hero video slider', emoji: '🎬', note: 'The three flavour videos at the top of the page.' },
  products: { label: 'Flavour cards', emoji: '🥤', note: 'The Sobolo, Lemonade and Pinezest shortcut cards.' },
  story: { label: 'Brand story', emoji: '📖', note: 'Edit its text and picture in the Web CMS tab.' },
  gallery: { label: '"Sparkle In The Wild" gallery', emoji: '📸', note: 'Edit its four titles and pictures in the Web CMS tab.' },
};

export const CUSTOM_TYPES = {
  textimage: { label: 'Text & image', emoji: '🖼️', blurb: 'A heading and paragraphs beside a picture.' },
  banner: { label: 'Banner', emoji: '📣', blurb: 'A bold coloured strip with a message and button.' },
  cards: { label: 'Image cards', emoji: '🃏', blurb: 'Up to 6 picture cards that link to pages.' },
  photogallery: { label: 'Photo gallery', emoji: '🌄', blurb: 'A grid of photos with captions.' },
  faq: { label: 'FAQ', emoji: '❓', blurb: 'Questions that open to show the answer.' },
};

export const DEFAULT_BLOCKS = [
  { id: 'builtin-hero', type: 'hero', visible: true },
  { id: 'builtin-products', type: 'products', visible: true },
  { id: 'builtin-story', type: 'story', visible: true },
  { id: 'builtin-gallery', type: 'gallery', visible: true },
];

export const MAX_CUSTOM_BLOCKS = 30;
export const MAX_CARDS = 6;
export const MAX_GALLERY_ITEMS = 12;
export const MAX_FAQ_ITEMS = 12;
export const BANNER_COLORS = ['rose', 'emerald', 'amber', 'dark'];

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'b' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function makeBlock(type) {
  const base = { id: newId(), type, visible: true };
  switch (type) {
    case 'textimage':
      return { ...base, eyebrow: '', heading: 'Your heading here', body: 'Write a few lines here.\n\nLeave a blank line to start a new paragraph.', imageUrl: '', imageSide: 'right', theme: 'light', buttonLabel: '', buttonLink: '' };
    case 'banner':
      return { ...base, heading: 'Big announcement', subtext: 'Add one supporting line.', buttonLabel: 'Shop now', buttonLink: '/shop', color: 'rose' };
    case 'cards':
      return { ...base, heading: '', subheading: '', cards: [{ title: 'Card title', label: 'Shop now', imageUrl: '', link: '/shop' }] };
    case 'photogallery':
      return { ...base, eyebrow: '', heading: 'Gallery', items: [{ imageUrl: '', caption: '', link: '' }] };
    case 'faq':
      return { ...base, heading: 'Frequently asked questions', items: [{ q: 'Your question?', a: 'Your answer.' }] };
    default:
      return null;
  }
}

// ---------- Validation ----------
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const text = (v, max) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '');
function link(v) {
  const s = str(v, 300);
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  if (/^https:\/\//i.test(s)) return s;
  return '';
}
const img = link; // pictures follow the same rule: site path or https address

export function sanitizeBlock(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type;
  const base = { id: str(raw.id, 64) || newId(), type, visible: raw.visible !== false };
  if (BUILTIN[type]) return base;
  switch (type) {
    case 'textimage':
      return { ...base, eyebrow: str(raw.eyebrow, 60), heading: str(raw.heading, 120), body: text(raw.body, 2500), imageUrl: img(raw.imageUrl), imageSide: raw.imageSide === 'left' ? 'left' : 'right', theme: raw.theme === 'dark' ? 'dark' : 'light', buttonLabel: str(raw.buttonLabel, 30), buttonLink: link(raw.buttonLink) };
    case 'banner':
      return { ...base, heading: str(raw.heading, 120), subtext: str(raw.subtext, 220), buttonLabel: str(raw.buttonLabel, 30), buttonLink: link(raw.buttonLink), color: BANNER_COLORS.includes(raw.color) ? raw.color : 'rose' };
    case 'cards':
      return { ...base, heading: str(raw.heading, 120), subheading: str(raw.subheading, 220), cards: (Array.isArray(raw.cards) ? raw.cards : []).slice(0, MAX_CARDS).map((c) => ({ title: str(c?.title, 60), label: str(c?.label, 30), imageUrl: img(c?.imageUrl), link: link(c?.link) })) };
    case 'photogallery':
      return { ...base, eyebrow: str(raw.eyebrow, 60), heading: str(raw.heading, 120), items: (Array.isArray(raw.items) ? raw.items : []).slice(0, MAX_GALLERY_ITEMS).map((i) => ({ imageUrl: img(i?.imageUrl), caption: str(i?.caption, 80), link: link(i?.link) })) };
    case 'faq':
      return { ...base, heading: str(raw.heading, 120), items: (Array.isArray(raw.items) ? raw.items : []).slice(0, MAX_FAQ_ITEMS).map((i) => ({ q: str(i?.q, 200), a: text(i?.a, 1200) })).filter((i) => i.q || i.a) };
    default:
      return null;
  }
}

// Always returns a safe list: valid blocks only, each built-in section exactly once.
export function sanitizeBlocks(list) {
  const out = [];
  const builtinSeen = new Set();
  const ids = new Set();
  let custom = 0;
  for (const raw of Array.isArray(list) ? list.slice(0, 80) : []) {
    const b = sanitizeBlock(raw);
    if (!b) continue;
    if (BUILTIN[b.type]) {
      if (builtinSeen.has(b.type)) continue;
      builtinSeen.add(b.type);
      b.id = 'builtin-' + b.type;
    } else {
      if (custom >= MAX_CUSTOM_BLOCKS) continue;
      custom += 1;
      if (ids.has(b.id)) b.id = newId();
    }
    ids.add(b.id);
    out.push(b);
  }
  // A built-in section that is missing is added back hidden, never silently shown.
  for (const t of Object.keys(BUILTIN)) {
    if (!builtinSeen.has(t)) out.push({ id: 'builtin-' + t, type: t, visible: false });
  }
  return out;
}

// One line describing a block in the builder's list.
export function blockSummary(b) {
  if (BUILTIN[b.type]) return BUILTIN[b.type].note;
  if (b.type === 'cards') return b.heading || `${(b.cards || []).length} card(s)`;
  if (b.type === 'photogallery') return b.heading || `${(b.items || []).length} photo(s)`;
  if (b.type === 'faq') return b.heading || `${(b.items || []).length} question(s)`;
  return b.heading || '(no heading)';
}
