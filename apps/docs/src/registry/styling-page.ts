import { sourceOf } from "../content/sources";
import type { Block, DocPage } from "../content/types";
import { code, fileBlock, UPDATED } from "./shared";
import type { GraphicsGallerySlot } from "@react-wrapped/graphics";
import type { WrappedViewSlot } from "@react-wrapped/kit";
import type {
  ConfiguratorSlot,
  SceneEditorSlot,
  ShareActionsSlot,
  TimelineSlot,
  WrappedPlayerSlot,
} from "@react-wrapped/player";
import type { YearScanSlot } from "@react-wrapped/scan";

/*
 * The styling guide: tokens, slots, and where the library's stylesheet has to stand for Tailwind's utilities to win.
 *
 * Every slot table is an object keyed by the slot names its component exports. A slot added to the library without
 * a line here stops the typecheck, and so does a line left behind for a slot that is gone.
 */

/** One line per slot of a component, as the table a page shows. */
const slotTable = <Slot extends string>(docs: Record<Slot, string>): Block => ({
  kind: "table",
  head: ["Slot", "What it is"],
  rows: Object.entries<string>(docs).map(([slot, text]) => [`\`${slot}\``, text]),
});

const PLAYER_SLOTS: Record<WrappedPlayerSlot, string> = {
  player: "The root: the video and the controls under it. `className` lands here too.",
  "player-room": "The space the frame is fitted into.",
  "player-frame": "The frame around the video: its corners, its shadow, its outline.",
  "player-transport": "The row of controls under the video.",
  "player-play": "The play and pause button.",
  "player-restart": "The button that plays from the start.",
  "player-clock": "Where the playhead is and how long the video runs.",
  "player-fullscreen": "The full screen button.",
};

const TIMELINE_SLOTS: Record<TimelineSlot, string> = {
  timeline: "The root: the row of segments and the preview that opens over it.",
  "timeline-track": "The row of segments, the part that is clicked and dragged.",
  "timeline-segment": "One scene's share of the row.",
  "timeline-segment-bar": "The bar drawn inside a segment.",
  "timeline-segment-fill": "The played part of a bar.",
  "timeline-popover": "What holds the preview over its segment. Its `z-index` is set here.",
  "timeline-preview": "The preview card.",
  "timeline-preview-thumb": "The box around the still of the scene.",
  "timeline-preview-title": "The scene's name.",
  "timeline-preview-length": "How long the scene plays, or that it is off.",
  "timeline-preview-rarity": "How rare a found scene is. Its colour is the palette's, set inline.",
  "timeline-controls": "The creator's row of controls in the card.",
  "timeline-move-earlier": "The arrow that moves the scene one place earlier.",
  "timeline-move-later": "The arrow that moves it one place later.",
  "timeline-edit": "The pencil that opens the scene editor.",
  "timeline-toggle": "The switch that takes the scene out of the video.",
  "timeline-toggle-thumb": "The dot that slides in that switch.",
};

const SETTINGS_SLOTS: Record<ConfiguratorSlot, string> = {
  settings: "The root. `className` lands here too.",
  "settings-field": "One setting: its name and what there is to pick.",
  "settings-label": "A setting's name.",
  "settings-palette": "The grid of palettes.",
  "settings-swatch": "One palette in the grid. It is a radio: the picked one has `aria-checked`.",
  "settings-swatch-colors": "The palette's five colours on its swatch.",
  "settings-swatch-color": "One of the five.",
  "settings-swatch-name": "The palette's name.",
  "settings-accent": "The row for a colour of your own, shown while the custom palette is picked.",
  "settings-accent-input": "The colour input in that row.",
  "settings-accent-random": "The button that picks a random colour.",
  "settings-chips": "A row of choices: dark or light, format, cell shape, speed.",
  "settings-chip": "One choice. It is a radio: the picked one has `aria-checked`.",
  "settings-divider": "The line above the switches.",
  "settings-switch-row": "A setting that is on or off: its name and its switch.",
  "settings-switch-label": "That setting's name.",
  "settings-switch": "The switch. Its state is in `data-state`: `checked` or `unchecked`.",
  "settings-switch-thumb": "The dot that slides in the switch.",
};

