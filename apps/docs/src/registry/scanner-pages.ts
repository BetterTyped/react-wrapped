import { sourceOf } from "../content/sources";
import type { DocPage } from "../content/types";
import { type PropDocs, propsTable } from "./props";
import { code, fileBlock, UPDATED } from "./shared";
import type { WrappedView } from "@react-wrapped/kit";
import type { HiddenDrop, useOpenedDrops, YearScan } from "@react-wrapped/scan";

/*
 * The scanner section: the year scan, the drops it finds and how rare they are, and the hook that remembers what
 * was opened.
 */

const INSTALL = code("bash", ["pnpm add @react-wrapped/scan @react-wrapped/core gsap"]);
const STYLES = code("tsx", [`import "@react-wrapped/core/styles.css";`, `import "@react-wrapped/scan/styles.css";`]);

const SCAN_PROPS: PropDocs<Parameters<typeof YearScan>[0]> = {
  calendar: ["CalendarLevels", "The year the scan sweeps. Use the one the video draws, so both show the same year."],
  palette: [
    "WrappedPalette",
    "The video's palette: `resolvePalette(config)`. The panel and the rarity colours follow it.",
  ],
  drops: [
    "readonly HiddenDrop[]",
    "Every hidden scene, found or not, in the order the scan opens them. With none, nothing is drawn.",
  ],
  found: ["readonly string[]", "The ids of the drops already opened."],
  onOpen: [
    "(id: string) => void",
    "A card was turned over. Add the id to `found` and put that drop's scene in the video.",
  ],
  describeDay: ["(day: number) => string", "How a day reads on a found card, by its index in `calendar.levels`."],
  actions: ["ReactNode", "Extra buttons for the panel's header, such as a link to every achievement.", "optional"],
  sessionKey: [
    "string | null",
    "A session storage key. With one, each find keeps its day for the visit, so a replay opens the same cells.",
    "optional",
  ],
  gate: [
    "boolean",
    "The scan is the page for now: the panel says the video is almost ready and offers nothing but the scan.",
    "optional",
  ],
  onRunChange: [
    "(running: boolean) => void",
    "A scan started, or came to rest: finished, stopped or skipped to its end.",
    "optional",
  ],
  className: ["string", "A class for the panel.", "optional"],
  classNames: [
    "SlotClassNames<YearScanSlot>",
    'A class per part, by slot name: `"scan-start"`, `"scan-card"`. See [styling](/docs/guides/styling/).',
    "optional",
  ],
};

const DROP_DOCS: PropDocs<HiddenDrop> = {
  id: ["string", "Stable for this drop. `found` and `onOpen` speak in ids."],
  name: ["string", "What the card and the badge call it."],
  rarity: [
    '"common" | "rare" | "epic" | "legendary"',
    "How rare it is. Decides the colour and how big a show the card gets.",
  ],
  kind: ["string", 'The small word next to the rarity: "Achievement", "Easter egg".'],
  line: ["string", "One line on the back of the card, in this year's own numbers."],
  art: ["PixelArt", "Nine rows of nine characters: `x` lit, `o` half lit, `.` off."],
};

const OPENING_DOCS: PropDocs<NonNullable<Extract<Parameters<typeof WrappedView>[0], { subject: unknown }>["opening"]>> =
  {
    calendar: ["CalendarLevels", "Handed on to the scan."],
    drops: ["readonly HiddenDrop[]", "Handed on to the scan."],
    found: ["readonly string[]", "Handed on to the scan."],
    onOpen: ["(id: string) => void", "Handed on to the scan."],
    describeDay: ["(day: number) => string", "Handed on to the scan."],
    actions: ["ReactNode", "Handed on to the scan.", "optional"],
    sessionKey: ["string | null", "Handed on to the scan.", "optional"],
    gate: [
      "boolean",
      "Puts the scan first. Until the creator has run it once, the scan is the page and the video is not shown.",
      "optional",
    ],
  };

