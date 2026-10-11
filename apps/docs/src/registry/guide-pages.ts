import { excerpt } from "../content/source";
import { sourceOf } from "../content/sources";
import type { DocPage } from "../content/types";
import { type PropDocs, propsTable } from "./props";
import { code, fileBlock, UPDATED } from "./shared";
import type {
  CoverMove,
  defineScene,
  SceneContext,
  SceneField,
  TransitionContext,
  TransitionSpec,
  WrappedPalette,
  WrappedSearch,
} from "@react-wrapped/core";

/*
 * The guides: how to go past the ready-made parts. Each one is built around a file that runs on this site, shown as
 * it is, so the code a guide explains is code that works.
 */

const SCENE_SPEC: PropDocs<Parameters<typeof defineScene>[0]> = {
  align: [
    '"start" | "center"',
    "Where the content sits: against the left edge, or centred. Left when left out.",
    "optional",
  ],
  fields: ["readonly SceneField<P>[]", "The texts a viewer may rewrite in the scene editor.", "optional"],
  render: ["(props: P) => ReactNode", "What the scene draws, inside the frame's padding."],
  animate: [
    "(context: SceneContext, props: P) => gsap.core.Timeline",
    "Builds the timeline that brings the scene in and holds it. Called once per video, not per play.",
  ],
};

const SCENE_CONTEXT: PropDocs<SceneContext> = {
  root: ["HTMLElement", "The scene's own element. Query inside it and nowhere else."],
  format: [
    '"story" | "square" | "landscape"',
    "The frame the video plays in, for a scene that moves differently in a wide one.",
  ],
  rng: [
    "Rng",
    "A seeded random source: `next()`, `int(max)`, `pick(items)`, `fork(label)`. The same link always draws the same values.",
  ],
};

const FIELD_DOCS: PropDocs<SceneField<unknown>> = {
  name: ["string", "The key the edit is stored under. Usually the prop's name."],
  label: ["string", "What the editor calls the field."],
  multiline: ["boolean", "Edited in a box of several lines.", "optional"],
  read: ["(props: P) => string", "The text as the editor shows it."],
  write: ["(props: P, value: string) => P", "The props with the viewer's text put back in."],
};

const TRANSITION_SPEC: PropDocs<TransitionSpec> = {
  id: [
    "string",
    "What a config names it by. Lower case letters, digits and hyphens, starting with a letter, and not a built-in id.",
  ],
  label: ["string", "What the scene editor calls it."],
  cover: [
    "ReactNode | ((format: WrappedFormat) => ReactNode)",
    "Markup the transition draws above the scenes. Rendered once into every stage, hidden until you show it.",
    "optional",
  ],
  play: [
    "(tl: gsap.core.Timeline, context: TransitionContext) => void",
    "Puts the transition on the timeline it is handed.",
  ],
  lucky: [
    "boolean",
    "Lets the seed pick it for scenes nobody chose a transition for. Off unless you turn it on.",
    "optional",
  ],
};

const TRANSITION_CONTEXT: PropDocs<TransitionContext> = {
  root: ["HTMLElement", "The scene that is leaving. Your transition has to take it out of sight."],
  group: ["HTMLElement | null", "The element holding your `cover`, or `null` when there is none in this stage."],
};

const COVER_MOVE: PropDocs<CoverMove> = {
  hidden: ["gsap.TweenVars", "Where a layer waits out of sight."],
  covering: ["gsap.TweenVars", "The frame is covered."],
  reopen: ["gsap.TweenVars", "What the clearing starts from, when that is not where the covering ended.", "optional"],
  cleared: ["gsap.TweenVars", "The frame is clear again."],
  duration: [
    "number",
    "Seconds for each layer's way in, and the same for its way out. Half a second when left out.",
    "optional",
  ],
  ease: ["readonly [string, string]", "One ease for the way in and one for the way out.", "optional"],
};

const PALETTE_DOCS: PropDocs<WrappedPalette> = {
  bg: ["string", "The frame's background. `--wr-bg` on the stage."],
  card: ["string", "A panel standing on the background. `--wr-card`."],
  fg: ["string", "Text. `--wr-fg`."],
  muted: ["string", "Quieter text. `--wr-muted`."],
  levels: [
    "readonly [string, string, string, string, string]",
    "Five steps, quietest to loudest. `--wr-l0` to `--wr-l4`. The last one is the accent.",
  ],
  rarity: [
    "Record<Rarity, string>",
    "A colour per rarity. `--wr-common`, `--wr-rare`, `--wr-epic` and `--wr-legendary`.",
  ],
};

const SEARCH_DOCS: PropDocs<WrappedSearch> = {
  p: ["string", "`palette`: the palette's id.", "optional"],
  a: ["string", "`accent`: six hex digits without the hash. Only with the custom palette.", "optional"],
  m: ['"dark" | "light"', "`mode`.", "optional"],
  f: ['"story" | "square" | "landscape"', "`format`.", "optional"],
  c: ['"round" | "square" | "circle"', "`shape`, the calendar's cells.", "optional"],
  s: ['"0.75" | "1" | "1.5"', "`speed`.", "optional"],
  t: ["string", "`cuts`: picked transitions as `scene:transition` pairs with commas between them.", "optional"],
  h: ["string", "`hidden`: scene keys with commas between them.", "optional"],
  o: ["string", "`order`: scene keys with commas between them.", "optional"],
  e: ["string", "`edits`: the rewritten texts as one JSON object.", "optional"],
  g: ["0", "`grain`: there only when the grain is off.", "optional"],
};