const SHARE_SLOTS: Record<ShareActionsSlot, string> = {
  share: "The root: the row's own box. `className` lands here too.",
  "share-copy": "The button that copies the link.",
  "share-download": "The button that makes the video file.",
  "share-stop": "What the download button turns into while the file is made: it counts up, and stops when pressed.",
  "share-progress": "The line under the buttons that says what is being made and how long is left.",
  "share-problem": "The line under the buttons that says why a file could not be made.",
};

const EDITOR_SLOTS: Record<SceneEditorSlot, string> = {
  editor: "The dialog. Its backdrop is this element's `::backdrop`. `className` lands here too.",
  "editor-header": "The top of the dialog: the icon, the title and the line under it.",
  "editor-icon": "The disc with the pencil in it.",
  "editor-title": "The dialog's title.",
  "editor-description": "The line under the title.",
  "editor-body": "Everything between the header and the buttons.",
  "editor-field": "One thing to edit: its name and its input.",
  "editor-label": "A field's name.",
  "editor-input": "A text input, one line or several.",
  "editor-cut": "The transition picker: the preview beside the choices.",
  "editor-preview": "The box around the transition's preview.",
  "editor-transitions": "The row of transitions.",
  "editor-transition": "One transition. It is a radio: the picked one has `aria-checked`.",
  "editor-footer": "The row of buttons at the bottom.",
  "editor-reset": "The button that restores the original scene.",
  "editor-save": "The button that saves.",
};

const SCAN_SLOTS: Record<YearScanSlot, string> = {
  scan: "The root: the panel. Its background and text colour are the palette's, set inline. `className` lands here too.",
  "scan-header": "The top of the panel: the words on one side, the buttons on the other.",
  "scan-headline": "The headline, which changes with what the scan is doing.",
  "scan-about": "The line under the headline.",
  "scan-actions": "The buttons in the header: yours from `actions`, then the scan's own.",
  "scan-start": "The button that starts the scan, or picks it up again. Its colours are set inline.",
  "scan-find-all": "Shown while a scan runs: sends it straight to its end.",
  "scan-again": "Shown once everything is found: runs the scan again.",
  "scan-grid": "The year: a cell per day.",
  "scan-cell": "One day. Its colour is the palette's level for that day, set inline.",
  "scan-tile": "The button over a cell something was found in.",
  "scan-finds": "The list under the year, a badge per hidden scene.",
  "scan-find": "A found scene's badge. Its colours are set inline, from its rarity.",
  "scan-find-hidden": "The badge of a scene that is still hidden.",
  "scan-find-art": "A badge's little picture.",
  "scan-find-name": "A badge's name.",
  "scan-find-day": "The day a badge was found on.",
  "scan-flight": "What a found card flies in. It covers the page and is drawn at the end of `body`, outside the panel.",
  "scan-backdrop": "The dimmed page behind a card.",
  "scan-card": "The card's face. Its colours are set inline, from its rarity.",
  "scan-card-art": "The picture on the card.",
  "scan-card-name": "The name on the card.",
  "scan-card-rarity": "How rare it is.",
  "scan-card-line": "The line that says what it was earned for.",
  "scan-card-day": "The day it was found on.",
  "scan-card-back": "The card's back, shown before it turns over.",
  "scan-card-button": "The button that covers the card: it turns it over, adds it to the video, or closes it.",
};

const GALLERY_SLOTS: Record<GraphicsGallerySlot, string> = {
  gallery: "The root: the heading, the line under it and the tiles. `className` lands here too.",
  "gallery-heading": "The heading.",
  "gallery-heading-accent": "The heading's second half, in the accent colour.",
  "gallery-about": "The line under the heading.",
  "gallery-grid": "The grid of tiles.",
  "gallery-tile": "A graphic that can be taken. Its background and text colour are the palette's, set inline.",
  "gallery-art": "The space the picture stands in.",
  "gallery-image": "The picture.",
  "gallery-placeholder": "The dot that waits where a picture is still being drawn.",
  "gallery-title": "A tile's title.",
  "gallery-line": "The line under the title.",
  "gallery-actions": "The row of buttons on a tile.",
  "gallery-download": "The download button. Its colours are set inline.",
  "gallery-markdown": "The button that copies the Markdown snippet. Its colours are set inline.",
  "gallery-problem": "Said under a tile whose picture did not come through.",
  "gallery-locked": "A graphic the scan has not found yet.",
  "gallery-lock": "The disc with the lock in it.",
};

