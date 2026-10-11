import { sourceOf } from "../content/sources";
import type { DocPage } from "../content/types";
import { type PropDocs, propsTable } from "./props";
import { code, fileBlock, UPDATED } from "./shared";
import type {
  LoadingStage,
  LoadingSubject,
  SceneInstance,
  StageTake,
  WrappedConfig,
  WrappedSubject,
} from "@react-wrapped/core";
import type {
  SceneCut,
  SceneEditor,
  Timeline,
  TimelineEditing,
  WrappedConfigurator,
  WrappedPlayer,
  WrappedPlayerHandle,
  WrappedPlayerLoading,
} from "@react-wrapped/player";

/*
 * The player section: the video with its controls, the timeline that edits the cut, the scene editor, the settings
 * panel, the frame while a year loads, and the MP4. Every props table is keyed by the real props.
 */

const INSTALL = code("bash", ["pnpm add @react-wrapped/player @react-wrapped/core gsap"]);
const STYLES = code("tsx", [`import "@react-wrapped/core/styles.css";`, `import "@react-wrapped/player/styles.css";`]);

const PLAYER_PROPS: PropDocs<Parameters<typeof WrappedPlayer>[0]> = {
  ref: ["Ref<WrappedPlayerHandle>", "Hands out the player's handle, to drive it from your own code.", "optional"],
  subject: ["WrappedSubject", "Who the video is about. Shown in the corner of every frame."],
  seed: [
    "string",
    "Picks the transitions and the small variations in motion. The same seed always plays the same video.",
  ],
  scenes: [
    "readonly SceneInstance[]",
    "The scenes that play, in order. Keep the array the same between renders: a new one rebuilds the timeline.",
  ],
  config: ["WrappedConfig", "Palette, format, cell shape, speed, grain and picked transitions."],
  autoplay: ["boolean", "Starts playing as soon as the video is built. On unless you say otherwise.", "optional"],
  editing: [
    "TimelineEditing & { scenes: readonly SceneInstance[] }",
    "Turns the timeline into the editor. Leave it out for someone who only watches.",
    "optional",
  ],
  className: ["string", "A class for the player's root, for sizing it in your layout.", "optional"],
};

const SUBJECT_PROPS: PropDocs<WrappedSubject> = {
  handle: ["string", "Shown as @handle in the frame's top corner."],
  name: [
    "string | null",
    "The person's display name. The frame shows the handle. This one is for your own page.",
    "optional",
  ],
  avatarUrl: ["string | null", "Their picture. Left out, the first two letters of the handle on a disc.", "optional"],
  caption: ["string", "The small line under the handle: what this Wrapped is called."],
  period: [
    "string",
    "The window the numbers cover, already formatted. The frame does not draw it: write it into a scene, such as the opening's line.",
    "optional",
  ],
  mark: [
    "string | readonly string[]",
    "A logo pressed into the bottom right corner, as SVG path data. See [marks](/docs/marks/).",
    "optional",
  ],
  brand: ["string", "A quiet line in the bottom left: a site address or a product name.", "optional"],
};

const HANDLE_DOCS: PropDocs<WrappedPlayerHandle> = {
  play: ["() => void", "Plays from where the playhead is. At the end of the video it starts over."],
  pause: ["() => void", "Stops where it is."],
  restart: ["() => void", "Plays from the first frame."],
  seek: ["(seconds: number) => void", "Jumps to a moment, in seconds at normal speed, and stays there paused."],
  duration: ["() => number", "The length of the video in seconds at normal speed. Zero while there is no video."],
  scenes: [
    "() => readonly SceneMark[]",
    "Each playing scene with its `key`, its `label` and the `time` it starts at, in play order.",
  ],
  take: [
    "() => StageTake | null",
    "Lends out the stage and the playhead for making a file. See [video export](/docs/player/video-export/).",
  ],
};

