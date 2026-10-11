import { EASE_OUT, setText } from "./motion";

/*
 * How each chart comes in. A chart with a function here plays it instead of the shared moves in `animateChart`.
 *
 * They all tell it in the same order, because that is the order a chart is read in: what the chart is made of
 * stands first (the empty slots, the grid, the names on the axes), then the numbers arrive with a direction (a
 * level rising, a wave crossing, a hand going round), then the one thing the chart is about lands last and alone,
 * and only then does its pill say what it is. Nothing is left standing still: `restIn` fades in whatever a
 * choreography did not move itself.
 *
 * Every tween is a `from`, so the finished picture is the markup's own (a still shows it with no timeline at all),
 * and every `from` holds its start from the scene's first frame, so nothing is seen before it comes in.
 */

type Piece = SVGElement | HTMLElement;
type Entrance = (tl: gsap.core.Timeline, figure: HTMLElement, at: number) => void;

const all = (root: Element, selector: string) => [...root.querySelectorAll<Piece>(selector)];
const one = (root: Element, selector: string) => root.querySelector<Piece>(selector);
const pair = (text: string | undefined) => (text ?? "0 0").split(" ").map(Number) as [number, number];
const count = (value: number) => Math.round(value).toLocaleString("en-US");

/**
 * The moves every chart is put together from, on one timeline. Kept as methods so a call names what moves, how and
 * when, without handing the timeline over every time.
 */