const OPENED_DOCS: PropDocs<ReturnType<typeof useOpenedDrops>> = {
  opened: ["readonly string[]", "The ids opened so far, in the order they were opened."],
  open: ["(id: string) => void", "Adds an id and writes the list to storage. An id already there is ignored."],
  ready: ["boolean", "True once storage has been read. Before that, `opened` is empty for everyone."],
};

const overview: DocPage = {
  path: "/docs/scanner/",
  section: "scanner",
  title: "Scanner",
  tagline: "find the hidden scenes of a year",
  nav: "Overview",
  description:
    "The react-wrapped scanner: a beam sweeps the year's calendar, finds hidden scenes with a rarity each, and adds them to the video as they are opened.",
  lead: "The scanner is the part of a Wrapped people come back to. Some scenes of the video start out hidden somewhere in the year: achievements that were earned, an easter egg or two. A beam sweeps the calendar, locks onto a day, a card flies out and turns over, and that scene joins the video. Use it when part of the story should be found, not just watched.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "year-scan" },
      caption: "Press the button. Click a card to turn it, click again to add it.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    STYLES,
    { kind: "h2", text: "What is in it" },
    {
      kind: "cards",
      items: [
        {
          path: "/docs/scanner/year-scan/",
          title: "YearScan",
          text: "The panel: the year, the beam, the cards and the list of finds.",
        },
        {
          path: "/docs/scanner/drops/",
          title: "Rarity and drops",
          text: "What a hidden scene is, the four rarities, and which drops a year gets.",
        },
        {
          path: "/docs/scanner/use-opened-drops/",
          title: "useOpenedDrops",
          text: "Remembers what was opened, on this device or for this visit.",
        },
      ],
    },
    { kind: "h2", text: "How a find becomes a scene" },
    {
      kind: "steps",
      items: [
        "You decide which scenes are hidden and describe each as a `HiddenDrop`: a name, a rarity, a line and pixel art.",
        "The scan gets all of them in `drops` and the ids already opened in `found`.",
        "When a card is turned over the scan calls `onOpen(id)`.",
        "You add the id to `found` and build your scenes again, this time with that drop's scene in them. Give that scene the key `drop-` followed by the drop's id.",
        "The player rebuilds only what changed, and the card flies to the timeline segment with that key.",
      ],
    },
    {
      kind: "p",
      text: "So a drop is never a special kind of scene. It is an ordinary scene, usually a [fact scene](/docs/scenes/fact/), that your code leaves out until its id is in `found`.",
    },
    { kind: "h2", text: "Scan first" },
    {
      kind: "p",
      text: 'For someone\'s own year the scan can come before the video. With `opening.gate` on `WrappedView`, a creator who has opened nothing gets the scan as the whole page. It says "Your Wrapped is almost ready." and offers one button. When the scan has run and found something, the video takes its place and the scan moves under it. Anyone who has scanned before, and anyone only watching a shared link, gets the video straight away.',
    },
    { kind: "preview", demo: { type: "part", id: "scan-first" }, caption: "The whole page, starting from the scan." },
    fileBlock(sourceOf("demos/scan-first.tsx"), "scan-first.tsx"),
    {
      kind: "p",
      text: "`opening` is everything `WrappedView` needs to run the scan for you:",
    },
    propsTable(OPENING_DOCS, ["Key", "Type", "What it does"]),
    {
      kind: "p",
      text: "The [full example](/examples/full-wrapped/) has a switch for both starts. To run the same flow without `WrappedView`, see [build the page from parts](/docs/guides/from-parts/).",
    },
  ],
  related: [
    "/docs/scanner/year-scan/",
    "/docs/scanner/drops/",
    "/docs/scenes/fact/",
    "/docs/guides/from-parts/",
    "/examples/full-wrapped/",
  ],
  updated: UPDATED,
};