const TIMELINE_PROPS: PropDocs<Parameters<typeof Timeline>[0]> = {
  trackRef: [
    "RefObject<HTMLDivElement | null>",
    "A ref for the row of segments. The engine fills each segment's bar through it as the video plays.",
  ],
  scenes: ["readonly SceneInstance[]", "Every scene in order. With `editing`, that includes the ones switched off."],
  marks: ["readonly SceneMark[]", "Where each playing scene starts. From `useWrappedTimeline`."],
  duration: ["() => number", "The length of the video in seconds. From `useWrappedTimeline`."],
  config: ["WrappedConfig", "For the format of the hover still, the speed and the rarity colours."],
  editing: [
    "TimelineEditing",
    "The creator's controls in the hover card. Leave it out for a plain scrubber.",
    "optional",
  ],
  onSeek: ["(seconds: number) => void", "Called while the viewer clicks or drags along the row."],
};

const EDITING_DOCS: PropDocs<TimelineEditing & { scenes: readonly SceneInstance[] }> = {
  scenes: [
    "readonly SceneInstance[]",
    "Every scene in the viewer's order, the switched-off ones too. Only on the player's `editing`: the timeline takes it as its own `scenes`.",
  ],
  hidden: ["readonly string[]", "The keys of the scenes that are switched off."],
  onToggle: ["(key: string, on: boolean) => void", "The switch in the hover card was flipped."],
  onMove: ["(key: string, by: -1 | 1) => void", "An arrow was pressed: one place earlier, or one place later."],
  onEdit: ["(key: string) => void", "The pencil was pressed. Open an editor for that scene."],
};

const EDITOR_PROPS: PropDocs<Parameters<typeof SceneEditor>[0]> = {
  scene: ["SceneInstance | null", "The scene as it plays now, edits applied. `null` keeps the dialog closed."],
  original: ["SceneInstance | null", 'The same scene with no edits. "Original scene" restores from it.'],
  cut: ["SceneCut | null", "The way out of the scene. `null` for the last scene playing, or one that is switched off."],
  config: ["WrappedConfig", "So the transition preview plays in the video's own palette and format."],
  onSave: [
    "(values: Record<string, string>, style: WrappedTransition | null) => void",
    "The texts that differ from the original, by field name, and the picked transition.",
  ],
  onClose: ["() => void", "The dialog was closed, by saving or by leaving."],
};

const CUT_DOCS: PropDocs<SceneCut> = {
  style: ["WrappedTransition", "The transition the scene plays now."],
  original: ["WrappedTransition", "The one the seed picked, to go back to."],
  next: ["SceneInstance", "The scene it hands over to, for the preview."],
};

const CONFIGURATOR_PROPS: PropDocs<Parameters<typeof WrappedConfigurator>[0]> = {
  config: ["WrappedConfig", "What the panel shows as picked."],
  onChange: ["(next: WrappedConfig) => void", "Called with the whole next config on every change."],
  className: ["string", "A class for the panel's root.", "optional"],
};

const CONFIG_DOCS: PropDocs<WrappedConfig> = {
  palette: ["string", "The id of a built-in palette, or `custom`."],
  accent: ["string", "The colour the custom palette is made from, as `#rrggbb`."],
  mode: ['"dark" | "light"', "Dark or light. One switch for every palette."],
  format: ['"story" | "square" | "landscape"', "9:16, 1:1 or 16:9. See [formats](/docs/formats/)."],
  shape: ['"round" | "square" | "circle"', "The shape of the calendar's cells."],
  speed: ['"0.75" | "1" | "1.5"', "How fast the video plays."],
  cuts: ["Record<string, WrappedTransition>", "A picked transition per scene key. Others keep the seed's pick."],
  hidden: ["readonly string[]", "The keys of the scenes that are switched off."],
  order: ["readonly string[]", "Scene keys in the viewer's order. Empty means your order."],
  edits: ["Record<string, string>", "Rewritten texts, keyed `<scene key>.<field name>`."],
  grain: ["boolean", "The film grain over the frame."],
};

