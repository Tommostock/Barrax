/* ============================================================================
   BARRAX HQ -- Scriptable Home-Screen Widget (MEDIUM)
   ----------------------------------------------------------------------------
   Paste this whole file into a new Scriptable script on your iPhone, set the
   TOKEN constant below, then add a Scriptable widget to your home screen and
   pick this script from the "When Interacting" options.

   Design system:
     - No border-radius (sharp corners)
     - No gradients, flat colours only
     - No emojis anywhere
     - Military / tactical HUD feel

   Data source:
     GET /api/widget/summary?token=... (see app/api/widget/summary/route.ts)

   How refresh works:
     iOS decides when to redraw widgets, usually every 15-30 minutes. We hint
     at 10 minutes via refreshAfterDate -- iOS may ignore it under battery
     pressure but it nudges the system in the right direction.
   ============================================================================ */

// ---------------------------------------------------------------------------
// CONFIG -- edit these two lines
// ---------------------------------------------------------------------------

// The base URL of your BARRAX deployment. Include the "https://".
const API_BASE = "https://barraxapp.vercel.app";

// Paste the token you minted in Settings -> WIDGET TOKENS. It is a long
// 64-character hex string. Keep this script private -- the token is what
// proves to the server that it is you asking.
const TOKEN = "PASTE_YOUR_FRESH_TOKEN_HERE";

// ---------------------------------------------------------------------------
// BRAND COLOURS -- matches app/globals.css
// ---------------------------------------------------------------------------

const COL = {
  bg:          new Color("#0C0C0C"),
  panel:       new Color("#141A14"),
  panelAlt:    new Color("#1A221A"),
  greenPrim:   new Color("#4A6B3A"),
  greenDark:   new Color("#2D4220"),
  greenLight:  new Color("#6B8F5A"),
  xpGold:      new Color("#B8A04A"),
  sand:        new Color("#C4B090"),
  danger:      new Color("#8B3232"),
  textPrim:    new Color("#D4D4C8"),
  textSec:     new Color("#7A7A6E"),
};

// ---------------------------------------------------------------------------
// FORMAT HELPERS
// ---------------------------------------------------------------------------

// "8:03" from 483 seconds. Used for run pace and run duration.
function fmtMinSec(totalSeconds) {
  if (totalSeconds == null) return "--:--";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// "1.41 km" from 1409 metres.
function fmtKm(metres) {
  if (metres == null) return "--";
  return `${(metres / 1000).toFixed(2)} km`;
}

// Shortens rank title so it fits on one line ("Lance Corporal" -> "LCP").
function shortRank(title) {
  if (!title) return "";
  const map = {
    "Recruit":        "RCT",
    "Private":        "PVT",
    "Lance Corporal": "LCP",
    "Corporal":       "CPL",
    "Sergeant":       "SGT",
    "Staff Sergeant": "SSG",
    "Warrant Officer":"WO",
    "Lieutenant":     "LT",
    "Captain":        "CPT",
    "Major":          "MAJ",
    "Colonel":        "COL",
    "General":        "GEN",
  };
  return map[title] ?? title.toUpperCase().slice(0, 3);
}

// ---------------------------------------------------------------------------
// RING DRAWING
// ---------------------------------------------------------------------------
// Scriptable's DrawContext has no built-in arc primitive, so we approximate
// an arc by drawing many short line segments around a circle. The result is
// a clean ring that matches the in-app macro rings.

function drawRing({ value, target, size, fillColour, trackColour }) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const stroke = Math.max(4, Math.round(size * 0.14));
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Track: full circle behind the progress fill
  ctx.setStrokeColor(trackColour);
  ctx.setLineWidth(stroke);
  const trackPath = new Path();
  trackPath.addEllipse(
    new Rect(stroke / 2, stroke / 2, size - stroke, size - stroke),
  );
  ctx.addPath(trackPath);
  ctx.strokePath();

  // Fill arc starting at 12 o'clock and sweeping clockwise. Capped at 100%.
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  if (pct > 0) {
    ctx.setStrokeColor(fillColour);
    const segments = Math.max(8, Math.floor(pct * 96));
    const startA = -Math.PI / 2;
    const sweep = pct * Math.PI * 2;
    for (let i = 0; i < segments; i++) {
      const a0 = startA + (sweep * i) / segments;
      const a1 = startA + (sweep * (i + 1)) / segments;
      const p = new Path();
      p.move(new Point(cx + radius * Math.cos(a0), cy + radius * Math.sin(a0)));
      p.addLine(new Point(cx + radius * Math.cos(a1), cy + radius * Math.sin(a1)));
      ctx.addPath(p);
      ctx.strokePath();
    }
  }

  return ctx.getImage();
}

// ---------------------------------------------------------------------------
// FETCH
// ---------------------------------------------------------------------------

async function fetchSummary() {
  const url = `${API_BASE}/api/widget/summary?token=${encodeURIComponent(TOKEN)}`;
  const req = new Request(url);
  req.timeoutInterval = 10;
  return await req.loadJSON();
}

// ---------------------------------------------------------------------------
// ERROR WIDGET -- shown when the fetch fails or the token is wrong
// ---------------------------------------------------------------------------

function buildErrorWidget(message) {
  const w = new ListWidget();
  w.backgroundColor = COL.bg;
  w.setPadding(12, 12, 12, 12);

  const title = w.addText("BARRAX HQ");
  title.font = Font.boldSystemFont(14);
  title.textColor = COL.sand;

  w.addSpacer(6);

  const err = w.addText(message);
  err.font = Font.regularMonospacedSystemFont(10);
  err.textColor = COL.danger;

  return w;
}