const yearScan: DocPage = {
  path: "/docs/scanner/year-scan/",
  section: "scanner",
  title: "YearScan",
  tagline: "the scan that reveals drops",
  nav: "YearScan",
  description:
    "YearScan is the React component that sweeps a year's calendar with a beam, reveals hidden scenes as cards with a rarity, and lists what was found.",
  lead: "`YearScan` is the panel under the video with the year on it. Before the first scan the year is blank. Press the button and a beam colours it week by week, doubles back, and stops on a day. A card comes out of that cell, turns over, and lands in the video. Afterwards the panel lists the finds, and the scan can be played again.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "year-scan" },
      caption: "The readout under the panel is the demo's own state.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    STYLES,
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "The scan holds no list of finds. You give it `found` and it tells you through `onOpen` when there is one more. The component below is the preview above.",
    },
    {
      kind: "note",
      text: "One name is agreed between the scan and your scenes: the scene of a drop has the key `drop-` followed by the drop's id. A found card flies to the timeline segment with that key. With any other key the scene still joins the video, and the card fades out where it is.",
    },
    fileBlock(sourceOf("demos/year-scan.tsx"), "scan-the-year.tsx"),
    { kind: "h2", text: "Props" },
    propsTable(SCAN_PROPS),
    { kind: "h2", text: "What the viewer does" },
    {
      kind: "list",
      items: [
        "**Scan my year** starts a run through every drop not found yet, one after another.",
        "**The card** comes out face down. A click turns it over, and a second click sends it into the video. Left alone it does both by itself, staying face up as long as its text takes to read.",
        "**Find all** skips the rest of a run and opens everything that is left.",
        "**A click outside the card** stops the run. A card already turned over still lands. One still face down goes back unopened.",
        "**Scan again** replays the finds once everything is found. Nothing new joins the video.",
        "**The badges** under the year list the finds. A click on one, or on its cell in the year, brings its card back up until Escape or another click.",
      ],
    },
    { kind: "h2", text: "Where a drop hides" },
    {
      kind: "p",
      text: "The scan picks the day, at random among the active days of the year, and no two drops share one. So a drop has no date of its own: `describeDay` only says how the day the scan picked reads on the card. With a `sessionKey` each find keeps its day for the rest of the visit, so replays open the same cells. Finds from an earlier visit get a day as soon as the panel mounts.",
    },
    { kind: "h2", text: "gate and onRunChange" },
    {
      kind: "p",
      text: "`gate` is for the [scan first](/docs/scanner/) flow. The panel fills the box the video is about to take, its headline says the Wrapped is almost ready, and a found card lands on its badge because there is no timeline yet. `onRunChange` tells you when a run starts and when it comes to rest. Keep `gate` on while a run you started from the gate is still going, or the first find swaps the page out from under the ones after it.",
    },
    code("tsx", [
      `import { useState } from "react";`,
      ``,
      `// Inside your page component, next to the list of found ids.`,
      `const [running, setRunning] = useState(false);`,
      `const [passed, setPassed] = useState(false);`,
      `// The scan is the page until one run has come to rest with something found.`,
      `const gated = !passed && (found.length === 0 || running);`,
      ``,
      `const onRunChange = (now: boolean) => {`,
      `  setRunning(now);`,
      `  if (!now && found.length > 0) setPassed(true);`,
      `};`,
    ]),
    {
      kind: "p",
      text: "The [from parts example](/examples/from-parts/) has this wired into a whole page.",
    },
    { kind: "h2", text: "Rarity on screen" },
    {
      kind: "p",
      text: "Every find flares its cell in its rarity colour. The rarer the drop, the longer the card hums before it turns, and a legendary one gets the full show: a flash, a turning foil border and sparkles. The colours come from the palette, so they change with the theme. See [rarity and drops](/docs/scanner/drops/).",
    },
  ],
  related: [
    "/docs/scanner/",
    "/docs/scanner/drops/",
    "/docs/scanner/use-opened-drops/",
    "/docs/scenes/fact/",
    "/docs/player/timeline/",
  ],
  updated: UPDATED,
};