const LOADING_PROPS: PropDocs<Parameters<typeof WrappedPlayerLoading>[0]> = {
  subject: ["LoadingSubject", "What is known before the year is: usually a handle and a caption."],
  lines: ["readonly string[]", "What to read meanwhile. More than one take turns, 2.6 seconds each."],
  config: ["WrappedConfig", "The frame takes the format and palette the video will have."],
  className: ["string", "A class for the root, the same one you give the player.", "optional"],
};

const LOADING_SUBJECT: PropDocs<LoadingSubject> = {
  handle: [
    "string",
    "Shown in the corner the way the video shows it. Leave it out when the link does not say.",
    "optional",
  ],
  caption: ["string", "The small line under the handle."],
  avatarUrl: ["string", "A picture that can be had before the year. It fades in over the initials.", "optional"],
  mark: ["string | readonly string[]", "The corner mark, as on the video.", "optional"],
  brand: ["string", "The quiet line in the bottom left, as on the video.", "optional"],
};

const LOADING_STAGE_PROPS: PropDocs<Parameters<typeof LoadingStage>[0]> = {
  subject: ["LoadingSubject", "As above."],
  lines: ["readonly string[]", "As above."],
  config: ["WrappedConfig", "As above."],
  scale: [
    "number",
    "How much the full-size frame is scaled down: the width you draw it at divided by the format's width.",
  ],
};

const TAKE_DOCS: PropDocs<StageTake> = {
  stage: ["HTMLElement", "The stage element itself, at the video's real resolution."],
  seconds: ["number", "How long the video plays at the speed it is set to."],
  show: ["(seconds: number) => void", "Puts that moment of the video on the stage."],
  intact: ["() => boolean", "False once the video was rebuilt under the render: a setting changed, a scene joined."],
  release: ["() => void", "Gives the stage back. The player returns to where it was and plays on if it was playing."],
};

const overview: DocPage = {
  path: "/docs/player/",
  section: "player",
  title: "Player",
  tagline: "play, scrub and edit a Wrapped",
  nav: "Overview",
  description:
    "The react-wrapped player package: a video player for React with a timeline that edits the cut, a scene editor, a settings panel and MP4 export.",
  lead: "The player package is everything around the frame: the video with its transport, a timeline that is also the editor, a dialog for one scene's words and transition, the settings panel, the frame shown while a year loads, and the function that turns the video into an MP4. Use `WrappedPlayer` alone to play a video, and add the rest when the viewer should change it.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "player-remote" },
      caption: "The player, with five buttons of our own driving it.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    { kind: "p", text: "Load the two stylesheets once, core first:" },
    STYLES,
    {
      kind: "note",
      text: "With `@react-wrapped/kit` you install one package and load one stylesheet, `@react-wrapped/kit/styles.css`, and every name on these pages is exported from it too.",
    },
    { kind: "h2", text: "What is in it" },
    {
      kind: "cards",
      items: [
        {
          path: "/docs/player/wrapped-player/",
          title: "WrappedPlayer",
          text: "The video, play and pause, the timeline, the clock and full screen. A ref drives it from outside.",
        },
        {
          path: "/docs/player/timeline/",
          title: "Timeline",
          text: "A segment per scene. Scrub it, and with editing on: hide, move and edit scenes from it.",
        },
        {
          path: "/docs/player/scene-editor/",
          title: "SceneEditor",
          text: "A dialog for one scene: rewrite its texts and pick the transition out of it.",
        },
        {
          path: "/docs/player/configurator/",
          title: "WrappedConfigurator",
          text: "Palette, dark or light, format, cell shape, speed and grain in one panel.",
        },
        {
          path: "/docs/player/loading/",
          title: "Loading",
          text: "The same frame with a scan beam crossing a blank year, for while the numbers load.",
        },
        {
          path: "/docs/player/video-export/",
          title: "Video export",
          text: "An MP4 at full resolution, drawn frame by frame in the browser. No server.",
        },
      ],
    },
    { kind: "h2", text: "How the pieces talk" },
    {
      kind: "list",
      items: [
        "**One config.** Everything a viewer can change is a `WrappedConfig`. The settings panel, the timeline and the scene editor each hand you the next one, and you pass it back down.",
        "**Scenes in, scenes filtered.** You give the player only the scenes that play. The timeline gets all of them, so a switched-off scene can be switched back on.",
        "**One handle.** `ref` on the player gives `play`, `pause`, `seek` and the rest. The MP4 is made through the same handle.",
      ],
    },
    {
      kind: "p",
      text: "`WrappedView` in the kit wires all of this for you. [Build the page from parts](/docs/guides/from-parts/) does the same wiring by hand.",
    },
  ],
  related: [
    "/docs/player/wrapped-player/",
    "/docs/player/timeline/",
    "/docs/guides/from-parts/",
    "/docs/scenes/",
    "/examples/full-wrapped/",
  ],
  updated: UPDATED,
};

