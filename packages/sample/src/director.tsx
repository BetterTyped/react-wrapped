import { type SampleInsight, sampleInsights } from "./insights";
import { RARITY_ORDER, type SampleTrait, type SampleTraitKind, type SampleTraits } from "./traits";
import { dropVisual, weekBars, yearShape } from "./visuals";
import { formatDay, formatShort, SAMPLE_CAPTION, samplePeriod, type SampleYear } from "./year";
import {
  barsScene,
  bigDayScene,
  bigNumberScene,
  type CalendarLevels,
  chartScene,
  createRng,
  cutDrops,
  factScene,
  type HiddenDrop,
  listScene,
  openingScene,
  personaScene,
  RARITY_LABELS,
  type Rng,
  type SceneInstance,
  type ShareCardSpec,
  splitScene,
  summaryScene,
  trophiesScene,
  type WrappedSubject,
  type WrappedToken,
} from "@react-wrapped/core";

/*
 * The director: the one place that decides what the video says. It takes the year and the roll and returns scenes
 * in story order, built from the engine's own scene library and nothing else. A Wrapped for any other product is
 * this file written again for other numbers.
 */

export const SAMPLE_TITLE = "My year on Orbit.";

const WEEKDAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

const KIND_LABELS: Record<SampleTraitKind, string> = {
  coderType: "Coder type",
  achievement: "Achievement",
  easterEgg: "Easter egg",
};

const fmt = (count: number) => count.toLocaleString("en-US");
const pct = (share: number) => `${Math.round(share * 100)}%`;
const plural = (count: number, word: string) => `${fmt(count)} ${word}${count === 1 ? "" : "s"}`;
/** The same with the count in the accent color, for a headline: "*3* achievements". */
const counted = (count: number, word: string) => `*${count}* ${word}${count === 1 ? "" : "s"}`;

/**
 * The story. Every found drop belongs to the scene it continues, so a drop never just follows another drop: a
 * streak achievement plays after your longest streak, a big-day achievement after your biggest day, and the easter
 * egg once the coder type has landed. Anything not listed here continues the last one.
 */
const CONTINUES: Record<string, string> = {
  "four-digits": "total",
  "second-wind": "total",
  "friday-shipper": "week",
  "night-watch": "week",
  "clean-sheet": "week",
  "launch-day": "biggest-day",
  "long-haul": "streak",
  "shore-leave": "streak",
  "all-weather": "streak",
  "home-base": "repositories",
  "many-tongues": "languages",
  "second-pair": "languages",
};
/** The scenes a drop may follow, in story order. Never the shape: it leads straight into the coder type. */
const ANCHORS = ["total", "week", "biggest-day", "streak", "repositories", "languages", "type"];

/**
 * Puts each found drop after the scene it continues. When that scene is not in this year's video, or already has a
 * drop behind it, the drop goes to the nearest scene that is free (the later one when two are as near), so two
 * drops never play back to back.
 */
function slotDrops(story: readonly SceneInstance[], drops: readonly { after: string; scene: SceneInstance }[]) {
  const inStory = ANCHORS.map((key, index) => ({ key, index })).filter(({ key }) =>
    story.some((scene) => scene.key === key),
  );
  const behind = new Map<string, SceneInstance[]>();
  for (const drop of drops) {
    const wanted = Math.max(0, ANCHORS.indexOf(drop.after));
    const nearest = inStory.toSorted(
      (a, b) => Math.abs(a.index - wanted) - Math.abs(b.index - wanted) || b.index - a.index,
    );
    // More drops than scenes to put them behind cannot happen with one roll, but a drop is never lost to it.
    const anchor = nearest.find(({ key }) => !behind.has(key)) ?? nearest[0];
    if (anchor) behind.set(anchor.key, [...(behind.get(anchor.key) ?? []), drop.scene]);
  }
  return story.flatMap((scene) => [scene, ...(behind.get(scene.key) ?? [])]);
}

/** How rare an easter egg is, said the way people say odds. Earned things are about you, not about odds. */
function oddsLine(trait: SampleTrait): string | null {
  if (trait.kind !== "easterEgg" || !trait.chance) return null;
  return `Only about **1 in ${Math.max(2, Math.round(100 / trait.chance))}** scans turns this one up.`;
}

/**
 * The roll as this year plays it: the same type, seed and earned list, with the drops cut down to what gets a scene.
 * At most one easter egg, and achievements only where the year can draw a chart for them, each a different kind of
 * chart. The scan, the video and the trophy case all read the drops from here, so they agree.
 */
export function playSampleTraits(year: SampleYear, traits: SampleTraits): SampleTraits {
  return { ...traits, drops: cutDrops(traits, (trait) => dropVisual(trait, year)?.chart.type ?? null) };
}

/**
 * The scene a drop becomes once it is found: the name, its rarity in one word under it, and one description. A
 * charted drop's description says what the chart shows. An easter egg has its pixel art, what it means, and its odds.
 */
