/*
 * Where the ink of a big number really is. The stage sets its figures tabular, so every digit takes the same room and
 * a count does not shiver while it climbs. The price is blank space inside that room: a "1" stands in a slot as wide
 * as an "8" with a ninth of an em empty before it and nearly a fifth after. A number centred or lined up by its box
 * is then off by eye: "190" sat 12px right of its tile's middle, "11,999" began 34px right of the line above it.
 *
 * Each entry is a character's advance and the blank on its left and right, in em. Measured off the stage's own type
 * (Inter 800, "ss01" and "cv11", tabular figures) by scanning a 400px glyph for its first and last inked column. A
 * character missing here is treated as filling its room, which leaves it where the box puts it.
 */
const GLYPHS: Record<string, readonly [advance: number, left: number, right: number]> = {
  "0": [0.661, 0.038, 0.036],
  "1": [0.661, 0.115, 0.186],
  "2": [0.661, 0.06, 0.064],
  "3": [0.661, 0.045, 0.051],
  "4": [0.661, 0.033, 0.029],
  "5": [0.661, 0.068, 0.039],
  "6": [0.661, 0.053, 0.041],
  "7": [0.661, 0.055, 0.066],
  "8": [0.661, 0.038, 0.039],
  "9": [0.661, 0.04, 0.051],
  ",": [0.25, 0.018, 0.047],
  ".": [0.25, 0.038, 0.037],
  K: [0.67, 0.055, 0.003],
  M: [0.871, 0.055, 0.056],
  B: [0.651, 0.055, 0.024],
  T: [0.608, 0.023, 0.023],
  "%": [0.918, 0.04, 0.04],
};
/** Any other character: an average one that fills its room. */
const UNKNOWN = [0.661, 0, 0] as const;

/** The tracking the big numbers are set with (`.wr-mega`, `.wr-big-cell strong`), in em. */
const TRACKING = -0.07;

export interface NumberInk {
  /** How far inside its box the ink starts: what a number lined up on the left moves back by. */
  inset: number;
  /** How wide the ink is: what has to fit the column. */
  width: number;
  /** How far a number centred by its box has to move for its ink to be centred. Negative is to the left. */
  nudge: number;
}

/** A count as the counters end up showing it: grouped, with its suffix. */
export const countText = (value: number, suffix = "") => value.toLocaleString("en-US") + suffix;

const round = (value: number) => Math.round(value * 1000) / 1000;

/** The ink of `text` set as a big number, in em of its own font size. */
export function numberInk(text: string): NumberInk {
  const glyphs = [...text].map((char) => GLYPHS[char] ?? UNKNOWN);
  const first = glyphs[0];
  const last = glyphs.at(-1);
  if (!first || !last) return { inset: 0, width: 0, nudge: 0 };
  const advances = glyphs.reduce((sum, [advance]) => sum + advance, 0);
  const inset = first[1];
  // Tracking comes after every character, the last one too, so the box ends one tracking short of the last advance.
  const width = advances + (glyphs.length - 1) * TRACKING - inset - last[2];
  return { inset: round(inset), width: round(width), nudge: round((TRACKING - inset + last[2]) / 2) };
}
