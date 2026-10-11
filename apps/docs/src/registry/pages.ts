import { toSource } from "../content/source";
import type { Block, DocPage, Section } from "../content/types";
import { PACKAGES } from "../site";
import { CHART_DOCS, CHART_TYPES, type ChartType, examplesOf } from "./charts";
import { TRANSITIONS } from "./transitions";

/*
 * Every page of the docs, built from the registries. The sidebar, the routes, the sitemap, the Markdown twins and
 * llms.txt all read this one list, so a chart added to its registry gets all five without another edit.
 */

/** The day the generated pages' wording last changed. Bump it when the templates below change. */
const UPDATED = "2026-10-11";

const indent = (code: string, by: string) =>
  code
    .split("\n")
    .map((line, index) => (index === 0 ? line : `${by}${line}`))
    .join("\n");

/* ---------- charts ---------- */

const chartPath = (type: ChartType) => `/docs/charts/${type}/`;

function chartPage(type: ChartType, index: number): DocPage {
  const doc = CHART_DOCS[type];
  const examples = examplesOf(type);
  const [first, ...rest] = examples;
  const neighbours = [CHART_TYPES[index - 1], CHART_TYPES[index + 1], CHART_TYPES[(index + 7) % CHART_TYPES.length]]
    .filter((other): other is ChartType => other !== undefined && other !== type)
    .map(chartPath);
  const blocks: Block[] = [
    { kind: "preview", demo: { type: "chart", example: first.name }, caption: first.says },
    { kind: "h2", text: "Installation" },
    { kind: "code", language: "bash", code: "pnpm add @react-wrapped/charts @react-wrapped/core gsap" },
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "A chart is data, not markup. Hand a scene an object with `type` set and the numbers to draw, and the scene draws it and plays its entrance on the video's timeline.",
    },
    {
      kind: "code",
      language: "tsx",
      code: [
        `import { chartScene } from "@react-wrapped/scenes";`,
        ``,
        `export const scene = chartScene(`,
        `  {`,
        `    eyebrow: "Your year",`,
        `    title: ["${doc.name}."],`,
        `    lede: "${first.says}",`,
        `    chart: ${indent(toSource(first.chart), "    ")},`,
        `  },`,
        `  { key: "${type}", label: "${doc.name}" },`,
        `);`,
      ].join("\n"),
    },
    { kind: "h2", text: "Props" },
    {
      kind: "table",
      head: ["Prop", "Type", "What it does"],
      rows: [
        ["`type`", `\`"${type}"\``, "Picks this chart."],
        ...Object.entries(doc.props).map(([name, [propType, text]]) => [`\`${name}\``, `\`${propType}\``, text]),
      ],
    },
    ...rest.flatMap((example): Block[] => [
      { kind: "h2", text: example.name },
      { kind: "p", text: example.says },
      { kind: "preview", demo: { type: "chart", example: example.name } },
      { kind: "code", language: "tsx", code: `const chart = ${toSource(example.chart)};` },
    ]),
    { kind: "h2", text: "How it comes in" },
    {
      kind: "p",
      text: "Every chart plays in the order it is read: what it is made of stands first, the numbers arrive with a direction, and the one thing the chart is about lands last with its pill. Nothing is on screen before its own entrance. See [how charts animate](/docs/charts/) for the shared rules.",
    },
  ];
  return {
    path: chartPath(type),
    section: "charts",
    title: `${doc.name} chart`,
    tagline: doc.tagline,
    nav: doc.name,
    description: doc.description,
    lead: doc.lead,
    blocks,
    related: ["/docs/charts/", ...neighbours, "/docs/transitions/"],
    updated: UPDATED,
  };
}

const chartsOverview: DocPage = {
  path: "/docs/charts/",
  section: "charts",
  title: "Charts",
  tagline: "21 animated charts for React",
  nav: "Overview",
  description:
    "Twenty-one animated React charts made for year in review videos: line, bars, funnel, radar, heatmaps and more, each with its own GSAP entrance.",
  lead: "react-wrapped ships twenty-one charts, each a picture of its own numbers. A scene hands a chart type its data and never draws its own, so every chart in a video shares one look: a glow behind what matters, a hairline through the point, and the number in a pill.",
  blocks: [
    {
      kind: "cards",
      items: CHART_TYPES.map((type) => ({
        path: chartPath(type),
        title: CHART_DOCS[type].name,
        text: examplesOf(type)[0].says,
        demo: { type: "chart", example: examplesOf(type)[0].name },
      })),
    },
    { kind: "h2", text: "How charts animate" },
    {
      kind: "list",
      items: [
        "**Structure first.** Empty slots, grids and axis names stand before any number arrives.",
        "**Numbers arrive with a direction.** A level rising, a wave, a hand going round.",
        "**The point lands last and alone**, then its pill grows out of it on a hairline.",
        "**Nothing grows past its own size.** Cells in a grid never overlap their neighbours on the way in.",
        "**Everything seeks.** A chart animates on the scene's timeline, so scrubbing and exporting frame by frame both work.",
      ],
    },
    { kind: "h2", text: "Colours" },
    {
      kind: "p",
      text: "A chart reads the palette of the stage it is on. The lit part takes `--wr-rarity`, the quiet part the palette's five levels, text takes `--wr-fg`. Change the palette and every chart follows; see [theming](/docs/theming/).",
    },
  ],
  related: ["/docs/transitions/", "/docs/", "/docs/installation/", "/designs/"],
  updated: UPDATED,
};