const wrappedPlayer: DocPage = {
  path: "/docs/player/wrapped-player/",
  section: "player",
  title: "WrappedPlayer",
  tagline: "the video and its controls",
  nav: "WrappedPlayer",
  description:
    "WrappedPlayer is the React component that plays a year in review video: the stage, play and pause, a scrubbable timeline, full screen and a ref handle.",
  lead: "`WrappedPlayer` is the video. It mounts every scene on one stage, builds a single GSAP timeline from them with a transition between each pair, and puts a transport under it: play, replay, the timeline, a clock and full screen. Use it whenever you want a video on a page without the rest of `WrappedView`.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "player-remote" },
      caption: "Tap the left or right third of the frame to step between scenes.",
    },
    { kind: "h2", text: "Installation" },
    INSTALL,
    STYLES,
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "Give it who the video is about, a seed, the scenes and a config. The component below is the preview above: the player in a box with a height, and five buttons that drive it through its ref.",
    },
    fileBlock(sourceOf("demos/player-remote.tsx"), "player-remote.tsx"),
    { kind: "h2", text: "Give it a height" },
    {
      kind: "p",
      text: "The frame is always drawn at its real size and scaled to fit the room the player has: the width of its container and the height left above the transport. A container with no height gives it a room of 320 pixels, which makes a small 9:16 frame. Put the player in a box with a height, or in a flex column and let it grow. On a phone the frame never takes more than 72 percent of the screen's height, so the controls stay in view.",
    },
    { kind: "h2", text: "Props" },
    propsTable(PLAYER_PROPS),
    { kind: "h2", text: "The subject" },
    propsTable(SUBJECT_PROPS, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "The handle" },
    {
      kind: "p",
      text: "`ref` gives you a `WrappedPlayerHandle`. Every player has its own, so any number of them can share a page. All times are seconds of the video at normal speed, whatever speed the config sets.",
    },
    propsTable(HANDLE_DOCS, ["Method", "Type", "What it does"]),
    { kind: "h2", text: "Controls" },
    {
      kind: "list",
      items: [
        "**The frame.** A tap on the left third goes back to the start of the scene, or to the one before right after a cut. The right third goes on to the next scene. The middle pauses and plays.",
        "**The buttons.** Play or pause, play from the start, full screen. They are the accessible controls. The frame taps are a shortcut for touch.",
        "**The keyboard.** With focus in the transport, the left and right arrows step between scenes and `f` toggles full screen.",
        "**Full screen** plays in a dark room, whatever the page's theme is.",
      ],
    },
    { kind: "h2", text: "When the video is rebuilt" },
    {
      kind: "p",
      text: "The timeline is rebuilt when the `scenes` array, the format, the seed or `config.cuts` changes. The playhead stays where it was, and a scene whose content did not change keeps the animation it already built, so a scene joining mid-play costs almost nothing. Speed changes without a rebuild. This is why the scenes array and the config should come from state or `useMemo`: a fresh array on every render rebuilds the video on every render.",
    },
  ],
  related: [
    "/docs/player/",
    "/docs/player/timeline/",
    "/docs/player/video-export/",
    "/docs/scenes/",
    "/docs/guides/from-parts/",
  ],
  updated: UPDATED,
};