const overview: DocPage = {
  path: "/docs/guides/",
  section: "guides",
  title: "Guides",
  tagline: "build past the ready-made parts",
  nav: "Overview",
  description:
    "Guides for react-wrapped: write a custom scene, add a transition, bring your own palette and chrome colours, keep the config in the URL, render on a server.",
  lead: "The ready-made scenes, transitions and the one-component page cover most Wrappeds. These guides are for the rest: a scene nobody shipped, a transition in your brand's shape, your own colours on the chrome, a link that carries every setting, a server-rendered page, and the whole page wired by hand from the single packages.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          path: "/docs/guides/custom-scene/",
          title: "Custom scene",
          text: "Write a scene with `defineScene` and the motion kit the built-in scenes use.",
          demo: { type: "scene", key: "guide:goal" },
        },
        {
          path: "/docs/guides/custom-transition/",
          title: "Custom transition",
          text: "Add your own way out of a scene with `defineTransition` and `coverCut`.",
          demo: { type: "transition", id: "curtain" },
        },
        {
          path: "/docs/guides/palette-and-chrome/",
          title: "Custom palette and chrome colours",
          text: "One accent colour for the video, and ten tokens for everything around it.",
        },
        {
          path: "/docs/guides/config-in-the-url/",
          title: "The config in the URL",
          text: "Short query keys, so a shared link plays the video exactly as its owner set it.",
        },
        {
          path: "/docs/guides/server-rendering/",
          title: "Server rendering",
          text: "What is in the server's HTML, what waits for the browser, and where the client boundary goes.",
        },
        {
          path: "/docs/guides/from-parts/",
          title: "Build the page from parts",
          text: "What `WrappedView` does, done by hand with the player, the scan, the editor and the gallery.",
        },
      ],
    },
    { kind: "h2", text: "Where to start" },
    {
      kind: "list",
      items: [
        "New here? [Your first Wrapped](/docs/first-wrapped/) gets a video playing in five steps.",
        "Want to see everything at once? The [full example](/examples/full-wrapped/) is one component, and the [from parts example](/examples/from-parts/) is the same page without it.",
      ],
    },
  ],
  related: [
    "/docs/first-wrapped/",
    "/docs/scenes/",
    "/docs/player/",
    "/examples/full-wrapped/",
    "/examples/from-parts/",
  ],
  updated: UPDATED,
};

