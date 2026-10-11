/**
 * A small seeded random source. Every choice a video makes (which moments,
 * which layout, which line, which transition) goes through one of these, so a
 * shared link replays exactly the video its owner saw, and the MP4 renderer
 * frames the same one.
 */
export interface Rng {
  /** A float in [0, 1). */
  next: () => number;
  /** An integer in [0, max). */
  int: (max: number) => number;
  /** One item of a non-empty list. */
  pick: <T>(items: readonly T[]) => T;
  /** A new source for a sub-decision, so adding a choice in one scene does not reshuffle the others. */
  fork: (label: string) => Rng;
}

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function createRng(seed: string): Rng {
  let state = hash(seed);
  // mulberry32: fast, small, and good enough for picking layouts.
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number) => Math.floor(next() * max);
  return {
    next,
    int,
    pick: (items) => items[int(items.length)],
    fork: (label) => createRng(`${seed}/${label}`),
  };
}