function movesOn(tl: gsap.core.Timeline) {
  /** A `from` that does nothing when there is nothing to move, instead of a warning for every chart without that piece. */
  const from = (targets: Piece | readonly Piece[] | null, vars: gsap.TweenVars, at: number) => {
    if (!targets || (Array.isArray(targets) && targets.length === 0)) return;
    tl.from(targets, vars, at);
  };

  return {
    from,

    /**
     * The one thing the chart is about lands: it swells once and settles, like something set down. Only for a thing
     * with room around it. A cell in a grid or a wedge in a ring grows into its neighbours, so those arrive last
     * instead.
     */
    land(target: Piece | null, at: number, origin?: string) {
      if (!target) return;
      tl.to(
        target,
        {
          keyframes: [
            { scale: 1.2, duration: 0.16, ease: "power2.out" },
            { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" },
          ],
          ...(origin ? { svgOrigin: origin } : { transformOrigin: "50% 50%" }),
        },
        at,
      );
    },

    /** The hairline grows from the point up to its pill, and the pill pops on the end of it. */
    pillIn(figure: HTMLElement, at: number) {
      for (const line of all(figure, "line[data-chart-note]")) {
        from(line, { scale: 0, svgOrigin: line.dataset.origin, duration: 0.35, ease: "power2.out" }, at);
      }
      from(
        all(figure, "g[data-chart-note]"),
        { scale: 0.3, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "back.out(2.6)" },
        at + 0.22,
      );
    },

    /** Small words on an axis or under a chart: up and in, one after another, over `spread` seconds. */
    labelsIn(labels: readonly Piece[], at: number, spread = 0.4) {
      from(labels, { y: 16, autoAlpha: 0, duration: 0.5, ease: EASE_OUT, stagger: { amount: spread } }, at);
    },

    /** A share that counts up to the percent written in its `data-share`. */
    shareUp(node: Piece | null, at: number, duration: number) {
      if (!node) return;
      const share = Number(node.dataset.share ?? 0);
      const box = { value: 0 };
      tl.to(
        box,
        {
          value: share,
          duration,
          ease: "power2.out",
          onUpdate: () => {
            setText(node, `${count(box.value)}%`);
          },
        },
        at,
      );
    },
  };
}

/**
 * The notes of a chart that has no choreography of its own, brought in the way the others bring theirs: the words on
 * its axis rise, a rule is drawn from where it starts, a hairline grows up from its point, and the pill pops on the
 * end of it.
 */
export function notesIn(tl: gsap.core.Timeline, figure: HTMLElement, at: number) {
  const m = movesOn(tl);
  const notes = (selector: string) => all(figure, selector);
  m.labelsIn(
    notes("text[data-chart-note]").filter((note) => !note.parentElement?.closest("[data-chart-note]")),
    at + 0.5,
  );
  for (const [index, key] of notes("li[data-chart-note]").entries()) {
    m.from(key, { x: -26, autoAlpha: 0, duration: 0.5, ease: "back.out(1.8)" }, at + 0.9 + index * 0.1);
  }
  for (const line of notes("line[data-chart-note]")) {
    const start = `${line.getAttribute("x1") ?? 0} ${line.getAttribute("y1") ?? 0}`;
    m.from(line, { scale: 0, svgOrigin: line.dataset.origin ?? start, duration: 0.5, ease: "power2.out" }, at + 0.9);
  }
  m.from(
    notes("circle[data-chart-note]"),
    { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3)" },
    at + 1.05,
  );
  // A group that holds a pill of its own (a funnel's stage) only fades: the pill inside does the popping.
  const groups = notes("g[data-chart-note]");
  const holders = groups.filter((group) => group.querySelector("[data-chart-note]"));
  m.from(holders, { autoAlpha: 0, duration: 0.45, ease: "power1.out", stagger: 0.1 }, at + 0.9);
  m.from(
    groups.filter((group) => !holders.includes(group)),
    { scale: 0.3, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "back.out(2.6)", stagger: 0.1 },
    at + 1.12,
  );
}

/**
 * Fades in whatever is drawn in the chart and that nothing has moved: a stray axis, a slot, a caption. A chart is
 * never half animated, with its numbers arriving over furniture that was already standing there.
 */
export function restIn(tl: gsap.core.Timeline, figure: HTMLElement, at: number) {
  const moved = new Set<unknown>(
    tl.getChildren(true, true, false).flatMap((tween) => (tween as gsap.core.Tween).targets()),
  );
  const isMoved = (piece: Element) => {
    for (let node: Element | null = piece; node && node !== figure; node = node.parentElement) {
      if (moved.has(node)) return true;
    }
    return false;
  };
  const still = all(figure, "rect, circle, path, line, polygon, polyline, text, li, i, b, small").filter(
    (piece) => !piece.closest("defs, mask, clipPath") && !isMoved(piece),
  );
  if (still.length > 0) {
    tl.from(still, { autoAlpha: 0, duration: 0.6, ease: "power1.out", stagger: { amount: 0.3 } }, at);
  }
}

/* ---------- spark ---------- */

/** A number written on a piece of a chart as an attribute: where along the chart it sits. */
const xOf = (piece: Piece, attribute: string) => Number(piece.getAttribute(attribute) ?? 0);

/**
 * The year is drawn left to right, and everything said about it turns up as the line gets there: the rule to cross
 * is laid first, the lit stretch stands up when the line reaches it, the dot lands where the line crosses, and each
 * pill pops as the line passes under it.
 */
const spark: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const draw = 1.5;
  const width = figure.querySelector("svg")?.viewBox.baseVal.width || 1000;
  /** When the line being drawn gets to `x`: the wipe eases in and out, so this is that ease run backwards. */
  const reaches = (x: number) => {
    const share = Math.min(1, Math.max(0, x / width));
    return at + draw * (share < 0.5 ? Math.sqrt(share / 2) : 1 - Math.sqrt((1 - share) / 2));
  };

  const line = one(figure, "[data-chart-wipe]");
  if (line) {
    tl.fromTo(
      line,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: draw, ease: "power2.inOut" },
      at,
    );
  }
  // The rule to cross is level, so it has no height of its own to clip by: the clip reaches above and below it.
  const rule = one(figure, "line[data-chart-note]:not([data-origin])");
  if (rule) {
    tl.fromTo(
      rule,
      { clipPath: "inset(-20px 100% -20px 0%)" },
      { clipPath: "inset(-20px 0% -20px 0%)", duration: 0.9, ease: "power2.out" },
      at,
    );
  }
  const band = one(figure, "[data-chart-band]");
  if (band) {
    m.from(
      band,
      { scaleY: 0, autoAlpha: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "back.out(1.4)" },
      reaches(xOf(band, "x")),
    );
  }
  for (const dot of all(figure, "circle[data-chart-note]")) {
    m.from(
      dot,
      { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3.4)" },
      reaches(xOf(dot, "cx")),
    );
  }
  const stems = all(figure, "line[data-chart-note][data-origin]");
  for (const stem of stems) {
    m.from(
      stem,
      { scale: 0, svgOrigin: stem.dataset.origin, duration: 0.35, ease: "power2.out" },
      reaches(xOf(stem, "x1")) + 0.1,
    );
  }
  const last = Math.max(at + 0.6, ...stems.map((stem) => reaches(xOf(stem, "x1")) + 0.1));
  m.from(
    all(figure, "g[data-chart-note]"),
    { scale: 0.3, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "back.out(2.6)", stagger: 0.12 },
    last + 0.2,
  );
};