const customScene: DocPage = {
  path: "/docs/guides/custom-scene/",
  section: "guides",
  title: "Custom scene",
  tagline: "write a scene with defineScene",
  nav: "Custom scene",
  description:
    "Write your own react-wrapped scene with defineScene: a render, a GSAP timeline that brings it in, editable fields, and the rules that keep it seekable.",
  lead: "A scene is a render and a timeline. `defineScene` takes both and gives back a scene function like the eleven built-in ones: it works with every transition, shows up on the timeline, opens in the scene editor and exports frame by frame. This guide builds one, a goal with a bar that fills, and lists the rules a scene has to keep.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "scene", key: "guide:goal" },
      caption: "The scene this guide builds: a percentage, a bar and a count, all on one timeline.",
    },
    { kind: "h2", text: "Installation" },
    code("bash", ["pnpm add @react-wrapped/core gsap"]),
    { kind: "h2", text: "The whole scene" },
    {
      kind: "p",
      text: "This file is the scene in the preview. `render` draws it with the stage's own type classes, and `animate` brings it in with the motion kit and one tween of its own.",
    },
    fileBlock(sourceOf("demos/custom-scene.tsx"), "goal-scene.tsx"),
    { kind: "h2", text: "Place it" },
    {
      kind: "p",
      text: "What `defineScene` returns is called like any [ready-made scene](/docs/scenes/): the props, then the key and the label.",
    },
    code("tsx", [
      `import { goalScene } from "./goal-scene";`,
      ``,
      `export const scene = goalScene(`,
      `  {`,
      `    eyebrow: "Your goal for the year",`,
      `    title: ["200 active days.", "*So close.*"],`,
      `    reached: 182,`,
      `    goal: 200,`,
      `    unit: "days",`,
      `    lede: "Eighteen short. There is always next year.",`,
      `  },`,
      `  { key: "goal", label: "Goal" },`,
      `);`,
    ]),
    { kind: "h2", text: "defineScene" },
    propsTable(SCENE_SPEC, ["Key", "Type", "What it does"]),
    { kind: "h3", text: "What animate is handed" },
    propsTable(SCENE_CONTEXT, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "The rules" },
    {
      kind: "list",
      items: [
        "**A scene brings itself in and never takes itself out.** End on a `hold` and return. The way out is a [transition](/docs/transitions/) the player adds, which is why your scene works with all of them.",
        "**Only add tweens.** The player seeks this timeline, plays it backwards and jumps into its middle. A timer, a `delayedCall` or a callback that changes something outside the timeline will not follow it there.",
        "**Everything is on the timeline.** A number that counts is a tween on a plain object with an `onUpdate`, as in the example. Nothing moves by CSS animation or transition: the exported video sets each frame's moment on the timeline and draws it, and CSS motion would stand still.",
        "**Text is set through `setText`.** It edits the text node in place. Assigning `textContent` on every frame of a counter inserts a new node each time, and a page with `:has()` rules restyles itself on every insertion.",
        "**Query inside `root`.** All scenes of a video are mounted on one stage at once, so a selector run on the document finds other scenes' elements too.",
        "**Render the finished picture.** A still of the scene, such as the timeline's hover card, shows the markup as rendered, with every `data-count` set to its final number. Start values belong in `from` tweens, not in the markup.",
        "**Props are plain data.** The player compares `JSON.stringify(props)` to decide whether a scene changed and has to be built again. A function or an element in the props is invisible to that check.",
      ],
    },
    { kind: "h2", text: "The motion kit" },
    {
      kind: "p",
      text: "These are the helpers the built-in scenes are made of. Use them and your scene moves like the rest of the video. All of them come from `@react-wrapped/core`.",
    },
    {
      kind: "table",
      head: ["Helper", "What it does"],
      rows: [
        [
          "`linesIn(tl, root, { at, stagger? })`",
          "Every heading line under `root` rises out of its own mask, 0.09 seconds apart.",
        ],
        [
          "`riseIn(tl, targets, { at, stagger? })`",
          "Supporting text and objects come up out of a blur, 0.9 seconds each.",
        ],
        [
          "`countUp(tl, element, { at, duration?, style? })`",
          "Counts an element up to its `data-count` and puts its `data-suffix` after the number. `style` is `climb` or `slot`.",
        ],
        ["`hold(tl, seconds)`", "A pause for reading. Every scene ends on one."],
        [
          "`hasTargets(targets)`",
          "Whether a selector found anything. Guard a tween on a part the scene does not always render, and GSAP has nothing empty to warn about.",
        ],
        ["`setText(element, text)`", "Changes an element's text without swapping its text node."],
        ["`EASE_OUT`", "The ease arrivals use: `expo.out`."],
        [
          "`Lines`",
          "A heading as lines, each in a mask, ready for `linesIn`. Takes `lines` and an optional `className`.",
        ],
        [
          "`headingLines(text)`",
          "Splits a one-line heading into two balanced lines at a word. Text with its own line breaks keeps them.",
        ],
        [
          "`rich(text)`",
          "Turns the two text marks into elements: single stars for the accent colour, double stars for bold.",
        ],
        ["`textField(name, label)`", "A field for a prop that is one string."],
        ["`linesField(name, label)`", "A field for a prop that is an array of lines, edited one line per row."],
      ],
    },
    {
      kind: "p",
      text: "The type classes are plain CSS in the core stylesheet: `wr-eyebrow` for the small line on top, `wr-mega` for a giant number, `wr-title` for the headline (it is what `Lines` uses) and `wr-lede` for the line at the bottom. For anything else, style it yourself with the [stage's variables](/docs/theming/), as the bar in the example does with `--wr-l1` and `--wr-l4`.",
    },
    { kind: "h2", text: "Fields" },
    {
      kind: "p",
      text: "`fields` lists what a viewer may rewrite. `textField` and `linesField` cover a string and an array of lines. For anything else write the field yourself: how to read the text out of the props, and how to put an edited text back.",
    },
    propsTable(FIELD_DOCS, ["Key", "Type", "What it does"]),
    { kind: "h2", text: "Sizes and time" },
    {
      kind: "list",
      items: [
        "The frame's short side is always 1080 pixels and the whole stage is scaled to the page. Size things in those pixels: a 128 pixel headline, a 44 pixel line.",
        "A scene's content sits inside the frame's padding, in a column 920 pixels wide in the tall and square formats.",
        "`defineScene` fits a scene that is too tall by scaling it as a whole, down to 60 percent, before `animate` runs. Test yours in all three [formats](/docs/formats/).",
        "After your `hold`, the scene is kept up for as long as its text takes to read, when that is longer.",
        "For a chart inside a scene, render `Chart` and call `animateChart(tl, root, at)`, both from `@react-wrapped/charts`. That is all the [chart scene](/docs/scenes/chart/) does.",
      ],
    },
  ],
  related: [
    "/docs/scenes/",
    "/docs/guides/custom-transition/",
    "/docs/player/scene-editor/",
    "/docs/theming/",
    "/docs/formats/",
  ],
  updated: UPDATED,
};

