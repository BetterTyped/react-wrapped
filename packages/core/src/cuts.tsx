import type { ReactNode } from "react";

import { createRng } from "./rng";
import { type BuiltInTransition, WRAPPED_TRANSITIONS, type WrappedFormat, type WrappedTransition } from "./types";

/*
 * Cuts: how one scene hands over to the next. Most of them are covers: something in the palette's own colors takes the
 * whole frame, the old scene goes out behind it, and it clears onto the next one. A cover is never a grid of tiles
 * (those were built, and retired): it is a few big shapes, three deep, so its edge is a band of the theme's colors.
 */

/**
 * The way out of a scene that the cut's luck picked. It hangs on the seed and the scene alone, so a scene keeps its
 * cut when the scenes around it are moved, switched off or found later.
 */
export function luckyCut(seed: string, sceneKey: string): WrappedTransition {
  const luck = createRng(seed).fork("motion").fork(`${sceneKey}/exit`);
  const builtIn = luck.pick(WRAPPED_TRANSITIONS);
  const own = [...CUSTOM.values()].filter((spec) => spec.lucky).map((spec) => spec.id);
  if (own.length === 0) return builtIn;
  // Yours get their fair share of scenes from a throw of their own, so every scene they do not win keeps the
  // transition it had before you added them. Adding one never reshuffles a whole video.
  const joined = luck.fork("own");
  return joined.next() < own.length / (WRAPPED_TRANSITIONS.length + own.length) ? joined.pick(own) : builtIn;
}

export const TRANSITION_LABELS: Record<BuiltInTransition, string> = {
  layers: "Layers",
  slash: "Slash",
  arrow: "Arrow",
  wave: "Wave",
  drip: "Drip",
  bloom: "Bloom",
  pulse: "Pulse",
  blink: "Blink",
  spin: "Spin",
  fan: "Fan",
  doors: "Doors",
  brush: "Brush",
  scan: "Scan",
  flash: "Flash",
  iris: "Iris",
  wipe: "Wipe",
  lift: "Lift",
  drop: "Drop",
  zoom: "Zoom",
};

/* ---------- transitions of your own ---------- */

/** What a transition is handed when it is put on the timeline. */
export interface TransitionContext {
  /** The scene that is leaving. The transition has to take it out of sight. */
  root: HTMLElement;
  /** What the transition drew for itself above the scenes (its `cover`), out of sight until it shows it. */
  group: HTMLElement | null;
}

export interface TransitionSpec {
  /** What a config names it by: `cuts: { total: "curtain" }`. Lower case, no spaces, not a built-in one's. */
  id: string;
  /** What the scene editor calls it. */
  label: string;
  /**
   * Markup the transition draws above the scenes: three `<i />` for the layers of a cover, an SVG, anything. It is
   * rendered once into every stage, hidden, inside an element with `data-cut` set to the id.
   */
  cover?: ReactNode | ((format: WrappedFormat) => ReactNode);
  /**
   * Puts the transition on the timeline. Add the label `HANDOVER` where the next scene should start; without it the
   * next scene starts a beat before this ends. Only add tweens: the engine seeks and reverses this timeline.
   */
  play: (tl: gsap.core.Timeline, context: TransitionContext) => void;
  /** Lets the video's seed pick it for scenes nobody chose a transition for. Off unless asked. */
  lucky?: boolean;
}

const CUSTOM = new Map<string, TransitionSpec>();

/**
 * Adds a transition of your own. Call it once, where your app starts, before a stage is on the page: a stage draws
 * every transition's cover when it mounts.
 */
export function defineTransition(spec: TransitionSpec): TransitionSpec {
  if ((WRAPPED_TRANSITIONS as readonly string[]).includes(spec.id)) {
    throw new Error(`"${spec.id}" is a built-in transition. Give yours another id.`);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(spec.id)) {
    throw new Error(
      `A transition id is lower case letters, digits and hyphens, starting with a letter. Got "${spec.id}".`,
    );
  }
  CUSTOM.set(spec.id, spec);
  return spec;
}

/** Every transition a scene can be given: the built-in ones, then yours. */
export function transitionList(): { id: WrappedTransition; label: string }[] {
  return [
    ...WRAPPED_TRANSITIONS.map((id) => ({ id, label: TRANSITION_LABELS[id] })),
    ...[...CUSTOM.values()].map((spec) => ({ id: spec.id, label: spec.label })),
  ];
}

export const isTransition = (id: string): id is WrappedTransition =>
  (WRAPPED_TRANSITIONS as readonly string[]).includes(id) || CUSTOM.has(id);

/**
 * The label a cut puts where the next scene should begin: under a closed cover, or as the last of the old scene
 * leaves. A cut without one (a plain fade) hands over a beat before it ends.
 */
export const HANDOVER = "handover";

