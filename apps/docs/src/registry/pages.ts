import { excerpt, toSource } from "../content/source";
import { sourceOf } from "../content/sources";
import type { Block, DocPage, Section } from "../content/types";
import { PACKAGES } from "../site";
import { CHART_DOCS, CHART_TYPES, type ChartType, examplesOf } from "./charts";
import { extraPages } from "./extra-pages";
import { graphicsPages, marksPages } from "./graphics-pages";
import { guidePages } from "./guide-pages";
import { playerPages } from "./player-pages";
import { type PropDocs, propsTable } from "./props";
import { scannerPages } from "./scanner-pages";
import { scenePages } from "./scene-pages";
import { fileBlock } from "./shared";
import { stylingPage } from "./styling-page";
import { TRANSITIONS } from "./transitions";
import type { WrappedView } from "@react-wrapped/kit";

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
  related: ["/docs/scenes/chart/", "/docs/transitions/", "/docs/graphics/insight-cards/", "/docs/", "/designs/"],
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
  related: ["/docs/guides/custom-transition/", "/docs/charts/", "/docs/player/scene-editor/", "/docs/", "/designs/"],
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
        "A **scene** is a React node and a GSAP timeline that brings it in. Use one of the [eleven ready-made ones](/docs/scenes/) or declare your own with `defineScene`.",
        "A **cut** is a list of scenes. The stage plays them in order on one master timeline, with a [transition](/docs/transitions/) between each pair.",
        "A **chart** is data a scene hands over. There are [twenty-one](/docs/charts/), and they all animate on the same timeline.",
        "The [**player**](/docs/player/) puts controls and a timeline around the stage. Its timeline is also the editor.",
        "The [**scanner**](/docs/scanner/) hides some scenes in the year and lets the viewer find them.",
        "The [**graphics**](/docs/graphics/) are the cards a viewer keeps: one for the whole year and one per finding.",
        "Everything a viewer can change (palette, format, speed, transitions, edited texts) is one config object that [fits in a URL](/docs/guides/config-in-the-url/).",
      ],
    },
    { kind: "h2", text: "Built on GSAP" },
    {
      kind: "p",
      text: "All motion runs on [GSAP](https://gsap.com) timelines. That is what makes a video seekable, scrubbable from the timeline, and exportable frame by frame. GSAP is a peer dependency and you install it yourself.",
    },
  ],
  related: ["/docs/installation/", "/docs/first-wrapped/", "/docs/scenes/", "/docs/player/", "/examples/full-wrapped/"],
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
      text: "Each package depends only on the ones before it in the list on the [introduction](/docs/). A page that only draws charts on a stage needs two packages:",
    },
    { kind: "code", language: "bash", code: "pnpm add @react-wrapped/core @react-wrapped/charts gsap" },
    { kind: "code", language: "tsx", code: `import "@react-wrapped/core/styles.css";` },
    {
      kind: "p",
      text: "Four packages have a stylesheet. Core's holds the frame, the scenes and the charts, so load it first. The player, the scan and the graphics each add their own on top:",
    },
    {
      kind: "table",
      head: ["Package", "Stylesheet"],
      rows: [
        ["`@react-wrapped/core`", "`@react-wrapped/core/styles.css`"],
        ["`@react-wrapped/charts`, `scenes`, `marks`", "None. What they draw is styled by core's."],
        ["`@react-wrapped/player`", "`@react-wrapped/player/styles.css`"],
        ["`@react-wrapped/scan`", "`@react-wrapped/scan/styles.css`"],
        ["`@react-wrapped/graphics`", "`@react-wrapped/graphics/styles.css`"],
        ["`@react-wrapped/kit`", "`@react-wrapped/kit/styles.css`, all of the above in one file."],
      ],
    },
    { kind: "h2", text: "The font" },
    {
      kind: "p",
      text: "The library ships no font file. The frame, the share card and the insight cards are set in `Inter` where the page or the machine has a font by that name, and in the system's own sans otherwise. Both look right: the scenes measure their big numbers by the ink of whatever font is in use. To get the same type on every machine, load Inter under exactly that family name, with the `@fontsource/inter` package or a rule of your own.",
    },
    {
      kind: "code",
      language: "css",
      code: [
        `@font-face {`,
        `  font-family: "Inter";`,
        `  font-style: normal;`,
        `  font-weight: 100 900;`,
        `  font-display: swap;`,
        `  src: url("/fonts/inter-latin-wght-normal.woff2") format("woff2");`,
        `}`,
      ].join("\n"),
    },
    {
      kind: "p",
      text: "The controls around the frame use the font of your page. To set the video and the controls in a typeface of your choice, set `--wr-font` on any element above them. The share card is drawn on a canvas, which cannot read the variable, so it stays in Inter or the system's sans. See [custom palette and chrome colours](/docs/guides/palette-and-chrome/).",
    },
    { kind: "h2", text: "Requirements" },
    {
      kind: "list",
      items: [
        "React 19 and React DOM 19.",
        "GSAP 3.13 or newer, installed by you as a peer dependency.",
        "No Tailwind, no CSS framework and no reset: the stylesheets bring everything the components need and stay inside their own `wr-` classes.",
        "A browser for anything that plays or draws. The markup itself [renders on a server](/docs/guides/server-rendering/).",
      ],
    },
  ],
  related: ["/docs/first-wrapped/", "/docs/", "/docs/theming/", "/docs/guides/server-rendering/"],
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
      code: [
        `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig } from "@react-wrapped/kit";`,
        ``,
        `const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, palette: "custom", accent: "#ff5c8a" };`,
      ].join("\n"),
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
  related: ["/docs/guides/palette-and-chrome/", "/docs/formats/", "/docs/player/configurator/", "/designs/"],
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
      code: [
        `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig } from "@react-wrapped/kit";`,
        ``,
        `const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, format: "landscape" };`,
      ].join("\n"),
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
  related: ["/docs/theming/", "/docs/player/video-export/", "/docs/scenes/", "/designs/"],
  updated: UPDATED,
};

