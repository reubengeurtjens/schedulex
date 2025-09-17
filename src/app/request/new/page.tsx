"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/**
 * QUOTE_TRADES
 * Broad, quotes-first trades & specializations (residential + light commercial).
 * Tip: add/remove items freely; the type-ahead will pick them up automatically.
 */
const QUOTE_TRADES = [
  // Building & structural
  "builder – renovations",
  "builder – home extensions",
  "builder – new home (custom)",
  "project manager (residential)",
  "architect (residential)",
  "building designer / draftsperson",
  "structural engineer (site inspection)",
  "civil engineer (driveway/culvert/drainage)",
  "building certifier / approvals",
  "demolition contractor",
  "asbestos testing & removal",
  "lead paint removal",
  "mould remediation",
  "fire/flood/smoke restoration",
  "insurance repair builder",
  "restumping / re-levelling / underpinning",
  "foundation repair",
  "concrete slab & footings",
  "concreter – driveway (plain/exposed/stencil)",
  "concrete cutting & core drilling",
  "concrete polishing",
  "concrete pump hire",
  "earthmoving / excavation (trenches, pool digs)",
  "bobcat/posi-track hire",
  "tipper truck hire",
  "crane truck hire",
  "scaffolding hire",
  "temporary fencing",
  "skip bin hire / site clean-up",
  "bricklayer / blocklayer",
  "stone mason / heritage restoration",
  "repointing (brick/stone)",
  "carpenter – framing",
  "carpenter – fix & fit-off",
  "joiner / cabinet maker (custom)",
  "door installation (internal/external)",
  "window installation (aluminium/uPVC/timber)",
  "cladding installer (FC/metal/timber)",
  "eaves / fascia repair",
  "deck builder (timber/composite)",
  "pergola / veranda / carport",
  "stairs – timber",
  "balustrades & handrails (timber/steel/glass)",
  "plasterer / gyprock / drywall",
  "renderer / solid plaster / stucco",
  "venetian/marmorino plaster",
  "roofer – metal / Colorbond",
  "roofer – tile",
  "roof restoration / re-roofing",
  "guttering & downpipes",
  "gutter guard installation",
  "fascia & soffit repair",
  "skylight / roof window install",
  "roof ventilation / whirlybird",
  "insulation (ceiling/wall/floor)",
  "acoustic treatment / soundproofing",

  // Electrical / low-voltage
  "electrician – general",
  "switchboard upgrade",
  "full/partial house rewire",
  "EV charger installation",
  "solar PV installation",
  "solar battery installation",
  "off-grid solar design",
  "generator changeover switch",
  "data cabling / ethernet",
  "home theatre wiring/setup",
  "TV antenna / satellite dish / Starlink mount",
  "CCTV security cameras",
  "alarm system / monitoring",
  "intercom / access control",
  "smart home automation",
  "ceiling fan installation",
  "lighting design & install (indoor/outdoor)",
  "landscape & garden lighting",
  "pool/spa electrical",

  // Plumbing / gas / drainage
  "plumber – general",
  "hot water system replacement (gas/electric/heat pump/solar)",
  "hot water relocation (re-pipe)",
  "blocked drains (CCTV inspection & quote)",
  "pipe relining (trenchless)",
  "stormwater drainage & pits",
  "rainwater tank installation (pump/plumbed)",
  "greywater systems",
  "sump pump installation",
  "septic system installation / upgrade",
  "sewer connection / main extension",
  "roof plumbing (box gutters, flashings)",
  "gasfitter – appliance install",
  "LPG conversion",
  "backflow testing & install",
  "whole-house water filtration / RO",
  "bidet spray / smart toilet install",

  // HVAC / fireplaces / ventilation
  "air conditioning – split system install",
  "air conditioning – multi-split",
  "air conditioning – ducted",
  "evaporative cooling install",
  "ducted gas heating",
  "mechanical ventilation (bathroom/kitchen/laundry)",
  "rangehood ducting (new/through roof)",
  "fireplace install – wood",
  "fireplace install – gas",
  "chimney/flue install or repair",

  // Exterior & landscaping
  "landscape design & construct",
  "new turf – natural",
  "synthetic turf installation",
  "irrigation system installation",
  "retaining walls – timber",
  "retaining walls – concrete sleeper",
  "retaining walls – masonry/stone",
  "paving – paths/patios",
  "driveway – concrete (plain/exposed)",
  "driveway – asphalt/bitumen",
  "line marking (drive/lot)",
  "carport/garage builder",
  "shed supply & erection (steel/timber)",
  "pergola/veranda/awning",
  "shade sail installation",
  "fencing – timber",
  "fencing – Colorbond/metal",
  "fencing – aluminium/slat",
  "fencing – masonry/brick",
  "pool fencing – glass/aluminium",
  "automatic gates (swing/slider)",
  "letterbox brickwork / piers",
  "garden edging (concrete/steel)",
  "decking – timber/composite",
  "pool builder – concrete",
  "pool builder – fibreglass",
  "spa installation & pad",
  "pool equipment upgrade (pump/filter/heater)",
  "water feature installation",
  "outdoor kitchen / BBQ build",
  "pizza oven (built-in)",
  "exterior balustrades & handrails",
  "glass balustrade (stairs/balconies)",

  // Windows / doors / glass / furnishings
  "glazier – custom glass",
  "double-glazing retrofit",
  "window replacement (all types)",
  "sliding/stacker door install",
  "bifold door install",
  "security screen doors & windows",
  "flyscreens (custom)",
  "roller shutters",
  "plantation shutters",
  "blinds & curtains (measure & install)",

  // Interior finishes / wet areas
  "painter – interior",
  "painter – exterior",
  "feature & decorative painting",
  "wallpaper installation",
  "epoxy floor coating (garage/commercial)",
  "timber floor supply & install",
  "floor sanding & polishing",
  "engineered/laminate/vinyl plank flooring",
  "carpet supply & install",
  "tiler – floor & wall",
  "natural stone tiling",
  "bathroom renovation",
  "ensuite renovation",
  "laundry renovation",
  "kitchen renovation",
  "kitchen benchtop – stone/engineered",
  "splashback – tile/glass/stone",
  "shower screen (frameless/semiframe)",
  "vanity installation",
  "waterproofing (bathroom/balcony)",
  "leak detection (bathroom/balcony)",

  // Specialty & remediation
  "termite inspection",
  "termite treatment & barrier",
  "pest control – rodents/cockroaches/ants",
  "bird proofing & netting",
  "possum proofing",
  "roof cleaning & painting",
  "solar panel cleaning (large arrays)",
  "gutter cleaning (multi-storey/guarded)",
  "balcony remediation",
  "concrete cancer repair",
  "balustrade compliance upgrade",
  "window/door compliance upgrade (eg. pool regs)",
  "rope access trades (high/strata)",
  "pressure washing – house/external",

  // Metalwork / fabrication
  "welder – mobile",
  "steel fabrication – gates/frames/brackets",
  "custom staircases – steel",
  "handrails – stainless/steel",
  "security grilles & doors (metal)",
  "powder coating (fabricated items)",

  // Commercial / shopfit / refrigeration
  "shopfitter (retail/office/clinic)",
  "commercial signage – fabrication & install",
  "commercial kitchen exhaust & ducting",
  "commercial refrigeration install",

  // Rural / marine / off-grid
  "water bore drilling",
  "bore pump installation",
  "dam construction/repair (small-scale)",
  "rural fencing (stock/chainmesh)",
  "cattle grids / access",
  "farm shed erection",
  "cold room installation",
  "jetty / pontoon / boat ramp (small works)",
].sort();

