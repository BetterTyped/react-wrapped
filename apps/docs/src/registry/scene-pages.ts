import { toSource } from "../content/source";
import type { Block, DocPage } from "../content/types";
import { type PropDocs, propsTable } from "./props";
import { SCENE_DOCS, SCENE_IDS, SCENE_SOURCE_NAMES, type SceneId } from "./scenes";
import { code, UPDATED } from "./shared";
import type { openingScene } from "@react-wrapped/scenes";

/*
 * The scenes section: an overview and a page per ready-made scene, built from the scene registry the same way the
 * chart pages are built from theirs.
 */

export const scenePath = (id: SceneId) => `/docs/scenes/${id}/`;

/** The usage code of a scene's page, printed from the very props its preview plays. */
function usageOf(id: SceneId): string {
  const doc = SCENE_DOCS[id];
  const { props, meta } = doc.example;
  const body = toSource(props, "  ", SCENE_SOURCE_NAMES);
  const calendar = Object.entries(props).some(([name, value]) => name === "calendar" && value !== undefined);
  const art = body.includes("PIXEL_ART.");
  const core =
    calendar && art
      ? [`import { type CalendarLevels, PIXEL_ART } from "@react-wrapped/core";`]
      : calendar
        ? [`import type { CalendarLevels } from "@react-wrapped/core";`]
        : art
          ? [`import { PIXEL_ART } from "@react-wrapped/core";`]
          : [];
  return [
    ...core,
    `import { ${doc.fn} } from "@react-wrapped/scenes";`,
    ``,
    ...(calendar
      ? [
          `// The year as a grid of cells. \`calendarFromCounts\` makes one from a count per day.`,
          `declare const calendar: CalendarLevels;`,
          ``,
        ]
      : []),
    `export const scene = ${doc.fn}(`,
    `  ${body},`,
    `  ${toSource(meta, "  ")},`,
    `);`,
  ].join("\n");
}

function scenePage(id: SceneId): DocPage {
  const doc = SCENE_DOCS[id];
  const { fields } = doc.example;
  const blocks: Block[] = [
    { kind: "preview", demo: { type: "scene", key: `example:${id}` }, caption: doc.example.says },
    { kind: "h2", text: "Installation" },
    code("bash", ["pnpm add @react-wrapped/scenes @react-wrapped/core gsap"]),
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: `Call \`${doc.fn}\` with what the scene says, then with the key and the label it goes by. What comes back is a scene placed in a video: put it in the \`scenes\` array of a [player](/docs/player/wrapped-player/). The code below places the scene in the preview above.`,
    },
    code("tsx", [usageOf(id)]),
    { kind: "h2", text: "Props" },
    propsTable(doc.props),
    ...(doc.note ? [{ kind: "note", text: doc.note } satisfies Block] : []),
    { kind: "h2", text: "What a viewer can rewrite" },
    ...(fields.length > 0
      ? ([
          {
            kind: "p",
            text: "These texts are the scene's fields. From the pencil on the [timeline](/docs/player/timeline/) a viewer opens the [scene editor](/docs/player/scene-editor/) and rewrites them. Numbers, charts and pictures stay yours. Place the scene with `locked: true` and it offers none of them.",
          },
          {
            kind: "table",
            head: ["Field", "In the editor", "Edited as"],
            rows: fields.map((field) => [
              `\`${field.name}\``,
              field.label,
              field.multiline ? "Lines, one per line on screen" : "One line",
            ]),
          },
        ] satisfies Block[])
      : ([
          {
            kind: "p",
            text: "Nothing. This scene has no fields, so the [scene editor](/docs/player/scene-editor/) only offers the transition out of it.",
          },
        ] satisfies Block[])),
    { kind: "h2", text: "How it comes in" },
    {
      kind: "p",
      text: `${doc.motion} The scene then holds for at least as long as its text takes to read. The way out is not the scene's: the player adds a [transition](/docs/transitions/).`,
    },
    { kind: "h2", text: "In a real year" },
    { kind: "p", text: doc.sample.says },
    { kind: "preview", demo: { type: "scene", key: `sample:${doc.sample.key}` } },
  ];
  return {
    path: scenePath(id),
    section: "scenes",
    title: `${doc.name} scene`,
    tagline: doc.tagline,
    nav: doc.name,
    description: doc.description,
    lead: doc.lead,
    blocks,
    related: ["/docs/scenes/", ...doc.related.map(scenePath), "/docs/guides/custom-scene/"],
    updated: UPDATED,
  };
}

/** What a scene is placed with: the second argument of every scene function. */
const META_DOCS: PropDocs<Parameters<typeof openingScene>[1]> = {
  key: [
    "string",
    "The scene's name inside this video, unique among its scenes. Hidden scenes, their order, edits and picked transitions are all stored by it, so do not change it between visits.",
  ],
  label: ["string", "What the timeline and the scene editor call the scene."],
  drop: [
    '"common" | "rare" | "epic" | "legendary"',
    "Marks a scene that is this person's own find. The timeline colours its segment with that rarity.",
    "optional",
  ],
  locked: ["boolean", "A scene that was assigned, not written: none of its texts can be rewritten.", "optional"],
};