/* ---------- transitions ---------- */

const transitionPath = (id: string) => `/docs/transitions/${id}/`;

const transitionPages: DocPage[] = TRANSITIONS.map((transition, index) => {
  const others = [TRANSITIONS[index - 1], TRANSITIONS[index + 1], TRANSITIONS[(index + 5) % TRANSITIONS.length]]
    .filter((other) => other !== undefined && other.id !== transition.id)
    .map((other) => transitionPath(other.id));
  return {
    path: transitionPath(transition.id),
    section: "transitions",
    title: `${transition.name} transition`,
    tagline: transition.tagline,
    nav: transition.name,
    description: `${transition.name} is a scene transition for React year in review videos: ${transition.tagline}. Built on GSAP, seekable, drawn in the palette's own colours.`,
    lead: `${transition.says} ${
      transition.kind === "cover"
        ? "It is a cover: it takes the whole frame and the next scene starts underneath it."
        : "It is a move: the old scene itself is taken out and the next one comes in behind."
    }`,
    blocks: [
      { kind: "preview", demo: { type: "transition", id: transition.id } },
      { kind: "h2", text: "Usage" },
      {
        kind: "p",
        text: "Every scene already has a transition: the video's seed picks one per scene, so two videos rarely cut the same way. To choose one yourself, name it for that scene in the config.",
      },
      {
        kind: "code",
        language: "tsx",
        code: [
          `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig } from "@react-wrapped/kit";`,
          ``,
          `const config: WrappedConfig = {`,
          `  ...DEFAULT_WRAPPED_CONFIG,`,
          `  // The scene with the key "total" leaves with ${transition.name}.`,
          `  cuts: { total: "${transition.id}" },`,
          `};`,
        ].join("\n"),
      },
      { kind: "h2", text: "How it works" },
      {
        kind: "p",
        text:
          transition.kind === "cover"
            ? "A cover is a few big shapes, three layers deep, in the palette's levels two, three and four. The layers follow each other by a beat, so the cover's edge is a band of colours and never one hard line. The next scene starts under the closed cover, so it clears onto a scene that is already playing."
            : "A move animates the outgoing scene itself and marks the moment the next scene should start. The next scene comes in as the last of the old one leaves, so two headlines never sit on top of each other.",
      },
      {
        kind: "p",
        text: "Transitions are placed on the same GSAP timeline as the scenes. Seeking backwards through one undoes it exactly, which is what makes the timeline scrubbable and the video exportable frame by frame.",
      },
    ],
    related: ["/docs/transitions/", ...others, "/docs/charts/"],
    updated: UPDATED,
  };
});

const transitionsOverview: DocPage = {
  path: "/docs/transitions/",
  section: "transitions",
  title: "Transitions",
  tagline: "19 scene transitions for React",
  nav: "Overview",
  description:
    "Nineteen GSAP scene transitions for React videos: fourteen covers drawn in the palette's colours and five moves that take the scene out itself.",
  lead: "A transition is how one scene hands over to the next. react-wrapped has nineteen: fourteen covers that take the whole frame in the palette's colours, and five moves that take the old scene out itself. Each scene gets one from the video's seed, and you can pick any of them per scene.",
  blocks: [
    { kind: "h2", text: "Covers" },
    {
      kind: "cards",
      items: TRANSITIONS.filter((transition) => transition.kind === "cover").map((transition) => ({
        path: transitionPath(transition.id),
        title: transition.name,
        text: transition.tagline,
        demo: { type: "transition", id: transition.id },
      })),
    },
    { kind: "h2", text: "Moves" },
    {
      kind: "cards",
      items: TRANSITIONS.filter((transition) => transition.kind === "move").map((transition) => ({
        path: transitionPath(transition.id),
        title: transition.name,
        text: transition.tagline,
        demo: { type: "transition", id: transition.id },
      })),
    },
  ],
  related: ["/docs/charts/", "/docs/", "/docs/installation/", "/designs/"],
  updated: UPDATED,
};

/* ---------- get started ---------- */