const customTransition: DocPage = {
  path: "/docs/guides/custom-transition/",
  section: "guides",
  title: "Custom transition",
  tagline: "add your own way out",
  nav: "Custom transition",
  description:
    "Add a custom scene transition to react-wrapped with defineTransition: a cover drawn in the palette's colours with coverCut, or a move of the scene itself.",
  lead: "A transition takes one scene out and says when the next one may start. `defineTransition` adds yours to the nineteen built-in ones: it can be picked per scene in the config, it shows up in the scene editor, and the seed can deal it out if you let it. This guide adds two, a cover and a move.",
  blocks: [
    { kind: "preview", demo: { type: "transition", id: "curtain" }, caption: "Curtain, the cover this guide defines." },
    { kind: "h2", text: "Installation" },
    code("bash", ["pnpm add @react-wrapped/core gsap"]),
    { kind: "h2", text: "Two transitions" },
    {
      kind: "p",
      text: "This file is registered on this site. `curtain` is a cover: it draws three layers over the frame. `tilt` is a move: it draws nothing and animates the leaving scene itself.",
    },
    fileBlock(sourceOf("demos/custom-transition.tsx"), "transitions.tsx"),
    { kind: "preview", demo: { type: "transition", id: "tilt" }, caption: "Tilt, the move." },
    { kind: "h2", text: "Register it once" },
    {
      kind: "p",
      text: "`defineTransition` has to run before a stage is on the page, because a stage draws every transition's cover when it mounts. Import the file where your app starts. From then on the id works like a built-in one:",
    },
    code("tsx", [
      `// main.tsx, or your root layout: before anything renders a stage.`,
      `import "./transitions";`,
      ``,
      `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig } from "@react-wrapped/core";`,
      ``,
      `// The scene with the key "total" leaves with the curtain.`,
      `export const config: WrappedConfig = { ...DEFAULT_WRAPPED_CONFIG, cuts: { total: "curtain" } };`,
    ]),
    {
      kind: "list",
      items: [
        "`transitionList()` returns every transition as `{ id, label }`, the built-in ones first and then yours. The [scene editor](/docs/player/scene-editor/) offers exactly that list.",
        "`isTransition(id)` says whether an id is known. A link that names an unknown transition falls back to the seed's pick, so define yours before you read a [config from the URL](/docs/guides/config-in-the-url/).",
        "Defining an id twice replaces the first one. Using a built-in id, or one with capitals or spaces, throws.",
      ],
    },
    { kind: "h2", text: "defineTransition" },
    propsTable(TRANSITION_SPEC, ["Key", "Type", "What it does"]),
    { kind: "h3", text: "What play is handed" },
    propsTable(TRANSITION_CONTEXT, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "A cover with coverCut" },
    {
      kind: "p",
      text: "Every built-in cover is one function with different numbers, and it is exported. `coverCut(tl, { root, group }, move)` brings the layers of `group` in one after another until the frame is covered, hides the old scene under them, marks the handover, and clears the layers in reverse order onto the next scene. You only describe three states of a layer.",
    },
    propsTable(COVER_MOVE, ["Key", "Type", "What it is"]),
    {
      kind: "list",
      items: [
        "The stage gives the first three children of your cover the palette's levels two, three and four as their colour. Three `<i />` are enough: each already fills the frame.",
        "Layers follow each other by 0.085 seconds, so a cover's edge is a band of three colours and never one hard line.",
        'Your cover sits in an element with `data-cut` set to your id. Shape its layers from your own stylesheet with that selector, for example a `clip-path` on `[data-cut="curtain"] i`.',
        "`cover` can be a function of the format, for shapes that should not stretch in the wide frame.",
      ],
    },
    { kind: "h2", text: "A move and the HANDOVER label" },
    {
      kind: "p",
      text: "A move animates `root`, the scene that is leaving, and has to end with it out of sight. Add the label `HANDOVER` where the next scene should start. In `tilt` that is 0.07 seconds before the end, so the next headline comes in as the last of the old one goes. With no label the next scene starts a quarter of a second before your timeline ends. `coverCut` sets the label for you, just before the cover closes.",
    },
    { kind: "h2", text: "The rules" },
    {
      kind: "list",
      items: [
        "**Only add tweens to `tl`.** The player seeks and reverses it, and the scrubber runs through your transition in both directions.",
        "**Animate only `root` and your own `group`.** The next scene and the chrome are not yours.",
        "**Leave `root` hidden** when you are done: `autoAlpha: 0`. `coverCut` does it under the closed cover.",
        "**Handle a missing `group`.** A stage that mounted before your transition was defined has no cover for it. Fade the scene out, as `curtain` does.",
      ],
    },
    { kind: "h2", text: "Let the seed pick it" },
    {
      kind: "p",
      text: "With `lucky: true` your transition joins the pool the seed draws from for scenes nobody picked a transition for. Decide this before you share links: the pool's size is part of the draw, so adding a lucky transition changes which one most scenes of an existing video get.",
    },
  ],
  related: [
    "/docs/transitions/",
    "/docs/guides/custom-scene/",
    "/docs/player/scene-editor/",
    "/docs/guides/config-in-the-url/",
    "/docs/theming/",
  ],
  updated: UPDATED,
};

