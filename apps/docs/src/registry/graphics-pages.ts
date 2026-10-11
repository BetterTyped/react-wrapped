import { sourceOf } from "../content/sources";
import type { DocPage } from "../content/types";
import { type PropDocs, propsTable } from "./props";
import { code, fileBlock, UPDATED } from "./shared";
import type { GraphicsGallery, InsightCardSpec, ShareCardSpec, WrappedGraphic } from "@react-wrapped/graphics";
import { MARK_LAYERS, MARKS } from "@react-wrapped/marks";

/*
 * The graphics section (what a viewer keeps: the share card, insight cards and the gallery) and the marks page.
 */

const INSTALL = code("bash", ["pnpm add @react-wrapped/graphics @react-wrapped/core gsap"]);
const STYLES = code("tsx", [
  `import "@react-wrapped/core/styles.css";`,
  `import "@react-wrapped/graphics/styles.css";`,
]);

const SHARE_CARD_DOCS: PropDocs<ShareCardSpec> = {
  handle: ["string", "Written as @handle next to the avatar."],
  avatarUrl: [
    "string | null",
    "The picture. With `null`, or when it does not load, the handle's first two letters on a disc.",
  ],
  caption: ["string", "What this Wrapped is called. Set under the handle, before the period."],
  period: ["string", "The window the numbers cover, already formatted."],
  graph: [
    "{ levels: readonly number[]; lead: number }",
    "The year as cells, the same shape as a scene's calendar. Leave it out and the numbers move up.",
    "optional",
  ],
  stats: [
    "readonly { label: string; value: string }[]",
    "The headline numbers, already formatted. Up to four share the row.",
  ],
  tokens: [
    "readonly WrappedToken[]",
    "What this person got, as tinted plates at the bottom. The first two are drawn.",
    "optional",
  ],
  brand: ["string", "A quiet line in the top right: a site address or a product name.", "optional"],
};

const INSIGHT_DOCS: PropDocs<InsightCardSpec> = {
  handle: ["string", "Written as @handle above the chart."],
  caption: ["string", "The line after the handle: what this Wrapped is called and the period."],
  name: ["string", "What the card is called: an achievement's name, or the part of the year it shows."],
  rarity: [
    '"common" | "rare" | "epic" | "legendary"',
    "For an achievement. Its word goes under the name and its colour lights the chart's point.",
    "optional",
  ],
  stat: ["{ value: string; label: string }", "The headline number and what it counts, read as one sentence."],
  insight: ["string", "One line saying what the chart shows."],
  chart: [
    "SceneChart",
    "Any of the [charts](/docs/charts/), as data. Use the one the video plays for the same finding.",
  ],
  brand: ["string", "A quiet line under the chart: a site address or a product name.", "optional"],
};

const GRAPHIC_DOCS: PropDocs<WrappedGraphic> = {
  id: ["string", "Stable and unique in the gallery."],
  title: ["string", "The tile's heading."],
  line: ["string", "One line under it."],
  image: [
    "string | (() => Promise<Blob>)",
    "Where the picture comes from: the address of an image, or a function that draws it when the tile is about to be seen.",
  ],
  fileName: ["string", "The name of the saved file, without an extension. The gallery saves a PNG."],
  markdown: [
    "string",
    "A snippet that embeds the image. With one, the tile gets a second button that copies it.",
    "optional",
  ],
  locked: ["boolean", "Not found yet. The tile is shown closed, with nothing to download.", "optional"],
  wide: ["boolean", "Wide artwork, such as a card. The tile takes two columns.", "optional"],
};

const GALLERY_PROPS: PropDocs<Parameters<typeof GraphicsGallery>[0]> = {
  graphics: ["readonly WrappedGraphic[]", "The tiles. Unlocked ones are shown first, whatever order you pass."],
  palette: ["WrappedPalette", "The video's palette: `resolvePalette(config)`. Each tile sits on its background."],
};