/* ---------- shapes ---------- */

type Profile = (x: number) => number;

const EDGE_POINTS = 120;
const percent = (value: number) => `${Math.round(value * 100) / 100}%`;

/**
 * A band taller than the frame whose top and bottom edges follow a profile, as a clip-path. `margin` is how much of
 * the band's height each edge may use (in percent); between the two margins the band is solid, and that part is
 * exactly the frame when the band is at rest. A profile answers how far into its margin the edge reaches, 0 to 1.
 */
function bandShape(margin: number, top: Profile, bottom: Profile): string {
  const steps = Array.from({ length: EDGE_POINTS + 1 }, (_unused, index) => index / EDGE_POINTS);
  const along = (edge: (x: number) => number) => steps.map((x) => `${percent(x * 100)} ${percent(edge(x))}`);
  return `polygon(${[
    ...along((x) => margin * (1 - top(x))),
    ...along((x) => 100 - margin * (1 - bottom(x))).toReversed(),
  ].join(",")})`;
}

const swell =
  (phase: number, waves = 1.25): Profile =>
  (x) =>
    0.5 + 0.5 * Math.sin(2 * Math.PI * (waves * x + phase));

/**
 * Paint running down: round-ended fingers of uneven length with a small arch between each pair, the same on every
 * replay and different on every layer. Both pieces meet upright, so the edge is one smooth line and never a row of
 * teeth (a plain wave with tall peaks was exactly that).
 */
const drips =
  (layer: number, across: number): Profile =>
  (x) => {
    const at = x * across + layer * 0.37;
    const drip = Math.floor(at);
    const reach = 0.36 + 0.64 * ((((drip + layer * 3) * 7919) % 13) / 12);
    // -1 to 1 across the finger (the middle 60% of its slot), beyond that across the arch to the next one.
    const finger = (at - drip - 0.5) / 0.3;
    if (Math.abs(finger) < 1) return 0.14 + (reach - 0.14) * (1 - Math.abs(finger) ** 2.6) ** (1 / 2.6);
    const arch = (Math.abs(finger) - 1) / (0.2 / 0.3) - 1;
    return 0.14 - 0.1 * Math.sqrt(1 - Math.min(1, arch * arch));
  };

const LAYERS = [0, 1, 2] as const;
// The bands' margins as a share of their own height: the stylesheet makes them 12% and 24% taller than the frame.
const WAVE_SHAPES = LAYERS.map((layer) => bandShape((12 / 124) * 100, swell(layer / 3), swell(layer / 3 + 0.5)));
/** Fingers stay about as wide in every format, so a wide frame gets more of them, not fatter ones. */
const dripShapes = (across: number) =>
  LAYERS.map((layer) => bandShape((24 / 148) * 100, (x) => 0.35 * swell(layer / 3, 1)(x), drips(layer, across)));
const DRIP_SHAPES: Record<WrappedFormat, readonly string[]> = {
  story: dripShapes(3.6),
  square: dripShapes(3.6),
  landscape: dripShapes(6.4),
};

/** One stroke of a wide brush, back and forth down the frame. Its turns sit outside the frame. */
const BRUSH_PATH = "M -25 4 L 125 14 L -25 33 L 125 43 L -25 62 L 125 72 L -25 91 L 125 101";
const BRUSH_WIDTHS = [48, 42, 36] as const;
/** What the stroke's length is called, whatever it measures. A thousand, because a dash offset moves in whole units. */
const BRUSH_LENGTH = 1000;

/** The shapes panel cuts are made of: three plain layers each, shaped and stacked by the stylesheet. */
const PANEL_CUTS = [
  "layers",
  "slash",
  "arrow",
  "wave",
  "drip",
  "bloom",
  "pulse",
  "blink",
  "spin",
  "fan",
  "doors",
] as const;

/**
 * Everything the cover cuts draw with, one group per cut, all out of sight until a cut shows its own. A group per cut
 * means no cut can leave a clip or a mask behind on a shape another cut is about to use.
 */
export function StageCover({ format }: { format: WrappedFormat }) {
  const shapes: Partial<Record<(typeof PANEL_CUTS)[number], readonly string[]>> = {
    wave: WAVE_SHAPES,
    drip: DRIP_SHAPES[format],
  };
  return (
    <div className="wr-cover" data-wr-cover aria-hidden>
      {PANEL_CUTS.map((style) => (
        <div key={style} data-cut={style}>
          {LAYERS.map((layer) => (
            <i key={layer} style={{ clipPath: shapes[style]?.[layer] }} />
          ))}
        </div>
      ))}
      <svg data-cut="brush" viewBox="0 0 100 100" preserveAspectRatio="none">
        {BRUSH_WIDTHS.map((width) => (
          <path key={width} d={BRUSH_PATH} pathLength={BRUSH_LENGTH} strokeWidth={width} />
        ))}
      </svg>
      <div data-cut="scan">
        <i />
      </div>
      <div data-cut="flash">
        <i />
      </div>
      {[...CUSTOM.values()].map((spec) =>
        spec.cover ? (
          <div key={spec.id} data-cut={spec.id} data-cut-custom>
            {typeof spec.cover === "function" ? spec.cover(format) : spec.cover}
          </div>
        ) : null,
      )}
    </div>
  );
}