const drops: DocPage = {
  path: "/docs/scanner/drops/",
  section: "scanner",
  title: "Rarity and drops",
  tagline: "hidden scenes and how rare",
  nav: "Rarity and drops",
  description:
    "Drops are the hidden scenes of a react-wrapped video. Each has one of four rarities, a colour from the palette, and becomes a scene once the scan finds it.",
  lead: "A drop is a scene that starts out hidden: an achievement the year earned, or an easter egg handed out by luck. Each has a rarity, common, rare, epic or legendary, and the rarity decides its colour everywhere it shows up. This page covers the data a drop is made of and how one turns into a scene.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "rarities" },
      caption: "The four rarities in the current palette, then the sample year's drops.",
    },
    { kind: "h2", text: "The four rarities" },
    {
      kind: "table",
      head: ["Rarity", "Label", "Colour variable"],
      rows: [
        ["`common`", "Common", "`--wr-common`"],
        ["`rare`", "Rare", "`--wr-rare`"],
        ["`epic`", "Epic", "`--wr-epic`"],
        ["`legendary`", "Legendary", "`--wr-legendary`"],
      ],
    },
    {
      kind: "p",
      text: "`RARITY_LABELS` maps each rarity to its word. The colours are not fixed: every palette brings four that sit well on it, in `palette.rarity`, and the custom palette cuts them from your accent. On a stage, `data-rarity` on an element sets `--wr-rarity` for everything inside it, which is how a chart lights its point in the colour of the scene it is in.",
    },
    fileBlock(sourceOf("demos/rarities.tsx"), "rarities.tsx"),
    { kind: "h2", text: "A hidden drop" },
    {
      kind: "p",
      text: "`HiddenDrop` is what the scan knows about a drop: enough to draw its card. The scene itself is yours and stays out of the video until the drop is found.",
    },
    propsTable(DROP_DOCS, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "From a drop to a scene" },
    {
      kind: "p",
      text: "Build your scenes from the list of opened ids. A drop that has been opened gets a scene, placed with `drop` set to its rarity (the timeline colours its segment) and with `locked` (nobody rewrites what was assigned):",
    },
    code("tsx", [
      `import { PIXEL_ART, RARITY_LABELS, type SceneInstance } from "@react-wrapped/core";`,
      `import type { HiddenDrop } from "@react-wrapped/scan";`,
      `import { factScene } from "@react-wrapped/scenes";`,
      ``,
      `const DROPS: readonly HiddenDrop[] = [`,
      `  {`,
      `    id: "long-haul",`,
      `    name: "Long Haul",`,
      `    rarity: "epic",`,
      `    kind: "Achievement",`,
      `    line: "48 days in a row without missing one.",`,
      `    art: PIXEL_ART.flame,`,
      `  },`,
      `];`,
      ``,
      `/** The scenes of every drop opened so far. Add them to the story where they belong. */`,
      `export function dropScenes(opened: readonly string[]): SceneInstance[] {`,
      `  return DROPS.filter((drop) => opened.includes(drop.id)).map((drop) =>`,
      `    factScene(`,
      `      {`,
      `        stamp: RARITY_LABELS[drop.rarity],`,
      `        rarity: drop.rarity,`,
      `        title: [drop.name],`,
      `        description: drop.line,`,
      `        art: drop.art,`,
      `        variant: 0,`,
      `      },`,
      `      { key: \`drop-\${drop.id}\`, label: drop.name, drop: drop.rarity, locked: true },`,
      `    ),`,
      `  );`,
      `}`,
    ]),
    {
      kind: "p",
      text: "Give a drop's scene a place in the story, not the end of it: put it right after the scene it continues. When the viewer has reordered the cut by hand, `arrangeScenes` still drops a new scene in after the one you put before it.",
    },
    { kind: "h2", text: "Which drops a year gets" },
    {
      kind: "p",
      text: "`cutDrops` picks the drops a video really gets out of everything a year qualified for. It follows two rules. At most one easter egg: a video padded with eggs is a run of jokes. And every other drop is an achievement that can draw a picture of its own numbers, with no two drawing the same kind of picture.",
    },
    code("ts", [
      `import { cutDrops } from "@react-wrapped/scan";`,
      ``,
      `interface Trait {`,
      `  id: string;`,
      `  kind: "achievement" | "easterEgg";`,
      `  /** The chart this achievement would draw for this year, or null when it has none. */`,
      `  chart: string | null;`,
      `}`,
      ``,
      `export function dropsFor(rolled: readonly Trait[], earned: readonly Trait[]): Trait[] {`,
      `  // \`drops\` is what was rolled: its length is how many slots there are, and its egg is the egg.`,
      `  // \`earned\` is every achievement, hardest first. The hardest ones that can be drawn get the slots.`,
      `  return cutDrops({ drops: rolled, earned }, (trait) => trait.chart);`,
      `}`,
    ]),
    {
      kind: "note",
      text: "Roll once and store the result. If a reload could roll again, people would reload until they like what they got. The sample in the repository works its roll out from the handle, so the same person always gets the same drops.",
    },
  ],
  related: [
    "/docs/scanner/year-scan/",
    "/docs/scenes/fact/",
    "/docs/scenes/trophies/",
    "/docs/theming/",
    "/docs/scanner/",
  ],
  updated: UPDATED,
};

