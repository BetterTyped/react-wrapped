import type { SourceNames } from "../content/source";
import { goalScene } from "../demos/custom-scene";
import type { PropDocs } from "./props";
import { SAMPLE, SAMPLE_DROP_KEYS } from "./sample";
import { PIXEL_ART, type SceneInstance } from "@react-wrapped/core";
import {
  barsScene,
  bigDayScene,
  bigNumberScene,
  chartScene,
  factScene,
  listScene,
  openingScene,
  personaScene,
  splitScene,
  summaryScene,
  trophiesScene,
} from "@react-wrapped/scenes";

/*
 * The eleven ready-made scenes, each with the example its page leads with. The usage code on a page is printed from
 * the very props its preview plays, and the props table is keyed by the scene's own props, so neither can fall
 * behind the library.
 */

/** What a scene is placed with: its second argument. */
interface Meta {
  key: string;
  label: string;
  drop?: SceneInstance["drop"];
  locked?: boolean;
}

interface SceneExample<P> {
  props: P;
  meta: Meta;
  /** The scene as placed, ready for a stage. */
  scene: SceneInstance;
  /** The texts this kind of scene lets a viewer rewrite. Read from an unlocked placing: a locked one offers none. */
  fields: SceneInstance["fields"];
  /** One line under the preview. */
  says: string;
}

interface SceneDoc<P> {
  /** The name people call it. */
  name: string;
  /** The exported function. */
  fn: string;
  /** A few words after the name in the browser title. */
  tagline: string;
  /** The search result's line, 50 to 170 characters. */
  description: string;
  /** What it is and when to reach for it. */
  lead: string;
  props: PropDocs<P>;
  example: SceneExample<P>;
  /** How the scene brings itself in, in the order it happens. */
  motion: string;
  /** The same kind of scene in the sample year, and what the director did with it. */
  sample: { key: string; says: string };
  /** A thing worth knowing that is not a prop. */
  note?: string;
  related: readonly SceneId[];
}

const SCENE_FNS = {
  opening: openingScene,
  "big-number": bigNumberScene,
  "big-day": bigDayScene,
  bars: barsScene,
  chart: chartScene,
  list: listScene,
  split: splitScene,
  fact: factScene,
  persona: personaScene,
  summary: summaryScene,
  trophies: trophiesScene,
} as const;

export type SceneId = keyof typeof SCENE_FNS;

type SceneDocs = { [K in SceneId]: SceneDoc<Parameters<(typeof SCENE_FNS)[K]>[0]> };

/** Places a scene the way a page's code does, and keeps the props it was placed with for printing. */
const example = <P,>(
  place: (props: P, meta: Meta) => SceneInstance,
  props: P,
  { says, ...meta }: Meta & { says: string },
): SceneExample<P> => ({
  props,
  meta,
  scene: place(props, meta),
  fields: place(props, { key: meta.key, label: meta.label }).fields,
  says,
});

const { calendar } = SAMPLE;

/** Values the printed code calls by name: the year's calendar, and every piece of pixel art. */
export const SCENE_SOURCE_NAMES: SourceNames = new Map<unknown, string>([
  [calendar, "calendar"],
  ...Object.entries(PIXEL_ART).map(([name, art]): [unknown, string] => [art, `PIXEL_ART.${name}`]),
]);

const HOURS = [5, 3, 1, 0, 0, 0, 1, 3, 6, 10, 12, 11, 8, 10, 13, 12, 10, 8, 6, 8, 11, 14, 16, 9];