const VIEW_SLOTS: Record<WrappedViewSlot, string> = {
  view: "The root: the grid the whole page is laid out on. `className` lands here too.",
  "view-player-panel": "The card the player stands in.",
  "view-side": "The creator's column beside the video: the share row over the settings.",
  "view-settings-panel":
    "The card the settings stand in. The share row above it is a card by itself: its slot is `share`.",
  "view-viewer": "What holds your `viewer` content, under the video, for someone who is not the creator.",
  "view-scan": "What holds the year scan.",
  "view-gallery": "What holds the gallery.",
};

export const stylingPage: DocPage = {
  path: "/docs/guides/styling/",
  section: "guides",
  title: "Styling",
  tagline: "tokens, slots and Tailwind",
  nav: "Styling",
  description:
    "Restyle the react-wrapped player, settings, scan and gallery by hand: CSS tokens for colour, a class per slot with classNames, and one layer line for Tailwind.",
  lead: "Everything around the video can be restyled, at three levels. Tokens recolour all of it at once. Slots put a class of yours on one part: the play button, a timeline segment, a settings chip. And one line of CSS makes your Tailwind utilities win over the library's own classes. This guide goes through the three, cheapest first, and lists every slot there is.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "own-style" },
      caption: "The same player and settings with and without a class per slot. Square buttons, outlined chips.",
    },
    fileBlock(sourceOf("demos/own-style.tsx"), "own-style.tsx"),
    { kind: "h2", text: "Tokens" },
    {
      kind: "p",
      text: "Start here. Ten custom properties named `--wr-ui-*` hold every colour and the corner radius of the chrome, and `--wr-font` holds its font. Set them on any element above the library's parts and everything under it follows, in light and dark. No component has to be touched. They are listed in [custom palette and chrome colours](/docs/guides/palette-and-chrome/).",
    },
    code("css", [
      `:root {`,
      `  --wr-ui-primary: oklch(0.62 0.2 285);`,
      `  --wr-ui-radius: 6px;`,
      `  --wr-font: "Your Font", sans-serif;`,
      `}`,
    ]),
    { kind: "h2", text: "Slots" },
    {
      kind: "p",
      text: 'Tokens change a colour everywhere. To change the shape, the size or the type of one part, reach that part. Every element of the chrome you might want to restyle is a slot: it has a name, it carries that name as `data-wr-slot="player-play"`, and it takes a class for it. A class reaches a slot in three ways.',
    },
    { kind: "h3", text: "On one component" },
    {
      kind: "p",
      text: "Every chrome component takes `classNames`: an object with a class per slot. `className` is still there and is the root's class. A component that renders another takes that one's slots too and hands them on, so the player takes the timeline's, and `WrappedView` takes all of them in one object.",
    },
    code("tsx", [
      `<WrappedPlayer`,
      `  subject={subject}`,
      `  seed={seed}`,
      `  scenes={scenes}`,
      `  config={config}`,
      `  className="my-player"`,
      `  classNames={{`,
      `    "player-play": "my-play-button",`,
      `    "player-frame": "my-frame",`,
      `    "timeline-segment-bar": "my-bar",`,
      `  }}`,
      `/>`,
    ]),
    { kind: "h3", text: "For the whole page" },
    {
      kind: "p",
      text: "[`WrappedProvider`](/docs/guides/labels/) takes the same object and applies it to everything under it, so a design is written once. Keep the object the same between renders: a constant outside the component, or `useMemo`.",
    },
    code("tsx", [
      `import { type SlotClassNames, WrappedProvider, type WrappedSlot } from "@react-wrapped/kit";`,
      ``,
      `// Typed against every slot there is, so a misspelt name does not compile.`,
      `const CLASS_NAMES: SlotClassNames<WrappedSlot> = {`,
      `  "player-play": "my-play-button",`,
      `  "settings-chip": "my-chip",`,
      `  "scan-start": "my-play-button",`,
      `  "gallery-tile": "my-tile",`,
      `};`,
      ``,
      `export function Page({ children }: { children: React.ReactNode }) {`,
      `  return <WrappedProvider classNames={CLASS_NAMES}>{children}</WrappedProvider>;`,
      `}`,
    ]),
    { kind: "h3", text: "From a stylesheet" },
    {
      kind: "p",
      text: "The attribute is there whether you pass a class or not, so a stylesheet can target a part with no React involved at all.",
    },
    code("css", [
      `[data-wr-slot="player-play"] {`,
      `  border-radius: 6px;`,
      `}`,
      ``,
      `/* A picked chip, and only inside your own wrapper. */`,
      `.my-settings [data-wr-slot="settings-chip"][aria-checked="true"] {`,
      `  background: rebeccapurple;`,
      `}`,
    ]),
    { kind: "h3", text: "How the classes add up" },
    {
      kind: "list",
      items: [
        "**The order on an element** is the library's own classes, then the provider's class for that slot, then the component's `classNames`. Nothing of the library's is taken away: your class is added after it.",
        "**Providers nest** the way they do for labels. A slot named by an inner provider takes the inner class in place of the outer one, and every other slot keeps what the outer provider gave it.",
        "**With no `classNames` anywhere** every part renders exactly the classes it did before. The only addition is the `data-wr-slot` attribute.",
        '**A state needs the state in your selector.** The library styles hover, focus and a picked choice with selectors that have the state in them, and those outweigh a bare class. To restyle a picked chip write `.my-chip[aria-checked="true"]`, or with Tailwind `aria-checked:bg-violet-600`.',
        "**The scan and the gallery wear the video's palette.** Their backgrounds and colours are inline styles, so the year looks the way it does in the video. A class changes their shape and type freely, and their colours only with `!important`. The tables below say which slots those are.",
        "**Two things are drawn outside their component's box.** The scan's flying card is drawn at the end of `body`, and the scene editor is a dialog in the top layer. `classNames` and the provider reach both. A stylesheet selector that starts from your own wrapper does not.",
        '**The video itself has no slots.** The frame\'s look is the palette and the scene, so an exported file is the same on any site. Restyle what is around it, and give the frame its corners through `"player-frame"`.',
      ],
    },
    { kind: "h2", text: "With Tailwind" },
    {
      kind: "p",
      text: "This needs one line of setup, and it is worth knowing why. The library's stylesheet is plain CSS, outside any cascade layer. Tailwind v4 puts its utilities in `@layer utilities`, and a rule in a layer loses to a rule outside one, whatever their order or weight. So out of the box a Tailwind class like `bg-red-500` passed to a slot does **not** win over the library's own class for the background.",
    },
    {
      kind: "p",
      text: "The fix is to import the library's stylesheet into a layer that comes before utilities. In your app's CSS, after Tailwind:",
    },
    code("css", [`@import "tailwindcss";`, `@import "@react-wrapped/kit/styles.css" layer(components);`], "app.css"),
    {
      kind: "p",
      text: "From then on any utility you pass through `className` or `classNames` wins, states included:",
    },
    code("tsx", [
      `<WrappedPlayer`,
      `  {...video}`,
      `  classNames={{`,
      `    "player-play": "rounded-md bg-violet-600 text-white",`,
      `    "player-frame": "rounded-md shadow-none ring-2 ring-violet-600",`,
      `  }}`,
      `/>`,
    ]),
    {
      kind: "list",
      items: [
        '**Load the stylesheet only this way.** Take the `import "@react-wrapped/kit/styles.css"` out of your JavaScript. A second copy outside the layer would still be on the page, and it would still win.',
        "**The same line works for the single packages**: import `@react-wrapped/core/styles.css` and the others into the same layer, core first.",
        "**Set the chrome tokens outside a layer**, or in a layer after `components`. The library's own values are now in `components`, so a `--wr-ui-*` set inside `@layer base` would lose to them.",
        "**Your unlayered rules now outrank the library too.** That is the point of the move, and it includes element rules: a bare `button { ... }` outside any layer reaches the library's buttons. Tailwind's own reset is in `base`, before `components`, so it does not.",
        "**Colours set inline** on the scan and the gallery still need the important modifier: `bg-violet-600!`.",
      ],
    },
    { kind: "h2", text: "Without Tailwind" },
    {
      kind: "p",
      text: "With plain CSS or CSS modules there is nothing to set up. Load the library's stylesheet before your own. A class of yours and a class of the library's then weigh the same, and yours wins by coming later. That is all the preview at the top of this page does.",
    },
    code("tsx", [
      `import "@react-wrapped/kit/styles.css";`,
      `// After the library's, so a class from here wins over the library's class on the same element.`,
      `import "./app.css";`,
    ]),
    {
      kind: "p",
      text: "When you cannot control the order, as with some CSS module setups, write the slot into the selector. An attribute and a class together outweigh the library's single class, so the rule wins wherever it is loaded.",
    },
    code("css", [
      `.playButton[data-wr-slot="player-play"] {`,
      `  border-radius: 6px;`,
      `  background: rebeccapurple;`,
      `}`,
    ]),
    { kind: "h2", text: "Every slot" },
    {
      kind: "p",
      text: "Each component exports its slot names twice: as a type (`WrappedPlayerSlot`) for your own objects, and as a list (`WRAPPED_PLAYER_SLOTS`). `WrappedSlot` from `@react-wrapped/kit` is all of them together.",
    },
    { kind: "h3", text: "WrappedPlayer" },
    {
      kind: "p",
      text: "`WrappedPlayerSlot`. [`WrappedPlayerLoading`](/docs/player/loading/) has the same slots, so the frame and the controls look the same before the year arrives as after.",
    },
    slotTable(PLAYER_SLOTS),
    { kind: "h3", text: "Timeline" },
    {
      kind: "p",
      text: "`TimelineSlot`. The [player](/docs/player/wrapped-player/) takes these as well. The preview and everything in it is on the page only while a segment is hovered, and the controls only for a creator.",
    },
    slotTable(TIMELINE_SLOTS),
    { kind: "h3", text: "WrappedConfigurator" },
    { kind: "p", text: "`ConfiguratorSlot`, on the [settings panel](/docs/player/configurator/)." },
    slotTable(SETTINGS_SLOTS),
    { kind: "h3", text: "ShareActions" },
    { kind: "p", text: "`ShareActionsSlot`, on the [share row](/docs/player/share-actions/)." },
    slotTable(SHARE_SLOTS),
    { kind: "h3", text: "SceneEditor" },
    { kind: "p", text: "`SceneEditorSlot`, on the [scene editor](/docs/player/scene-editor/)." },
    slotTable(EDITOR_SLOTS),
    { kind: "h3", text: "YearScan" },
    { kind: "p", text: "`YearScanSlot`, on the [year scan](/docs/scanner/year-scan/)." },
    slotTable(SCAN_SLOTS),
    { kind: "h3", text: "GraphicsGallery" },
    { kind: "p", text: "`GraphicsGallerySlot`, on the [gallery](/docs/graphics/gallery/)." },
    slotTable(GALLERY_SLOTS),
    { kind: "h3", text: "WrappedView" },
    {
      kind: "p",
      text: "`WrappedViewSlot` is the page's own layout. The component takes every slot on this page in one `classNames` object and hands each part its own.",
    },
    slotTable(VIEW_SLOTS),
  ],
  related: [
    "/docs/guides/palette-and-chrome/",
    "/docs/guides/labels/",
    "/docs/theming/",
    "/docs/player/wrapped-player/",
    "/docs/guides/from-parts/",
  ],
  updated: UPDATED,
};
