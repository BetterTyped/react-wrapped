import { createContext, type ReactNode, useContext, useMemo } from "react";

import { type Rarity, RARITY_LABELS } from "./rarity";

/*
 * Every word the library puts on screen by itself: the player's buttons, the timeline, the scene editor, the settings,
 * the scan, the gallery, the share row, and the few words scenes and charts print without being handed them. They are
 * all here, in one table, so a site can translate the library or reword it without touching a component. A scene's
 * own texts (its headline, its numbers) are not here: those are the director's, passed in as props.
 *
 * A value is a string, or a function when the sentence has a number or a name in it, so the language decides where
 * the number goes and how its plural reads.
 */

const WEEKDAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"] as const;
const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** The locale numbers and dates are written in when nobody says otherwise. */
export const DEFAULT_LOCALE = "en-US";

export const DEFAULT_LABELS = {
  /** The transport under the video. */
  player: {
    controls: "Video controls. Left and right arrows step between scenes.",
    play: "Play",
    pause: "Pause",
    restart: "Play from the start",
    fullscreen: "Full screen",
    exitFullscreen: "Leave full screen",
    /** Where the playhead is and how long the video runs, both already written as 0:38. */
    clock: (elapsed: string, total: string) => `${elapsed} / ${total}`,
  },
  /** The row of segments, and the preview that opens over one. */
  timeline: {
    /** How long a scene plays: 4s, or 1:05 past a minute. */
    length: (seconds: number) =>
      seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    off: "Off",
    earlier: "Earlier",
    later: "Later",
    moveEarlier: (scene: string) => `Play ${scene} earlier`,
    moveLater: (scene: string) => `Play ${scene} later`,
    edit: (scene: string) => `Edit ${scene}`,
    editHint: "Its words and transition",
    toggle: (scene: string) => `Play ${scene}`,
  },
  /** The scene editor. */
  editor: {
    title: (scene: string) => `Edit "${scene}"`,
    titleEmpty: "Edit scene",
    wordsHelp:
      "Wrap words in *stars* to color them, **double stars** to make them bold. A new line in a headline starts a new line on screen.",
    cutHelp: "Pick how this scene hands over to the next one.",
    cutField: "Transition to the next scene",
    cut: "Transition",
    reset: "Original scene",
    save: "Save",
  },
  /**
   * What the scene editor calls a text field, by the name the scene itself gave it ("Headline", "Line under it").
   * Empty here: a field missing from the table keeps the scene's own name for it.
   */
  fields: {} as Partial<Record<string, string>>,
  /** The settings panel. */
  settings: {
    colors: "Colors",
    palette: "Palette",
    customPalette: "Your color",
    accent: "Accent color",
    randomAccent: "Pick a random color",
    randomAccentHint: "Random color",
    mode: "Dark or light",
    dark: "Dark",
    light: "Light",
    format: "Format",
    cells: "Cells",
    cellShape: "Cell shape",
    shapes: { round: "Rounded", square: "Square", circle: "Dots" },
    speed: "Speed",
    /** A speed on its chip: 1.5x. */
    speedValue: (speed: string) => `${speed}x`,
    grain: "Film grain",
  },
  /** The year scan: its headline for every state, its buttons, and the card it turns over. */
  scan: {
    hiding: (count: number) => `Your year is hiding ${count} ${count === 1 ? "scene" : "scenes"}.`,
    almostReady: "Your Wrapped is almost ready.",
    scanningAgain: "Scanning your year again.",
    scanning: (left: number) => `Scanning your year. ${left} more after this one.`,
    scanningLast: "Scanning for the last one.",
    foundAll: (count: number) => `You found all ${count}.`,
    moreHiding: (count: number) => `${count} more ${count === 1 ? "is" : "are"} hiding in your year.`,
    about: "Achievements you earned and a few easter eggs. Each one joins your video when the scan finds it.",
    aboutWaiting: (count: number) =>
      `Your year is hiding ${count} ${count === 1 ? "scene" : "scenes"} only you get. Find ${count === 1 ? "it" : "them"} and your video plays.`,
    aboutGate: "Achievements you earned and a few easter eggs. Your video plays when the scan is done.",
    done: "They are in your video now. Run the scan again to watch them come out.",
    doneGate: "They are in your video. Here it comes.",
    start: "Scan my year",
    startGate: "Find my scenes",
    resume: "Keep scanning",
    findAll: "Find all",
    again: "Scan again",
    finds: "Your finds",
    stillHidden: "Still hidden",
    open: (name: string) => `Open ${name}`,
    openCard: "Open this card",
    closeCard: "Close this card",
    closeCardHint: "Click to close",
    turnCard: "Turn the card over, then add it to your video",
    turnCardHint: "Click to turn it over, click again to add it",
    /** Under a found card, with the day as the page describes it: "Found on Mar 14". */
    foundOn: (day: string) => `Found on ${day}`,
  },
  /** The graphics a Wrapped hands its owner to keep. */
  gallery: {
    /** The heading's first half: "3 graphics". The accent half comes after it. */
    count: (count: number) => `${count} ${count === 1 ? "graphic" : "graphics"}`,
    toKeep: "to keep.",
    about: "Post them, pin them, put them in your README.",
    aboutLocked: (locked: number) =>
      `Post them, pin them, put them in your README. ${locked} more ${locked === 1 ? "unlocks" : "unlock"} as the scan finds ${locked === 1 ? "it" : "them"}.`,
    lockedTitle: "Still hidden",
    lockedLine: "Scan your year to unlock it.",
    download: "Download",
    markdown: "Markdown",
    markdownHint: "Copy the snippet that embeds it",
    copied: "Copied",
    failed: "That did not come through. Try again in a moment.",
  },
  /** The two buttons beside the video, and the line under them while the file is made. */
  share: {
    copyLink: "Copy link",
    copied: "Copied",
    download: "Download",
    stop: "Stop",
    stopMaking: (percent: number) => `Stop making the video, ${percent}% done`,
    percent: (percent: number) => `${percent}%`,
    /** Why the file takes a while. `frames` is already written in the page's locale; `left` is one of the two below. */
    drawing: (frames: string, left: string | null) =>
      `Drawing ${frames} frames at full size, one by one, so the video is sharp and smooth on any machine.${left === null ? "" : ` ${left}`}`,
    minutesLeft: (minutes: number) => `About ${minutes} min left.`,
    secondsLeft: (seconds: number) => `About ${seconds}s left.`,
  },
  /** Why a video file could not be made. Said under the share buttons, or handed to `onError`. */
  video: {
    failed: "The video did not come through. Try again.",
    unsupported: "This browser cannot make the video. Chrome, Edge and Safari can.",
    canvasBlocked: "Your browser blocked the canvas the video is drawn on.",
    changed: "The video changed while it was being made. Try again.",
    unfinished: "The browser could not finish the video file.",
    fileUnread: "A file the video needs could not be read.",
    fileMissing: (status: number) => `A file the video needs did not load (${status}).`,
  },
  /** How rare a find is, as a word: Common, Rare, Epic, Legendary. The same words `RARITY_LABELS` holds. */
  rarity: { ...RARITY_LABELS },
  /** The few words the ready-made scenes print that no director passed in. */
  scenes: {
    stillHidden: "Still hidden",
    more: (count: number) => `+${count} more`,
  },
  /** The few words the charts print that no director passed in. */
  charts: {
    /** An hour of the day as people say it: "12 am", "3 pm". */
    hour: (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "am" : "pm"}`,
    /** A weekday as a habit, Monday being 0: "Fridays". */
    weekday: (day: number): string => WEEKDAYS[day] ?? "",
    /** A weekday on an axis, Monday being 0: "F". */
    weekdayLetter: (day: number): string => WEEKDAY_LETTERS[day] ?? "",
    /** The busiest slot of a week: "Fridays, 3 pm". */
    weekdayHour: (weekday: string, hour: string) => `${weekday}, ${hour}`,
    /** Stands where a change in percent would, for a count that was zero the year before. */
    new: "new",
  },
  /** A palette's name by its id ("evergreen"). Empty here: a palette missing from the table keeps its built-in name. */
  palettes: {} as Partial<Record<string, string>>,
  /** A transition's name by its id ("wave"). Empty here: one missing from the table keeps its own name. */
  transitions: {} as Partial<Record<string, string>>,
  /** A format's name by its id ("story"). Empty here: one missing from the table keeps its ratio, "9:16". */
  formats: {} as Partial<Record<string, string>>,
};

/** Every label the library reads, in the shape of `DEFAULT_LABELS`. */
export type WrappedLabels = typeof DEFAULT_LABELS;

/** Any part of a tree, down to a single leaf. A function is a leaf: it is replaced whole. */
type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** Some of the labels: only the ones to change. Everything left out keeps what it had. */
export type WrappedLabelOverrides = DeepPartial<WrappedLabels>;

const isGroup = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function mergeGroup(base: Record<string, unknown>, over: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...base };
  for (const [key, value] of Object.entries(over)) {
    // A key set to undefined is a key left out: it must not blank a label.
    if (value === undefined) continue;
    const current = merged[key];
    merged[key] = isGroup(current) && isGroup(value) ? mergeGroup(current, value) : value;
  }
  return merged;
}

/**
 * Labels with some of them replaced. For drawing outside React (`renderShareCard`), where there is no provider to
 * read; inside React use `WrappedProvider`. With nothing to replace it hands back the same object.
 */
export function mergeLabels(base: WrappedLabels, overrides?: WrappedLabelOverrides): WrappedLabels {
  if (!overrides) return base;
  return mergeGroup(base, overrides) as WrappedLabels;
}

const LabelsContext = createContext<WrappedLabels>(DEFAULT_LABELS);
const LocaleContext = createContext<string>(DEFAULT_LOCALE);

/**
 * Rewords or translates everything under it. `labels` holds only what changes and is laid over what the nearest
 * provider above already says, so a site can set its language once at the top and reword one button further down.
 *
 * Keep `labels` the same object between renders (a constant, or `useMemo`): a new one is a new table, and everything
 * that reads a label draws again.
 */
export function WrappedProvider({
  labels,
  locale,
  children,
}: {
  labels?: WrappedLabelOverrides;
  /** How the chrome writes numbers: "en-US", "pl-PL". Left out, it is the provider's above, or "en-US". */
  locale?: string;
  children: ReactNode;
}) {
  const inherited = useContext(LabelsContext);
  const inheritedLocale = useContext(LocaleContext);
  const merged = useMemo(() => mergeLabels(inherited, labels), [inherited, labels]);
  return (
    <LocaleContext.Provider value={locale ?? inheritedLocale}>
      <LabelsContext.Provider value={merged}>{children}</LabelsContext.Provider>
    </LocaleContext.Provider>
  );
}

/** The labels in force here: the defaults, with whatever the providers above replaced. Works with no provider. */
export const useLabels = (): WrappedLabels => useContext(LabelsContext);

/** The locale in force here, for writing a number. "en-US" with no provider. */
export const useLocale = (): string => useContext(LocaleContext);

/**
 * One label, as text. A scene's markup is built outside React (the director calls the scene long before it is on a
 * stage), so a scene cannot read the labels itself: it places this where the word goes, and the word is looked up
 * when the stage renders it, under whatever provider the stage is under.
 */
export function Label({ of }: { of: (labels: WrappedLabels) => string }) {
  return of(useLabels());
}

/** A rarity as a word, in the page's language. For scenes, which are built outside React: see `Label`. */
export function RarityLabel({ rarity }: { rarity: Rarity }) {
  return useLabels().rarity[rarity];
}
