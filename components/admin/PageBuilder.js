'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle2, Info, Upload, ToggleLeft, ToggleRight, Layers, X } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabaseClient';
import { getPageBuilderState, savePageDraft, publishPageLayout, discardPageDraft } from '../../app/actions/pageBuilder';
import {
  BUILTIN, CUSTOM_TYPES, DEFAULT_BLOCKS, MAX_CUSTOM_BLOCKS, MAX_CARDS, MAX_GALLERY_ITEMS, MAX_FAQ_ITEMS,
  makeBlock, blockSummary,
} from '../../lib/pageBlocks';

const inputCls = 'w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-stone-600';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1';
const smallBtn = 'px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-black disabled:opacity-30 disabled:hover:bg-stone-800';

async function uploadImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a picture file (JPG, PNG or WebP).');
  if (file.size > 6 * 1024 * 1024) throw new Error('That picture is larger than 6 MB. Please choose a smaller one.');
  const supabase = createBrowserSupabaseClient();
  const ext = ((file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')) || 'jpg';
  const name = `pagebuilder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from('sparkle-assets').upload(name, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return supabase.storage.from('sparkle-assets').getPublicUrl(name).data.publicUrl;
}

function TextField({ label, value, onChange, max, placeholder, rows, hint }) {
  const Tag = rows ? 'textarea' : 'input';
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <Tag className={inputCls} value={value || ''} maxLength={max} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-[10px] text-stone-500">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function ImageField({ label, value, onChange, onError }) {
  const [busy, setBusy] = useState(false);
  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(file)); } catch (err) { onError(err.message || 'Upload failed.'); }
    setBusy(false);
  }
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-3">
        {value ? <img src={value} alt="" className="h-14 w-14 rounded-lg object-cover border border-stone-800" /> : <div className="h-14 w-14 rounded-lg border border-dashed border-stone-700 text-[9px] text-stone-600 flex items-center justify-center">None</div>}
        <label className="cursor-pointer bg-stone-950 hover:bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
          <Upload className="h-3.5 w-3.5 text-emerald-500" /> {busy ? 'Uploading…' : value ? 'Change picture' : 'Upload picture'}
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={pick} />
        </label>
        {value && <button type="button" onClick={() => onChange('')} className="text-[11px] text-stone-500 hover:text-red-400">Remove</button>}
      </div>
    </div>
  );
}

// A list of repeating items (cards, photos, questions) with add / remove / move.
function ItemList({ items, max, addLabel, makeItem, onChange, renderItem }) {
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">#{i + 1}</span>
            <div className="ml-auto flex gap-1.5">
              <button type="button" className={smallBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" className={smallBtn} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button type="button" className={`${smallBtn} !text-red-400`} onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          {renderItem(it, (patch) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x))))}
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, makeItem()])} className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> {addLabel} ({items.length}/{max})
        </button>
      )}
    </div>
  );
}

const LINK_HINT = 'Use /shop or /custom for pages on your site, or a full https:// address.';

function BlockEditor({ block, onChange, onError }) {
  const set = (patch) => onChange(patch);
  switch (block.type) {
    case 'textimage':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Small label above heading (optional)" value={block.eyebrow} max={60} onChange={(v) => set({ eyebrow: v })} />
          <TextField label="Heading" value={block.heading} max={120} onChange={(v) => set({ heading: v })} />
          <div className="md:col-span-2"><TextField label="Text" rows={6} value={block.body} max={2500} onChange={(v) => set({ body: v })} hint="Leave a blank line to start a new paragraph." /></div>
          <ImageField label="Picture" value={block.imageUrl} onChange={(v) => set({ imageUrl: v })} onError={onError} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Picture on the" value={block.imageSide} onChange={(v) => set({ imageSide: v })} options={[['right', 'Right'], ['left', 'Left']]} />
            <SelectField label="Background" value={block.theme} onChange={(v) => set({ theme: v })} options={[['light', 'Light'], ['dark', 'Dark']]} />
          </div>
          <TextField label="Button text (optional)" value={block.buttonLabel} max={30} onChange={(v) => set({ buttonLabel: v })} />
          <TextField label="Button goes to" value={block.buttonLink} placeholder="/shop" onChange={(v) => set({ buttonLink: v })} hint={LINK_HINT} />
        </div>
      );
    case 'banner':
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="Heading" value={block.heading} max={120} onChange={(v) => set({ heading: v })} />
          <SelectField label="Colour" value={block.color} onChange={(v) => set({ color: v })} options={[['rose', 'Red / Rose'], ['emerald', 'Green'], ['amber', 'Gold'], ['dark', 'Black']]} />
          <div className="md:col-span-2"><TextField label="Supporting line (optional)" value={block.subtext} max={220} onChange={(v) => set({ subtext: v })} /></div>
          <TextField label="Button text (optional)" value={block.buttonLabel} max={30} onChange={(v) => set({ buttonLabel: v })} />
          <TextField label="Button goes to" value={block.buttonLink} placeholder="/shop" onChange={(v) => set({ buttonLink: v })} hint={LINK_HINT} />
        </div>
      );
    case 'cards':
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Heading (optional)" value={block.heading} max={120} onChange={(v) => set({ heading: v })} />
            <TextField label="Line under heading (optional)" value={block.subheading} max={220} onChange={(v) => set({ subheading: v })} />
          </div>
          <ItemList items={block.cards} max={MAX_CARDS} addLabel="Add card" makeItem={() => ({ title: 'Card title', label: 'Shop now', imageUrl: '', link: '/shop' })} onChange={(cards) => set({ cards })}
            renderItem={(c, up) => (
              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Title" value={c.title} max={60} onChange={(v) => up({ title: v })} />
                <TextField label="Small text under title" value={c.label} max={30} onChange={(v) => up({ label: v })} />
                <TextField label="Card goes to" value={c.link} placeholder="/shop" onChange={(v) => up({ link: v })} hint={LINK_HINT} />
                <ImageField label="Picture" value={c.imageUrl} onChange={(v) => up({ imageUrl: v })} onError={onError} />
              </div>
            )} />
        </div>
      );
    case 'photogallery':
      return (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Small label above heading (optional)" value={block.eyebrow} max={60} onChange={(v) => set({ eyebrow: v })} />
            <TextField label="Heading" value={block.heading} max={120} onChange={(v) => set({ heading: v })} />
          </div>
          <ItemList items={block.items} max={MAX_GALLERY_ITEMS} addLabel="Add photo" makeItem={() => ({ imageUrl: '', caption: '', link: '' })} onChange={(items) => set({ items })}
            renderItem={(it, up) => (
              <div className="grid gap-3 md:grid-cols-2">
                <ImageField label="Photo" value={it.imageUrl} onChange={(v) => up({ imageUrl: v })} onError={onError} />
                <TextField label="Caption (optional)" value={it.caption} max={80} onChange={(v) => up({ caption: v })} />
                <TextField label="Photo links to (optional)" value={it.link} placeholder="/shop" onChange={(v) => up({ link: v })} hint={LINK_HINT} />
              </div>
            )} />
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-4">
          <TextField label="Heading" value={block.heading} max={120} onChange={(v) => set({ heading: v })} />
          <ItemList items={block.items} max={MAX_FAQ_ITEMS} addLabel="Add question" makeItem={() => ({ q: 'Your question?', a: 'Your answer.' })} onChange={(items) => set({ items })}
            renderItem={(it, up) => (
              <div className="space-y-3">
                <TextField label="Question" value={it.q} max={200} onChange={(v) => up({ q: v })} />
                <TextField label="Answer" rows={3} value={it.a} max={1200} onChange={(v) => up({ a: v })} />
              </div>
            )} />
        </div>
      );
    default:
      return null;
  }
}

export default function PageBuilder() {
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [saved, setSaved] = useState(DEFAULT_BLOCKS);          // what the server holds as the working copy
  const [published, setPublished] = useState(DEFAULT_BLOCKS);  // what visitors see
  const [history, setHistory] = useState([]);
  const [publishedAt, setPublishedAt] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [addType, setAddType] = useState('textimage');
  const [busy, setBusy] = useState(null); // 'save' | 'publish' | 'discard'
  const [notice, setNotice] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  async function load() {
    setLoading(true);
    const res = await getPageBuilderState();
    if (res.success) {
      const d = res.data;
      const pub = d.published || DEFAULT_BLOCKS;
      const working = d.draft || pub;
      setPublished(pub); setSaved(working); setBlocks(working);
      setHistory(d.history || []); setPublishedAt(d.publishedAt);
      setNotice(null);
    } else {
      setNotice({ type: 'error', text: res.error || 'Could not load the page builder.' });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const editorJson = JSON.stringify(blocks);
  const unsaved = editorJson !== JSON.stringify(saved);
  const unpublished = editorJson !== JSON.stringify(published);
  const customCount = useMemo(() => blocks.filter((b) => !BUILTIN[b.type]).length, [blocks]);

  useEffect(() => {
    if (!unsaved) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const err = (text) => setNotice({ type: 'error', text });
  const change = (next) => { setBlocks(next); setNotice(null); };
  const patch = (id, fields) => change(blocks.map((b) => (b.id === id ? { ...b, ...fields } : b)));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= blocks.length) return; const n = [...blocks]; [n[i], n[j]] = [n[j], n[i]]; change(n); };
  const remove = (b) => { if (window.confirm('Delete this block? You can still discard changes before publishing.')) change(blocks.filter((x) => x.id !== b.id)); };
  const duplicate = (b, i) => {
    if (customCount >= MAX_CUSTOM_BLOCKS) return err(`You can have at most ${MAX_CUSTOM_BLOCKS} added blocks.`);
    const copy = { ...JSON.parse(JSON.stringify(b)), id: makeBlock('faq').id };
    const n = [...blocks]; n.splice(i + 1, 0, copy); change(n); setOpenId(copy.id);
  };
  function add() {
    if (customCount >= MAX_CUSTOM_BLOCKS) return err(`You can have at most ${MAX_CUSTOM_BLOCKS} added blocks.`);
    const nb = makeBlock(addType);
    change([...blocks, nb]); setOpenId(nb.id);
  }

  async function saveDraft() {
    setBusy('save');
    const res = await savePageDraft(blocks);
    if (res.success) { setBlocks(res.blocks); setSaved(res.blocks); setNotice({ type: 'ok', text: 'Draft saved. Click "Preview draft" to see it on the real site. Visitors can’t see it yet.' }); }
    else err(res.error || 'Could not save the draft.');
    setBusy(null);
  }

  async function publish() {
    if (!window.confirm('Publish these changes to the live website now?')) return;
    setBusy('publish');
    const res = await publishPageLayout(blocks);
    if (res.success) {
      setBlocks(res.blocks); setSaved(res.blocks); setPublished(res.blocks);
      setHistory(res.history || []); setPublishedAt(res.publishedAt);
      setNotice({ type: 'ok', text: 'Published. Visitors see the new layout within about a minute.' });
    } else err(res.error || 'Could not publish.');
    setBusy(null);
  }

  async function discard() {
    if (!window.confirm('Throw away all changes since the last publish and go back to the live layout?')) return;
    setBusy('discard');
    const res = await discardPageDraft();
    if (res.success) { setBlocks(published); setSaved(published); setNotice({ type: 'ok', text: 'Changes discarded. The editor now matches the live site.' }); }
    else err(res.error || 'Could not discard.');
    setBusy(null);
  }

  const status = unsaved ? ['Unsaved changes', 'bg-amber-950 text-amber-400 border-amber-900/50']
    : unpublished ? ['Draft saved, not published', 'bg-blue-950 text-blue-400 border-blue-900/50']
    : ['Live: no pending changes', 'bg-emerald-950 text-emerald-400 border-emerald-900/50'];
  const fmt = (iso) => { try { return new Date(iso).toLocaleString('en-GH'); } catch { return ''; } };

  if (loading) return <div className="flex items-center gap-2 text-xs text-stone-400 p-6"><RefreshCw className="h-4 w-4 animate-spin" /> Loading the page builder…</div>;

  return (
    <div className="space-y-6 text-stone-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2"><Layers className="h-5 w-5 text-emerald-400" /> Homepage Page Builder</h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl">Arrange the sections of your homepage, hide or show them, and add new ones. Nothing changes for visitors until you click <b>Publish</b>.</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${status[1]}`}>{status[0]}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={saveDraft} disabled={!unsaved || busy} className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"><Save className="h-4 w-4" /> {busy === 'save' ? 'Saving…' : 'Save draft'}</button>
          <a href="/?previewDraft=on" target="_blank" rel="noopener noreferrer" aria-disabled={unsaved} onClick={(e) => { if (unsaved) { e.preventDefault(); err('Save the draft first, then preview it.'); } }} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${unsaved ? 'bg-stone-800 text-stone-500' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}>Preview draft ↗</a>
          <button onClick={publish} disabled={(!unpublished && !unsaved) || busy} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-40">{busy === 'publish' ? 'Publishing…' : 'Publish'}</button>
          <button onClick={discard} disabled={(!unpublished && !unsaved) || busy} className="px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/50 text-xs font-black uppercase tracking-wider disabled:opacity-30">Discard changes</button>
          <a href="/?previewDraft=off" target="_blank" rel="noopener noreferrer" className="ml-auto text-[11px] text-stone-500 hover:text-stone-300 underline">View live site ↗</a>
        </div>

        {publishedAt && <p className="text-[11px] text-stone-500">Last published {fmt(publishedAt)}.</p>}

        {notice && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-bold border ${notice.type === 'ok' ? 'bg-emerald-950/60 border-emerald-900/50 text-emerald-300' : 'bg-red-950/60 border-red-900/50 text-red-300'}`}>
            {notice.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span className="flex-1">{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-white">Add a new block</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(CUSTOM_TYPES).map(([key, t]) => (
            <button key={key} onClick={() => setAddType(key)} className={`text-left rounded-xl border px-2.5 py-2 transition-all ${addType === key ? 'border-emerald-500 bg-emerald-950/40' : 'border-stone-800 bg-stone-950 hover:border-stone-600'}`}>
              <div className="text-lg leading-none">{t.emoji}</div>
              <div className="text-[10px] font-bold text-white mt-1 leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-500">{CUSTOM_TYPES[addType].blurb} New blocks appear at the bottom of the list; use the arrows to move them.</p>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add {CUSTOM_TYPES[addType].label}</button>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] text-stone-500 flex items-start gap-1.5"><Info className="h-3.5 w-3.5 shrink-0 mt-0.5" /> The menu bar at the top and the footer at the bottom always stay in place. Blocks below appear in this order on the homepage.</p>
        {blocks.map((b, i) => {
          const builtin = BUILTIN[b.type];
          const meta = builtin || CUSTOM_TYPES[b.type];
          const open = openId === b.id;
          return (
            <div key={b.id} className={`bg-stone-900 border rounded-2xl ${b.visible ? 'border-stone-800' : 'border-stone-800 opacity-60'}`}>
              <div className="flex items-center gap-3 p-4">
                <span className="text-xl leading-none">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black uppercase tracking-wide text-white truncate">{meta.label}{builtin && <span className="ml-2 text-[9px] font-bold text-stone-500 normal-case tracking-normal">built-in</span>}</div>
                  <div className="text-[11px] text-stone-500 truncate">{blockSummary(b)}</div>
                </div>
                <button type="button" onClick={() => patch(b.id, { visible: !b.visible })} className="shrink-0" aria-label={b.visible ? 'Hide this block' : 'Show this block'} title={b.visible ? 'Shown on the site. Click to hide.' : 'Hidden. Click to show.'}>
                  {b.visible ? <ToggleRight className="h-7 w-7 text-emerald-500" /> : <ToggleLeft className="h-7 w-7 text-stone-600" />}
                </button>
                <div className="flex gap-1.5 shrink-0">
                  <button type="button" className={smallBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                  <button type="button" className={smallBtn} disabled={i === blocks.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  {!builtin && <button type="button" className={smallBtn} onClick={() => setOpenId(open ? null : b.id)}>{open ? 'Close' : 'Edit'}</button>}
                </div>
              </div>
              {!builtin && open && (
                <div className="border-t border-stone-800 p-4 space-y-4">
                  <BlockEditor block={b} onChange={(fields) => patch(b.id, fields)} onError={err} />
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => duplicate(b, i)} className={smallBtn}>Duplicate</button>
                    <button type="button" onClick={() => remove(b)} className="ml-auto px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-950/50 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete block</button>
                  </div>
                </div>
              )}
              {builtin && (b.type === 'story' || b.type === 'gallery') && <div className="px-4 pb-3 -mt-1 text-[10px] text-stone-600">Text and pictures for this block live in the <b>Web CMS</b> tab.</div>}
            </div>
          );
        })}
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
        <button onClick={() => setShowHistory(!showHistory)} className="text-[11px] font-black uppercase tracking-wider text-white">{showHistory ? '▾' : '▸'} Earlier published versions ({history.length})</button>
        {showHistory && (history.length === 0
          ? <p className="text-[11px] text-stone-500">No earlier versions yet. Each time you publish, the previous version is kept here (the last 10).</p>
          : <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
                  <span className="text-[11px] text-stone-300">{h.publishedAt ? fmt(h.publishedAt) : 'Earlier version'}</span>
                  <span className="text-[10px] text-stone-600">{h.blocks.filter((x) => x.visible).length} blocks shown</span>
                  <button className={`${smallBtn} ml-auto`} onClick={() => { change(h.blocks); setNotice({ type: 'ok', text: 'Loaded into the editor. Review it, then Save draft or Publish.' }); }}>Load into editor</button>
                </div>
              ))}
            </div>)}
      </div>
    </div>
  );
}