/* ---------- covers ---------- */

type CoverStyle = (typeof PANEL_CUTS)[number] | "brush" | "scan" | "flash";

/** The three states of a cover's layers. `coverCut` plays through them. */
export interface CoverMove {
  /** Where a layer waits out of sight. Also puts back anything the clearing changed the last time round. */
  hidden: gsap.TweenVars;
  /** The frame is covered. */
  covering: gsap.TweenVars;
  /** What the clearing starts from, when that is not where the covering ended (a disc leaving by another corner). */
  reopen?: gsap.TweenVars;
  /** The frame is clear again. */
  cleared: gsap.TweenVars;
  duration?: number;
  /** One ease for the way in, one for the way out. The default never rests: a cover passes through. */
  ease?: readonly [string, string];
}

const circle = (radius: number, at: string) => `circle(${radius}% at ${at})`;

/** Two doors as one shape, each shut over this many percent of the frame from its own side. */
const doors = (shut: number) =>
  `polygon(0% 0%, ${shut}% 0%, ${shut}% 100%, 0% 100%, 0% 0%, 100% 0%, 100% 100%, ${100 - shut}% 100%, ${100 - shut}% 0%, 100% 0%)`;

const COVER_MOVES: Record<CoverStyle, CoverMove> = {
  // Flat bands rising through the frame.
  layers: { hidden: { yPercent: 101 }, covering: { yPercent: 0 }, cleared: { yPercent: -101 } },
  // Slanted bands crossing it.
  slash: { hidden: { xPercent: -100 }, covering: { xPercent: 0 }, cleared: { xPercent: 100 } },
  // The same crossing, led by a point.
  arrow: { hidden: { xPercent: -100 }, covering: { xPercent: 0 }, cleared: { xPercent: 100 } },
  // Water coming up: three swells out of step, drifting sideways as they climb.
  wave: {
    hidden: { yPercent: 100, xPercent: -4 },
    covering: { yPercent: 0, xPercent: 0 },
    cleared: { yPercent: -100, xPercent: 4 },
    duration: 0.6,
  },
  // Paint running down from the top.
  drip: { hidden: { yPercent: -100 }, covering: { yPercent: 0 }, cleared: { yPercent: 100 }, duration: 0.6 },
  // Discs growing out of one corner and leaving into the opposite one.
  bloom: {
    hidden: { clipPath: circle(0, "0% 100%") },
    covering: { clipPath: circle(145, "0% 100%") },
    reopen: { clipPath: circle(145, "100% 0%") },
    cleared: { clipPath: circle(0, "100% 0%") },
    duration: 0.58,
  },
  // Rings out of the middle, then the middle opens.
  pulse: {
    hidden: { clipPath: circle(0, "50% 50%"), "--wr-hole": "-1%" },
    covering: { clipPath: circle(72, "50% 50%") },
    reopen: { "--wr-hole": "-1%" },
    cleared: { "--wr-hole": "101%" },
  },
  // An eye shutting and opening.
  blink: {
    hidden: { "--wr-lid": "66%" },
    covering: { "--wr-lid": "0.01%" },
    cleared: { "--wr-lid": "66%" },
    duration: 0.44,
  },
  // A clock hand going once round, and round again to clear.
  spin: {
    hidden: { "--wr-from": "0deg", "--wr-to": "0deg" },
    covering: { "--wr-to": "360deg" },
    reopen: { "--wr-from": "0deg" },
    cleared: { "--wr-from": "360deg" },
    duration: 0.6,
  },
  // The same hand hinged at the bottom, like a wiper.
  fan: {
    hidden: { "--wr-from": "0deg", "--wr-to": "0deg" },
    covering: { "--wr-to": "180deg" },
    reopen: { "--wr-from": "0deg" },
    cleared: { "--wr-from": "180deg" },
  },
  doors: {
    hidden: { clipPath: doors(0) },
    covering: { clipPath: doors(50.5) },
    cleared: { clipPath: doors(0) },
    ease: ["power3.inOut", "power3.inOut"],
  },
  // A wide brush paints the frame over, then the paint leaves from where the stroke began.
  brush: {
    hidden: { strokeDashoffset: BRUSH_LENGTH },
    covering: { strokeDashoffset: 0 },
    cleared: { strokeDashoffset: -BRUSH_LENGTH },
    duration: 0.64,
    ease: ["power2.inOut", "power2.inOut"],
  },
  // The year scan's beam: it crosses the frame leaving it blank, and doubles back over the next scene.
  scan: {
    hidden: { xPercent: -106 },
    covering: { xPercent: 0 },
    cleared: { xPercent: -106 },
    duration: 0.62,
    ease: ["power2.inOut", "power2.inOut"],
  },
  // Light swelling out of the middle until it is all there is, then thinning out over the next scene.
  flash: {
    hidden: { "--wr-core": "-50%", opacity: 1 },
    covering: { "--wr-core": "100%" },
    reopen: { opacity: 1 },
    cleared: { opacity: 0 },
    duration: 0.55,
  },
};