const overview: DocPage = {
  path: "/docs/graphics/",
  section: "graphics",
  title: "Graphics",
  tagline: "cards a viewer keeps and posts",
  nav: "Overview",
  description:
    "The react-wrapped graphics package: a share card, insight cards with a chart each, and a gallery to download them from, all drawn in the browser as PNG.",
  lead: "A video gets watched once. A picture gets posted. The graphics package draws what a viewer takes away: one share card with the whole year on it, an insight card for each finding with its own chart, and a gallery under the video to download them from. Everything is drawn in the browser, in the palette the viewer picked.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "share-card" },
      caption: "Drawn on a canvas just now, in the palette picked below.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    STYLES,
    { kind: "h2", text: "What is in it" },
    {
      kind: "cards",
      items: [
        {
          path: "/docs/graphics/share-card/",
          title: "Share card",
          text: "The handle, the year's grid, four numbers and two tokens on one 1200 by 630 card.",
        },
        {
          path: "/docs/graphics/insight-cards/",
          title: "Insight cards",
          text: "One finding each: a big number, the chart that shows it, and one line.",
        },
        {
          path: "/docs/graphics/gallery/",
          title: "Graphics gallery",
          text: "Tiles under the video with a download button each, and locked ones for what the scan has not found.",
        },
      ],
    },
    { kind: "h2", text: "One size, one palette" },
    {
      kind: "list",
      items: [
        "Every card is 1200 by 630, the size link previews use, and is saved at twice that so it stays sharp.",
        "A card takes a `WrappedPalette`, the same object the stage reads. Pass `resolvePalette(config)` and the card wears the theme of the video it came from.",
        "Cards are drawn in the browser. On a server there is no canvas and no layout, so draw them in an effect or on a click.",
        "The numbers on a card are strings you formatted. Build the card and the [summary scene](/docs/scenes/summary/) from the same values and they always agree.",
      ],
    },
  ],
  related: [
    "/docs/graphics/share-card/",
    "/docs/graphics/insight-cards/",
    "/docs/graphics/gallery/",
    "/docs/scenes/summary/",
    "/docs/theming/",
  ],
  updated: UPDATED,
};

const shareCard: DocPage = {
  path: "/docs/graphics/share-card/",
  section: "graphics",
  title: "Share card",
  tagline: "the year as one 1200 x 630 PNG",
  nav: "Share card",
  description:
    "renderShareCard draws a year in review as one PNG in the browser: the handle, the year's calendar, four headline numbers and two tokens, in any palette.",
  lead: "`renderShareCard` draws the whole year on one card and gives it back as a PNG. It is painted on a canvas, so the file is the same on every machine: 1200 by 630, saved at twice that. Use it for the picture people post, pin to a profile or drop into a README.",
  blocks: [
    { kind: "preview", demo: { type: "part", id: "share-card" } },
    { kind: "h2", text: "Installation" },
    INSTALL,
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "Call it with a spec and a palette. It needs a browser, so call it from an effect or a click. The component below draws the card once per palette and shows it with a download link.",
    },
    fileBlock(sourceOf("demos/share-card.tsx"), "share-card.tsx"),
    { kind: "h2", text: "The spec" },
    propsTable(SHARE_CARD_DOCS, ["Key", "Type", "What it is"]),
    code("ts", [
      `import type { ShareCardSpec } from "@react-wrapped/graphics";`,
      `import { PIXEL_ART } from "@react-wrapped/core";`,
      ``,
      `export const card: ShareCardSpec = {`,
      `  handle: "ada",`,
      `  avatarUrl: null,`,
      `  caption: "Orbit Wrapped",`,
      `  period: "Oct 2025 to Oct 2026",`,
      `  stats: [`,
      `    { label: "Contributions", value: "2,052" },`,
      `    { label: "Longest streak", value: "48 days" },`,
      `    { label: "Biggest day", value: "58" },`,
      `    { label: "Top language", value: "TypeScript" },`,
      `  ],`,
      `  tokens: [{ name: "The Marathoner", kind: "Coder type", rarity: "epic", art: PIXEL_ART.mountain }],`,
      `  brand: "orbit.example",`,
      `};`,
    ]),
    { kind: "h2", text: "What it draws" },
    {
      kind: "list",
      items: [
        "The palette's background with one soft light in the top left corner, as on the video.",
        "The avatar or the initials, the handle, and the caption with the period after it.",
        "The year as cells, when you pass `graph`.",
        "The numbers in one row. A value too long for its column is set smaller until it fits.",
        "Up to two tokens at the bottom, each tinted in its rarity colour with its pixel art.",
      ],
    },
    {
      kind: "note",
      text: "The card is set in Inter and waits for the page's fonts before it draws. Load Inter on the page, or the text falls back to the system font. An avatar from another site has to allow cross-origin use, or the card draws the initials.",
    },
    { kind: "h2", text: "As a scene" },
    {
      kind: "p",
      text: "The same content closes the video as the [summary scene](/docs/scenes/summary/). In the [gallery](/docs/graphics/gallery/) the card is one tile: hand it `image: () => renderShareCard(card, palette)`.",
    },
  ],
  related: ["/docs/graphics/", "/docs/graphics/insight-cards/", "/docs/graphics/gallery/", "/docs/scenes/summary/"],
  updated: UPDATED,
};

