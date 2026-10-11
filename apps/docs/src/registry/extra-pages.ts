import { sourceOf } from "../content/sources";
import type { DocPage } from "../content/types";
import { type PropDocs, propsTable } from "./props";
import { code, fileBlock, UPDATED } from "./shared";
import type { WrappedProvider } from "@react-wrapped/core";
import type { ShareActions } from "@react-wrapped/player";
import type { useScanGate } from "@react-wrapped/scan";

/*
 * Pages for the parts that were opened up last: every word the library shows, the share row, and the hook behind
 * the scan first flow.
 */

const PROVIDER_PROPS: PropDocs<Parameters<typeof WrappedProvider>[0]> = {
  labels: [
    "WrappedLabelOverrides",
    "The words to replace, in the shape of `DEFAULT_LABELS`. Anything left out keeps its English.",
    "optional",
  ],
  locale: [
    "string",
    'How the controls write numbers, such as `"pl-PL"`. Left out, it is the provider\'s above, or `"en-US"`.',
    "optional",
  ],
  children: ["ReactNode", "Everything that should read its words from this provider.", "optional"],
};

const LABEL_GROUPS: readonly (readonly [string, string])[] = [
  ["`player`", "The transport under the video: play, pause, full screen, the clock."],
  ["`timeline`", "The row of segments and the preview that opens over one."],
  ["`editor`", "The scene editor: its title, its buttons, the transition picker."],
  ["`fields`", 'A scene\'s editable fields, by their English name: `{ Headline: "Nagłówek" }`.'],
  ["`settings`", "The settings panel: colours, format, cells, speed, grain."],
  ["`scan`", "The year scan: its headline for every state, its buttons, the card it turns over."],
  ["`gallery`", "The graphics to keep: heading, locked tiles, download buttons."],
  ["`share`", "Copy link, Download, and the line shown while the video file is made."],
  ["`video`", "Why a video file could not be made."],
  ["`rarity`", "Common, Rare, Epic, Legendary."],
  ["`scenes`, `charts`", "The few words the ready-made scenes and charts print on their own."],
  ["`palettes`, `transitions`, `formats`", "Names by id. Empty by default: a missing id keeps its built-in name."],
];

const labels: DocPage = {
  path: "/docs/guides/labels/",
  section: "guides",
  title: "Labels and translation",
  tagline: "every word, replaceable",
  nav: "Labels and translation",
  description:
    "Translate or reword everything react-wrapped shows: 106 labels in one object, replaced through WrappedProvider, with plural forms as functions.",
  lead: "Every word the library shows on its own, from Play to the scan's headlines, lives in one object: `DEFAULT_LABELS`. Wrap any part of your page in `WrappedProvider` and hand it the words you want instead. Use it to translate the interface, or just to make it sound like your product.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "labels" },
      caption: "The year scan in Polish. Run it: the headlines count in Polish too.",
    },
    fileBlock(sourceOf("demos/labels.tsx"), "scan-in-polish.tsx"),
    { kind: "h2", text: "How it works" },
    {
      kind: "list",
      items: [
        "**Replace only what you need.** `labels` is a partial of `DEFAULT_LABELS`. Anything you leave out stays as it is.",
        "**A sentence with a number in it is a function.** `scan.hiding` gets the count and returns the sentence, so a language with three plural forms can have all three.",
        "**Providers nest.** One around your app can set the language, and one around a single player can reword that player. The inner one is merged over the outer one.",
        "**No provider is fine.** Without one, every part reads the English defaults.",
        "**Your scenes are yours.** The text you pass to a scene is never touched. Labels cover only the words the library adds itself.",
      ],
    },
    { kind: "h2", text: "The groups" },
    { kind: "table", head: ["Group", "What it holds"], rows: LABEL_GROUPS },
    {
      kind: "p",
      text: "The object is typed, so your editor lists every key and what each function is given. Read `DEFAULT_LABELS` in `@react-wrapped/core` for the full English text.",
    },
    { kind: "h2", text: "Props" },
    propsTable(PROVIDER_PROPS),
    { kind: "h2", text: "Outside React" },
    {
      kind: "p",
      text: "Three functions draw without React and take their words as an argument: `renderShareCard(spec, palette, { labels, locale })`, `renderInsightCard(spec, palette, { labels, locale })` and `renderVideo(take, size, { labels })`. Build the full table for them with `mergeLabels(DEFAULT_LABELS, yours)`. Inside a component, `useLabels()` hands you the merged table of the nearest provider.",
    },
    code("tsx", [
      `import { DEFAULT_LABELS, mergeLabels, resolvePalette } from "@react-wrapped/core";`,
      `import { renderShareCard } from "@react-wrapped/graphics";`,
      ``,
      `const labels = mergeLabels(DEFAULT_LABELS, { rarity: { legendary: "Legendarne" } });`,
      `const png = await renderShareCard(card, resolvePalette(config), { labels, locale: "pl-PL" });`,
    ]),
    { kind: "h2", text: "What is not covered yet" },
    {
      kind: "list",
      items: [
        "Numbers drawn inside the video itself (a counter, a chart's pill) are written the `en-US` way: 1,687. Only the controls around the video follow `locale`.",
        "Hour names in the charts (`hourName`) are English. Pass your own labels in the chart's data where it takes them.",
      ],
    },
  ],
  related: [
    "/docs/guides/palette-and-chrome/",
    "/docs/scanner/year-scan/",
    "/docs/player/wrapped-player/",
    "/docs/guides/from-parts/",
  ],
  updated: UPDATED,
};

