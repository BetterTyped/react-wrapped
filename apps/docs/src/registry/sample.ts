import {
  directSample,
  formatShort,
  playSampleTraits,
  sampleInsights,
  sampleTraits,
  sampleYear,
} from "@react-wrapped/sample";

/*
 * The made-up year every live preview plays: ada, a developer on Orbit, a platform that does not exist. Worked out
 * once here, so a scene on one page and the player on another show the same numbers.
 */

const year = sampleYear();
const traits = sampleTraits(year);
const played = playSampleTraits(year, traits);
/** Every drop this year hides, as if the scan had already found them all. */
const everyDrop = played.drops.map((drop) => drop.id);

/** The year with every hidden scene found: the longest video the sample plays. */
export const SAMPLE = directSample(year, traits, everyDrop);

/** The same year with only these drops opened, for previews where the scan still has something to find. */
export const sampleCut = (opened: readonly string[]) => directSample(year, traits, opened);

/** The cards to keep. They do not change with what the scan has found. */
export const SAMPLE_INSIGHTS = sampleInsights(year, traits);

export const SAMPLE_HANDLE = year.handle;

/** How a day of the sample reads on a scan card: "Mar 14". */
export const describeSampleDay = (day: number) => formatShort(year.days[day].date);

/** A scene of the sample by its key. Throws on a key the sample does not play, so a typo cannot ship a blank preview. */
export function sampleScene(key: string) {
  const scene = SAMPLE.scenes.find((candidate) => candidate.key === key);
  if (!scene) throw new Error(`The sample has no scene "${key}".`);
  return scene;
}

const keyOfDrop = (egg: boolean) => {
  const drop = played.drops.find((candidate) => (candidate.kind === "easterEgg") === egg);
  if (!drop) throw new Error(`The sample hides no ${egg ? "easter egg" : "achievement"}.`);
  return `drop-${drop.id}`;
};

/** The scenes the scan adds: one achievement that draws a chart of its numbers, and the easter egg with its pixel art. */
export const SAMPLE_DROP_KEYS = { charted: keyOfDrop(false), egg: keyOfDrop(true) };

/** A short video for previews that are about the player, not the story: the first four scenes and the closing card. */
export const SHORT_SCENES = [...SAMPLE.scenes.slice(0, 4), sampleScene("share-card")];
