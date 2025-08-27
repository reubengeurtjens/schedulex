// src/app/api/locations/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 60_000;
const CACHE = new Map<string, { ts: number; data: string[]; meta: any }>();

const STATE_ABBR: Record<string, string> = {
  "New South Wales": "NSW", Victoria: "VIC", Queensland: "QLD",
  "South Australia": "SA", "Western Australia": "WA", Tasmania: "TAS",
  "Northern Territory": "NT", "Australian Capital Territory": "ACT",
};
const abbr = (s?: string | null) => (s ? STATE_ABBR[s] ?? s : undefined);

const ALLOWED = new Set([
  "suburb","neighbourhood","locality","hamlet","village","town","city",
  "residential","quarter","borough","city_district",
]);

// Small local fallback so we ALWAYS have results while debugging
const AU_FALLBACK = [
  "Parramatta NSW","Blacktown NSW","Penrith NSW","Liverpool NSW","Bondi NSW","Manly NSW",
  "Newcastle NSW","Wollongong NSW","Canberra ACT","Belconnen ACT","Woden ACT",
  "Melbourne VIC","Geelong VIC","Richmond VIC","Brunswick VIC","St Kilda VIC","Mordialloc VIC",
  "Brisbane QLD","South Brisbane QLD","Fortitude Valley QLD","Toowoomba QLD","Cairns QLD",
  "Gold Coast QLD","Surfers Paradise QLD","Sunshine Coast QLD",
  "Adelaide SA","Glenelg SA","Prospect SA",
  "Perth WA","Fremantle WA","Joondalup WA","Mandurah WA",
  "Hobart TAS","Launceston TAS",
  "Darwin NT","Palmerston NT"
];

const ok = (json: any, status = 200) =>
  Response.json(json, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const take = Math.min(Number(sp.get("take") ?? 8), 20);
  const debug = sp.get("debug") === "1";
  const forceLocal = sp.get("local") === "1";   // <-- new: force local list

  if (q.length < 2) {
    return ok(debug ? { suggestions: [], meta: { reason: "query_too_short" } } : { suggestions: [] });
  }

  const key = `${q.toLowerCase()}|${take}|local=${forceLocal}`;
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && now - cached.ts < TTL_MS) {
    return ok(debug ? { suggestions: cached.data, meta: cached.meta } : { suggestions: cached.data });
  }

  const meta: any = {};

  // --- 0) If you pass ?local=1, return local filtered results immediately ---
  if (forceLocal) {
    const s = q.toLowerCase();
    const local = AU_FALLBACK.filter(x => x.toLowerCase().includes(s)).slice(0, take);
    meta.mode = "local-only";
    CACHE.set(key, { ts: now, data: local, meta });
    return ok(debug ? { suggestions: local, meta } : { suggestions: local });
  }

  // --- 1) Try Nominatim (OpenStreetMap) ---
  let suggestions: string[] = [];
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(take * 4));
    url.searchParams.set("countrycodes", "au");
    url.searchParams.set("q", q);

    const email = process.env.NOMINATIM_EMAIL?.trim();
    const headers: Record<string, string> = { "Accept-Language": "en-AU" };
    if (email) headers["User-Agent"] = `ScheduleX/1.0 (+${email})`;

    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    meta.nominatim_status = res.status;
    if (res.ok) {
      const items = (await res.json()) as any[];
      meta.nominatim_count = items?.length ?? 0;
      suggestions = normalizeNominatim(items, take);
    }
  } catch (e: any) {
    meta.nominatim_error = String(e);
  }

  // --- 2) If still empty, try Photon (Komoot) ---
  if (suggestions.length === 0) {
    try {
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", q);
      url.searchParams.set("lang", "en");
      url.searchParams.set("limit", String(take * 4));
      url.searchParams.set("countrycode", "AU");

      const res = await fetch(url.toString(), { cache: "no-store" });
      meta.photon_status = res.status;
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data?.features) ? data.features : [];
        meta.photon_count = items?.length ?? 0;
        suggestions = normalizePhoton(items, take);
      }
    } catch (e: any) {
      meta.photon_error = String(e);
    }
  }

  // --- 3) If both online providers fail, return local filtered list so UI still works ---
  if (suggestions.length === 0) {
    const s = q.toLowerCase();
    suggestions = AU_FALLBACK.filter(x => x.toLowerCase().includes(s)).slice(0, take);
    meta.fallback = suggestions.length;
  }

  CACHE.set(key, { ts: now, data: suggestions, meta });
  return ok(debug ? { suggestions, meta } : { suggestions });
}

/* helpers */
function normalizeNominatim(items: any[], take: number): string[] {
  const out: string[] = []; const seen = new Set<string>();
  for (const r of items) {
    const addr = r?.address ?? {};
    const type = String(r?.type ?? "").toLowerCase();
    const country = String(addr?.country_code ?? "").toLowerCase();
    if (country !== "au") continue;
    if (!ALLOWED.has(type)) continue;

    const name =
      addr.suburb || addr.neighbourhood || addr.locality || addr.hamlet ||
      addr.village || addr.town || addr.city || addr.quarter || addr.borough ||
      r.name || r.display_name;
    if (!name) continue;

    const state = addr.state_code || abbr(addr.state);
    const label = state ? `${name} ${state}` : String(name);
    const k = label.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(label); if (out.length >= take) break; }
  }
  return out;
}

function normalizePhoton(features: any[], take: number): string[] {
  const out: string[] = []; const seen = new Set<string>();
  for (const f of features) {
    const p = f?.properties ?? {};
    if (String(p?.countrycode ?? "").toUpperCase() !== "AU") continue;
    const osmVal = String(p?.osm_value ?? "").toLowerCase();
    if (!ALLOWED.has(osmVal)) continue;

    const name = p?.name || p?.city || p?.district || p?.locality;
    if (!name) continue;

    const stateAbbr = abbr(p?.state || p?.county);
    const label = stateAbbr ? `${name} ${stateAbbr}` : String(name);
    const k = label.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(label); if (out.length >= take) break; }
  }
  return out;
}