const paletteAndChrome: DocPage = {
  path: "/docs/guides/palette-and-chrome/",
  section: "guides",
  title: "Custom palette and chrome colours",
  nav: "Palette and chrome",
  description:
    "Give a react-wrapped video your own palette from one accent colour, and recolour the player, the settings and the scan with ten CSS custom properties.",
  lead: "There are two sets of colours and they are set in two places. The video has a palette: it belongs to the frame, the viewer can change it, and it is baked into the exported file. The chrome around the video (the player's controls, the settings, the scan panel, the gallery) reads ten CSS custom properties that you set once in your stylesheet. This guide covers both.",
  blocks: [
    { kind: "preview", demo: { type: "part", id: "own-colour" }, caption: "One accent in, a whole palette out." },
    { kind: "h2", text: "A palette from one colour" },
    {
      kind: "p",
      text: "Set `palette` to `custom` and `accent` to your colour as `#rrggbb`. `mode` still says dark or light. Everything else is worked out from the accent, so the result always fits itself.",
    },
    fileBlock(sourceOf("demos/own-colour.tsx"), "own-colour.tsx"),
    {
      kind: "list",
      items: [
        "Level 0 is a quiet tint of the background. Levels 1 to 3 are the accent mixed into the background at 30, 55 and 80 percent, and level 4 is the accent itself.",
        "Rare and epic are the accent's neighbours on the colour wheel, 48 degrees to each side. Legendary is gold, or a light tint of the accent when the accent is already gold.",
        "On the light background the rarity colours are deepened so they still read.",
        "`randomAccent()` gives a bright, saturated colour at a random hue that reads on both backgrounds.",
      ],
    },
    { kind: "h2", text: "resolvePalette" },
    {
      kind: "p",
      text: "`resolvePalette(config)` turns the three config keys into a `WrappedPalette`: the colours as an object. The stage writes it out as CSS variables, and the scan, the gallery and the card renderers take it as a prop, which is how they wear the theme of the video.",
    },
    propsTable(PALETTE_DOCS, ["Key", "Type", "What it is"]),
    code("tsx", [
      `import { DEFAULT_WRAPPED_CONFIG, paletteStyle, resolvePalette } from "@react-wrapped/core";`,
      ``,
      `const palette = resolvePalette({ ...DEFAULT_WRAPPED_CONFIG, palette: "custom", accent: "#ff5c8a" });`,
      ``,
      `// The same colours as CSS variables, for an element of your own that should match the frame.`,
      `export const frameColours = paletteStyle(palette);`,
    ]),
    {
      kind: "p",
      text: "The built-in palettes are in `WRAPPED_PALETTES`, each with a `label`. `themePalette(id, mode)` gives one of them in dark or light, for a picker's swatch, and `isPresetPalette(id)` tells a built-in id from `custom`. The variables themselves are listed under [theming](/docs/theming/).",
    },
    { kind: "h2", text: "Chrome tokens" },
    {
      kind: "p",
      text: "Everything outside the frame is painted with these. The library sets its own values on the page's root with no weight at all, so any rule of yours wins: on `:root`, on `body`, or on a wrapper around one part.",
    },
    {
      kind: "table",
      head: ["Token", "What it paints"],
      rows: [
        ["`--wr-ui-bg`", "The background of a full screen player, and text standing on a solid button."],
        ["`--wr-ui-fg`", "Text, and the solid buttons."],
        ["`--wr-ui-card`", "Panels and cards: the settings' swatches, the timeline's hover card, dialogs."],
        ["`--wr-ui-muted`", "Quiet fills: chips at rest, the empty part of the timeline."],
        ["`--wr-ui-muted-fg`", "Quiet text: the clock, hints, descriptions."],
        ["`--wr-ui-primary`", "The one accent: the played part of the timeline, the highlighted words in headings."],
        ["`--wr-ui-primary-fg`", "Text on the accent."],
        ["`--wr-ui-border`", "Hairlines and outlines."],
        ["`--wr-ui-ring`", "The focus ring."],
        ["`--wr-ui-radius`", "The base corner radius."],
        ["`--wr-font`", "The chrome's font. Left out, the chrome uses the font of the page around it."],
      ],
    },
    code("css", [
      `:root {`,
      `  --wr-ui-primary: oklch(0.62 0.2 285);`,
      `  --wr-ui-card: oklch(0.97 0.02 285);`,
      `  --wr-ui-border: oklch(0.86 0.05 285);`,
      `  --wr-ui-radius: 6px;`,
      `  --wr-font: "Your Font", sans-serif;`,
      `}`,
      ``,
      `/* Your rule on :root also beats the library's dark values, so say what dark should be. */`,
      `.dark {`,
      `  --wr-ui-primary: oklch(0.74 0.16 285);`,
      `  --wr-ui-card: oklch(0.25 0.03 285);`,
      `  --wr-ui-border: oklch(0.34 0.05 285);`,
      `}`,
    ]),
    {
      kind: "preview",
      demo: { type: "part", id: "own-chrome" },
      caption: "The same parts with and without a set of tokens on the wrapper.",
    },
    fileBlock(sourceOf("demos/own-chrome.tsx"), "own-chrome.tsx"),
    { kind: "h2", text: "Dark mode" },
    {
      kind: "p",
      text: "The chrome is dark wherever an ancestor has the class `dark`, the way most apps switch themes. There is nothing to pass and nothing to call: toggle the class on `html` and the library follows. A player in full screen is always dark, whatever the page is.",
    },
    { kind: "h2", text: "What the tokens do not touch" },
    {
      kind: "list",
      items: [
        "The frame. Its colours are the palette's, so an exported video looks the same on any site.",
        "The scan panel and the gallery tiles. They sit on the palette's background on purpose, so the year looks the way it does in the video.",
        "The frame's font. The stage, the share card and the insight cards are set in a font named Inter, with figures of equal width so a counting number does not shiver. See [installation](/docs/installation/) for loading it.",
      ],
    },
  ],
  related: [
    "/docs/theming/",
    "/docs/player/configurator/",
    "/docs/installation/",
    "/docs/guides/config-in-the-url/",
    "/docs/scanner/drops/",
  ],
  updated: UPDATED,
};