const openedDrops: DocPage = {
  path: "/docs/scanner/use-opened-drops/",
  section: "scanner",
  title: "useOpenedDrops",
  tagline: "remember what was found",
  nav: "useOpenedDrops",
  description:
    "useOpenedDrops is a React hook that remembers which hidden scenes of a Wrapped were opened, in local storage or for one visit, and fails soft.",
  lead: "`useOpenedDrops` keeps the list of drops a viewer has opened. Give it a storage key and the list is remembered on this device, so someone who ran the scan last week gets their full video today. Give it `null` and the list lasts for this visit only, which is what an example page wants.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "year-scan" },
      caption: "This scan keeps its finds with `useOpenedDrops(null)`: reload and they are gone.",
    },
    { kind: "h2", text: "Usage" },
    code("tsx", [
      `import { useOpenedDrops } from "@react-wrapped/scan";`,
      ``,
      `export function useMyDrops(handle: string, rolledAt: string) {`,
      `  // One key per person and per roll, so a new roll starts with nothing opened.`,
      `  const { opened, open, ready } = useOpenedDrops(\`orbit-wrapped:\${handle}:\${rolledAt}\`);`,
      `  return { opened, open, ready };`,
      `}`,
    ]),
    {
      kind: "p",
      text: "Pass `opened` to the scan as `found` and `open` as `onOpen`, and build your scenes from `opened`. That is the whole loop.",
    },
    { kind: "h2", text: "What it returns" },
    propsTable(OPENED_DOCS, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "Good to know" },
    {
      kind: "list",
      items: [
        "The list is stored in local storage as a JSON array under your key.",
        "Storage is read before the first paint. With [scan first](/docs/scanner/) on, someone who opened everything last week never sees the gate flash by.",
        "Blocked or full storage is not an error. The drops are opened for this visit and can be opened again next time.",
        "Opening is one way. There is no close: a drop cannot be hidden again from here.",
        "On the server and in the first render `opened` is empty. Wait for `ready` before you decide what to show.",
      ],
    },
    {
      kind: "p",
      text: "The hook is small on purpose. To keep opened drops in your database, skip it: any `found` list and any `onOpen` function work with the scan.",
    },
  ],
  related: ["/docs/scanner/year-scan/", "/docs/scanner/", "/docs/scanner/drops/", "/docs/guides/server-rendering/"],
  updated: UPDATED,
};

export const scannerPages: readonly DocPage[] = [overview, yearScan, drops, openedDrops];
