import { createRng } from "./rng";

/*
 * The loader's motion, as numbers. A beam crosses a blank year and back, the way the year scan's first pass does, and
 * every week it crosses lights up and fades behind it. The whole loop is worked out once and handed to the Web
 * Animations API: nothing runs per frame, so the wait costs the page nothing.
 */

/** One crossing, in seconds. The scan's own first pass takes the same. */
const SWEEP = 1.7;
/** The breath the beam takes at each edge before it turns. */
const REST = 0.22;
export const LOOP_SECONDS = 2 * (SWEEP + REST);

/** A week's light after the beam crosses it: up fast, held a moment, then a long tail. */
const ATTACK = 0.07;
const HOLD = 0.14;
const FADE = 0.66;
const GLOW = ATTACK + HOLD + FADE;
/** The flare right at the beam: the week's colour pushed past itself for a moment, gone before the tail is. */
const FLARE = 0.4;
/** Pushed which way: brighter on a dark frame, deeper on a light one, where brighter would only wash it out. */
const FLARE_GAIN = { dark: 0.75, light: -0.22 };
/** Where a week's light changes direction, as seconds after the beam. The tail is a curve, so it gets a few. */
const STOPS = [
  0,
  ATTACK,
  ATTACK + HOLD,
  ATTACK + FLARE,
  ...[0.2, 0.4, 0.6, 0.8].map((x) => ATTACK + HOLD + FADE * x),
  GLOW,
];

/** Sine in and out: the beam slows into each edge. `easeBack` is where along the crossing it reaches a place. */
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const easeBack = (place: number) => Math.acos(1 - 2 * place) / Math.PI;

function glow(since: number): number {
  if (since < 0 || since >= GLOW) return 0;
  if (since < ATTACK) return since / ATTACK;
  if (since < ATTACK + HOLD) return 1;
  const left = 1 - (since - ATTACK - HOLD) / FADE;
  return left * left;
}

function flare(since: number): number {
  if (since < 0 || since >= ATTACK + FLARE) return 0;
  return since < ATTACK ? since / ATTACK : 1 - (since - ATTACK) / FLARE;
}

const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * One week's light across the loop. `place` is where the week sits in the year, 0 (first) to 1 (last). The beam
 * crosses it twice, out and back, and a crossing late in one loop is still fading when the next loop starts.
 */
export function weekFrames(place: number, frame: "dark" | "light" = "dark"): Keyframe[] {
  const out = SWEEP * easeBack(place);
  const back = SWEEP + REST + SWEEP * (1 - easeBack(place));
  const crossings = [back - LOOP_SECONDS, out, back];
  const level = (of: (since: number) => number, at: number) =>
    Math.max(...crossings.map((crossing) => of(at - crossing)));

  const times = new Set([0, LOOP_SECONDS]);
  for (const crossing of crossings) {
    for (const stop of STOPS) {
      const at = round(crossing + stop);
      if (at > 0 && at < LOOP_SECONDS) times.add(at);
    }
  }
  return [...times]
    .toSorted((a, b) => a - b)
    .map((at) => ({
      offset: round(at / LOOP_SECONDS),
      opacity: round(level(glow, at)),
      filter: `brightness(${round(1 + FLARE_GAIN[frame] * level(flare, at))})`,
    }));
}

/** The beam itself, as a share of the distance between the first week and the last. */
export function beamFrames(steps = 24): Keyframe[] {
  const frames: Keyframe[] = [];
  for (const [start, forward] of [
    [0, true],
    [SWEEP + REST, false],
  ] as const) {
    for (let step = 0; step <= steps; step += 1) {
      const along = ease(step / steps);
      frames.push({
        offset: round((start + (SWEEP * step) / steps) / LOOP_SECONDS),
        transform: `translateX(${round((forward ? along : 1 - along) * 100)}%)`,
      });
    }
  }
  frames.push({ offset: 1, transform: "translateX(0%)" });
  return frames;
}

const WEEKS = 53;
/** Weekends are quieter, the way most years are. */
const WEEKDAY_SHARE = [0.3, 1, 1, 1, 1, 0.9, 0.35];
const LEVEL_FLOORS = [0.2, 0.42, 0.64, 0.86];

/**
 * A year nobody has, for the beam to light: busy stretches and thin ones, quiet weekends. Seeded by who the wait is
 * for, so one person's loader always shows the same year.
 */
export function placeholderYear(seed: string): number[][] {
  const rng = createRng(`${seed}/loading`);
  let energy = 0.55;
  return Array.from({ length: WEEKS }, () => {
    energy = Math.min(1, Math.max(0.12, energy + (rng.next() - 0.5) * 0.5));
    return WEEKDAY_SHARE.map((share) => {
      const value = energy * share * (0.45 + rng.next() * 0.9);
      return LEVEL_FLOORS.filter((floor) => value >= floor).length;
    });
  });
}
