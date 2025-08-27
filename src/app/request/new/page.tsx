// src/app/request/new/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Suggestion = string;

const TRADES: Suggestion[] = [
  'Mechanic','Plumber','Electrician','Carpenter','Painter','Roofer','HVAC',
  'Locksmith','Glazier','Tiler','Bricklayer','Landscaper','Gardener','Pest control',
  'Cleaner','Handyman','Plasterer','Welder','Auto electrician','Panel beater',
  'Appliance repair','Flooring','Cabinet maker','Concrete','Fencing','Irrigation',
  'Pool service','Window tinting','Solar installer','IT support','Computer repair',
  'Data cabling','Audio/Visual','Security system','Gutter cleaning','Tree lopping',
  'Removalist','Courier','Dog groomer','Mobile detailer'
];

const CITIES_BASE: Suggestion[] = [
  'Sydney NSW','Parramatta NSW','Liverpool NSW','Penrith NSW','Newcastle NSW',
  'Wollongong NSW','Canberra ACT','Melbourne VIC','Geelong VIC','Brisbane QLD',
  'Gold Coast QLD','Sunshine Coast QLD','Adelaide SA','Perth WA','Hobart TAS',
  'Darwin NT','Auckland','Wellington','Christchurch','Toronto','Vancouver',
  'New York','Los Angeles','San Francisco','Chicago','London','Manchester','Birmingham'
];

const LS_LOCATIONS_KEY = 'sx_recent_locations_v1';

function scoreSuggestions(q: string, items: Suggestion[], limit = 8): Suggestion[] {
  const s = q.trim().toLowerCase();
  if (!s) return items.slice(0, limit);
  return items
    .map(item => {
      const t = item.toLowerCase();
      let rank = 999;
      if (t.startsWith(s)) rank = 0;
      else if (t.includes(s)) rank = 1;
      return { item, rank, idx: t.indexOf(s) };
    })
    .filter(x => x.rank < 999)
    .sort((a, b) => (a.rank - b.rank) || (a.idx - b.idx) || a.item.localeCompare(b.item))
    .slice(0, limit)
    .map(x => x.item);
}

function useRecentLocations(): [string[], (val: string) => void] {
  const [recents, setRecents] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_LOCATIONS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);
  const remember = (val: string) => {
    const v = (val || '').trim();
    if (!v) return;
    const next = [v, ...recents.filter(r => r.toLowerCase() !== v.toLowerCase())].slice(0, 12);
    setRecents(next);
    try { localStorage.setItem(LS_LOCATIONS_KEY, JSON.stringify(next)); } catch {}
  };
  return [recents, remember];
}