const timeline: DocPage = {
  path: "/docs/player/timeline/",
  section: "player",
  title: "Timeline",
  tagline: "the scrubber that edits the cut",
  nav: "Timeline",
  description:
    "The react-wrapped timeline: one segment per scene, scrubbable, with a hover still. With editing on, a viewer hides, reorders and edits scenes from it.",
  lead: "The timeline is the row under the video with one segment per scene, each as long as its scene plays. It is how a viewer scrubs, and with `editing` on it is also the whole editor: hover a segment to switch that scene off, move it earlier or later, or open it for editing. There is no separate scene list to keep in sync.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "timeline-editing" },
      caption: "Hover a segment (tap it on a phone): arrows, a pencil and a switch.",
    },
    { kind: "h2", text: "Editing from the player" },
    {
      kind: "p",
      text: "`WrappedPlayer` draws the timeline for you. Pass it `editing` and the hover card of every segment gets its controls. The player never changes the cut itself: each control calls you, you change the config, and the scenes you pass back are the new video.",
    },
    fileBlock(sourceOf("demos/timeline-editing.tsx"), "editable-cut.tsx"),
    propsTable(EDITING_DOCS, ["Key", "Type", "What it does"]),
    { kind: "h2", text: "What the viewer gets" },
    {
      kind: "list",
      items: [
        "**Scrub.** Click or drag anywhere on the row. The video pauses on that moment.",
        "**A still.** Hovering a segment shows the finished scene, its name and how long it plays. On touch a tap opens the same card.",
        "**The switch.** A scene switched off shrinks to a hollow sliver and stops playing. It stays on the row, so it can be switched back on. The last scene still on cannot be switched off.",
        "**The arrows** move a scene one place earlier or later.",
        "**The pencil** is there when the scene has texts to rewrite or a transition to pick.",
        "**Rarity.** A scene placed with `drop` wears its rarity colour, and glows once when it joins the row, so a find is easy to spot.",
      ],
    },
    { kind: "h2", text: "Keeping new scenes in place" },
    {
      kind: "p",
      text: "`arrangeScenes(scenes, order)` from `@react-wrapped/core` puts scenes in the viewer's order. A scene the viewer has never placed, such as one the [scan](/docs/scanner/) just found, goes right after the scene you put before it, so a find lands in its story slot even after the cut was reordered by hand. Your last scene stays last.",
    },
    { kind: "h2", text: "Without the player" },
    {
      kind: "p",
      text: "`Timeline` is exported for a transport of your own. It needs what `useWrappedTimeline` returns: the marks, the duration and a seek function, plus a ref the engine fills the segments through. This is the whole of a small player with its own play button:",
    },
    { kind: "preview", demo: { type: "part", id: "own-transport" } },
    fileBlock(sourceOf("demos/own-transport.tsx"), "own-transport.tsx"),
    { kind: "h2", text: "Props" },
    propsTable(TIMELINE_PROPS),
  ],
  related: [
    "/docs/player/scene-editor/",
    "/docs/player/wrapped-player/",
    "/docs/guides/config-in-the-url/",
    "/docs/scanner/",
    "/docs/player/",
  ],
  updated: UPDATED,
};