const insightCards: DocPage = {
  path: "/docs/graphics/insight-cards/",
  section: "graphics",
  title: "Insight cards",
  tagline: "one finding, one chart, one PNG",
  nav: "Insight cards",
  description:
    "Insight cards put one finding of a year on a card: the headline number, any react-wrapped chart and one line. Shown as a React component or saved as PNG.",
  lead: "An insight card is one thing a year turned out to be: the number, the chart that shows it, and the line that says what it means. `InsightCard` is the card as a React component, and `renderInsightCard` is the same card as a PNG. Make one per finding, so a viewer has more than one picture worth posting.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "insight-card" },
      caption: "The component on the page, scaled to fit. The button saves it as a PNG.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    STYLES,
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "`InsightCard` always draws at 1200 by 630. To show it on a page, scale it into a box of that shape. To save it, call `renderInsightCard` with the same spec and palette.",
    },
    fileBlock(sourceOf("demos/insight-card.tsx"), "insight-card.tsx"),
    { kind: "h2", text: "The spec" },
    propsTable(INSIGHT_DOCS, ["Key", "Type", "What it is"]),
    code("ts", [
      `import type { InsightCardSpec } from "@react-wrapped/graphics";`,
      ``,
      `export const fridays: InsightCardSpec = {`,
      `  handle: "ada",`,
      `  caption: "Orbit Wrapped, Oct 2025 to Oct 2026",`,
      `  name: "Friday Shipper",`,
      `  rarity: "rare",`,
      `  stat: { value: "31%", label: "of your work landed on a Friday" },`,
      `  insight: "Contributions by weekday. The lit column is Friday.",`,
      `  chart: {`,
      `    type: "bars",`,
      `    bars: [`,
      `      { label: "M", value: 312 },`,
      `      { label: "T", value: 341 },`,
      `      { label: "W", value: 330 },`,
      `      { label: "T", value: 352 },`,
      `      { label: "F", value: 398, peak: true },`,
      `      { label: "S", value: 84 },`,
      `      { label: "S", value: 61 },`,
      `    ],`,
      `  },`,
      `};`,
    ]),
    { kind: "h2", text: "Good to know" },
    {
      kind: "list",
      items: [
        'The number is sized to its length: "31%" is set bigger than "12,480". Keep `stat.value` short.',
        "With a `rarity` the chart's point takes that rarity's colour. A common one, or a card with no rarity, lights it in the card's own ink.",
        "`renderInsightCard` lays the card out off screen and captures it at twice its size. Captures run one at a time, so asking for ten at once does not freeze the page.",
        "The chart on a card is drawn finished. Entrances belong to the video.",
      ],
    },
  ],
  related: [
    "/docs/graphics/",
    "/docs/charts/",
    "/docs/graphics/gallery/",
    "/docs/graphics/share-card/",
    "/docs/scenes/fact/",
  ],
  updated: UPDATED,
};

const gallery: DocPage = {
  path: "/docs/graphics/gallery/",
  section: "graphics",
  title: "Graphics gallery",
  tagline: "tiles to download, some locked",
  nav: "Gallery",
  description:
    "GraphicsGallery lays out everything a Wrapped gives its owner to keep as tiles with a download button, and shows locked tiles for what is still hidden.",
  lead: "`GraphicsGallery` is the section under the video where a viewer collects their pictures. Each graphic is a tile on the palette's own background with a download button. A graphic the scan has not found yet is a locked tile, so there is always one more to get.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "gallery" },
      caption: "The share card, three insight cards and two that are still locked.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    STYLES,
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "Describe each graphic as a `WrappedGraphic` and pass the list with the palette. A graphic can be an image that already has an address, or a function that draws it. Memoize the list: a tile draws its image again whenever its `image` function changes.",
    },
    fileBlock(sourceOf("demos/gallery.tsx"), "things-to-keep.tsx"),
    { kind: "h2", text: "Props" },
    propsTable(GALLERY_PROPS),
    { kind: "h2", text: "A graphic" },
    propsTable(GRAPHIC_DOCS, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "Locked tiles" },
    {
      kind: "p",
      text: 'Set `locked` on a graphic that belongs to a drop the [scan](/docs/scanner/) has not found. The tile shows a lock and "Still hidden", the heading counts only what can be taken, and the line under it says how many more are waiting. When the scan finds the drop, pass the graphic again without `locked` and its tile draws itself.',
    },
    { kind: "h2", text: "Drawing and downloading" },
    {
      kind: "list",
      items: [
        "A tile draws its image when it is about to scroll into view, not when the page loads. A gallery of ten cards three screens down costs nothing until someone gets there.",
        "Download saves a PNG named `fileName`. An image given by address is fetched and redrawn at twice its size first, so an SVG badge becomes a PNG people can post.",
        "With `markdown` set, a second button copies that snippet. Use it for images you host, such as a badge for a README that should stay live.",
        "A graphic with `wide` takes two columns. The grid is one column on a phone, two on a tablet and four on a wide screen.",
      ],
    },
  ],
  related: [
    "/docs/graphics/share-card/",
    "/docs/graphics/insight-cards/",
    "/docs/scanner/",
    "/docs/graphics/",
    "/examples/full-wrapped/",
  ],
  updated: UPDATED,
};