/* ---------- bars ---------- */

/** Left to right: a bar's name comes up, the bar rises out of the floor over it, its number lands on top. */
const bars: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const columns = all(figure, "[data-chart-col]");
  const step = Math.min(0.08, 0.7 / Math.max(1, columns.length));
  for (const [index, column] of columns.entries()) {
    const start = at + index * step;
    m.from(one(column, "[data-chart-bar-label]"), { y: 20, autoAlpha: 0, duration: 0.45, ease: EASE_OUT }, start);
    m.from(
      one(column, "[data-chart-bar]"),
      { scaleY: 0, transformOrigin: "50% 100%", duration: 0.85, ease: "back.out(1.8)" },
      start + 0.08,
    );
    m.from(
      one(column, "text[data-chart-note]"),
      { y: 18, autoAlpha: 0, duration: 0.4, ease: "back.out(2)" },
      start + 0.55,
    );
  }
  const landed = at + columns.length * step + 0.8;
  const peak = one(figure, "[data-chart-col][data-peak] [data-chart-bar]");
  if (peak) {
    tl.to(
      peak,
      {
        keyframes: [
          { scaleY: 1.07, duration: 0.14, ease: "power2.out" },
          { scaleY: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" },
        ],
        transformOrigin: "50% 100%",
      },
      landed,
    );
  }
  m.from(
    all(figure, "g[data-chart-note]"),
    { scale: 0.3, autoAlpha: 0, transformOrigin: "50% 100%", duration: 0.55, ease: "back.out(2.6)" },
    landed + 0.05,
  );
};

/* ---------- dial ---------- */

/**
 * The dark dial fans open from the left, then the share charges up it segment by segment, faster as it goes. A lit
 * segment comes up inside its own slot and never past the rim: thrown outwards, it left the dial.
 */
const gauge: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const slots = all(figure, "[data-chart-slot]");
  const lit = all(figure, "[data-chart-lit]");
  const origin = slots[0]?.dataset.origin;
  m.from(
    slots,
    { scale: 0.88, autoAlpha: 0, svgOrigin: origin, duration: 0.5, ease: "power3.out", stagger: { amount: 0.5 } },
    at,
  );
  const charge = 0.35 + lit.length * 0.06;
  m.from(
    lit,
    {
      scale: 0.9,
      autoAlpha: 0,
      svgOrigin: origin,
      duration: 0.4,
      ease: "power3.out",
      stagger: { amount: charge, ease: "power1.in" },
    },
    at + 0.55,
  );
};

/* ---------- days ---------- */

