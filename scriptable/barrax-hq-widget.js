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
// ---------------------------------------------------------------------------
// RANK THRESHOLDS
// ---------------------------------------------------------------------------
// Mirrored from types/index.ts so the widget can compute band-relative
// progress ("4 XP into rank 3's 500-XP band", not "504 XP into 1,000")
// without depending on current_rank_xp being present in the API payload.
// Keep this array in sync with RANK_THRESHOLDS in the app.
const RANK_THRESHOLDS = [
  { rank: 1,  title: "Recruit",         xp: 0     },
  { rank: 2,  title: "Private",         xp: 200   },
  { rank: 3,  title: "Lance Corporal",  xp: 500   },
  { rank: 4,  title: "Corporal",        xp: 1000  },
  { rank: 5,  title: "Sergeant",        xp: 2000  },
  { rank: 6,  title: "Staff Sergeant",  xp: 3500  },
  { rank: 7,  title: "Warrant Officer", xp: 5500  },
  { rank: 8,  title: "Lieutenant",      xp: 8000  },
  { rank: 9,  title: "Captain",         xp: 12000 },
  { rank: 10, title: "Major",           xp: 17000 },
  { rank: 11, title: "Colonel",         xp: 24000 },
  { rank: 12, title: "General",         xp: 33000 },
];

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
//
// Visual feedback when you hit or blow through a target:
//   * pct >= 100%: a subtle tick mark is drawn inside the ring.
//   * pct > 105%: the whole ring turns the brand danger red instead of
//                 the macro's usual colour. The tick still renders so the
//                 "you hit it" cue isn't lost.

function drawRing({ value, target, size, fillColour, trackColour }) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const stroke = Math.max(4, Math.round(size * 0.14));
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Raw percentage (can exceed 1) drives the state feedback; we still
  // clamp the visual arc to 100% so the sweep never wraps past the top.
  const rawPct = target > 0 ? value / target : 0;
  const pct = Math.min(1, rawPct);
  const isHit = rawPct >= 1;
  const isOver = rawPct > 1.05;

  // Danger state replaces the macro colour so the over-target warning
  // dominates the visual read.
  const arcColour = isOver ? COL.danger : fillColour;

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
  if (pct > 0) {
    ctx.setStrokeColor(arcColour);
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

  // Tick overlay when the target has been hit. Two short lines forming
  // the classic check shape, drawn at the centre of the ring.
  if (isHit) {
    // Scale the tick proportional to the ring so it reads the same at
    // any size. Stroke is slightly thinner than the arc's own stroke.
    const tickStroke = Math.max(2, Math.round(size * 0.045));
    ctx.setStrokeColor(arcColour);
    ctx.setLineWidth(tickStroke);

    const r = size * 0.18;         // half-span of the tick
    const dropY = size * 0.05;     // lower the whole tick a touch
    const pivotX = cx - r * 0.25;  // the inner "V" point, slightly left of centre
    const pivotY = cy + r * 0.55 + dropY;

    const tick = new Path();
    tick.move(new Point(pivotX - r, cy + dropY));             // left arm start
    tick.addLine(new Point(pivotX, pivotY));                   // V
    tick.addLine(new Point(pivotX + r * 1.25, cy - r * 0.6 + dropY)); // right arm up
    ctx.addPath(tick);
    ctx.strokePath();
  }

  return ctx.getImage();
}

