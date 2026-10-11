import type { Rarity } from "./rarity";

/*
 * The small pieces more than one package draws with: the year as a grid of cells, pixel art, and what a token
 * carries. Scenes use them, the scan uses them, the share card uses them.
 */

/** A year as GitHub draws it: columns of seven, starting on a Sunday. Levels are 0 to 4, -1 is an empty slot. */
export interface CalendarLevels {
  levels: readonly number[];
  /** Empty slots before the first day, so the first column lines up with its weekday. */
  lead: number;
  /** Month labels across the top, when the scene wants them. */
  months?: readonly string[];
}

export function Calendar({ calendar, months = false }: { calendar: CalendarLevels; months?: boolean }) {
  return (
    <div className="wr-frame">
      {months && calendar.months ? (
        <div className="wr-months">
          {calendar.months.map((month, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- a month name repeats across a year boundary
            <span key={`${month}-${index}`}>{month}</span>
          ))}
        </div>
      ) : null}
      <div className="wr-graph">
        {Array.from({ length: calendar.lead }, (_unused, index) => (
          <i key={`lead-${index}`} className="wr-cell" data-l="-1" />
        ))}
        {calendar.levels.map((level, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- one cell per day, positional
          <i key={index} className="wr-cell" data-l={level} />
        ))}
      </div>
    </div>
  );
}

/** 9x9 pixel art: "x" lit, "o" half lit, "." off. */
export type PixelArt = readonly string[];

/** Something a person pulled, as the share card shows it. */
export interface WrappedToken {
  name: string;
  /** "Coder type", "Lucky drop". */
  kind: string;
  rarity: Rarity;
  art: PixelArt;
}

export function Pixel({ art, className = "wr-pixel" }: { art: PixelArt; className?: string }) {
  return (
    <div className={className}>
      {art
        .join("")
        .split("")
        .map((char, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- a fixed 9x9 grid
          <i key={index} data-on={char === "x" ? 2 : char === "o" ? 1 : 0} />
        ))}
    </div>
  );
}