const configInUrl: DocPage = {
  path: "/docs/guides/config-in-the-url/",
  section: "guides",
  title: "The config in the URL",
  tagline: "a link that is the video",
  nav: "The config in the URL",
  description:
    "Keep a react-wrapped config in the URL with parseWrappedSearch, configFromSearch and searchFromConfig, so a shared link plays the video as its owner set it.",
  lead: "Everything a viewer can change is one `WrappedConfig`, and the whole of it fits in a query string. Put it there and the link is the video: whoever opens it sees the same palette, format, order, edits and transitions as the person who shared it. Three functions do the work, and none of them needs a router.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "config-url" },
      caption: "Change a setting and read the query. Or type a query and open it.",
    },
    { kind: "h2", text: "Three functions" },
    {
      kind: "table",
      head: ["Function", "What it does"],
      rows: [
        [
          "`parseWrappedSearch(input)`",
          'Reads whatever a router or `URLSearchParams` hands over into a `WrappedSearch`. Anything unexpected becomes "not set". It never throws.',
        ],
        [
          "`configFromSearch(search, defaults?)`",
          "Turns a `WrappedSearch` into a full `WrappedConfig`, with your defaults for everything the link leaves out.",
        ],
        [
          "`searchFromConfig(config, defaults?)`",
          "The way back: a `WrappedSearch` with every key that is at its default left out.",
        ],
      ],
    },
    fileBlock(sourceOf("demos/config-url.tsx"), "link-is-the-video.tsx"),
    { kind: "h2", text: "The short keys" },
    {
      kind: "p",
      text: "A `WrappedSearch` uses one letter per setting, so a link stays readable when someone pastes it into a chat.",
    },
    propsTable(SEARCH_DOCS, ["Key", "Type", "What it carries"]),
    code("bash", ["?p=grape&m=light&f=square&t=total:drip,week:iris&h=languages"]),
    { kind: "h2", text: "What is left out" },
    {
      kind: "list",
      items: [
        "A key at its default is not written. A video nobody changed has no query at all.",
        "`a` is written only with the custom palette. `g` is written only as `0`, when the grain is off.",
        "The scene editor stores only texts that differ from the original and only a transition that differs from the seed's pick, so `e` and `t` stay short too.",
        'Pass the same `defaults` to `configFromSearch` and `searchFromConfig`. Then "left out" means the same thing both ways.',
      ],
    },
    { kind: "h2", text: "A mangled link still plays" },
    {
      kind: "list",
      items: [
        "Every value is checked: the format against the three formats, the accent against six hex digits, each text against a length limit.",
        "A transition the page does not know is dropped and that scene plays the seed's pick. Scene keys that no longer exist are ignored.",
        "Edits that are not a flat object of short strings are dropped as a whole.",
        "Palette ids that were renamed still open as what they were.",
      ],
    },
    { kind: "h2", text: "In the address bar" },
    {
      kind: "p",
      text: "With no router, a small hook reads the link once and writes it back on every change. `WrappedView` and every other part take the pair it returns as `config` and `onConfigChange`.",
    },
    fileBlock(sourceOf("demos/use-url-config.ts"), "use-url-config.ts", "ts"),
    {
      kind: "p",
      text: "With a router, `parseWrappedSearch` is shaped to be a route's search validator: it takes the raw search object and returns a typed one. Read the route's search, pass it through `configFromSearch`, and on change navigate with `searchFromConfig(next)` and `replace`.",
    },
    {
      kind: "note",
      text: "A config in state is fine too. The docs examples keep it there. Put it in the URL when the page is someone's own and they will share it.",
    },
  ],
  related: [
    "/docs/player/configurator/",
    "/docs/player/timeline/",
    "/docs/guides/server-rendering/",
    "/docs/guides/custom-transition/",
    "/docs/first-wrapped/",
  ],
  updated: UPDATED,
};

