/** What picking needs to know about something the roll turned up. */
interface Rolled {
  id: string;
  kind: string;
}

/**
 * The generated scenes a cut really gets, out of what was rolled. Two rules decide it:
 *
 * - At most one easter egg. A cut padded with eggs is a run of jokes with nothing of the year in them.
 * - Every other one is an earned achievement that draws a chart of its own numbers. `pictureOf` names that picture
 *   for this year, or says null when the achievement has none or the year is too thin for it. Two achievements that
 *   would draw the same picture share one scene, the harder one's.
 *
 * `earned` comes hardest first, so the hardest achievements that can be drawn are the ones that get in. A year that
 * fits fewer gets fewer: a short hunt beats one filled out with scenes that have nothing to show.
 */
export function cutDrops<T extends Rolled>(
  traits: { drops: readonly T[]; earned: readonly T[] },
  pictureOf: (trait: T) => string | null,
): T[] {
  const egg = traits.drops.find((drop) => drop.kind === "easterEgg");
  const slots = traits.drops.length - (egg ? 1 : 0);
  const drawn = new Set<string>();
  const achievements: T[] = [];
  for (const trait of traits.earned) {
    if (achievements.length >= slots) break;
    const picture = pictureOf(trait);
    if (picture === null || drawn.has(picture)) continue;
    drawn.add(picture);
    achievements.push(trait);
  }
  return egg ? [...achievements, egg] : achievements;
}