/** One after another along the row: a day's tile comes up into its place, then its name and what day it was. */
const days: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const tiles = all(figure, ".wr-chart-day");
  const step = Math.min(0.1, 0.7 / Math.max(1, tiles.length));
  for (const [index, tile] of tiles.entries()) {
    const start = at + index * step;
    // Never past its own size: the tiles sit close, and one that grows touches the next.
    m.from(one(tile, "i"), { y: 46, scale: 0.82, autoAlpha: 0, duration: 0.65, ease: "power3.out" }, start);
    m.from(all(tile, "b, small"), { y: 18, autoAlpha: 0, duration: 0.45, ease: EASE_OUT, stagger: 0.07 }, start + 0.28);
  }
};

/* ---------- pixel area ---------- */

/**
 * The empty grid rolls in from the left, then every column stacks its lit cells up from the floor, as one wave. A
 * cell grows to its size and no further (past it, cells touch), and the one the chart is about arrives last.
 */
const pixels: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  m.from(
    all(figure, "[data-chart-slots]"),
    { y: 22, autoAlpha: 0, duration: 0.5, ease: EASE_OUT, stagger: { amount: 0.55 } },
    at,
  );
  const point = one(figure, "[data-chart-point]");
  const cell = { scale: 0.3, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "power3.out" };
  let last = at + 0.35;
  for (const column of all(figure, "[data-chart-col]")) {
    const start = at + 0.35 + Number(column.dataset.column ?? 0) * 0.04;
    const cells = ([...column.children] as Piece[]).filter((piece) => piece !== point);
    m.from(cells, { ...cell, stagger: 0.035 }, start);
    last = Math.max(last, start + cells.length * 0.035 + 0.3);
  }
  m.from(point, { ...cell, duration: 0.5 }, last);
  m.pillIn(figure, last + 0.15);
};

/* ---------- wheel ---------- */

/** Wound clockwise from the top: each arc is drawn along its own curve and its name steps out from the ring. */
const wheel: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const rim = one(figure, "[data-chart-rim]");
  m.from(
    rim,
    { scale: 0.6, autoAlpha: 0, rotation: -60, svgOrigin: rim?.dataset.origin, duration: 0.9, ease: "back.out(1.5)" },
    at,
  );
  const arcs = all(figure, "[data-chart-arc]");
  const labels = all(figure, "[data-chart-arc-label]");
  const step = Math.min(0.08, 0.9 / Math.max(1, arcs.length));
  for (const [index, arc] of arcs.entries()) {
    const length = Number(arc.dataset.length ?? 0) + 2;
    const start = at + 0.25 + index * step;
    tl.fromTo(
      arc,
      { strokeDasharray: `0 ${length}` },
      { strokeDasharray: `${length} ${length}`, duration: 0.55, ease: "power3.out" },
      start,
    );
    const [x, y] = pair(labels[index]?.dataset.from);
    m.from(labels[index] ?? null, { x, y, autoAlpha: 0, duration: 0.5, ease: "back.out(2)" }, start + 0.2);
  }
  // The busiest one swells in its own width once the hand has gone all the way round.
  const peak = one(figure, "[data-chart-point]");
  if (peak) {
    const width = Number(peak.dataset.width ?? 0);
    tl.to(
      peak,
      {
        keyframes: [
          { strokeWidth: width * 1.26, duration: 0.18, ease: "power2.out" },
          { strokeWidth: width, duration: 0.6, ease: "elastic.out(1, 0.45)" },
        ],
      },
      at + 0.25 + arcs.length * step + 0.35,
    );
  }
};

/* ---------- day clock ---------- */

/**
 * The empty face goes round from midnight, then each hour grows out of the hub in the same order, like a hand. An
 * hour grows to its own length and stops there: thrown past it, the busiest one left the face.
 */