const serverRendering: DocPage = {
  path: "/docs/guides/server-rendering/",
  section: "guides",
  title: "Server rendering",
  tagline: "Next.js, SSR and static HTML",
  nav: "Server rendering",
  description:
    "Render react-wrapped on a server or as static HTML: what is in the markup, what waits for the browser, where the client boundary goes in Next.js.",
  lead: "react-wrapped renders on a server. Nothing in it touches `window` while rendering, and this site is proof: every page here is static HTML made at build time. What the server cannot do is play: timelines are built in the browser. This guide says what ends up in the HTML, what waits, and how to set it up in a framework with server components.",
  blocks: [
    { kind: "h2", text: "What is in the server HTML" },
    {
      kind: "list",
      items: [
        "The whole stage with its palette as inline CSS variables, and every scene's markup. All scenes are mounted at once and the ones off screen are not displayed, so every word of the video is in the HTML.",
        "The transport, the timeline's row, the settings panel and the scan panel with its blank year.",
        "The gallery's tiles, each with its title and line. The pictures are not there yet.",
        "The loading frame, when you render [the wait](/docs/player/loading/).",
      ],
    },
    { kind: "h2", text: "What waits for the browser" },
    {
      kind: "list",
      items: [
        "**The size of the frame.** The player measures the room it has in a layout effect and scales the stage to it. Until then the frame is hidden, so it never shows at the wrong size.",
        "**The timelines.** Every scene's GSAP timeline is built after mount, when its elements can be measured. Autoplay starts right after.",
        "**Stored state.** `useOpenedDrops` reads storage before the first paint in the browser. On the server it has opened nothing and `ready` is false.",
        "**Pictures.** The share card and the insight cards are drawn on a canvas when their tile is about to be seen.",
        "**The MP4.** It needs the browser's video encoder.",
      ],
    },
    { kind: "h2", text: "Next.js and server components" },
    {
      kind: "p",
      text: 'The components use state and effects, and the packages do not mark themselves with `"use client"`. So put the boundary in a file of your own. Fetch the numbers in a server component, pass them down as plain data, and build the scenes on the client side of the boundary: a scene holds functions, and functions cannot cross it.',
    },
    code(
      "tsx",
      [
        `import { MyWrapped } from "./my-wrapped";`,
        `import { loadYear } from "./load-year";`,
        ``,
        `// A server component: it fetches, and hands over numbers.`,
        `export default async function Page({ params }: { params: Promise<{ handle: string }> }) {`,
        `  const { handle } = await params;`,
        `  const year = await loadYear(handle);`,
        `  return <MyWrapped year={year} />;`,
        `}`,
      ],
      "app/wrapped/[handle]/page.tsx",
    ),
    code(
      "tsx",
      [
        `"use client";`,
        ``,
        `import { useMemo, useState } from "react";`,
        `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig, WrappedView } from "@react-wrapped/kit";`,
        ``,
        `import { directYear, type Year } from "./direct-year";`,
        ``,
        `export function MyWrapped({ year }: { year: Year }) {`,
        `  const [config, setConfig] = useState<WrappedConfig>(DEFAULT_WRAPPED_CONFIG);`,
        `  // Scenes are built here, from the plain numbers the server sent. Memoized: a new array rebuilds the video.`,
        `  const cut = useMemo(() => directYear(year), [year]);`,
        `  return (`,
        `    <WrappedView`,
        `      subject={cut.subject}`,
        `      seed={cut.seed}`,
        `      scenes={cut.scenes}`,
        `      config={config}`,
        `      onConfigChange={setConfig}`,
        `    />`,
        `  );`,
        `}`,
      ],
      "app/wrapped/[handle]/my-wrapped.tsx",
    ),
    {
      kind: "p",
      text: "`directYear` is yours: the function that turns a year's numbers into a subject, a seed and scenes. Keep it in a file without the directive and it can be tested on its own.",
    },
    { kind: "h2", text: "The stylesheet, once" },
    {
      kind: "p",
      text: "Import the stylesheet in the root layout, not in the component, so it is in the first HTML and loads once. With the single packages, import core first and each package's own after it.",
    },
    code("tsx", [`import "@react-wrapped/kit/styles.css";`], "app/layout.tsx"),
    { kind: "h2", text: "The same on both sides" },
    {
      kind: "p",
      text: "The server's HTML and the browser's first render have to match. The library keeps its side: nothing it renders depends on the clock or on `Math.random`, and every variation in a video comes from the seed. Keep yours:",
    },
    {
      kind: "list",
      items: [
        "Format dates and numbers the same way on both sides. Name the locale and the time zone, or format on the server and send strings.",
        "Do not read the URL or storage while rendering. Start from defaults and read them in an effect, as the hook in [the config in the URL](/docs/guides/config-in-the-url/) does. A framework that hands the search to the server can use it from the first render.",
        "A [custom transition](/docs/guides/custom-transition/) has to be defined on both sides before a stage renders. Import its file from the client component, not only from a browser entry.",
      ],
    },
    { kind: "h2", text: "Static sites" },
    {
      kind: "p",
      text: "A statically built page works the same way: the HTML holds the markup, and the video starts when the script has loaded. For a crawler the text of every scene is in the page. For a link preview draw an image on the server from the same numbers, or host a [share card](/docs/graphics/share-card/) the owner made.",
    },
  ],
  related: [
    "/docs/installation/",
    "/docs/first-wrapped/",
    "/docs/player/loading/",
    "/docs/guides/config-in-the-url/",
    "/docs/scanner/use-opened-drops/",
  ],
  updated: UPDATED,
};