const SHARE_PROPS: PropDocs<Parameters<typeof ShareActions>[0]> = {
  player: [
    "RefObject<WrappedPlayerHandle | null>",
    "The player to film: the same ref you gave `WrappedPlayer`. The row borrows its stage while the file is made.",
  ],
  config: ["WrappedConfig", "The video's config. The file is made in its format, at full size."],
  fileName: ["string", "What the saved file is called, extension included: `ada-wrapped.mp4`."],
  onRendering: [
    "(rendering: boolean) => void",
    "Says when a file starts and stops being made, so the page can keep its hands off the video meanwhile.",
    "optional",
  ],
  onError: [
    "(message: string) => void",
    "Told why a video could not be made. Left out, the reason is shown under the buttons.",
    "optional",
  ],
  className: ["string", "A class for the row's own box, for the card you put around it.", "optional"],
};

const shareActions: DocPage = {
  path: "/docs/player/share-actions/",
  section: "player",
  title: "ShareActions",
  tagline: "copy the link, save the video",
  nav: "ShareActions",
  description:
    "ShareActions is the row beside a react-wrapped video: Copy link and Download. Download makes an MP4 in the browser, with progress and a stop button.",
  lead: "`ShareActions` is the two things people do first with their video: send the link and save the file. Download makes an MP4 in the page from the player's own stage, shows how far it is and how long is left, and can be stopped. It is the row `WrappedView` puts above the settings, on its own for a page you build yourself.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "share-actions" },
      caption: "Download really makes the file: a short video, drawn frame by frame in this page.",
    },
    { kind: "h2", text: "Installation" },
    code("bash", ["pnpm add @react-wrapped/player @react-wrapped/core gsap"]),
    { kind: "h2", text: "Usage" },
    fileBlock(sourceOf("demos/share-actions.tsx"), "video-with-share.tsx"),
    {
      kind: "p",
      text: "The [from parts example](/examples/from-parts/) uses it this way, next to the settings panel.",
    },
    { kind: "h2", text: "Props" },
    propsTable(SHARE_PROPS),
    { kind: "h2", text: "Good to know" },
    {
      kind: "list",
      items: [
        "The file is not a screen recording. Every frame is drawn at the video's real size and encoded by the browser, so it is sharp on any machine. See [video export](/docs/player/video-export/) for how, and for making the file without this row.",
        "Copy link copies the page's address. Keep the config in the URL and the link is the video: see [the config in the URL](/docs/guides/config-in-the-url/).",
        "Its words are labels: `share.copyLink`, `share.download` and the rest can be replaced through [`WrappedProvider`](/docs/guides/labels/).",
      ],
    },
  ],
  related: [
    "/docs/player/video-export/",
    "/docs/player/wrapped-player/",
    "/docs/guides/from-parts/",
    "/docs/guides/config-in-the-url/",
  ],
  updated: UPDATED,
};