const sceneEditor: DocPage = {
  path: "/docs/player/scene-editor/",
  section: "player",
  title: "SceneEditor",
  tagline: "rewrite a scene, pick its cut",
  nav: "SceneEditor",
  description:
    "SceneEditor is a React dialog for one scene of a Wrapped video: its editable texts and the transition out of it, with a live preview of the pick.",
  lead: "`SceneEditor` is the dialog behind the pencil on the timeline. It shows the texts one scene lets a viewer rewrite and, when the scene hands over to another one, a chip per transition with the cut playing next to them. Use it as the answer to the timeline's `onEdit`.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "scene-editor" },
      caption: "Rewrite the headline, pick another transition, save.",
    },
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "The editor keeps nothing. It opens on the scene you hand it and gives back what changed. You store that in the config: texts under `edits`, the transition under `cuts`.",
    },
    fileBlock(sourceOf("demos/scene-editing.tsx"), "edit-one-scene.tsx"),
    { kind: "h2", text: "Props" },
    propsTable(EDITOR_PROPS),
    { kind: "h3", text: "The cut" },
    propsTable(CUT_DOCS, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "How edits are stored" },
    {
      kind: "list",
      items: [
        "`onSave` gets only the texts that differ from the original, so the config and the link made from it stay short.",
        "A field left empty gives the original words back. There is no way to save an empty headline.",
        "Edits live in `config.edits` as `<scene key>.<field name>`. `editsFor(config.edits, key)` reads one scene's edits back out, and `scene.withEdits(edits)` returns that scene with them applied.",
        "A headline is edited as lines: a new line in the box is a new line on screen. Single stars colour words and double stars make them bold, as in any scene text.",
        "The transition list comes from `transitionList()`, so a [transition of your own](/docs/guides/custom-transition/) is offered next to the built-in ones.",
      ],
    },
    { kind: "h2", text: "Which scenes can be edited" },
    {
      kind: "p",
      text: 'A scene offers the fields its kind declares: see "What a viewer can rewrite" on each [scene\'s page](/docs/scenes/). A scene placed with `locked: true` offers none, and a scene with no fields still opens for its transition. The last scene playing has no way out, so pass `cut: null` for it.',
    },
  ],
  related: [
    "/docs/player/timeline/",
    "/docs/scenes/",
    "/docs/transitions/",
    "/docs/guides/config-in-the-url/",
    "/docs/player/",
  ],
  updated: UPDATED,
};

const configurator: DocPage = {
  path: "/docs/player/configurator/",
  section: "player",
  title: "WrappedConfigurator",
  tagline: "the settings panel",
  nav: "WrappedConfigurator",
  description:
    "WrappedConfigurator is the settings panel of a react-wrapped video: palette, dark or light, format, cell shape, speed and film grain in one component.",
  lead: "`WrappedConfigurator` is the panel with every setting that applies to the whole video: ten palettes and a colour of your own, dark or light, the three formats, the shape of the calendar's cells, the speed and the film grain. It is a controlled component: it shows a config and hands back the next one.",
  blocks: [
    { kind: "preview", demo: { type: "part", id: "settings" }, caption: "Every change lands in the video right away." },
    { kind: "h2", text: "Usage" },
    fileBlock(sourceOf("demos/settings.tsx"), "settings.tsx"),
    { kind: "h2", text: "Props" },
    propsTable(CONFIGURATOR_PROPS),
    { kind: "h2", text: "The config" },
    {
      kind: "p",
      text: "A `WrappedConfig` holds everything a viewer can change. The panel edits the first six keys and the grain. The rest belong to single scenes and are edited from the [timeline](/docs/player/timeline/). Start from `DEFAULT_WRAPPED_CONFIG` and change what you need.",
    },
    propsTable(CONFIG_DOCS, ["Key", "Type", "What it holds"]),
    {
      kind: "p",
      text: "The whole object fits in a URL, so a shared link plays the video exactly as its owner set it. See [the config in the URL](/docs/guides/config-in-the-url/).",
    },
    { kind: "h2", text: "Your own defaults" },
    code("tsx", [
      `import { DEFAULT_WRAPPED_CONFIG, type WrappedConfig } from "@react-wrapped/core";`,
      ``,
      `// What the video looks like before anyone touches a setting.`,
      `export const OUR_DEFAULTS: WrappedConfig = {`,
      `  ...DEFAULT_WRAPPED_CONFIG,`,
      `  palette: "ocean",`,
      `  format: "square",`,
      `  shape: "circle",`,
      `};`,
    ]),
  ],
  related: [
    "/docs/theming/",
    "/docs/formats/",
    "/docs/guides/palette-and-chrome/",
    "/docs/guides/config-in-the-url/",
    "/docs/player/",
  ],
  updated: UPDATED,
};