const fromParts: DocPage = {
  path: "/docs/guides/from-parts/",
  section: "guides",
  title: "Build the page from parts",
  tagline: "WrappedView, unpacked",
  nav: "Build the page from parts",
  description:
    "Rebuild the WrappedView page by hand from the single react-wrapped packages: the player, the settings, the scan, the scene editor and the gallery.",
  lead: "`WrappedView` is a layout and about a hundred lines of wiring around five components that are all exported. When you want a different page (the settings in a drawer, the scan on its own route, no gallery) take the parts and do the wiring yourself. This guide goes through that wiring with a page that does everything `WrappedView` does and imports nothing from the kit.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          path: "/examples/from-parts/",
          title: "From parts example",
          text: "The page this guide builds, running. No WrappedView, no kit.",
        },
        {
          path: "/examples/full-wrapped/",
          title: "Full Wrapped example",
          text: "The same year from the one component, to compare.",
        },
      ],
    },
    { kind: "h2", text: "The parts" },
    {
      kind: "table",
      head: ["Part", "Package", "Its job on the page"],
      rows: [
        [
          "[`WrappedPlayer`](/docs/player/wrapped-player/)",
          "`@react-wrapped/player`",
          "Plays the scenes that are on. Its timeline edits the cut.",
        ],
        [
          "[`WrappedConfigurator`](/docs/player/configurator/)",
          "`@react-wrapped/player`",
          "Changes what applies to the whole video.",
        ],
        [
          "[`SceneEditor`](/docs/player/scene-editor/)",
          "`@react-wrapped/player`",
          "Changes one scene's texts and its transition.",
        ],
        ["[`YearScan`](/docs/scanner/year-scan/)", "`@react-wrapped/scan`", "Finds the hidden scenes."],
        ["[`GraphicsGallery`](/docs/graphics/gallery/)", "`@react-wrapped/graphics`", "Hands out the pictures."],
        [
          "`arrangeScenes`, `editsFor`, `luckyCut`, `resolvePalette`",
          "`@react-wrapped/core`",
          "The small functions between them.",
        ],
      ],
    },
    code("bash", [
      "pnpm add @react-wrapped/core @react-wrapped/player @react-wrapped/scan @react-wrapped/graphics @react-wrapped/scenes gsap",
    ]),
    code("tsx", [
      `import "@react-wrapped/core/styles.css";`,
      `import "@react-wrapped/player/styles.css";`,
      `import "@react-wrapped/scan/styles.css";`,
      `import "@react-wrapped/graphics/styles.css";`,
    ]),
    { kind: "h2", text: "One config, one list of opened drops" },
    {
      kind: "p",
      text: "The page owns two pieces of state. The config is everything a viewer can change. The list of opened drops is what the scan has found. Every part reads from those two and reports back to them, and nothing else is shared.",
    },
    { kind: "h2", text: "From your scenes to the ones that play" },
    {
      kind: "p",
      text: "Four steps turn the scenes your director returns into the array the player gets. Each is memoized on what it reads, so a change to one scene's text does not rebuild the others.",
    },
    code("tsx", [excerpt(sourceOf("examples/from-parts.tsx"), "// The drops opened so far.")]),
    {
      kind: "list",
      items: [
        "`arrangeScenes` applies `config.order` and keeps a newly found scene in its story slot.",
        "`editsFor` picks one scene's edits out of the flat `config.edits`, and `scene.withEdits` applies them.",
        "The player gets `playing`. The timeline, through `editing.scenes`, gets `ordered`, so a hidden scene stays on the row.",
      ],
    },
    { kind: "h2", text: "Editing from the timeline" },
    {
      kind: "p",
      text: "`editing` is three callbacks. Two of them write to the config. The third opens the scene editor by remembering a key.",
    },
    code("tsx", [excerpt(sourceOf("examples/from-parts.tsx"), "const [editingKey, setEditingKey]")]),
    { kind: "h2", text: "A transition per scene" },
    {
      kind: "p",
      text: "The scene editor needs to know the way out of the scene it edits: the transition it plays now, the one the seed picked, and the scene that comes next. `luckyCut(seed, key)` is the seed's pick. Saving keeps a pick only when it differs from that, so the config stays short.",
    },
    code("tsx", [excerpt(sourceOf("examples/from-parts.tsx"), "// The way out of the scene being edited.")]),
    { kind: "h2", text: "The scan, first or under the video" },
    {
      kind: "p",
      text: "`YearScan` adds scenes by calling `onOpen`, which here is the `open` of `useOpenedDrops`: the list changes, the director runs again, and the new scene is in `cut.scenes`. Give a drop's scene the key `drop-` followed by the drop's id: the found card flies to the timeline segment with that key. For the scan first flow, keep `gate` on until a run has come to rest with something found.",
    },
    code("tsx", [excerpt(sourceOf("examples/from-parts.tsx"), "const [running, setRunning]")]),
    { kind: "h2", text: "The graphics" },
    {
      kind: "p",
      text: "The gallery takes a list of graphics and the palette. The list is memoized on the palette, because each tile draws its image again when its `image` function changes.",
    },
    code("tsx", [excerpt(sourceOf("examples/from-parts.tsx"), "const { palette: paletteId, accent, mode } = config;")]),
    { kind: "h2", text: "The layout is yours" },
    {
      kind: "p",
      text: "The parts bring no page layout. The example lays them out with inline styles on the [chrome tokens](/docs/guides/palette-and-chrome/), so its panels follow the same light and dark as the parts inside them. Two things to know: the player needs a box with a height, and the scan as the page needs one too.",
    },
    { kind: "h2", text: "The whole file" },
    {
      kind: "p",
      text: "The sample year comes from `@react-wrapped/sample`, a package inside the repository that is not published: it stands in for your own data and director. The example also adds one scene of its own with `chartScene`, to show a page mixing its scenes into a director's.",
    },
    fileBlock(sourceOf("examples/from-parts.tsx"), "from-parts.tsx"),
    { kind: "h2", text: "What WrappedView adds on top" },
    {
      kind: "list",
      items: [
        "The download button, with its progress and its stop. Build it from [video export](/docs/player/video-export/).",
        "The loading state in the same layout. Render [`WrappedPlayerLoading`](/docs/player/loading/) where the player will be.",
        "A viewer mode: with `editable` off there is no scan, no settings and no editing, only the video and what you pass as `viewer`.",
        "A short pause after the last find before the video takes the scan's place, and the settings column sliding open.",
      ],
    },
  ],
  related: [
    "/examples/from-parts/",
    "/examples/full-wrapped/",
    "/docs/player/",
    "/docs/scanner/",
    "/docs/graphics/gallery/",
  ],
  updated: UPDATED,
};

export const guidePages: readonly DocPage[] = [
  overview,
  customScene,
  customTransition,
  paletteAndChrome,
  configInUrl,
  serverRendering,
  fromParts,
];