/** The props of `WrappedView` once the year is in: the page as one component. */
const VIEW_PROPS: PropDocs<Extract<Parameters<typeof WrappedView>[0], { subject: unknown }>> = {
  subject: ["WrappedSubject", "Who the video is about."],
  seed: ["string", "Picks the transitions and the small variations. Give each person their own."],
  scenes: ["readonly SceneInstance[]", "The scenes in story order."],
  config: ["WrappedConfig", "Everything a viewer can change."],
  onConfigChange: ["(next: WrappedConfig) => void", "Called with the whole next config on every change."],
  editable: [
    "boolean",
    "Whether this is the creator. Off, there are no settings, no editing and no scan: only the video. On unless you say otherwise.",
    "optional",
  ],
  share: [
    "{ fileName: string; graphics?: readonly WrappedGraphic[]; onError?: (message: string) => void }",
    "Adds the link and download buttons, and the [gallery](/docs/graphics/gallery/) when there are graphics.",
    "optional",
  ],
  opening: [
    "{ calendar; drops; found; onOpen; describeDay; actions?; sessionKey?; gate? }",
    "Adds the [scan](/docs/scanner/) and the scenes hidden in the year.",
    "optional",
  ],
  viewer: [
    "ReactNode",
    "Shown under the video to someone who is not the creator, usually a way to make their own.",
    "optional",
  ],
  autoplay: ["boolean", "Starts playing as soon as the video is built. On unless you say otherwise.", "optional"],
  playerRef: [
    "Ref<WrappedPlayerHandle | null>",
    "The [player's handle](/docs/player/wrapped-player/): play, pause, seek.",
    "optional",
  ],
  className: ["string", "A class for the page's root.", "optional"],
  classNames: [
    "SlotClassNames<WrappedSlot>",
    'A class per part, by slot name, for the page and everything on it: `"view-player-panel"`, `"player-play"`, `"settings-chip"`. See [styling](/docs/guides/styling/).',
    "optional",
  ],
  loading: [
    "undefined",
    "Not passed with a year. Pass it in place of the year and the view is the [loading page](/docs/player/loading/).",
    "optional",
  ],
};