const introduction: DocPage = {
  path: "/docs/",
  section: "get-started",
  title: "Introduction",
  tagline: "year in review videos in React",
  nav: "Introduction",
  description:
    "react-wrapped is a set of React packages for year in review videos: scenes, charts, transitions, a player with an editor, a scanner and share cards.",
  lead: "react-wrapped turns a year of numbers into a short video that plays in the page. It is the engine behind Hype Stack's Wrapped, split into packages you can use whole or take apart: the stage, the scenes, the charts, the transitions, the player with its timeline editor, the year scan and the graphics people keep.",
  blocks: [
    { kind: "h2", text: "What is in it" },
    {
      kind: "table",
      head: ["Package", "What it holds"],
      rows: PACKAGES.map((entry) => [`\`${entry.name}\``, entry.holds]),
    },
    { kind: "h2", text: "How it fits together" },
    {
      kind: "list",
      items: [
        "A **scene** is a React node and a GSAP timeline that brings it in. You declare one with `defineScene` or use a ready-made one.",
        "A **cut** is a list of scenes. The stage plays them in order on one master timeline, with a [transition](/docs/transitions/) between each pair.",
        "A **chart** is data a scene hands over. There are [twenty-one](/docs/charts/), and they all animate on the same timeline.",
        "The **player** puts controls and a timeline around the stage. Its timeline is also the editor.",
        "Everything a viewer can change (palette, format, speed, transitions, edited texts) is one config object that fits in a URL.",
      ],
    },
    { kind: "h2", text: "Built on GSAP" },
    {
      kind: "p",
      text: "All motion runs on [GSAP](https://gsap.com) timelines. That is what makes a video seekable, scrubbable from the timeline, and exportable frame by frame. GSAP is a peer dependency and you install it yourself.",
    },
  ],
  related: ["/docs/installation/", "/docs/theming/", "/docs/charts/", "/docs/transitions/", "/examples/full-wrapped/"],
  updated: UPDATED,
};

const installation: DocPage = {
  path: "/docs/installation/",
  section: "get-started",
  title: "Installation",
  tagline: "add react-wrapped to a React app",
  nav: "Installation",
  description:
    "Install react-wrapped in a React 19 app with pnpm, npm or yarn. One package for everything, or only the parts you need. GSAP is a peer dependency.",
  lead: "Install `@react-wrapped/kit` for everything in one go, or pick the packages you need. All of them are released together under one version number, so they always fit each other.",
  blocks: [
    { kind: "h2", text: "Everything" },
    { kind: "code", language: "bash", code: "pnpm add @react-wrapped/kit gsap" },
    { kind: "p", text: "Then load the stylesheet once, anywhere in your app:" },
    { kind: "code", language: "tsx", code: `import "@react-wrapped/kit/styles.css";` },
    { kind: "h2", text: "Only the parts you need" },
    {
      kind: "p",
      text: "Each package has its own stylesheet and depends only on the ones before it in the list on the [introduction](/docs/). A page that only draws charts on a stage needs two packages:",
    },
    { kind: "code", language: "bash", code: "pnpm add @react-wrapped/core @react-wrapped/charts gsap" },
    {
      kind: "code",
      language: "tsx",
      code: `import "@react-wrapped/core/styles.css";\nimport "@react-wrapped/charts/styles.css";`,
    },
    { kind: "h2", text: "Requirements" },
    {
      kind: "list",
      items: [
        "React 19 and React DOM 19.",
        "GSAP 3.13 or newer, installed by you as a peer dependency.",
        "No Tailwind, no CSS framework and no reset: the stylesheets bring everything the components need and stay inside their own `wr-` classes.",
      ],
    },
  ],
  related: ["/docs/", "/docs/theming/", "/docs/formats/", "/docs/charts/"],
  updated: UPDATED,
};