const loading: DocPage = {
  path: "/docs/player/loading/",
  section: "player",
  title: "Loading",
  tagline: "the frame while the year loads",
  nav: "Loading",
  description:
    "WrappedPlayerLoading and LoadingStage draw the video's frame while its data is still loading: a scan beam over a blank year and lines that take turns.",
  lead: "`WrappedPlayerLoading` is the player before its video exists. It draws the same frame at the same size, with a beam crossing a blank year and a line of text that changes, and the transport under it at rest. Use it while the year's numbers are on their way, so nothing on the page moves when they arrive.",
  blocks: [
    { kind: "preview", demo: { type: "part", id: "loading" } },
    { kind: "h2", text: "Usage" },
    fileBlock(sourceOf("demos/loading.tsx"), "waiting-for-the-year.tsx"),
    {
      kind: "p",
      text: "Render it in the same place and with the same `className` as the player that will replace it. The frame takes its format and palette from the config, so the swap is the first scene starting inside a frame that is already there.",
    },
    { kind: "h2", text: "Props" },
    propsTable(LOADING_PROPS),
    { kind: "h3", text: "The loading subject" },
    propsTable(LOADING_SUBJECT, ["Key", "Type", "What it is"]),
    { kind: "h2", text: "With WrappedView" },
    {
      kind: "p",
      text: "`WrappedView` takes the wait as a prop. Pass `loading` in place of the subject, seed and scenes and it is the loading page. Pass the year once you have it and the same component is the video, so the layout is never rebuilt.",
    },
    code("tsx", [
      `import { WrappedView, type WrappedConfig, type WrappedCut } from "@react-wrapped/kit";`,
      ``,
      `const WAIT = {`,
      `  subject: { handle: "ada", caption: "Orbit Wrapped" },`,
      `  lines: ["Reading your year.", "Counting the busy days."],`,
      `};`,
      ``,
      `export function YearPage({`,
      `  cut,`,
      `  config,`,
      `  onConfigChange,`,
      `}: {`,
      `  /** Null until the year has loaded. */`,
      `  cut: (WrappedCut & { seed: string }) | null;`,
      `  config: WrappedConfig;`,
      `  onConfigChange: (next: WrappedConfig) => void;`,
      `}) {`,
      `  if (!cut) return <WrappedView loading={WAIT} config={config} onConfigChange={onConfigChange} />;`,
      `  return (`,
      `    <WrappedView`,
      `      subject={cut.subject}`,
      `      seed={cut.seed}`,
      `      scenes={cut.scenes}`,
      `      config={config}`,
      `      onConfigChange={onConfigChange}`,
      `    />`,
      `  );`,
      `}`,
    ]),
    { kind: "h2", text: "Only the frame" },
    {
      kind: "p",
      text: "`LoadingStage` from `@react-wrapped/core` is the frame alone, with no transport, for a layout of your own. It is drawn at full size and scaled with `scale`, like the stage itself, so give it a box of the scaled size with `position: relative` and `overflow: hidden`.",
    },
    propsTable(LOADING_STAGE_PROPS),
    { kind: "h2", text: "Motion" },
    {
      kind: "p",
      text: "The beam crosses the year and back in under four seconds, and each week lights as it passes and fades behind it. The loop runs on the Web Animations API and costs the page nothing while it waits. With reduced motion switched on in the system, the year stands still and only the lines change.",
    },
  ],
  related: ["/docs/player/wrapped-player/", "/docs/player/", "/docs/guides/server-rendering/", "/docs/scanner/"],
  updated: UPDATED,
};