const GATE_OPTIONS: PropDocs<Parameters<typeof useScanGate>[0]> = {
  enabled: [
    "boolean",
    "Whether this Wrapped opens on its scan at all: someone's own year with drops in it, not an example.",
  ],
  found: ["number", "How many drops have been found so far."],
  id: [
    "string | null",
    "Which Wrapped this is, such as its seed, so another year opened in the same place starts at its own scan.",
  ],
  beat: [
    "number",
    "Milliseconds the finished scan stays up before the video takes over. 900 unless you say.",
    "optional",
  ],
};

const GATE_RESULT: PropDocs<ReturnType<typeof useScanGate>> = {
  gated: ["boolean", "True while the scan is the page. Render the scan alone, and pass this on as its `gate`."],
  onRunChange: [
    "(running: boolean) => void",
    "Hand it to `YearScan`. It is how the hook knows a scan started or came to rest.",
  ],
};

const scanGate: DocPage = {
  path: "/docs/scanner/use-scan-gate/",
  section: "scanner",
  title: "useScanGate",
  tagline: "the scan first, then the video",
  nav: "useScanGate",
  description:
    "useScanGate is the React hook behind the scan first flow: the year scan is the page until it has run once, then the video and settings take over.",
  lead: "`useScanGate` decides when the scan is the whole page. A creator who has opened nothing yet sees the scan alone, with one button. When a scan has come to rest with something found, the video takes over, and it never goes back. `WrappedView` uses this hook when you set `opening.gate`. Reach for it when you build the page yourself.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "scan-first" },
      caption: "A page that opens on its scan. Find the scenes and the video takes over.",
    },
    { kind: "h2", text: "Usage" },
    code("tsx", [excerpt()]),
    {
      kind: "p",
      text: "That is from the [from parts example](/examples/from-parts/). While `gated` is true it renders the scan in a box as tall as the video will be and nothing else. Afterwards it renders the player, the settings and the gallery, with the same scan under them.",
    },
    { kind: "h2", text: "Options" },
    propsTable(GATE_OPTIONS, ["Option", "Type", "What it does"]),
    { kind: "h2", text: "What it returns" },
    propsTable(GATE_RESULT, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "The rules it keeps" },
    {
      kind: "list",
      items: [
        "The page stays the scan's while the scan it started is still going. The first find must not pull the layout out from under the ones after it.",
        "A scan stopped with nothing found leaves the scan as the page, ready to run again.",
        "A scan run later, under the video, never takes the page back.",
        "Someone who has already found something, on an earlier visit, goes straight to the video: read `found` from [`useOpenedDrops`](/docs/scanner/use-opened-drops/).",
      ],
    },
  ],
  related: [
    "/docs/scanner/",
    "/docs/scanner/year-scan/",
    "/docs/scanner/use-opened-drops/",
    "/docs/guides/from-parts/",
  ],
  updated: UPDATED,
};

/** The two lines of the from-parts example that use the hook, shown as they are in that file. */
function excerpt(): string {
  const source = sourceOf("examples/from-parts.tsx");
  const start = source.indexOf("  // With `gate`, the scan is the page");
  if (start === -1) throw new Error("The from-parts example no longer has its scan first lines.");
  const end = source.indexOf("\n\n", start);
  return [
    `import { useOpenedDrops, useScanGate, YearScan } from "@react-wrapped/scan";`,
    ``,
    ...source
      .slice(start, end)
      .split("\n")
      .map((line) => line.replace(/^ {2}/, "")),
  ].join("\n");
}

export const extraPages = { labels, shareActions, scanGate };