export default function NewRequestPage() {
  const router = useRouter();

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [recentLocations, rememberLocation] = useRecentLocations();

  // ---------- category typeahead ----------
  const [catOpen, setCatOpen] = useState(false);
  const [catIdx, setCatIdx] = useState(0);
  const catInputRef = useRef<HTMLInputElement>(null);

  const catSuggestions = useMemo(() => {
    const base = scoreSuggestions(category, TRADES);
    // ensure the exact casing if they typed an exact existing item
    return base;
  }, [category]);

  // ---------- location typeahead ----------
  const [locOpen, setLocOpen] = useState(false);
  const [locIdx, setLocIdx] = useState(0);
  const locInputRef = useRef<HTMLInputElement>(null);

  const locationPool = useMemo(() => {
    // combine recents + base (dedup, recents first)
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const r of recentLocations) {
      const k = r.toLowerCase();
      if (!seen.has(k)) { seen.add(k); merged.push(r); }
    }
    for (const c of CITIES_BASE) {
      const k = c.toLowerCase();
      if (!seen.has(k)) { seen.add(k); merged.push(c); }
    }
    return merged;
  }, [recentLocations]);

  const locSuggestions = useMemo(() => scoreSuggestions(location, locationPool), [location, locationPool]);

  // ---------- handlers ----------
  function pickCategory(value: string) {
    setCategory(value);
    setCatOpen(false);
    // move focus to description for speed
    setTimeout(() => (document.getElementById('desc') as HTMLTextAreaElement)?.focus(), 0);
  }

  function pickLocation(value: string) {
    setLocation(value);
    setLocOpen(false);
    rememberLocation(value);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!category.trim()) { setErr('Please choose a category/trade.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category: category.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
        }),
        cache: 'no-store',
      });

      const text = await res.text();
      let json: any = undefined;
      try { json = text ? JSON.parse(text) : undefined; } catch {}
      if (!res.ok || !json || typeof json.id !== 'number') {
        throw new Error(`Create failed (${res.status}): ${text || 'no response'}`);
      }
      if (location.trim()) rememberLocation(location.trim());
      router.push(`/request/${json.id}`);
    } catch (e: any) {
      setErr(e.message || 'Create failed');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- UI ----------
  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>New Request</h1>

      {/* quick chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {TRADES.slice(0, 12).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => pickCategory(t)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid #ddd',
              background: t === category ? '#e6f0ff' : '#fafafa',
              cursor: 'pointer'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* Category (typeahead) */}
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Category / Trade</label>
          <input
            ref={catInputRef}
            value={category}
            onChange={e => { setCategory(e.target.value); setCatOpen(true); setCatIdx(0); }}
            onFocus={() => setCatOpen(true)}
            onBlur={() => setTimeout(() => setCatOpen(false), 120)}
            onKeyDown={(e) => {
              if (!catOpen) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setCatIdx(i => Math.min(i + 1, catSuggestions.length - 1)); }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setCatIdx(i => Math.max(i - 1, 0)); }
              if (e.key === 'Enter' && catSuggestions[catIdx]) {
                e.preventDefault(); pickCategory(catSuggestions[catIdx]);
              }
              if (e.key === 'Escape') setCatOpen(false);
            }}
            placeholder="Start typing (e.g., Mechanic)…"
            required
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
          {catOpen && catSuggestions.length > 0 && (
            <ul
              style={{
                position: 'absolute', zIndex: 10, left: 0, right: 0, top: '100%',
                background: '#fff', border: '1px solid #ddd', borderTop: 'none', maxHeight: 220,
                overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0
              }}
            >
              {catSuggestions.map((s, i) => (
                <li
                  key={s}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickCategory(s)}
                  style={{
                    padding: '8px 10px',
                    background: i === catIdx ? '#f0f6ff' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="desc" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Description</label>
          <textarea
            id="desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Short description (optional)"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
        </div>

        {/* Location (typeahead + remembers) */}
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Location</label>
          <input
            ref={locInputRef}
            value={location}
            onChange={e => { setLocation(e.target.value); setLocOpen(true); setLocIdx(0); }}
            onFocus={() => setLocOpen(true)}
            onBlur={() => setTimeout(() => setLocOpen(false), 120)}
            onKeyDown={(e) => {
              if (!locOpen) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setLocIdx(i => Math.min(i + 1, locSuggestions.length - 1)); }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setLocIdx(i => Math.max(i - 1, 0)); }
              if (e.key === 'Enter' && locSuggestions[locIdx]) {
                e.preventDefault(); pickLocation(locSuggestions[locIdx]);
              }
              if (e.key === 'Escape') setLocOpen(false);
            }}
            placeholder="City/Suburb (optional)…"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
          {locOpen && locSuggestions.length > 0 && (
            <ul
              style={{
                position: 'absolute', zIndex: 10, left: 0, right: 0, top: '100%',
                background: '#fff', border: '1px solid #ddd', borderTop: 'none', maxHeight: 220,
                overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0
              }}
            >
              {locSuggestions.map((s, i) => (
                <li
                  key={s}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickLocation(s)}
                  style={{
                    padding: '8px 10px',
                    background: i === locIdx ? '#f0f6ff' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
          {recentLocations.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
              Recently used: {recentLocations.slice(0, 5).join(' • ')}
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} style={{ padding: '10px 14px', borderRadius: 8 }}>
          {submitting ? 'Creating…' : 'Create request'}
        </button>

        {err && <p style={{ color: 'crimson' }}>{err}</p>}
      </form>
    </div>
  );
}
