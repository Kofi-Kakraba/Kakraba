'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle2, Info, Calendar } from 'lucide-react';
import { getCampaignsAdmin, saveCampaignsAdmin } from '../../app/actions/campaigns';
import {
  THEMES, THEME_KEYS, getTheme, makeCampaign, campaignStatus, pickActiveCampaign,
  suggestWindow, newId, todayUTC,
} from '../../lib/siteThemes';
import PageBuilder from './PageBuilder';

const STATUS_STYLE = {
  live: 'bg-emerald-950 text-emerald-400 border-emerald-900/50',
  scheduled: 'bg-blue-950 text-blue-400 border-blue-900/50',
  ended: 'bg-stone-800 text-stone-400 border-stone-700',
  disabled: 'bg-stone-800 text-stone-500 border-stone-700',
  incomplete: 'bg-amber-950 text-amber-400 border-amber-900/50',
};
const STATUS_LABEL = { live: 'Live now', scheduled: 'Scheduled', ended: 'Ended', disabled: 'Switched off', incomplete: 'Needs dates' };

const inputCls = 'w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-stone-600';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1';

function CampaignsPanel() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }
  const [newTemplate, setNewTemplate] = useState('christmas');
  const [calendarYear, setCalendarYear] = useState(new Date().getUTCFullYear());

  const today = todayUTC();

  async function load() {
    setLoading(true);
    const res = await getCampaignsAdmin();
    if (res.success) { setList(res.data); setDirty(false); setNotice(null); }
    else setNotice({ type: 'error', text: res.error || 'Could not load campaigns.' });
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const change = (next) => { setList(next); setDirty(true); setNotice(null); };
  const patch = (id, fields) => change(list.map((c) => (c.id === id ? { ...c, ...fields } : c)));

  const sorted = useMemo(
    () => [...list].sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999')),
    [list]
  );
  const liveNow = useMemo(() => pickActiveCampaign(list, today), [list, today]);

  function addCampaign() { change([...list, makeCampaign(newTemplate)]); }

  function addCalendar() {
    const additions = [];
    for (const key of THEME_KEYS) {
      const w = suggestWindow(key, calendarYear);
      if (!w) continue; // Eid is set by hand
      const exists = list.some((c) => c.template === key && c.startDate === w.start);
      if (!exists) additions.push(makeCampaign(key, calendarYear));
    }
    if (additions.length === 0) { setNotice({ type: 'ok', text: `The ${calendarYear} calendar is already added.` }); return; }
    change([...list, ...additions]);
  }

  function changeTemplate(c, key) {
    const oldDefaults = getTheme(c.template).defaults;
    const next = getTheme(key).defaults;
    const same = (a, b) => (a || '') === (b || '');
    patch(c.id, {
      template: key,
      bannerText: same(c.bannerText, oldDefaults.bannerText) ? next.bannerText : c.bannerText,
      bannerLinkLabel: same(c.bannerLinkLabel, oldDefaults.bannerLinkLabel) ? next.bannerLinkLabel : c.bannerLinkLabel,
      bannerLink: same(c.bannerLink, oldDefaults.bannerLink) ? next.bannerLink : c.bannerLink,
      heroTag: same(c.heroTag, oldDefaults.heroTag) ? next.heroTag : c.heroTag,
      showCountdown: c.showCountdown === oldDefaults.showCountdown ? next.showCountdown : c.showCountdown,
    });
  }

  function duplicate(c) { change([...list, { ...c, id: newId(), name: `${c.name} (copy)` }]); }

  function remove(c) {
    if (window.confirm(`Delete "${c.name}"? This cannot be undone once you save.`)) change(list.filter((x) => x.id !== c.id));
  }

  async function save() {
    setSaving(true);
    const res = await saveCampaignsAdmin(list);
    if (res.success) {
      setList(res.data); setDirty(false);
      setNotice({ type: 'ok', text: 'Saved. Visitors will see the change within about a minute.' });
    } else {
      setNotice({ type: 'error', text: res.error || 'Could not save.' });
    }
    setSaving(false);
  }

  // Which other switched-on campaigns overlap this one?
  const overlaps = (c) =>
    c.enabled && c.startDate && c.endDate
      ? list.filter((o) => o.id !== c.id && o.enabled && o.startDate && o.endDate && o.startDate <= c.endDate && c.startDate <= o.endDate)
      : [];

  return (
    <div className="space-y-6 text-stone-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" /> Campaigns &amp; Templates
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl">
              A campaign switches a seasonal template on for the public website between two dates, then switches it off
              again by itself. The admin and checkout pages are never changed.
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              dirty ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-stone-800 text-stone-500'
            } disabled:opacity-60`}
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : dirty ? 'Save & Publish' : 'Saved'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500 uppercase font-bold tracking-wider text-[10px]">On the website right now:</span>
          {liveNow ? (
            <span className="px-2.5 py-1 rounded-full border bg-emerald-950 text-emerald-400 border-emerald-900/50 font-bold">
              {getTheme(liveNow.template).emoji} {liveNow.name}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full border bg-stone-800 text-stone-300 border-stone-700 font-bold">Normal Sparkle look</span>
          )}
          <a href="/?previewTemplate=off" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-300 underline ml-auto">
            View normal look ↗
          </a>
          <a href="/?previewTemplate=live" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-300 underline">
            End preview ↗
          </a>
        </div>

        {notice && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-bold border ${
            notice.type === 'ok' ? 'bg-emerald-950/60 border-emerald-900/50 text-emerald-300' : 'bg-red-950/60 border-red-900/50 text-red-300'
          }`}>
            {notice.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-white">Add a campaign</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEME_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setNewTemplate(key)}
                className={`text-left rounded-xl border px-2.5 py-2 transition-all ${
                  newTemplate === key ? 'border-emerald-500 bg-emerald-950/40' : 'border-stone-800 bg-stone-950 hover:border-stone-600'
                }`}
              >
                <div className="text-lg leading-none">{THEMES[key].emoji}</div>
                <div className="text-[10px] font-bold text-white mt-1 leading-tight">{THEMES[key].label}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-stone-500">{THEMES[newTemplate].blurb}</p>
          <button onClick={addCampaign} className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add {THEMES[newTemplate].label}
          </button>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-white">Add the whole year in one click</h3>
          <p className="text-[11px] text-stone-400">
            Adds Christmas, Independence Day, Valentine&apos;s, Easter, Black Friday, Mother&apos;s Day and Farmers&apos; Day with
            suggested dates for the year you choose. Eid moves with the moon, so add it yourself once the dates are announced.
          </p>
          <div className="flex items-center gap-2">
            <select value={calendarYear} onChange={(e) => setCalendarYear(Number(e.target.value))} className={`${inputCls} !w-28`}>
              {[0, 1, 2].map((n) => {
                const y = new Date().getUTCFullYear() + n;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <button onClick={addCalendar} className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Add {calendarYear} calendar
            </button>
          </div>
          <p className="text-[11px] text-stone-500 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            If two campaigns overlap, the one that started most recently is shown. You can check and edit every date below.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-stone-400 p-6"><RefreshCw className="h-4 w-4 animate-spin" /> Loading campaigns…</div>
      ) : sorted.length === 0 ? (
        <div className="bg-stone-900 border border-dashed border-stone-700 rounded-3xl p-8 text-center text-xs text-stone-400">
          No campaigns yet. Add one above, or add the whole year&apos;s calendar in one click.
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((c) => {
            const theme = getTheme(c.template);
            const status = campaignStatus(c, today);
            const clash = overlaps(c);
            return (
              <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl leading-none">{theme.emoji}</span>
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
                  <label className="ml-auto flex items-center gap-2 text-[11px] font-bold text-stone-300 cursor-pointer select-none">
                    <input type="checkbox" checked={c.enabled} onChange={(e) => patch(c.id, { enabled: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
                    Switched on
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className={labelCls}>Campaign name (only you see this)</label>
                    <input className={inputCls} value={c.name} onChange={(e) => patch(c.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Starts</label>
                    <input type="date" className={inputCls} value={c.startDate} onChange={(e) => patch(c.id, { startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Ends (last day shown)</label>
                    <input type="date" className={inputCls} value={c.endDate} onChange={(e) => patch(c.id, { endDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className={labelCls}>Template</label>
                    <select className={inputCls} value={c.template} onChange={(e) => changeTemplate(c, e.target.value)}>
                      {THEME_KEYS.map((k) => <option key={k} value={k}>{THEMES[k].emoji} {THEMES[k].label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelCls}>Banner message (top of every page)</label>
                    <input className={inputCls} maxLength={160} value={c.bannerText} onChange={(e) => patch(c.id, { bannerText: e.target.value })} placeholder="Leave empty for no banner" />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className={labelCls}>Banner button text</label>
                    <input className={inputCls} maxLength={30} value={c.bannerLinkLabel} onChange={(e) => patch(c.id, { bannerLinkLabel: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Banner button goes to</label>
                    <input className={inputCls} value={c.bannerLink} onChange={(e) => patch(c.id, { bannerLink: e.target.value })} placeholder="/shop or https://…" />
                  </div>
                  <div>
                    <label className={labelCls}>Homepage tag (on the video)</label>
                    <input className={inputCls} maxLength={40} value={c.heroTag} onChange={(e) => patch(c.id, { heroTag: e.target.value })} placeholder="Leave empty for none" />
                  </div>
                  <div className="flex flex-col justify-end gap-2 pb-1">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-stone-300 cursor-pointer select-none">
                      <input type="checkbox" checked={!!c.showCountdown} onChange={(e) => patch(c.id, { showCountdown: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
                      Show countdown to end date
                    </label>
                    <label className={`flex items-center gap-2 text-[11px] font-bold cursor-pointer select-none ${theme.particles ? 'text-stone-300' : 'text-stone-600'}`}>
                      <input type="checkbox" disabled={!theme.particles} checked={theme.particles ? c.particles !== false : false} onChange={(e) => patch(c.id, { particles: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
                      Falling decorations
                    </label>
                  </div>
                </div>

                {(status === 'incomplete' || clash.length > 0) && (
                  <div className="text-[11px] text-amber-400 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      {status === 'incomplete' && 'Choose a start and end date (end on or after start) for this campaign to go live. '}
                      {clash.length > 0 && `Overlaps with ${clash.map((o) => o.name).join(', ')}. Whichever started most recently is shown.`}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a href={`/?previewTemplate=${c.template}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-[11px] font-black uppercase tracking-wider">
                    Preview template ↗
                  </a>
                  <button onClick={() => duplicate(c)} className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-black uppercase tracking-wider">Duplicate</button>
                  <button onClick={() => remove(c)} className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-950/50 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <button onClick={save} disabled={saving} className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & Publish changes'}
          </button>
        </div>
      )}
    </div>
  );
}

// The "Campaigns" tab now holds two tools. Both stay mounted so unsaved edits are never lost when switching.
export default function CampaignsManager() {
  const [view, setView] = useState('campaigns');
  const pill = (key, label) => (
    <button
      onClick={() => setView(key)}
      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${view === key ? 'bg-emerald-600 text-white' : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'}`}
    >
      {label}
    </button>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {pill('campaigns', '📅 Campaigns & Templates')}
        {pill('builder', '🧱 Page Builder')}
      </div>
      <div className={view === 'campaigns' ? '' : 'hidden'}><CampaignsPanel /></div>
      <div className={view === 'builder' ? '' : 'hidden'}><PageBuilder /></div>
    </div>
  );
}