const clock: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const hub = one(figure, "[data-chart-hub]");
  const origin = hub?.dataset.origin;
  m.from(hub, { scale: 0, autoAlpha: 0, svgOrigin: origin, duration: 0.6, ease: "back.out(2.2)" }, at);
  m.from(
    all(figure, "[data-chart-slot]"),
    { scale: 0.6, autoAlpha: 0, svgOrigin: origin, duration: 0.5, ease: "power3.out", stagger: { amount: 0.6 } },
    at + 0.05,
  );
  m.labelsIn(all(figure, "[data-chart-tick-label]"), at + 0.3);
  const point = one(figure, "[data-chart-point]");
  let last = at + 0.45;
  for (const hour of all(figure, "[data-chart-hour]")) {
    if (hour === point) continue;
    const start = at + 0.45 + Number(hour.dataset.chartHour ?? 0) * 0.045;
    m.from(hour, { scale: 0.45, svgOrigin: origin, duration: 0.6, ease: "power3.out" }, start);
    m.from(hour, { autoAlpha: 0, duration: 0.18, ease: "none" }, start);
    last = Math.max(last, start + 0.4);
  }
  // The busiest hour comes last, on its own, once the hand has gone all the way round.
  m.from(point, { scale: 0.45, svgOrigin: origin, duration: 0.7, ease: "expo.out" }, last);
  m.from(point, { autoAlpha: 0, duration: 0.18, ease: "none" }, last);
  m.pillIn(figure, last + 0.35);
};

/* ---------- river ---------- */

/**
 * The streams are pulled in from the left one after another, like ribbons, each to its full length. The months come
 * up under them as they pass, the names line up below, and each share counts up to where the year ended.
 */
const river: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  // The clip reaches past the band above, below and behind, so the lit stream keeps its glow once it is in.
  // Percent on the side that moves, at both ends: a tween cannot cross from percent to pixels, it jumps.
  const shut = "inset(-60px 100% -60px -60px)";
  const open = "inset(-60px -10% -60px -60px)";
  const streams = all(figure, "[data-chart-stream]");
  for (const [index, stream] of streams.entries()) {
    tl.fromTo(stream, { clipPath: shut }, { clipPath: open, duration: 1.35, ease: "power3.inOut" }, at + index * 0.14);
  }
  const drawn = at + (streams.length - 1) * 0.14 + 1.35;
  m.labelsIn(all(figure, "[data-chart-tick-label]"), at + 0.3, 1);
  m.from(
    one(figure, "[data-chart-point]"),
    { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3)" },
    drawn - 0.1,
  );
  m.pillIn(figure, drawn);
  for (const [index, key] of all(figure, "[data-chart-key]").entries()) {
    const start = at + 0.9 + index * 0.14;
    m.from(key, { x: -26, autoAlpha: 0, duration: 0.5, ease: "back.out(1.8)" }, start);
    m.shareUp(one(key, "[data-share]"), start, 0.9);
  }
};

/* ---------- dot share ---------- */

/** A hundred dark dots pour in column by column, then the share fills over them like a level, faster as it rises. */
const dots: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  m.from(
    all(figure, "[data-chart-slot]"),
    {
      scale: 0,
      autoAlpha: 0,
      transformOrigin: "50% 50%",
      duration: 0.4,
      ease: "back.out(2.4)",
      stagger: { amount: 0.6 },
    },
    at,
  );
  const lit = all(figure, "[data-chart-lit]");
  const fill = 0.5 + lit.length * 0.012;
  m.from(
    lit,
    {
      scale: 0,
      transformOrigin: "50% 50%",
      duration: 0.5,
      ease: "back.out(1.6)",
      stagger: { amount: fill, ease: "power1.in" },
    },
    at + 0.6,
  );
  m.labelsIn(all(figure, "text[data-chart-note]"), at + 0.5, 0.15);
  const landed = at + 0.6 + fill + 0.35;
  m.land(one(figure, "[data-chart-point]"), landed);
  m.pillIn(figure, landed);
};

/* ---------- bubbles ---------- */