const firstWrapped: DocPage = {
  path: "/docs/first-wrapped/",
  section: "get-started",
  title: "Your first Wrapped",
  tagline: "install to a playing video",
  nav: "Your first Wrapped",
  description:
    "Build a first year in review video with react-wrapped in five steps: install, name the subject, bring your numbers, place three scenes, render WrappedView.",
  lead: "This page goes from an empty file to a video that plays: who it is about, a seed, three scenes and one component, with the settings working. It takes one file of about seventy lines. Everything comes from `@react-wrapped/kit`, the package with all the others in it.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "first-wrapped" },
      caption: "What the file on this page renders. Three scenes, and the settings beside them.",
    },
    { kind: "h2", text: "1. Install" },
    { kind: "code", language: "bash", code: "pnpm add @react-wrapped/kit gsap" },
    { kind: "p", text: "Load the stylesheet once, where your app starts:" },
    { kind: "code", language: "tsx", code: `import "@react-wrapped/kit/styles.css";` },
    {
      kind: "p",
      text: "The frame is set in Inter. [Installation](/docs/installation/) says how to load it.",
    },
    { kind: "h2", text: "2. Say who it is about" },
    {
      kind: "p",
      text: "The subject is the person the year belongs to. The handle and the caption sit in the top corner of every frame.",
    },
    { kind: "code", language: "tsx", code: excerpt(sourceOf("demos/first-wrapped.tsx"), "// Who the video is about.") },
    { kind: "h2", text: "3. Bring your numbers" },
    {
      kind: "p",
      text: "Scenes say what you hand them, so the numbers are yours to work out. Here they are made up: a count per day. Two of the scenes draw the year as a grid of cells, and `calendarFromCounts` turns the counts into that grid.",
    },
    { kind: "code", language: "tsx", code: excerpt(sourceOf("demos/first-wrapped.tsx"), "// Your numbers.") },
    { kind: "h2", text: "4. Place three scenes" },
    {
      kind: "p",
      text: "A scene is a function. The first argument is what it says, the second is its key and its label on the timeline. The array is the video, in play order. These three are the [opening](/docs/scenes/opening/), a [big number](/docs/scenes/big-number/) and a [list](/docs/scenes/list/).",
    },
    { kind: "code", language: "tsx", code: excerpt(sourceOf("demos/first-wrapped.tsx"), "// A scene is a function:") },
    {
      kind: "p",
      text: "Stars in a text are marks: single stars put words in the accent colour, double stars make them bold.",
    },
    { kind: "h2", text: "5. Render WrappedView" },
    {
      kind: "p",
      text: "`WrappedView` is the whole page: the player, its timeline and the settings. It needs the subject, the scenes, a seed and a config. The seed picks the transitions between scenes, so use something that is the person's own, such as their handle and the year. The config is everything a viewer can change, and it lives in your state.",
    },
    {
      kind: "code",
      language: "tsx",
      code: excerpt(sourceOf("demos/first-wrapped.tsx"), "export function FirstWrapped()"),
    },
    {
      kind: "p",
      text: "That is a playing video. Hover the timeline to switch a scene off, move it, or open it and rewrite its headline. Change the palette and the format in the settings. All of it lands in `config`.",
    },
    { kind: "h2", text: "The whole file" },
    fileBlock(sourceOf("demos/first-wrapped.tsx"), "first-wrapped.tsx"),
    { kind: "h2", text: "WrappedView props" },
    propsTable(VIEW_PROPS),
    { kind: "h2", text: "Where to go next" },
    {
      kind: "list",
      items: [
        "**More scenes.** There are [eleven](/docs/scenes/), and the [chart scene](/docs/scenes/chart/) takes any of the [twenty-one charts](/docs/charts/).",
        "**A link that is the video.** Keep the [config in the URL](/docs/guides/config-in-the-url/) and a shared link plays exactly what its owner set.",
        "**Things to keep.** Pass `share` for the download button and the [graphics](/docs/graphics/).",
        "**Hidden scenes.** Pass `opening` and the [scanner](/docs/scanner/) finds them.",
        "**Your own page.** [Build the page from parts](/docs/guides/from-parts/) when `WrappedView` is not the layout you want.",
        "**All of it at once.** The [full example](/examples/full-wrapped/) is a whole year, directed from data.",
      ],
    },
  ],
  related: [
    "/docs/installation/",
    "/docs/scenes/",
    "/docs/player/",
    "/docs/guides/config-in-the-url/",
    "/examples/full-wrapped/",
  ],
  updated: UPDATED,
};

/* ---------- the whole site ---------- */

export const SECTIONS: readonly Section[] = [
  { id: "get-started", title: "Get started", pages: [introduction, installation, firstWrapped, theming, formats] },
  { id: "scenes", title: "Scenes", pages: scenePages },
  { id: "charts", title: "Charts", pages: [chartsOverview, ...CHART_TYPES.map(chartPage)] },
  { id: "transitions", title: "Transitions", pages: [transitionsOverview, ...transitionPages] },
  { id: "player", title: "Player", pages: [...playerPages, extraPages.shareActions] },
  { id: "scanner", title: "Scanner", pages: [...scannerPages, extraPages.scanGate] },
  { id: "graphics", title: "Graphics", pages: graphicsPages },
  { id: "marks", title: "Marks", pages: marksPages },
  { id: "guides", title: "Guides", pages: [...guidePages, extraPages.labels, stylingPage] },
];

export const PAGES: readonly DocPage[] = SECTIONS.flatMap((section) => section.pages);

const BY_PATH = new Map(PAGES.map((page) => [page.path, page]));

export const pageAt = (path: string) => BY_PATH.get(path);

/** The pages that are not docs pages but still get linked to as "related". */
const OTHER_TITLES: Readonly<Record<string, string>> = {
  "/": "React Wrapped",
  "/designs/": "Designs",
  "/examples/full-wrapped/": "Full Wrapped example",
  "/examples/from-parts/": "From parts example",
};

export const titleOf = (path: string) => BY_PATH.get(path)?.title ?? OTHER_TITLES[path];

/** The page before and the page after, in sidebar order. */
export function neighboursOf(path: string): { previous?: DocPage; next?: DocPage } {
  const index = PAGES.findIndex((page) => page.path === path);
  return { previous: PAGES[index - 1], next: PAGES[index + 1] };
}
