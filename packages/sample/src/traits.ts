import { SAMPLE_CATALOG, type SampleAchievementEntry, type SampleEggEntry, type SampleTypeEntry } from "./catalog";
import type { SampleYear } from "./year";
import { createRng, type PixelArt, type Rarity } from "@react-wrapped/kit";

/*
 * The roll: what one year was handed out of the catalog. On a real product this happens on a server, once, and is
 * stored, so nobody can roll again until they like the result. Here it is worked out from the year and a seed.
 */

export type SampleTraitKind = "coderType" | "achievement" | "easterEgg";

/** A catalog entry as one year got it: its line already says this year's numbers. */
export interface SampleTrait {
  id: string;
  kind: SampleTraitKind;
  name: string;
  rarity: Rarity;
  line: string;
  about: string;
  art: PixelArt;
  /** For an easter egg: how many scans in a hundred turn it up. Null for anything earned. */
  chance: number | null;
}

export interface SampleTraits {
  /** The cut's luck. The director and the player draw every choice from it, so the same roll plays the same video. */
  seed: string;
  type: SampleTrait;
  /**
   * What the scan can find. Luck only decides how many and which egg; which achievements get a scene is settled
   * when the cut is made (`playSampleTraits`), by what this year can draw a chart for.
   */
  drops: readonly SampleTrait[];
  /** Every achievement the year earned, hardest first. */
  earned: readonly SampleTrait[];
}

export const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const satisfies readonly Rarity[];

/** How many achievements a roll hides in the year, next to its one easter egg. */
const ACHIEVEMENT_SLOTS = 3;

/**
 * The roll's own seed. Any text works. This one was picked because it hands the default handle, ada, the legendary
 * egg, so a page that plays the sample gets to show what finding the rarest one looks like.
 */
const ROLL_SEED = "orbit-roll-25";

type Entry = SampleTypeEntry | SampleAchievementEntry | SampleEggEntry;

const rolled = (entry: Entry, kind: SampleTraitKind, year: SampleYear): SampleTrait => ({
  id: entry.id,
  kind,
  name: entry.name,
  rarity: entry.rarity,
  line: typeof entry.line === "function" ? entry.line(year) : entry.line,
  about: entry.about,
  art: entry.art,
  chance: "chance" in entry ? entry.chance : null,
});

/**
 * The roll for a year. The type is the first one in the catalog the year fits, the achievements are the ones it
 * earned, and the easter egg is drawn by its odds from a seed made of the handle. Exactly one egg, never more.
 */
export function sampleTraits(year: SampleYear): SampleTraits {
  const rng = createRng(`${ROLL_SEED}:${year.handle.toLowerCase()}`);
  const { types, achievements, eggs } = SAMPLE_CATALOG;

  const type = types.find((entry) => entry.fits(year)) ?? types[types.length - 1];
  const earned = achievements
    .filter((entry) => entry.earned(year))
    .map((entry) => rolled(entry, "achievement", year))
    // Stable, so two of the same rarity keep the catalog's order.
    .toSorted((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));

  // One number between 0 and 100, walked down the eggs by their odds.
  let left = rng.next() * eggs.reduce((sum, entry) => sum + entry.chance, 0);
  const egg =
    eggs.find((entry) => {
      left -= entry.chance;
      return left < 0;
    }) ?? eggs[0];

  return {
    seed: `${year.handle.toLowerCase()}:${rng.int(1000)}`,
    type: rolled(type, "coderType", year),
    drops: [...earned.slice(0, ACHIEVEMENT_SLOTS), rolled(egg, "easterEgg", year)],
    earned,
  };
}