/** Helper to normalise text for includes() filtering */
function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export default function NewQuotePage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = norm(category);
    if (!q) return QUOTE_TRADES.slice(0, 12);
    return QUOTE_TRADES.filter((c) => norm(c).includes(q)).slice(0, 12);
  }, [category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Keep API contract unchanged; we’re just framing the UI as “quotes”
        body: JSON.stringify({ category, description, location }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed: ${res.status}`);
      }
      const created = await res.json();
      router.push(`/request/${created.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit quote request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-1">Book a Quote</h1>
      <p className="text-sm text-gray-600 mb-6">
        Choose a trade/specialist, describe the job, and tell us where you need the quote.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Trade / Specialization</label>
          <input
            list="quote-trades"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., deck builder, pipe relining, balcony remediation"
            className="w-full rounded-md border px-3 py-2"
            required
          />
          <datalist id="quote-trades">
            {filtered.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">
            Start typing to see niche options (e.g., “EV charger”, “pipe relining”, “balcony remediation”).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">What needs quoting?</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scope, size, access, timelines, photos link if any…"
            className="w-full rounded-md border px-3 py-2 min-h-[110px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Suburb/City (and state if helpful)"
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          disabled={submitting}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Request quote"}
        </button>
      </form>
    </div>
  );
}