export const PIXEL_ART = {
  mountain: [
    "....x....",
    "...xxx...",
    "..xxoxx..",
    "..xooox..",
    ".xxoooxx.",
    ".xooooox.",
    "xxoooooxx",
    "xooooooox",
    "xxxxxxxxx",
  ],
  bolt: [
    ".....xx..",
    "....xx...",
    "...xx....",
    "..xxxxx..",
    "....xx...",
    "...xx....",
    "..xx.....",
    ".xx......",
    ".........",
  ],
  flame: [
    "....x....",
    "...xx....",
    "...xxx...",
    "..xxoxx..",
    "..xooox..",
    ".xxooxxx.",
    ".xoooox..",
    "..xooxx..",
    "...xxx...",
  ],
  globe: [
    "..xxxxx..",
    ".xooxoox.",
    "xoooxooox",
    "xxxxxxxxx",
    "xoooxooox",
    "xxxxxxxxx",
    "xoooxooox",
    ".xooxoox.",
    "..xxxxx..",
  ],
  check: [
    ".........",
    "........x",
    ".......xx",
    "x.....xx.",
    "xx...xx..",
    ".xx.xx...",
    "..xxx....",
    "...x.....",
    ".........",
  ],
  tree: [
    "....x....",
    "...xxx...",
    "..xoxox..",
    "...xxx...",
    "..xxoxx..",
    ".xoxxxox.",
    "xxxxoxxxx",
    "....o....",
    "...ooo...",
  ],
  palm: [
    "..xx.xx..",
    ".x..x..x.",
    "....o....",
    "....o....",
    "....o....",
    "...o.....",
    "...o.....",
    "ooooooooo",
    ".........",
  ],
  eye: [
    ".........",
    "..xxxxx..",
    ".x.....x.",
    "x..ooo..x",
    "x..oxo..x",
    "x..ooo..x",
    ".x.....x.",
    "..xxxxx..",
    ".........",
  ],
  lock: [
    "..xxxxx..",
    ".x.....x.",
    ".x.....x.",
    "xxxxxxxxx",
    "xooooooox",
    "xoooxooox",
    "xoooxooox",
    "xooooooox",
    "xxxxxxxxx",
  ],
  rocket: [
    "....x....",
    "...xxx...",
    "...xox...",
    "...xxx...",
    "..xxxxx..",
    ".x.xxx.x.",
    "...ooo...",
    "....o....",
    "...o.o...",
  ],
  calendar: [
    "x.x...x.x",
    "xxxxxxxxx",
    "x.......x",
    "x.o.o.o.x",
    "x.......x",
    "x.o.x.o.x",
    "x.......x",
    "xxxxxxxxx",
    ".........",
  ],
  moon: [
    "...xxx...",
    ".xxx.....",
    ".xx......",
    "xx.......",
    "xx.......",
    "xx.......",
    ".xx....x.",
    ".xxxxxxx.",
    "...xxx...",
  ],
  duck: [
    "...xx....",
    "..xxxx...",
    "..xoxxoo.",
    "..xxxx...",
    ".xxxxxxx.",
    "xxxxxxxxx",
    "xxxxxxxxx",
    ".xxxxxxx.",
    "..ooooo..",
  ],
  plant: [
    "...x.x...",
    "..xxoxx..",
    ".xo.x.ox.",
    "..x.x.x..",
    "....x....",
    "..ooooo..",
    "..ooooo..",
    "...ooo...",
    "...ooo...",
  ],
  mug: [
    ".x.x.x...",
    "..x.x.x..",
    ".........",
    "xxxxxxx..",
    "xoooooxxx",
    "xoooooxox",
    "xoooooxxx",
    "xoooooo..",
    ".xxxxx...",
  ],
  cat: [
    "x.....x..",
    "xx...xx..",
    "xxxxxxx..",
    "xoxxxox..",
    "xxxoxxx..",
    ".xxxxx...",
    "..xxxxx.x",
    "..xxxxxx.",
    "..x.x.x..",
  ],
  owl: [
    ".x.....x.",
    ".xxxxxxx.",
    "xooxxxoox",
    "xxoxxxoxx",
    ".xxxoxxx.",
    ".xoxxxox.",
    ".xxoooxx.",
    "..xxxxx..",
    "..x...x..",
  ],
  hedgehog: [
    "..x.x.x..",
    ".xxxxxxx.",
    "xxxxxxxxx",
    "xxxxxxxoo",
    "xxxxxxoxo",
    ".xxxxxooo",
    "..x...x..",
    ".........",
    ".........",
  ],
  octopus: [
    "..xxxxx..",
    ".xxxxxxx.",
    ".xoxxxox.",
    ".xxxxxxx.",
    "..xxxxx..",
    ".x.x.x.x.",
    "x.x.x.x.x",
    ".x.x.x.x.",
    ".........",
  ],
  fox: [
    "x......x.",
    "xx....xx.",
    "xxxxxxxx.",
    "xoxxxxox.",
    ".xxooxx..",
    "..xxxx...",
    "...xx..xx",
    "..xxxxxx.",
    "..x..x...",
  ],
  dragon: [
    "x.......x",
    "xx.xxx.xx",
    ".xxxxxxx.",
    "..xoxox..",
    "..xxxxx..",
    ".xxxoxxx.",
    "xx.xxx.xx",
    "x..x.x..x",
    ".........",
  ],
  phoenix: [
    "....x....",
    "...xox...",
    "x..xxx..x",
    "xx.xxx.xx",
    ".xxxoxxx.",
    "..xxxxx..",
    "...xxx...",
    "..x.x.x..",
    ".x..x..x.",
  ],
  crown: [
    ".........",
    "x...x...x",
    "xx.xxx.xx",
    "xxxxxxxxx",
    "xoxxoxxox",
    "xxxxxxxxx",
    "xxxxxxxxx",
    ".........",
    ".........",
  ],
  trophy: [
    "xxxxxxxxx",
    "x.xxxxx.x",
    "x.xxxxx.x",
    ".xxxxxxx.",
    "..xxxxx..",
    "...xxx...",
    "....x....",
    "..xxxxx..",
    ".xxxxxxx.",
  ],
  question: [
    "..xxxxx..",
    ".xx...xx.",
    ".x....xx.",
    ".....xx..",
    "....xx...",
    "....x....",
    ".........",
    "....x....",
    ".........",
  ],
} as const satisfies Record<string, PixelArt>;