/** The biggest disc swells up first; the others bud out of its middle and travel to their places, counting as they go. */
const bubbles: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  for (const [index, disc] of all(figure, "[data-chart-disc]").entries()) {
    const main = index === 0;
    const start = main ? at : at + 0.4 + (index - 1) * 0.14;
    const [x, y] = main ? [0, 0] : pair(disc.dataset.from);
    m.from(
      disc,
      {
        scale: 0,
        x,
        y,
        svgOrigin: disc.dataset.origin,
        duration: main ? 1.2 : 1,
        ease: main ? "elastic.out(1, 0.55)" : "back.out(1.9)",
      },
      start,
    );
    m.from(disc, { autoAlpha: 0, duration: 0.15, ease: "none" }, start);
    m.shareUp(one(disc, "[data-share]"), start + 0.1, main ? 1.1 : 0.9);
    m.from(one(disc, "[data-chart-disc-name]"), { y: 14, autoAlpha: 0, duration: 0.45, ease: EASE_OUT }, start + 0.55);
  }
};

/* ---------- month up close ---------- */

/**
 * The weekdays drop in along the top, then the month is dealt out from its first corner as one diagonal wave. A cell
 * grows to its size and no further (past it, cells touch), and the biggest day arrives last.
 */
const month: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  m.from(
    all(figure, "[data-chart-head]"),
    { y: -18, autoAlpha: 0, duration: 0.45, ease: "back.out(2)", stagger: 0.045 },
    at,
  );
  const cells = all(figure, "[data-chart-cell]");
  const point = one(figure, "[data-chart-point]");
  const cell = { scale: 0.4, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "power3.out" };
  for (const [index, piece] of cells.entries()) {
    if (piece === point) continue;
    m.from(piece, cell, at + 0.2 + ((index % 7) + Math.floor(index / 7)) * 0.075);
  }
  const dealt = at + 0.2 + (6 + Math.floor((cells.length - 1) / 7)) * 0.075 + 0.35;
  m.from(point, { ...cell, duration: 0.65 }, dealt);
};

/* ---------- radar ---------- */

/**
 * The grid opens from the middle, ring by ring, and the axes shoot out to it. The year's outline then unfurls with a
 * turn, a dot lands on each corner in order, and the corner it reaches furthest on lands last and says so.
 */
const radar: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const plate = one(figure, "[data-chart-plate]");
  const origin = plate?.dataset.origin;
  m.from(
    all(figure, "[data-chart-grid]").toReversed(),
    { scale: 0, autoAlpha: 0, svgOrigin: origin, duration: 0.75, ease: "back.out(1.6)", stagger: 0.11 },
    at,
  );
  m.from(
    all(figure, "[data-chart-axis]"),
    { scale: 0, svgOrigin: origin, duration: 0.55, ease: "power3.out", stagger: 0.05 },
    at + 0.2,
  );
  m.labelsIn(all(figure, "[data-chart-axis-label]"), at + 0.45, 0.4);
  m.from(
    one(figure, "[data-chart-everyone]"),
    { scale: 0, autoAlpha: 0, svgOrigin: origin, duration: 0.8, ease: EASE_OUT },
    at + 0.5,
  );
  m.from(plate, { scale: 0, rotation: -50, svgOrigin: origin, duration: 1.3, ease: "elastic.out(1, 0.7)" }, at + 0.65);
  m.from(plate, { autoAlpha: 0, duration: 0.2, ease: "none" }, at + 0.65);
  // Round the outline and back to the top: the strongest corner is the first in the markup and the last to land.
  const peaks = all(figure, "[data-chart-peak]");
  const order = [...peaks.slice(1), ...peaks.slice(0, 1)];
  m.from(
    order,
    { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3.4)", stagger: 0.08 },
    at + 1.3,
  );
  const landed = at + 1.3 + order.length * 0.08 + 0.3;
  m.land(one(figure, "[data-chart-point]"), landed);
  m.pillIn(figure, landed);
};

/* ---------- week by hour ---------- */

/**
 * The weekdays step in down the side, the empty week settles row by row, then the hours light up as a wave across
 * the day. A cell grows to its size and no further (past it, cells touch), and the busiest hour arrives last.
 */
