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

    /** The one thing the chart is about lands: it swells once and settles, like something set down. */
    land(target: Piece | null, at: number, origin?: string) {
      if (!target) return;
      tl.to(
        target,
        {
          keyframes: [
            { scale: 1.22, duration: 0.16, ease: "power2.out" },
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

/** The dark dial fans open from the left, then the share charges up it segment by segment, faster as it goes. */
const gauge: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const slots = all(figure, "[data-chart-slot]");
  const lit = all(figure, "[data-chart-lit]");
  const origin = slots[0]?.dataset.origin;
  m.from(
    slots,
    { scale: 0.7, autoAlpha: 0, svgOrigin: origin, duration: 0.55, ease: "back.out(1.8)", stagger: { amount: 0.5 } },
    at,
  );
  const charge = 0.35 + lit.length * 0.06;
  m.from(
    lit,
    {
      scale: 0.72,
      autoAlpha: 0,
      svgOrigin: origin,
      duration: 0.4,
      ease: "back.out(2.6)",
      stagger: { amount: charge, ease: "power1.in" },
    },
    at + 0.55,
  );
  m.land(one(figure, "[data-chart-point]"), at + 0.55 + charge + 0.3, origin);
};

/* ---------- days ---------- */

/** Dealt like cards: each day's tile tips down into its place, its name follows, and the days that count swell. */
const days: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const tiles = all(figure, ".wr-chart-day");
  const step = Math.min(0.09, 0.6 / Math.max(1, tiles.length));
  for (const [index, tile] of tiles.entries()) {
    const start = at + index * step;
    m.from(
      one(tile, "i"),
      {
        rotationX: -95,
        y: -28,
        autoAlpha: 0,
        transformPerspective: 700,
        transformOrigin: "50% 0%",
        duration: 0.75,
        ease: "back.out(1.6)",
      },
      start,
    );
    m.from(all(tile, "b, small"), { y: 18, autoAlpha: 0, duration: 0.45, ease: EASE_OUT, stagger: 0.07 }, start + 0.32);
  }
  const marked = all(figure, ".wr-chart-day[data-marked] i");
  if (marked.length > 0) {
    tl.to(
      marked,
      {
        keyframes: [
          { scale: 1.14, duration: 0.18, ease: "power2.out" },
          { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" },
        ],
        stagger: 0.14,
      },
      at + tiles.length * step + 0.75,
    );
  }
};

/* ---------- pixel area ---------- */

/** The empty grid rolls in from the left, then every column stacks its lit cells up from the floor, as one wave. */
const pixels: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  m.from(
    all(figure, "[data-chart-slots]"),
    { y: 22, autoAlpha: 0, duration: 0.5, ease: EASE_OUT, stagger: { amount: 0.55 } },
    at,
  );
  let last = at;
  for (const column of all(figure, "[data-chart-col]")) {
    const start = at + 0.35 + Number(column.dataset.column ?? 0) * 0.04;
    const cells = [...column.children] as Piece[];
    m.from(
      cells,
      { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.42, ease: "back.out(2.8)", stagger: 0.035 },
      start,
    );
    if (one(column, "[data-chart-point]")) last = start + cells.length * 0.035 + 0.3;
  }
  m.land(one(figure, "[data-chart-point]"), last);
  m.pillIn(figure, last);
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

/** The empty face goes round from midnight, then each hour grows out of the hub in the same order, like a hand. */
const clock: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const hub = one(figure, "[data-chart-hub]");
  const origin = hub?.dataset.origin;
  m.from(hub, { scale: 0, autoAlpha: 0, svgOrigin: origin, duration: 0.6, ease: "back.out(2.2)" }, at);
  m.from(
    all(figure, "[data-chart-slot]"),
    { scale: 0.5, autoAlpha: 0, svgOrigin: origin, duration: 0.5, ease: "back.out(1.6)", stagger: { amount: 0.6 } },
    at + 0.05,
  );
  m.labelsIn(all(figure, "[data-chart-tick-label]"), at + 0.3);
  let last = at;
  for (const hour of all(figure, "[data-chart-hour]")) {
    const start = at + 0.45 + Number(hour.dataset.chartHour ?? 0) * 0.045;
    m.from(hour, { scale: 0.45, svgOrigin: origin, duration: 0.65, ease: "back.out(2)" }, start);
    m.from(hour, { autoAlpha: 0, duration: 0.18, ease: "none" }, start);
    last = Math.max(last, start + 0.5);
  }
  m.land(one(figure, "[data-chart-point]"), last, origin);
  m.pillIn(figure, last + 0.05);
};

/* ---------- river ---------- */

/**
 * The year flows in from the left as thin threads that swell into their bands as they arrive. The months come up
 * under it as it passes, the names line up below, and each share counts up to where the year ended.
 */
const river: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  const flow = one(figure, "[data-chart-flow]");
  if (flow) {
    tl.fromTo(
      flow,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "power2.inOut" },
      at,
    );
  }
  const streams = all(figure, "[data-chart-stream]");
  m.from(
    streams,
    { scaleY: 0.08, svgOrigin: streams[0]?.dataset.origin, duration: 1.4, ease: "elastic.out(1, 0.7)", stagger: 0.09 },
    at + 0.35,
  );
  m.labelsIn(all(figure, "[data-chart-tick-label]"), at + 0.25, 1.1);
  const point = one(figure, "[data-chart-point]");
  m.from(point, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(3)" }, at + 1.5);
  m.pillIn(figure, at + 1.6);
  for (const [index, key] of all(figure, "[data-chart-key]").entries()) {
    const start = at + 1.2 + index * 0.12;
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
      ease: "back.out(3.4)",
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

/** The weekdays drop in along the top, then the month is dealt out from its first corner as one diagonal wave. */
const month: Entrance = (tl, figure, at) => {
  const m = movesOn(tl);
  m.from(
    all(figure, "[data-chart-head]"),
    { y: -18, autoAlpha: 0, duration: 0.45, ease: "back.out(2)", stagger: 0.045 },
    at,
  );
  const cells = all(figure, "[data-chart-cell]");
  const rows = Math.max(1, Math.round(cells.length / 7));
  m.from(
    cells,
    {
      scale: 0.2,
      autoAlpha: 0,
      rotation: -8,
      transformOrigin: "50% 50%",
      duration: 0.6,
      ease: "back.out(2.2)",
      stagger: { grid: [rows, 7], from: "start", amount: 0.9 },
    },
    at + 0.2,
  );
  m.land(one(figure, "[data-chart-point]"), at + 0.2 + 0.9 + 0.45);
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

/** The weekdays step in down the side, the empty week settles row by row, then the hours light up as a wave across the day. */
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
  let last = at;
  for (const cell of all(figure, "[data-chart-cell]")) {
    const start = at + 0.4 + Number(cell.dataset.hour ?? 0) * 0.038 + Number(cell.dataset.day ?? 0) * 0.022;
    m.from(cell, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.8)" }, start);
    last = Math.max(last, start + 0.35);
  }
  m.land(one(figure, "[data-chart-point]"), last);
  m.pillIn(figure, last);
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