const videoExport: DocPage = {
  path: "/docs/player/video-export/",
  section: "player",
  title: "Video export",
  tagline: "an MP4 made in the browser",
  nav: "Video export",
  description:
    "Export a react-wrapped video as an MP4 in the browser: renderVideo draws every frame at full resolution and encodes H.264 at 60 frames a second.",
  lead: "`renderVideo` turns the video on the page into an MP4 file, in the browser, with no server. It is not a screen recording: every frame is the real stage at the video's full resolution, set to its exact moment and handed to the browser's own H.264 encoder. Use it behind a download button.",
  blocks: [
    {
      kind: "preview",
      demo: { type: "part", id: "video-export" },
      caption: "Two scenes, to keep the wait short.",
    },
    { kind: "h2", text: "Usage" },
    {
      kind: "p",
      text: "Ask the player's handle for a take, hand it to `renderVideo` with the size of the format, and save the blob that comes back. Always release the take, whether the render finished, failed or was stopped.",
    },
    fileBlock(sourceOf("demos/video-export.tsx"), "download-video.tsx"),
    { kind: "h2", text: "How take() lends the stage" },
    {
      kind: "p",
      text: "`take()` on the [player's handle](/docs/player/wrapped-player/) pauses the video and hands over the stage and the playhead. While the take is out the render owns the frame: it calls `show(seconds)` for each frame's moment and draws what is there. `release()` puts the playhead back where it was and plays on if the video was playing.",
    },
    propsTable(TAKE_DOCS, ["Key", "Type", "What it does"]),
    {
      kind: "note",
      text: "Keep the viewer's hands off the video while it is filmed. The example sets `inert` on the player, and `WrappedView` does the same for its settings. If a setting does change, `intact()` turns false and `renderVideo` stops with an error that says to try again.",
    },
    { kind: "h2", text: "renderVideo" },
    code("ts", [
      `function renderVideo(`,
      `  take: StageTake,`,
      `  size: { width: number; height: number },`,
      `  options: { onProgress: (share: number) => void; signal: AbortSignal },`,
      `): Promise<Blob>;`,
    ]),
    {
      kind: "table",
      head: ["Argument", "What it is"],
      rows: [
        ["`take`", "What `player.take()` returned."],
        [
          "`size`",
          "The frame in pixels. `WRAPPED_FORMATS[config.format]` has the right numbers: 1080 by 1920, 1080 by 1080 or 1920 by 1080.",
        ],
        ["`onProgress`", "Called after every frame with the share done, from 0 to 1."],
        ["`signal`", "An `AbortSignal`. Aborting it stops the render and rejects the promise."],
      ],
    },
    { kind: "h2", text: "Frame by frame" },
    {
      kind: "list",
      items: [
        "`VIDEO_FPS` is 60. `frameTimes(seconds, fps)` lists the moment of every frame, and the last one is the very end of the video, so the file stops on the finished last scene.",
        "A frame is the stage's own markup drawn onto a canvas. The style rules and fonts it needs are collected once and travel with every frame.",
        "The file is H.264 in an MP4, about 12 megabits a second at 1080p, with the hardware encoder when the machine has one.",
        "Speed counts: a video set to 1.5x makes a shorter file.",
        "The result does not depend on how big the player is on the page, how fast the machine is, or whether the tab is in front.",
      ],
    },
    { kind: "h2", text: "When it cannot be made" },
    {
      kind: "p",
      text: '`renderVideo` rejects with a sentence you can show as it is. A browser without an H.264 encoder gets "This browser cannot make the video. Chrome, Edge and Safari can." A video that changed under the render gets "The video changed while it was being made. Try again." An aborted render rejects too: check `signal.aborted` before treating it as a failure.',
    },
    { kind: "h2", text: "Questions" },
    {
      kind: "faq",
      items: [
        {
          question: "Does the export need a server?",
          answer:
            "No. Every frame is drawn and encoded in the browser, and the file is a blob the page saves itself. Nothing is uploaded.",
        },
        {
          question: "Why is it slower than real time on some machines?",
          answer:
            "Because it is not a recording. A 40 second video is 2,400 frames, each drawn at full size. A fast machine makes the file quicker than the video plays and a slow one takes longer, but the file is the same.",
        },
      ],
    },
  ],
  related: [
    "/docs/player/wrapped-player/",
    "/docs/formats/",
    "/docs/graphics/",
    "/docs/player/",
    "/docs/guides/from-parts/",
  ],
  updated: UPDATED,
};

export const playerPages: readonly DocPage[] = [
  overview,
  wrappedPlayer,
  timeline,
  sceneEditor,
  configurator,
  loading,
  videoExport,
];