const scenesOverview: DocPage = {
  path: "/docs/scenes/",
  section: "scenes",
  title: "Scenes",
  tagline: "11 ready-made scenes for React",
  nav: "Overview",
  description:
    "Eleven ready-made scenes for a React year in review video: opening, big number, big day, bars, chart, list, split, fact, persona, trophies and summary.",
  lead: "A scene is one beat of the video: something to read, drawn on the frame, with the motion that brings it in. react-wrapped ships eleven of them, enough to tell a whole year. You decide what each one says and in which order they play, and the player does the rest.",
  blocks: [
    {
      kind: "cards",
      items: SCENE_IDS.map((id) => ({
        path: scenePath(id),
        title: SCENE_DOCS[id].name,
        text: SCENE_DOCS[id].example.says,
        demo: { type: "scene", key: `example:${id}` },
      })),
    },
    { kind: "h2", text: "Placing a scene" },
    {
      kind: "p",
      text: "Every scene is a function with the same two arguments: `scene(props, { key, label })`. The props are what this scene says. The second argument is how the video knows it. The result is a `SceneInstance`, and a video is an array of them.",
    },
    code("tsx", [
      `import { barsScene, bigNumberScene } from "@react-wrapped/scenes";`,
      ``,
      `export const scenes = [`,
      `  bigNumberScene(`,
      `    {`,
      `      eyebrow: "This year you made",`,
      `      value: 2052,`,
      `      title: ["contributions."],`,
      `      lede: "That's **5.6 a day**.",`,
      `      counter: "climb",`,
      `      variant: 0,`,
      `    },`,
      `    { key: "total", label: "Total contributions" },`,
      `  ),`,
      `  barsScene(`,
      `    {`,
      `      eyebrow: "Your week",`,
      `      title: ["You ship on", "*Fridays.*"],`,
      `      bars: [`,
      `        { label: "Thu", value: 352 },`,
      `        { label: "Fri", value: 398, peak: true },`,
      `        { label: "Sat", value: 84 },`,
      `      ],`,
      `      lede: "Weekends took **9%** of your work.",`,
      `    },`,
      `    { key: "week", label: "Your week" },`,
      `  ),`,
      `];`,
    ]),
    propsTable(META_DOCS, ["Key", "Type", "What it does"]),
    { kind: "h2", text: "Text marks" },
    {
      kind: "p",
      text: "Scene text is plain strings with two marks, so anyone can edit it without an editor. Wrap words in single stars and they take the palette's accent colour. Wrap them in double stars and they are set bold at full strength.",
    },
    {
      kind: "list",
      items: [
        "`title` is an array on most scenes: one entry per line on screen. Each line rises out of its own mask.",
        '`"You ship on *Fridays.*"` puts the last word in the accent colour.',
        '`"That\'s **5.6 a day**."` makes the number bold.',
      ],
    },
    { kind: "h2", text: "The calendar" },
    {
      kind: "p",
      text: "Three scenes draw the year as a grid of cells, the way a contribution graph does: a column per week, seven cells tall. They take it as a `CalendarLevels`: a level from 0 to 4 for each day, oldest first, and `lead`, the number of empty slots before the first day. `calendarFromCounts` makes one from a count per day:",
    },
    code("tsx", [
      `import { calendarFromCounts } from "@react-wrapped/core";`,
      ``,
      `// One count per day, oldest first. The second argument is the date of the first count.`,
      `const counts = [0, 3, 12, 7, 0, 0, 5];`,
      ``,
      `export const calendar = calendarFromCounts(counts, new Date("2025-10-11"));`,
    ]),
    {
      kind: "list",
      items: [
        "A day with nothing is level 0. The others are levels 1 to 4 by quartiles of the active days, so one huge day does not flatten the rest of the year.",
        "The date is read in UTC, so the server and the browser agree on the weekday.",
        "The result has `months` too, a short name per month. The [big number scene](/docs/scenes/big-number/) writes them across the top of its grid.",
        "To build a `CalendarLevels` by hand, a level of -1 leaves a slot empty.",
      ],
    },
    { kind: "h2", text: "Variants and the seed" },
    {
      kind: "p",
      text: "Some scenes take a `variant`, a second layout or entrance, so two videos do not look alike. Others pick small things themselves from the video's seed: which side a list slides in from, how a counter counts. To pick your own variants the same way, draw them from `createRng(seed)`. The same seed then always gives the same video, on every replay and in the exported file.",
    },
    code("tsx", [
      `import { createRng } from "@react-wrapped/core";`,
      ``,
      `// One source per video. \`fork\` gives a part of it its own stream, so adding a choice`,
      `// in one scene does not reshuffle the others.`,
      `const rng = createRng("ada:2026").fork("director");`,
      ``,
      `export const variant = rng.int(2);`,
      `export const eyebrow = rng.pick(["Your biggest day", "The day you went off", "Peak you"]);`,
    ]),
    { kind: "h2", text: "How long a scene stays" },
    {
      kind: "p",
      text: "A scene plays its entrance and then holds. The hold is never shorter than its text takes to read at about 240 words a minute, so a long line keeps its scene up longer and you do not set durations by hand. A scene that is too tall for the frame is scaled down as a whole, to 60 percent at most, before anything animates.",
    },
    { kind: "h2", text: "A scene of your own" },
    {
      kind: "p",
      text: "All eleven are made with `defineScene`, which is exported too. Give it a `render` and an `animate` and you get a scene function like the ones on this page: it works with every transition, the timeline and the editor. The [custom scene guide](/docs/guides/custom-scene/) builds one from start to finish.",
    },
  ],
  related: [
    "/docs/guides/custom-scene/",
    "/docs/charts/",
    "/docs/transitions/",
    "/docs/player/",
    "/docs/first-wrapped/",
  ],
  updated: UPDATED,
};

export const scenePages: readonly DocPage[] = [scenesOverview, ...SCENE_IDS.map(scenePage)];