// ---------------------------------------------------------------------------
// MEDIUM WIDGET LAYOUT
// ---------------------------------------------------------------------------
// Layout (roughly):
//
//   BARRAX HQ                     LCP  504 / 1000 XP
//   ----------------------------  ----------------
//   [O]   [O]   [O]   [O]         STREAK   0 DAYS
//   CAL   PRO   CRB   FAT         RUN      1.4 km
//   1405  98    130   53          PACE     8:03/km
//   2500  188   250   83
//
// ---------------------------------------------------------------------------

function buildMediumWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = COL.bg;
  w.setPadding(10, 12, 10, 12);

  // Nudge iOS to refresh in ~10 minutes. Actual cadence is iOS's call.
  w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000);

  // --- Top strip: app mark on the left, rank + XP on the right ------------
  const top = w.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();

  const brand = top.addText("BARRAX HQ");
  brand.font = Font.heavySystemFont(13);
  brand.textColor = COL.sand;

  top.addSpacer();

  const rankCol = top.addStack();
  rankCol.layoutVertically();

  const rankTitle = rankCol.addText(shortRank(data.rank?.title));
  rankTitle.font = Font.boldSystemFont(12);
  rankTitle.textColor = COL.xpGold;
  rankTitle.rightAlignText();

  const xp = data.rank?.total_xp ?? 0;
  const nextXp = data.rank?.next_rank_xp;
  const xpLine =
    nextXp != null
      ? `${xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`
      : `${xp.toLocaleString()} XP`;
  const xpText = rankCol.addText(xpLine);
  xpText.font = Font.regularMonospacedSystemFont(9);
  xpText.textColor = COL.textSec;
  xpText.rightAlignText();

  w.addSpacer(8);

  // --- Main body: rings on the left, stats on the right -------------------
  const body = w.addStack();
  body.layoutHorizontally();
  body.spacing = 10;

  // ----- Rings column ---------------------------------------------------
  const rings = body.addStack();
  rings.layoutHorizontally();
  rings.spacing = 8;

  const ringSize = 44;
  const macros = data.macros ?? {};
  const ringDefs = [
    { key: "CAL", data: macros.calories, colour: COL.greenLight },
    { key: "PRO", data: macros.protein,  colour: COL.greenPrim  },
    { key: "CRB", data: macros.carbs,    colour: COL.xpGold     },
    { key: "FAT", data: macros.fat,      colour: COL.sand       },
  ];

  for (const def of ringDefs) {
    const col = rings.addStack();
    col.layoutVertically();
    col.centerAlignContent();

    const value = def.data?.value ?? 0;
    const target = def.data?.target ?? 0;

    // The ring itself
    const ring = col.addImage(
      drawRing({
        value,
        target,
        size: ringSize * 3, // draw at 3x for crisp result on retina
        fillColour: def.colour,
        trackColour: COL.greenDark,
      }),
    );
    ring.imageSize = new Size(ringSize, ringSize);

    // Ring label (CAL / PRO / etc.)
    const lbl = col.addText(def.key);
    lbl.font = Font.boldMonospacedSystemFont(8);
    lbl.textColor = COL.textSec;
    lbl.centerAlignText();

    // Current value
    const cur = col.addText(String(Math.round(value)));
    cur.font = Font.regularMonospacedSystemFont(10);
    cur.textColor = COL.textPrim;
    cur.centerAlignText();

    // Target (small, muted)
    const tgt = col.addText(`/${Math.round(target)}`);
    tgt.font = Font.regularMonospacedSystemFont(8);
    tgt.textColor = COL.textSec;
    tgt.centerAlignText();
  }

  body.addSpacer();

  // ----- Stats column ---------------------------------------------------
  const stats = body.addStack();
  stats.layoutVertically();
  stats.spacing = 4;

  addStatRow(stats, "STREAK", `${data.streak?.current ?? 0} d`);

  // Today's workout. Mirrors the dashboard's "No orders" fallback.
  const w_ = data.today_workout;
  const workoutLabel = w_
    ? (w_.status === "complete" ? "DONE" : (w_.name || "ORDERS").toUpperCase())
    : "NO ORDERS";
  addStatRow(stats, "TODAY", workoutLabel);

  // Last run: distance + pace on two lines for readability.
  const run = data.last_run;
  if (run) {
    addStatRow(stats, "LAST RUN", fmtKm(run.distance_metres));
    addStatRow(stats, "PACE", `${fmtMinSec(run.avg_pace_seconds_per_km)}/km`);
  } else {
    addStatRow(stats, "LAST RUN", "--");
  }

  return w;
}

// Small helper: adds a "LABEL  value" row to a vertical stack.
function addStatRow(parent, label, value) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = 6;

  const lbl = row.addText(label);
  lbl.font = Font.boldMonospacedSystemFont(8);
  lbl.textColor = COL.textSec;

  row.addSpacer();

  const val = row.addText(value);
  val.font = Font.boldMonospacedSystemFont(11);
  val.textColor = COL.textPrim;
}

// ---------------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------------

async function run() {
  let widget;

  if (!TOKEN || TOKEN === "PASTE_YOUR_FRESH_TOKEN_HERE") {
    widget = buildErrorWidget("No token set. Edit this script and paste your widget token.");
  } else {
    try {
      const data = await fetchSummary();
      if (data && data.error) {
        widget = buildErrorWidget(data.error);
      } else {
        widget = buildMediumWidget(data);
      }
    } catch (e) {
      widget = buildErrorWidget(`Fetch failed: ${e.message ?? e}`);
    }
  }

  // When run from the Scriptable app directly, show a preview at medium size.
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
  Script.complete();
}

await run();