/** Layers follow each other by this much, so the edge of a cover is a band of colors and never one hard line. */
const LAYER_GAP = 0.085;

/**
 * Plays a cover: its layers come in one after another until the frame is covered, the old scene is taken out under
 * them, and they clear in reverse order onto the next one. Every built-in cover is this with different states; a
 * transition of your own can use it from its `play`.
 */
export function coverCut(
  tl: gsap.core.Timeline,
  { root, group }: { root: HTMLElement; group: Element },
  move: CoverMove,
) {
  const layers = [...group.children];
  const { duration = 0.5, ease = ["power2.in", "power2.out"] } = move;

  tl.set(group, { autoAlpha: 1 });
  // Every layer out of sight before the first one moves: the later ones wait their turn, and must not wait in view.
  tl.set(layers, move.hidden);
  tl.fromTo(layers, move.hidden, {
    ...move.covering,
    duration,
    ease: ease[0],
    stagger: LAYER_GAP,
    immediateRender: false,
  });
  // The next scene starts here, under the closed cover, so the cover clears onto it and never onto an empty frame.
  tl.addLabel(HANDOVER, "-=0.08");
  tl.set(root, { autoAlpha: 0 });
  // The top layer goes first, so the ones under it show as the trailing edge.
  tl.fromTo(layers, move.reopen ?? move.covering, {
    ...move.cleared,
    duration,
    ease: ease[1],
    stagger: { each: LAYER_GAP, from: "end" },
    immediateRender: false,
  });
  tl.set(group, { autoAlpha: 0 });
}

/**
 * Takes a scene out. The style is chosen per cut by the engine's seeded source, so two videos rarely cut the same
 * way. The plain ones move the scene itself; the rest are covers, and the next scene comes in under them.
 */
export function exitScene(
  tl: gsap.core.Timeline,
  root: HTMLElement,
  { style, cover }: { style: WrappedTransition; cover: HTMLElement | null },
) {
  const own = CUSTOM.get(style);
  if (own) {
    own.play(tl, { root, group: cover?.querySelector<HTMLElement>(`[data-cut="${own.id}"]`) ?? null });
    return;
  }
  switch (style) {
    case "lift":
      tl.to(root, { autoAlpha: 0, y: -60, scale: 0.97, filter: "blur(14px)", duration: 0.55, ease: "power3.in" });
      // The old scene is all but gone before the next one starts: two headlines never sit on top of each other.
      tl.addLabel(HANDOVER, "-=0.07");
      return;
    case "drop":
      tl.to(root, { autoAlpha: 0, y: 90, rotate: 1.5, filter: "blur(8px)", duration: 0.55, ease: "power3.in" });
      tl.addLabel(HANDOVER, "-=0.07");
      return;
    case "zoom":
      tl.to(root, { autoAlpha: 0, scale: 1.14, filter: "blur(12px)", duration: 0.6, ease: "power2.in" });
      tl.addLabel(HANDOVER, "-=0.07");
      return;
    case "wipe":
      tl.fromTo(
        root,
        { clipPath: "inset(0% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 100% 0%)", duration: 0.6, ease: "power3.inOut" },
      );
      // The next scene comes in as the last of this one is wiped away, not on top of it.
      tl.addLabel(HANDOVER, "-=0.18");
      tl.set(root, { autoAlpha: 0, clipPath: "none" });
      return;
    case "iris":
      tl.fromTo(
        root,
        { clipPath: "circle(75% at 50% 50%)" },
        { clipPath: "circle(0% at 50% 50%)", duration: 0.65, ease: "power3.inOut", immediateRender: false },
      );
      tl.addLabel(HANDOVER, "-=0.18");
      tl.set(root, { autoAlpha: 0, clipPath: "none" });
      return;
    default: {
      const group = cover?.querySelector(`[data-cut="${style}"]`);
      if (!group) {
        tl.to(root, { autoAlpha: 0, duration: 0.4 });
        return;
      }
      coverCut(tl, { root, group }, COVER_MOVES[style as CoverStyle]);
    }
  }
}