export const SCENE_DOCS: SceneDocs = {
  opening: {
    name: "Opening",
    fn: "openingScene",
    tagline: "the year arriving as a grid",
    description:
      "The opening scene of a React year in review video: the whole year as a grid of cells that fly in and settle, a headline and one line under it.",
    lead: "The opening scene is the first frame of a video. It draws the whole year as a grid of cells, brings them in, then sets the headline and one line under it. Use it once, first, to say whose year this is and which twelve months it covers.",
    props: {
      title: [
        "string",
        "The headline. One line is split into two balanced lines at a word. A line break in the text is kept as it is.",
      ],
      period: ["string", "The line under the headline: who and when."],
      calendar: [
        "CalendarLevels",
        "The year as cells: a level from 0 to 4 per day, oldest first, and how many empty slots come before the first day.",
      ],
      variant: [
        "number",
        "`0` flies the cells in from everywhere and lets them settle. `1` types the year out week by week.",
      ],
    },
    example: example(
      openingScene,
      { title: "My year on Orbit.", period: "@ada, Oct 2025 to Oct 2026", calendar, variant: 0 },
      { key: "opening", label: "Opening", says: "365 cells settling into a year, then the headline." },
    ),
    motion:
      "The cells come first, either from all sides or week by week. The headline rises out of its mask at 0.9 seconds and the line under it follows. Last, a ripple runs across the year from the first week to the last.",
    sample: {
      key: "opening",
      says: "The sample opens on this scene. The seed picks the variant, so two people rarely get the same entrance.",
    },
    related: ["big-number", "summary", "persona"],
  },
  "big-number": {
    name: "Big number",
    fn: "bigNumberScene",
    tagline: "one count, counted up",
    description:
      "A React scene for one big number: it counts up in giant type over a headline, with the year's calendar or a row of cells under it.",
    lead: "The big number scene gives one count the whole frame. The number climbs in type 300 pixels tall, the headline says what was counted, and a calendar or a row of cells shows it. Use it for the total of the year, the longest streak, anything that is a single figure.",
    props: {
      eyebrow: ["string", 'The small line above the number. It reads on into the number: "This year you made".'],
      value: ["number", "The count. A decimal such as 69.9 climbs with its decimal."],
      suffix: ["string", "Set right after the number, for a count too big to show whole: `K`, `M`, `%`.", "optional"],
      title: ["readonly string[]", "The headline under the number, one entry per line."],
      lede: ["string", "The line at the bottom. It says what the number means."],
      calendar: ["CalendarLevels", "Shows the year under the headline, with month names when it has them.", "optional"],
      cells: [
        "number",
        "Shows a row of lit cells instead, one per unit, 60 at most. Made for a streak counted in days.",
        "optional",
      ],
      counter: [
        '"climb" | "slot"',
        "How the number counts: a smooth climb, or digits that spin and lock in from the left like a slot machine.",
      ],
      variant: ["number", "`0` lets the number rise out of a blur. `1` springs it up from its bottom left corner."],
    },
    example: example(
      bigNumberScene,
      {
        eyebrow: "In the last 12 months you made",
        value: 2052,
        title: ["contributions."],
        lede: "That's **5.6 a day**, on **241** active days out of 365.",
        calendar,
        counter: "climb",
        variant: 0,
      },
      { key: "total", label: "Total contributions", says: "The number counts while the year fills in under it." },
    ),
    motion:
      "The small lines rise in, the number starts counting at 0.2 seconds and takes two seconds to land, and the headline rises while it counts. A calendar pops in cell by cell from the left. A row of cells does the same and finishes with one small wave.",
    sample: {
      key: "streak",
      says: "The sample uses it twice. This is the second time, for the longest streak, with `cells` instead of a calendar.",
    },
    note: "The number is set in tabular figures, so it does not shiver while it climbs, and a count too wide for the frame is set smaller until it fits.",
    related: ["big-day", "bars", "chart"],
  },
  "big-day": {
    name: "Big day",
    fn: "bigDayScene",
    tagline: "one date on a giant tile",
    description:
      "A React scene for the single biggest day of a year: one giant calendar cell with the count inside it and the date as the headline.",
    lead: "The big day scene is about one date. A single calendar cell grows to fill the middle of the frame with the day's count inside it, and the date is the headline. Use it for the busiest day, a launch day, a personal record.",
    props: {
      eyebrow: ["string", "The small line above the tile."],
      count: ["number", "The number inside the tile."],
      suffix: ["string", "After the count, for one too big to show whole: `K`, `M`.", "optional"],
      unit: ["string", "The small word under the count, inside the tile. Short and in capitals reads best."],
      title: ["readonly string[]", "The headline, usually the date on two lines."],
      lede: ["string", "The line at the bottom."],
    },
    example: example(
      bigDayScene,
      {
        eyebrow: "Your biggest day",
        count: 58,
        unit: "CONTRIBUTIONS",
        title: ["Thursday,", "April 16"],
        lede: "That's not a day, that's a release.",
      },
      { key: "biggest-day", label: "Biggest day", says: "One cell of the year, grown to the size of the frame." },
    ),
    motion:
      "The tile springs up from a single small cell with a turn, and eighteen sparks burst out of it. The count runs inside the tile, climbing or as a slot machine (the seed picks), then the date rises. The tile rocks once before the scene rests.",
    sample: {
      key: "biggest-day",
      says: "In the sample the line under the date changes with the size of the day: 40 or more gets a joke about a release.",
    },
    related: ["big-number", "fact", "bars"],
  },
  bars: {
    name: "Bars",
    fn: "barsScene",
    tagline: "a week or a year in columns",
    description:
      "A React scene with a row of columns under a headline: seven weekdays, twelve months, any short series with one or two columns lit.",
    lead: "The bars scene sets a short series of columns under a headline, with the ones that matter lit. Use it for the days of the week or the months of the year, when the story is which one stands out.",
    props: {
      eyebrow: ["string", "The small line above the headline."],
      title: ["readonly string[]", "The headline, one entry per line. It usually names the column that is lit."],
      bars: [
        "readonly { label: string; value: number; peak?: boolean }[]",
        "One column each, left to right. Heights are set against the tallest. `peak` lights a column.",
      ],
      lede: ["string", "The line under the columns."],
    },
    example: example(
      barsScene,
      {
        eyebrow: "Your week",
        title: ["You ship on", "*Fridays.*"],
        bars: [
          { label: "M", value: 312 },
          { label: "T", value: 341 },
          { label: "W", value: 330 },
          { label: "T", value: 352 },
          { label: "F", value: 398, peak: true },
          { label: "S", value: 84 },
          { label: "S", value: 61 },
        ],
        lede: "Weekends took **9%** of your work.",
      },
      { key: "week", label: "Your week", says: "Seven columns, the busiest one lit." },
    ),
    motion:
      "The headline rises first. The columns spring up from the baseline one after another, starting from the left, the middle or the right (the seed picks), with their labels fading in under them. The lit columns swell once at the end.",
    sample: {
      key: "week",
      says: "The sample counts contributions per weekday, Monday first, and lights the busiest one.",
    },
    note: "These are the scene's own columns. For columns with a value in a pill, or any other picture, hand a chart to the [chart scene](/docs/scenes/chart/).",
    related: ["chart", "list", "split"],
  },
  chart: {
    name: "Chart",
    fn: "chartScene",
    tagline: "any chart with a headline",
    description:
      "A React scene that tells one beat of the story with any of the 21 charts: a line above, a headline, the chart, and one line under it.",
    lead: "The chart scene is the frame around any of the twenty-one charts: a small line above, a headline, the chart, and one line under it that says what the chart shows. Use it whenever a beat of the story is a picture of numbers.",
    props: {
      eyebrow: ["string", "The small line above the headline."],
      title: ["readonly string[]", "The headline, one entry per line."],
      chart: ["SceneChart", "The chart as data: an object with `type` set and that chart's numbers."],
      lede: ["string", "The line under the chart. It explains the picture, so the chart needs no caption of its own."],
    },
    example: example(
      chartScene,
      {
        eyebrow: "Your day",
        title: ["Your best hour is", "*10 pm.*"],
        chart: { type: "clock", hours: HOURS },
        lede: "Commits by hour of the day. The lit hour is your busiest.",
      },
      { key: "day", label: "Your day", says: "A day clock chart inside the chart scene." },
    ),
    motion:
      "The small line and the headline come in, then the chart plays its own entrance at 0.6 seconds: structure first, numbers next, the point last. The line under it rises once the chart has drawn.",
    sample: {
      key: "shape",
      says: "The sample uses it for the shape of the year, a radar chart of six measures, right before the coder type.",
    },
    note: "The chart's point is lit in the frame's own ink here. A rarity colour belongs to something that was found, which is what the [fact scene](/docs/scenes/fact/) is for.",
    related: ["fact", "bars", "big-number"],
  },
  list: {
    name: "List",
    fn: "listScene",
    tagline: "a ranked top three",
    description:
      "A React scene for a ranked list: each row has a rank, a name, a meter set against the first row, and a count that climbs.",
    lead: "The list scene ranks a few things under a headline. Every row has its rank, its name, a meter measured against the first row, and a count. Use it for a top three: repositories, customers, songs, pages.",
    props: {
      eyebrow: ["string", "The small line above the headline."],
      title: ["readonly string[]", "The headline, one entry per line."],
      items: [
        "readonly { name: string; value: number; unit: string; meta?: string; color?: string | null }[]",
        "The rows, biggest first. `value` and `unit` are the count on the right, `meta` is the small note on the left, and `color` puts a dot before it.",
      ],
    },
    example: example(
      listScene,
      {
        eyebrow: "Where it happened",
        title: ["Your top", "repositories."],
        items: [
          { name: "ada/orbit-cli", value: 742, unit: "commits", meta: "TypeScript", color: "#3178c6" },
          { name: "ada/telemetry", value: 355, unit: "commits", meta: "Go", color: "#00add8" },
          { name: "ada/dotfiles", value: 203, unit: "commits", meta: "Shell", color: "#89e051" },
        ],
      },
      { key: "repositories", label: "Top repositories", says: "Three rows, each measured against the first." },
    ),
    motion:
      "The rows slide in from one side, a beat apart (the seed picks the side). Each row's meter then draws from the left while its count climbs.",
    sample: {
      key: "repositories",
      says: "The sample lists the three repositories with the most commits and tags each with its main language.",
    },
    note: "Three rows fit every format. With more, the scene is scaled down to fit the frame, so the type gets smaller.",
    related: ["split", "bars", "trophies"],
  },
  split: {
    name: "Split",
    fn: "splitScene",
    tagline: "one bar cut into shares",
    description:
      "A React scene for parts of a whole: one wide bar cut into coloured shares, with a legend whose percentages count up.",
    lead: "The split scene shows how a whole divides. One wide bar is cut into coloured parts, and a legend under it names each part with its percentage. Use it for languages, plans, countries: a handful of shares that add up to 100.",
    props: {
      eyebrow: ["string", "The small line above the headline."],
      title: ["readonly string[]", "The headline, one entry per line. It usually names the biggest part."],
      parts: [
        "readonly { name: string; color: string; share: number }[]",
        "The parts, biggest first. `share` is in percent and `color` is any CSS colour.",
      ],
    },
    example: example(
      splitScene,
      {
        eyebrow: "Written in",
        title: ["*TypeScript,*", "mostly."],
        parts: [
          { name: "TypeScript", color: "#3178c6", share: 54 },
          { name: "Go", color: "#00add8", share: 24 },
          { name: "CSS", color: "#663399", share: 14 },
          { name: "Shell", color: "#89e051", share: 8 },
        ],
      },
      { key: "languages", label: "Languages", says: "Four shares of one bar, drawn in a single stroke." },
    ),
    motion:
      "The bar is drawn left to right in one stroke. The legend rows come up under it and each percentage counts to its share.",
    sample: {
      key: "languages",
      says: "The sample splits the year by language and lets the seed pick the last word of the headline.",
    },
    note: "The parts bring their own colours, so this is the one scene that does not follow the palette. A part smaller than 1.5 percent is still drawn that wide, so it can be seen.",
    related: ["list", "chart", "bars"],
  },
  fact: {
    name: "Fact",
    fn: "factScene",
    tagline: "an achievement or an easter egg",
    description:
      "A React scene for one named thing about a year: an achievement or an easter egg with its rarity, pixel art or a chart, and one line.",
    lead: "The fact scene presents one named thing: an achievement that was earned, or an easter egg that was found. It shows the name, a tag coloured by rarity, one line, and either pixel art or a chart of the numbers behind it. Use it for every scene the scan adds to a video.",
    props: {
      stamp: ["string", "The small tag under the name. Usually the rarity as a word."],
      rarity: [
        '"common" | "rare" | "epic" | "legendary"',
        "Colours the tag and the chart's point with that rarity's colour from the palette.",
        "optional",
      ],
      title: ["readonly string[]", "The name, one entry per line."],
      description: ["string", "The one line under the name. With a chart, it says what the chart shows."],
      art: ["PixelArt", "Nine rows of nine characters: `x` lit, `o` half lit, `.` off.", "optional"],
      chart: ["SceneChart", "A chart of the numbers behind the fact. It takes the place of the art.", "optional"],
      variant: ["number", "Where the art sits: `0` above the name, `1` under the line. A chart ignores it."],
    },
    example: example(
      factScene,
      {
        stamp: "Legendary",
        rarity: "legendary",
        title: ["Rubber Duck"],
        description:
          "You explained the bug out loud and it fixed itself. Only about **1 in 50** scans turns this one up.",
        art: PIXEL_ART.duck,
        variant: 0,
      },
      {
        key: "drop-rubber-duck",
        label: "Rubber Duck",
        drop: "legendary",
        locked: true,
        says: "An easter egg: pixel art, the name, its rarity and one line.",
      },
    ),
    motion:
      "Pixel art pops in cell by cell, from the centre, the edges, the start or at random (the seed picks). The name rises, the tag follows quietly under it, a chart plays its own entrance, and the line comes last.",
    sample: {
      key: SAMPLE_DROP_KEYS.charted,
      says: "In the sample every achievement the scan finds becomes a fact scene with a chart of its own numbers.",
    },
    note: "The scene holds three kinds of text and no more: one tag, the name, one line. Place it with `drop` set to its rarity so the timeline colours its segment, and with `locked` so nobody rewrites what was assigned.",
    related: ["trophies", "persona", "chart"],
  },
  persona: {
    name: "Persona",
    fn: "personaScene",
    tagline: "who the year says you are",
    description:
      "A React scene that gives a year a character: a piece of pixel art, a name such as The Marathoner, and the line that explains it.",
    lead: "The persona scene gives the year a name. Pixel art comes in from the centre, the name lands under it, and one line says why. Use it once, near the end, for the type you assign from the numbers: The Marathoner, The Night Pilot.",
    props: {
      eyebrow: ["string", "The small line at the top."],
      name: ["string", 'The name. One that starts with "The " is set on two lines, with "The" on its own.'],
      line: ["string", "The line under the name: why this type, in this year's numbers."],
      art: ["PixelArt", "Nine rows of nine characters: `x` lit, `o` half lit, `.` off."],
    },
    example: example(
      personaScene,
      {
        eyebrow: "Your coder type",
        name: "The Marathoner",
        line: "48 days without a gap. You don't start things, you keep them going.",
        art: PIXEL_ART.mountain,
      },
      {
        key: "type",
        label: "Coder type",
        drop: "epic",
        locked: true,
        says: "Pixel art from the centre out, then the name.",
      },
    ),
    motion:
      "The art grows cell by cell from its centre and its lit cells pulse once. The name rises at 0.8 seconds and the line follows.",
    sample: {
      key: "type",
      says: "The sample picks the first type in its catalog that the year fits, and writes the year's own number into the line.",
    },
    note: `\`PIXEL_ART\` in \`@react-wrapped/core\` has ${Object.keys(PIXEL_ART).length} ready pieces, from \`mountain\` to \`question\`. Your own is an array of nine strings.`,
    related: ["fact", "trophies", "summary"],
  },
  summary: {
    name: "Summary",
    fn: "summaryScene",
    tagline: "the year on one closing card",
    description:
      "The closing scene of a React year in review video: one card with the handle, the year's grid, four headline numbers and what was found.",
    lead: "The summary scene closes a video with everything on one card: who it is about, the year as a grid, up to four headline numbers, and the tokens for what this person got. Use it last. It holds the longest, so it is the frame people screenshot.",
    props: {
      handle: ["string", "Shown as @handle at the top of the card."],
      avatarUrl: [
        "string | null",
        "A picture for the corner of the card. With `null`, the first two letters of the handle.",
      ],
      caption: ["string", "The line under the handle."],
      calendar: ["CalendarLevels", "The year as a grid of cells, under the name.", "optional"],
      stats: [
        "readonly { label: string; value: string }[]",
        "The headline numbers, already formatted. Four fit one row.",
      ],
      tokens: [
        "readonly WrappedToken[]",
        "What this person got, as tinted plates: pixel art, a name and a rarity each.",
        "optional",
      ],
    },
    example: example(
      summaryScene,
      {
        handle: "ada",
        avatarUrl: null,
        caption: "Orbit Wrapped, Oct 2025 to Oct 2026",
        calendar,
        stats: [
          { label: "Contributions", value: "2,052" },
          { label: "Longest streak", value: "48 days" },
          { label: "Biggest day", value: "58" },
          { label: "Top language", value: "TypeScript" },
        ],
        tokens: [
          { name: "The Marathoner", kind: "Coder type", rarity: "epic", art: PIXEL_ART.mountain },
          { name: "Rubber Duck", kind: "Easter egg", rarity: "legendary", art: PIXEL_ART.duck },
        ],
      },
      { key: "share-card", label: "Share card", says: "The whole year on one card, held for two and a half seconds." },
    ),
    motion:
      "The card comes up with a slight turn. The year sweeps in left to right as one stroke, the numbers rise one by one, and the tokens spring in last.",
    sample: {
      key: "share-card",
      says: "The sample shows the coder type and the rarest drop found so far, so the card changes as the scan finds more.",
    },
    note: "The [share card](/docs/graphics/share-card/) is the same content as a PNG. Build both from one set of numbers and they always agree.",
    related: ["trophies", "persona", "opening"],
  },
  trophies: {
    name: "Trophies",
    fn: "trophiesScene",
    tagline: "everything earned, in one case",
    description:
      "A React scene that lays out every achievement of a year as a trophy case: pixel art, a name and a rarity each, with the unfound ones hidden.",
    lead: "The trophies scene shows everything a year earned at once: a grid of plates, each with its pixel art, name and rarity, hardest first. The ones the scan has not found yet stay a question mark. Use it near the end, before the summary.",
    props: {
      eyebrow: ["string", "The small line above the headline."],
      title: ["readonly string[]", "The headline, one entry per line."],
      lede: ["string", "The line under the headline, above the case."],
      items: [
        "readonly (WrappedToken & { hidden?: boolean })[]",
        'The trophies, hardest first. A `hidden` one is drawn as a question mark. The first twelve are shown and the rest become "+N more".',
      ],
    },
    example: example(
      trophiesScene,
      {
        eyebrow: "Your trophy case",
        title: ["*5* achievements", "and *1* easter egg."],
        lede: "**2** still hiding in your year.",
        items: [
          { name: "All Weather", kind: "Achievement", rarity: "legendary", art: PIXEL_ART.crown },
          { name: "Long Haul", kind: "Achievement", rarity: "epic", art: PIXEL_ART.flame },
          { name: "Launch Day", kind: "Achievement", rarity: "rare", art: PIXEL_ART.rocket },
          { name: "Friday Shipper", kind: "Achievement", rarity: "common", art: PIXEL_ART.calendar },
          { name: "Night Watch", kind: "Achievement", rarity: "rare", art: PIXEL_ART.owl, hidden: true },
          { name: "Rubber Duck", kind: "Easter egg", rarity: "legendary", art: PIXEL_ART.duck, hidden: true },
        ],
      },
      {
        key: "trophies",
        label: "Trophy case",
        locked: true,
        says: "Four trophies found and two still hidden.",
      },
    ),
    motion:
      "The headline and the line come in, then the plates pop up one after another. The epic and legendary ones catch the light once everything has landed, and the hidden ones shake.",
    sample: {
      key: "trophies",
      says: "The sample rebuilds the case every time the scan finds a drop, so a question mark turns into a trophy.",
    },
    note: "This scene has no texts to rewrite: what it shows was earned, so the editor only offers its transition.",
    related: ["fact", "summary", "persona"],
  },
};

export const SCENE_IDS = Object.keys(SCENE_DOCS) as SceneId[];

/*
 * Every scene a preview can play, by the key a page names it with: "example:<id>" is the scene a page's code places,
 * "sample:<key>" is a scene of the sample year, and "guide:goal" is the one the custom scene guide builds.
 */
const DEMO_SCENES = new Map<string, SceneInstance>([
  ...SCENE_IDS.map((id): [string, SceneInstance] => [`example:${id}`, SCENE_DOCS[id].example.scene]),
  ...SAMPLE.scenes.map((scene): [string, SceneInstance] => [`sample:${scene.key}`, scene]),
  [
    "guide:goal",
    goalScene(
      {
        eyebrow: "Your goal for the year",
        title: ["200 active days.", "*So close.*"],
        reached: 182,
        goal: 200,
        unit: "days",
        lede: "Eighteen short. There is always next year.",
      },
      { key: "goal", label: "Goal" },
    ),
  ],
]);

export const demoScene = (key: string) => DEMO_SCENES.get(key);
export const DEMO_SCENE_KEYS = [...DEMO_SCENES.keys()];