// ---------------------------------------------------------------------------
// RANK PROGRESS BAR
// ---------------------------------------------------------------------------
// Thin gold line along the bottom of the widget showing progress
// from the user's current rank threshold to the next. Drawn as a
// single bitmap so the filled portion sits flush with the track.
function drawRankBar({ currentXp, rankStartXp, rankEndXp, width, height }) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  // Track (unfilled portion)
  ctx.setFillColor(COL.greenDark);
  ctx.fillRect(new Rect(0, 0, width, height));

  // How far into the band we are. Guards against weird payloads
  // (max rank where rankEndXp is null, or identical start/end).
  if (rankEndXp != null && rankEndXp > rankStartXp) {
    const pct = Math.max(
      0,
      Math.min(1, (currentXp - rankStartXp) / (rankEndXp - rankStartXp)),
    );
    if (pct > 0) {
      ctx.setFillColor(COL.xpGold);
      ctx.fillRect(new Rect(0, 0, Math.round(width * pct), height));
    }
  } else {
    // Max rank: show a fully-filled bar as a "you made it" flourish.
    ctx.setFillColor(COL.xpGold);
    ctx.fillRect(new Rect(0, 0, width, height));
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
// Macro circles are the main feature -- no side panel. Four rings
// (Calories, Protein, Carbs, Fat) spread across the full width, each
// with a centred label and a single "value/target" readout in a
// unified style.
//
//   BARRAX HQ                              LCP  504 / 1,000 XP
//
//      [O]         [O]         [O]         [O]
//    Calories    Protein      Carbs         Fat
//    1405/2500   98/188      130/250       53/83
//
// ---------------------------------------------------------------------------

function buildMediumWidget(data) {
  const w = new ListWidget();
  w.backgroundColor = COL.bg;
  w.setPadding(10, 14, 10, 14);

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

  // Vertically centre the rings in the remaining space.
  w.addSpacer();

  // --- Macro rings row: fills the full width, evenly spaced ---------------
  const rings = w.addStack();
  rings.layoutHorizontally();
  rings.centerAlignContent();

  // Larger rings now that they own the whole row.
  const ringSize = 58;

  const macros = data.macros ?? {};
  const ringDefs = [
    { label: "Calories", data: macros.calories, colour: COL.greenLight },
    { label: "Protein",  data: macros.protein,  colour: COL.greenPrim  },
    { label: "Carbs",    data: macros.carbs,    colour: COL.xpGold     },
    { label: "Fat",      data: macros.fat,      colour: COL.sand       },
  ];

  // Flexible spacers around every ring column push them into equal
  // columns across the row regardless of the ring or label widths.
  rings.addSpacer();
  for (const def of ringDefs) {
    addMacroColumn(rings, def, ringSize);
    rings.addSpacer();
  }

  // Breathing room under the rings so the readout doesn't hug the edge.
  w.addSpacer();

  // --- Rank progress bar ---------------------------------------------------
  // Thin gold line along the bottom with the current XP on the left and
  // the next-rank threshold on the right.
  addRankBar(w, data.rank);

  return w;
}

// Full-width rank progress bar pinned to the bottom of the widget.
// Layout is two rows so the bar itself can occupy the entire inner
// width with only the padding either side:
//
//   504                                             1,000
//   ================================----------------------
//
// Band-relative progress is computed locally from RANK_THRESHOLDS so
// it matches the in-app RankStrip component exactly -- "504 XP at
// Lance Corporal" reads as "4 / 500 into the band", not "504 / 1000
// from zero". The API's current_rank_xp is used when present, with a
// local lookup as a safe fallback if the deploy hasn't caught up.
function addRankBar(parent, rank) {
  const currentXp = rank?.total_xp ?? 0;
  const currentRank = rank?.level ?? 1;

  // Trust the API's current_rank_xp when it's present; otherwise look
  // up the threshold for the user's current rank so the maths is still
  // right. Same story for next_rank_xp.
  const rankStart =
    rank?.current_rank_xp ??
    (RANK_THRESHOLDS[currentRank - 1]?.xp ?? 0);
  const rankEnd =
    rank?.next_rank_xp ??
    (RANK_THRESHOLDS[currentRank]?.xp ?? null);

  const atMaxRank = rankEnd == null;

  // Numbers row: current XP flush left, next-rank threshold flush right.
  const numbers = parent.addStack();
  numbers.layoutHorizontally();

  const left = numbers.addText(currentXp.toLocaleString());
  left.font = Font.regularMonospacedSystemFont(8);
  left.textColor = COL.textSec;

  numbers.addSpacer();

  const right = numbers.addText(atMaxRank ? "MAX" : rankEnd.toLocaleString());
  right.font = Font.regularMonospacedSystemFont(8);
  right.textColor = COL.xpGold;

  // Tiny gap between the numbers and the bar.
  parent.addSpacer(3);

  // Bar row: image sized to the widget's inner width. Medium widget
  // inner width is ~310pt after the 14pt left/right padding; 290pt
  // leaves a little slack so it never overflows on smaller devices.
  const barDisplayWidth = 290;
  const barDisplayHeight = 3;

  const barRow = parent.addStack();
  barRow.layoutHorizontally();
  barRow.addSpacer();
  const barImg = barRow.addImage(
    drawRankBar({
      currentXp,
      rankStartXp: rankStart,
      rankEndXp: rankEnd,
      width: barDisplayWidth * 3, // oversample for retina crispness
      height: barDisplayHeight * 3,
    }),
  );
  barImg.imageSize = new Size(barDisplayWidth, barDisplayHeight);
  barRow.addSpacer();
}

// Vertical column: ring + "Calories" label + "value/target" readout.
// Label and readout share typography across all four macros -- only
// the ring fill colour differs -- so the row reads as one unit.
//
// The column is pinned to a fixed width so all four columns are the
// same size regardless of label length ("Calories" is wider than
// "Fat"). Inside that fixed box, spacer-sandwich stacks centre the
// ring, label, and readout precisely on the column's midline.
function addMacroColumn(parent, def, ringSize) {
  // Width must comfortably hold the ring AND the widest text line.
  // "1405/2500" at mono-10 is the longest readout we'll show; plus
  // a small buffer so it never hugs the spacers between columns.
  const colWidth = Math.max(ringSize, 72);

  const col = parent.addStack();
  col.layoutVertically();
  col.size = new Size(colWidth, 0); // height 0 = auto
  col.centerAlignContent();

  const value = def.data?.value ?? 0;
  const target = def.data?.target ?? 0;

  // Ring row -- spacer-sandwich so the ring sits on the column's
  // centre even though the ring image (58) is narrower than the
  // column box (72).
  const ringRow = col.addStack();
  ringRow.layoutHorizontally();
  ringRow.addSpacer();
  const ring = ringRow.addImage(
    drawRing({
      value,
      target,
      size: ringSize * 3, // draw at 3x and downsize for retina crispness
      fillColour: def.colour,
      trackColour: COL.greenDark,
    }),
  );
  ring.imageSize = new Size(ringSize, ringSize);
  ringRow.addSpacer();

  // Small gap between ring and the text underneath.
  col.addSpacer(4);

  // Macro name, mixed case, sandwiched so it sits dead-centre.
  const labelRow = col.addStack();
  labelRow.layoutHorizontally();
  labelRow.addSpacer();
  const lbl = labelRow.addText(def.label);
  lbl.font = Font.mediumSystemFont(10);
  lbl.textColor = COL.textSec;
  labelRow.addSpacer();

  // Single-line "value/target" readout, same treatment.
  const readoutRow = col.addStack();
  readoutRow.layoutHorizontally();
  readoutRow.addSpacer();
  const readout = readoutRow.addText(
    `${Math.round(value)}/${Math.round(target)}`,
  );
  readout.font = Font.regularMonospacedSystemFont(10);
  readout.textColor = COL.textPrim;
  readoutRow.addSpacer();
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