const hours: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  m.from(
    all(figure, "[data-chart-head]"),
    { x: -18, autoAlpha: 0, duration: 0.45, ease: "back.out(2)", stagger: 0.05 },
    at,
  );
  // One tween a row: a week of empty hours is 168 cells, and a tween each is slow to build for no gain.
  for (let day = 0; day < 7; day += 1) {
    m.from(
      all(figure, `[data-chart-slot][data-day="${day}"]`),
      { y: 14, autoAlpha: 0, duration: 0.5, ease: EASE_OUT },
      at + 0.05 + day * 0.05,
    );
  }
  m.labelsIn(all(figure, "[data-chart-tick-label]"), at + 0.3, 0.6);
  const point = one(figure, "[data-chart-point]");
  const cell = { scale: 0.3, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.42, ease: "power3.out" };
  let last = at + 0.4;
  for (const piece of all(figure, "[data-chart-cell]")) {
    if (piece === point) continue;
    const start = at + 0.4 + Number(piece.dataset.hour ?? 0) * 0.038 + Number(piece.dataset.day ?? 0) * 0.022;
    m.from(piece, cell, start);
    last = Math.max(last, start + 0.3);
  }
  m.from(point, { ...cell, duration: 0.55 }, last);
  m.pillIn(figure, last + 0.15);
};

/* ---------- then and now ---------- */

/**
 * Row after row: the track is drawn, the ring drops where last year ended, and this year's dot leaves the ring and
 * travels to where the year ended, pulling the lit stretch out behind it while its number counts from last year's to
 * this one's. The change in percent lands once the dot has.
 */
const dumbbell: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  for (const [index, row] of all(figure, "[data-chart-row]").entries()) {
    const start = at + index * 0.16;
    const { track, origin } = row.dataset;
    const travel = Number(row.dataset.travel ?? 0);
    const was = Number(row.dataset.was ?? 0);
    const now = Number(row.dataset.now ?? 0);

    m.from(one(row, "[data-chart-row-label]"), { x: -24, autoAlpha: 0, duration: 0.5, ease: EASE_OUT }, start);
    m.from(one(row, "[data-chart-track]"), { scaleX: 0, svgOrigin: track, duration: 0.7, ease: "power3.out" }, start);
    m.from(
      one(row, "[data-chart-then]"),
      { scale: 0, autoAlpha: 0, svgOrigin: origin, duration: 0.5, ease: "back.out(2.6)" },
      start + 0.3,
    );

    const leave = start + 0.62;
    const trip = 1;
    m.from(
      one(row, "[data-chart-stretch]"),
      { scaleX: 0, svgOrigin: origin, duration: trip, ease: "power3.inOut" },
      leave,
    );
    // It appears on the ring, then goes: the move is the whole point, so it never fades in half way along.
    m.from(one(row, "[data-chart-now]"), { autoAlpha: 0, duration: 0.12, ease: "none" }, leave);
    m.from(one(row, "[data-chart-now]"), { x: travel, duration: trip, ease: "power3.inOut" }, leave);
    const figureText = one(row, "[data-chart-now-figure]");
    if (figureText) {
      const box = { value: was };
      tl.to(
        box,
        {
          value: now,
          duration: trip,
          ease: "power3.inOut",
          onUpdate: () => {
            setText(figureText, count(box.value));
          },
        },
        leave,
      );
    }
    // The landing: the dot swells once as it stops, and the change is said.
    m.land(one(row, "[data-chart-now-dot]"), leave + trip - 0.08);
    m.from(
      one(row, "[data-chart-delta]"),
      { x: -20, autoAlpha: 0, duration: 0.5, ease: "back.out(2)" },
      leave + trip - 0.05,
    );
  }
};

export const CHART_ENTRANCES: Partial<Record<string, Entrance>> = {
  spark,
  bars,
  gauge,
  days,
  pixels,
  wheel,
  clock,
  river,
  dots,
  bubbles,
  month,
  radar,
  hours,
  dumbbell,
};