function dropScene(trait: SampleTrait, year: SampleYear, rng: Rng): SceneInstance {
  const visual = dropVisual(trait, year);
  return factScene(
    {
      stamp: RARITY_LABELS[trait.rarity],
      rarity: trait.rarity,
      title: [trait.name],
      description: visual?.description ?? [trait.about, oddsLine(trait)].filter(Boolean).join(" "),
      chart: visual?.chart,
      art: visual ? undefined : trait.art,
      variant: rng.int(2),
    },
    { key: `drop-${trait.id}`, label: trait.name, drop: trait.rarity, locked: true },
  );
}

/** A trait as a token: on the share card, and in the trophy case, where `hidden` keeps it a "?" until it is found. */
const tokenOf = (trait: SampleTrait, hidden = false): WrappedToken & { hidden: boolean } => ({
  name: trait.name,
  kind: KIND_LABELS[trait.kind],
  rarity: trait.rarity,
  art: trait.art,
  hidden,
});

const hiddenDrop = (trait: SampleTrait): HiddenDrop => ({
  id: trait.id,
  name: trait.name,
  rarity: trait.rarity,
  kind: KIND_LABELS[trait.kind],
  line: trait.line,
  art: trait.art,
});

/**
 * The trophy case: every achievement the year earned and the egg it hid, hardest first. What the scan has not found
 * yet stays a "?" at the end, so the case never gives a drop away before the scan does.
 */
function trophyCase(traits: SampleTraits, opened: readonly string[]) {
  const hidden = new Set(traits.drops.filter((drop) => !opened.includes(drop.id)).map((drop) => drop.id));
  const eggs = traits.drops.filter((drop) => drop.kind === "easterEgg");
  const trophies = [...traits.earned, ...eggs]
    .map((trait) => tokenOf(trait, hidden.has(trait.id)))
    .toSorted(
      (a, b) => Number(a.hidden) - Number(b.hidden) || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
    );
  return { trophies, hidden: hidden.size, eggs: eggs.length };
}

/** Everything a page needs to play one year: hand `subject`, `seed` and `scenes` to `WrappedView` as they are. */
export interface SampleCut {
  subject: WrappedSubject;
  /** The cut's luck, from the roll. The player picks its transitions with it. */
  seed: string;
  scenes: SceneInstance[];
  /** Every generated scene, found or not, in the order the scan opens them. */
  drops: HiddenDrop[];
  /** The drops not opened yet. Each joins `scenes` once it is. */
  pending: HiddenDrop[];
  /** The year as the video draws it, so the scan hides drops in the same graph. */
  calendar: CalendarLevels;
  card: ShareCardSpec;
  /** The cards to keep. They do not change with what has been opened. */
  insights: SampleInsight[];
}

/**
 * The whole video for one year: the scenes every Wrapped has, the coder type from the roll, and a scene for each
 * drop opened so far, slotted in behind the scene it continues. Every choice between two phrasings or two layouts
 * goes through the roll's seed, so the same roll always plays the same video.
 */