const theming: DocPage = {
  path: "/docs/theming/",
  section: "get-started",
  title: "Theming",
  tagline: "palettes, dark and light, your colour",
  nav: "Theming",
  description:
    "Theme a react-wrapped video with ten built-in palettes, a dark or light switch, or one accent colour of your own. Everything reads CSS variables.",
  lead: "A theme is one colour and one switch. The palette names the colour, `mode` says dark or light, and every scene, chart, transition and card reads the result from CSS variables on the stage. Pick a built-in palette, or hand over one accent and the rest is worked out from it.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "chart", example: "Rings" },
      caption: "The swatches under any preview change every preview on the site.",
    },
    { kind: "h2", text: "Pick a palette" },
    {
      kind: "code",
      language: "tsx",
      code: [
        `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig } from "@react-wrapped/kit";`,
        ``,
        `const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, palette: "grape", mode: "light" };`,
      ].join("\n"),
    },
    {
      kind: "p",
      text: "The built-in palettes are listed in `WRAPPED_PALETTES`. Each has a dark and a light side with the same hue, so `mode` is one switch for all of them.",
    },
    { kind: "h2", text: "Your own colour" },
    {
      kind: "p",
      text: "Set the palette to `custom` and give it an accent. The five levels, the surfaces and the four rarity colours are derived from that one colour, so the result always fits itself.",
    },
    {
      kind: "code",
      language: "tsx",
      code: `const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, palette: "custom", accent: "#ff5c8a" };`,
    },
    { kind: "h2", text: "The variables" },
    {
      kind: "p",
      text: "`resolvePalette(config)` returns the palette as an object, and the stage writes it out as CSS variables. Anything you draw inside a scene can use them.",
    },
    {
      kind: "table",
      head: ["Variable", "What it is"],
      rows: [
        ["`--wr-bg`", "The frame's background."],
        ["`--wr-card`", "A panel standing on the background."],
        ["`--wr-fg`", "Text."],
        ["`--wr-muted`", "Quieter text and hairlines."],
        ["`--wr-l0` to `--wr-l4`", "The five levels of the palette, empty to brightest. Level 4 is the accent."],
        [
          "`--wr-common`, `--wr-rare`, `--wr-epic`, `--wr-legendary`",
          "The four rarity colours, chosen to sit well on this palette.",
        ],
        ["`--wr-rarity`", "The rarity colour of the scene being drawn. Charts light their point with it."],
      ],
    },
    {
      kind: "code",
      language: "css",
      code: `.my-badge {\n  background: var(--wr-card);\n  color: var(--wr-fg);\n  box-shadow: inset 0 0 0 1px var(--wr-l2);\n}`,
    },
  ],
  related: ["/docs/formats/", "/docs/charts/", "/docs/transitions/", "/designs/"],
  updated: UPDATED,
};

const formats: DocPage = {
  path: "/docs/formats/",
  section: "get-started",
  title: "Formats",
  tagline: "9:16, 1:1 and 16:9 from one cut",
  nav: "Formats",
  description:
    "One react-wrapped video plays in three formats: 9:16 for stories, 1:1 for feeds and 16:9 for screens. Scenes are fitted to the frame for you.",
  lead: "Every video plays in three formats from the same scenes: 9:16 for stories, 1:1 for feeds, 16:9 for screens and slides. A scene is laid out against a frame whose short side is 1080 pixels, and is fitted to the frame when its content would not fit.",
  blocks: [
    { kind: "preview", demo: { type: "chart", example: "Bars" }, caption: "Switch the format under the preview." },
    {
      kind: "table",
      head: ["Format", "Label", "Size"],
      rows: [
        ["`story`", "9:16", "1080 x 1920"],
        ["`square`", "1:1", "1080 x 1080"],
        ["`landscape`", "16:9", "1920 x 1080"],
      ],
    },
    { kind: "h2", text: "Set the format" },
    {
      kind: "code",
      language: "tsx",
      code: `const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, format: "landscape" };`,
    },
    { kind: "h2", text: "How a scene fits" },
    {
      kind: "list",
      items: [
        "The stage is always drawn at its real size and scaled down to the room it has, so type and spacing never reflow between a preview and an export.",
        "A scene that is too tall for the frame is scaled as a whole, down to 60 percent, before anything animates. Nothing is ever cut off at the edge.",
        "A scene's `animate` gets the format in its context, for the rare scene that wants a different move in a wide frame.",
      ],
    },
  ],
  related: ["/docs/theming/", "/docs/charts/", "/docs/installation/", "/designs/"],
  updated: UPDATED,
};

/* ---------- the whole site ---------- */

export const SECTIONS: readonly Section[] = [
  { id: "get-started", title: "Get started", pages: [introduction, installation, theming, formats] },
  { id: "charts", title: "Charts", pages: [chartsOverview, ...CHART_TYPES.map(chartPage)] },
  { id: "transitions", title: "Transitions", pages: [transitionsOverview, ...transitionPages] },
];

export const PAGES: readonly DocPage[] = SECTIONS.flatMap((section) => section.pages);

const BY_PATH = new Map(PAGES.map((page) => [page.path, page]));

export const pageAt = (path: string) => BY_PATH.get(path);

/** The pages that are not docs pages but still get linked to as "related". */
const OTHER_TITLES: Readonly<Record<string, string>> = {
  "/": "React Wrapped",
  "/designs/": "Designs",
  "/examples/full-wrapped/": "Full Wrapped example",
};

export const titleOf = (path: string) => BY_PATH.get(path)?.title ?? OTHER_TITLES[path];

/** The page before and the page after, in sidebar order. */
export function neighboursOf(path: string): { previous?: DocPage; next?: DocPage } {
  const index = PAGES.findIndex((page) => page.path === path);
  return { previous: PAGES[index - 1], next: PAGES[index + 1] };
}