export const graphicsPages: readonly DocPage[] = [overview, shareCard, insightCards, gallery];

/* ---------- marks ---------- */

const MARK_IDS = Object.keys(MARKS);
const LAYERED = Object.keys(MARK_LAYERS);

const marks: DocPage = {
  path: "/docs/marks/",
  section: "marks",
  title: "Marks",
  tagline: "a logo pressed into the corner",
  nav: "Marks",
  description:
    "Marks are logos pressed into the bottom right corner of a react-wrapped frame, as SVG path data. Use one from the marks package or pass your own path.",
  lead: "A mark is the logo in the bottom right corner of the frame: what the year is about. It is not pasted on like a sticker. The stage presses it out of the palette's own colours, lit from the top left, so it belongs to the frame in every theme. Set it with `subject.mark`, from the marks package or from a path of your own.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "marks" },
      caption: "Pick a mark and look at the bottom right corner of the frame.",
    },
    { kind: "h2", text: "Installation" },
    code("bash", ["pnpm add @react-wrapped/marks @react-wrapped/core"]),
    {
      kind: "p",
      text: "The package is data only: path strings, no components and no stylesheet. `@react-wrapped/kit` includes it.",
    },
    { kind: "h2", text: "Usage" },
    code("tsx", [
      `import type { WrappedSubject } from "@react-wrapped/core";`,
      `import { markOf } from "@react-wrapped/marks";`,
      ``,
      `export const subject: WrappedSubject = {`,
      `  handle: "ada",`,
      `  name: "Ada",`,
      `  avatarUrl: null,`,
      `  caption: "Orbit Wrapped",`,
      `  period: "Oct 2025 to Oct 2026",`,
      `  mark: markOf("${MARK_IDS[0]}"),`,
      `};`,
    ]),
    {
      kind: "p",
      text: "Leave `mark` out and the corner keeps its plain pressed discs. The component below is the preview above: every mark as a small SVG, and the picked one pressed into a player's frame.",
    },
    fileBlock(sourceOf("demos/marks.tsx"), "mark-picker.tsx"),
    { kind: "h2", text: "Your own mark" },
    {
      kind: "p",
      text: "A mark is SVG path data drawn in a box of 24 by 24: the `d` of a `path`. Pass your logo's path as a string. For a logo made of several shapes that should stay apart, pass an array with one path per shape, and each is pressed out on its own.",
    },
    code("tsx", [
      `import type { StageMark } from "@react-wrapped/core";`,
      ``,
      `// One shape: a ring with a dot in it. Fill is not needed: the stage colours and lights the mark itself.`,
      `export const ORBIT: StageMark =`,
      `  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";`,
      ``,
      `// Two shapes kept apart: each gets its own edge.`,
      `export const TWO_BARS: StageMark = ["M4 4h6v16H4z", "M14 9h6v11h-6z"];`,
    ]),
    {
      kind: "list",
      items: [
        "Use a single colour version of the logo. Colours in the artwork are ignored.",
        "Fill the box. A logo drawn small in the middle of its 24 by 24 comes out small in the corner.",
        "Keep shapes bold. Hairlines vanish once the mark is pressed into the background.",
      ],
    },
    { kind: "h2", text: "What the package exports" },
    {
      kind: "table",
      head: ["Export", "What it is"],
      rows: [
        ["`MARKS`", `Every mark by id, each as one path string. There are ${MARK_IDS.length}.`],
        ["`MarkId`", "The ids, as a type."],
        [
          "`markOf(id)`",
          "A mark ready for `subject.mark`: one path, or one path per shape for a mark made of several.",
        ],
        [
          "`MARK_LAYERS`",
          `The marks that are more than one flat shape, back to front, each layer with its own fill for drawing the mark in its own colours. Today: ${LAYERED.map((id) => `\`${id}\``).join(", ")}.`,
        ],
      ],
    },
    { kind: "h2", text: "Every mark" },
    {
      kind: "p",
      text: `The ids in \`MARKS\`: ${MARK_IDS.map((id) => `\`${id}\``).join(", ")}. The picker at the top of this page draws each of them.`,
    },
    {
      kind: "note",
      text: "The names and logos belong to their owners. A path in this package is there so a year about that product can show whose year it is. It is not a claim on the mark, and it does not mean the owner endorses this library or your app. Check a brand's own guidelines before you ship its logo.",
    },
  ],
  related: ["/docs/player/wrapped-player/", "/docs/theming/", "/docs/first-wrapped/", "/docs/player/loading/"],
  updated: UPDATED,
};

export const marksPages: readonly DocPage[] = [marks];