export function directSample(year: SampleYear, traits: SampleTraits, opened: readonly string[]): SampleCut {
  const played = playSampleTraits(year, traits);
  const rng = createRng(played.seed).fork("director");
  const { totals } = year;
  const period = samplePeriod(year);
  const calendar: CalendarLevels = {
    levels: year.days.map((day) => day.level),
    lead: year.lead,
    months: year.months.map((month) => month.label),
  };
  const counter = () => rng.pick(["climb", "slot"] as const);
  const week = weekBars(year);
  const [topLanguage] = year.languages;

  const story: SceneInstance[] = [
    openingScene(
      { title: SAMPLE_TITLE, period: `@${year.handle}, ${period}`, calendar, variant: rng.int(2) },
      { key: "opening", label: "Opening" },
    ),
    bigNumberScene(
      {
        eyebrow: rng.pick([
          "In the last 12 months you made",
          "Over the last year you racked up",
          "Twelve months. You made",
        ]),
        value: totals.contributions,
        title: ["contributions."],
        lede: `That's **${(totals.contributions / year.days.length).toFixed(1)} a day**, on **${totals.activeDays}** active days out of ${year.days.length}.`,
        calendar,
        counter: counter(),
        variant: rng.int(2),
      },
      { key: "total", label: "Total contributions" },
    ),
    barsScene(
      {
        eyebrow: rng.pick(["Your week", "Your rhythm"]),
        title: ["You ship on", `*${WEEKDAY_NAMES[week.peak]}.*`],
        bars: week.bars,
        lede: `Weekends took **${pct(year.weekendShare)}** of your work.`,
      },
      { key: "week", label: "Your week" },
    ),
  ];

  if (year.busiest.count > 0) {
    const [weekday, date] = formatDay(year.busiest.date).split(", ");
    story.push(
      bigDayScene(
        {
          eyebrow: rng.pick(["Your biggest day", "The day you went off", "Peak you"]),
          count: year.busiest.count,
          unit: "CONTRIBUTIONS",
          title: [`${weekday},`, date],
          lede:
            year.busiest.count >= 40
              ? rng.pick([
                  "That's not a day, that's a release.",
                  "Something shipped. Or something broke. Probably both.",
                ])
              : rng.pick(["A good day at the keyboard.", "The rest of the year has some catching up to do."]),
        },
        { key: "biggest-day", label: "Biggest day" },
      ),
    );
  }

  if (year.streak.length >= 3) {
    story.push(
      bigNumberScene(
        {
          eyebrow: "Longest streak",
          value: year.streak.length,
          title: ["days in a row."],
          cells: year.streak.length,
          lede: `${formatShort(year.streak.from)} to ${formatShort(year.streak.to)}, without missing a day.`,
          counter: counter(),
          variant: rng.int(2),
        },
        { key: "streak", label: "Longest streak" },
      ),
    );
  }

  if (year.repositories.length > 0) {
    story.push(
      listScene(
        {
          eyebrow: rng.pick(["Where it happened", "Your home turf"]),
          title: ["Your top", "repositories."],
          items: year.repositories.slice(0, 3).map((repository) => ({
            name: repository.name,
            value: repository.commits,
            unit: "commits",
            meta: repository.language,
            color: repository.color,
          })),
        },
        { key: "repositories", label: "Top repositories" },
      ),
    );
  }

  if (year.languages.length >= 2 && topLanguage) {
    story.push(
      splitScene(
        {
          eyebrow: "Written in",
          title: [`*${topLanguage.name},*`, rng.pick(["mostly.", "mainly.", "of course."])],
          parts: year.languages,
        },
        { key: "languages", label: "Languages" },
      ),
    );
  }

  // The whole year as one outline, right before it is given a name.
  if (totals.contributions > 0) {
    const shape = yearShape(year);
    story.push(
      chartScene(
        {
          eyebrow: "Your shape",
          title: ["Strongest on", `*${shape.word}.*`],
          chart: shape.chart,
          lede: "Six ways to measure a year, each against a mark that is **hard to reach**.",
        },
        { key: "shape", label: "Your shape" },
      ),
    );
  }

  story.push(
    personaScene(
      { eyebrow: "Your coder type", name: played.type.name, line: played.type.line, art: played.type.art },
      { key: "type", label: "Coder type", drop: played.type.rarity, locked: true },
    ),
  );

  const found = played.drops.filter((drop) => opened.includes(drop.id));
  const { trophies, hidden, eggs } = trophyCase(played, opened);
  if (trophies.length > 0) {
    const earned = played.earned.length;
    const inVideo = found.filter((drop) => drop.kind === "achievement").length;
    story.push(
      trophiesScene(
        {
          eyebrow: "Your trophy case",
          title:
            earned > 0
              ? [counted(earned, "achievement"), `and ${counted(eggs, "easter egg")}.`]
              : ["No achievements yet.", `${counted(eggs, "easter egg")}, though.`],
          lede:
            hidden > 0
              ? `**${hidden}** still hiding in your year.`
              : inVideo > 0
                ? `The hardest **${inVideo}** got scenes of their own.`
                : "Every one of them found.",
          items: trophies,
        },
        { key: "trophies", label: "Trophy case", locked: true },
      ),
    );
  }

  const [rarest] = found.toSorted((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  const tokens = [played.type, ...(rarest ? [rarest] : [])].map((trait) => tokenOf(trait));
  const stats = [
    { label: "Contributions", value: fmt(totals.contributions) },
    { label: "Longest streak", value: plural(year.streak.length, "day") },
    { label: "Biggest day", value: fmt(year.busiest.count) },
    topLanguage
      ? { label: "Top language", value: topLanguage.name }
      : { label: "Active days", value: fmt(totals.activeDays) },
  ];
  story.push(
    summaryScene(
      { handle: year.handle, avatarUrl: null, caption: `${SAMPLE_CAPTION}, ${period}`, calendar, stats, tokens },
      { key: "share-card", label: "Share card" },
    ),
  );

  return {
    subject: { handle: year.handle, name: null, avatarUrl: null, caption: SAMPLE_CAPTION, period },
    seed: played.seed,
    scenes: slotDrops(
      story,
      found.map((drop) => ({
        after: CONTINUES[drop.id] ?? "type",
        scene: dropScene(drop, year, rng.fork(`drop-${drop.id}`)),
      })),
    ),
    drops: played.drops.map(hiddenDrop),
    pending: played.drops.filter((drop) => !opened.includes(drop.id)).map(hiddenDrop),
    calendar,
    card: {
      handle: year.handle,
      avatarUrl: null,
      caption: SAMPLE_CAPTION,
      period,
      graph: { levels: calendar.levels, lead: year.lead },
      stats,
      tokens,
    },
    insights: sampleInsights(year, played),
  };
}
