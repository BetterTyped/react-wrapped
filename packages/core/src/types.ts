import type { ReactNode } from "react";

import type { Rng } from "./rng";

/** The video's fixed resolution. Every scene is laid out against a shorter side of 1080 px. */
export const WRAPPED_FORMATS = {
  story: { label: "9:16", width: 1080, height: 1920 },
  square: { label: "1:1", width: 1080, height: 1080 },
  landscape: { label: "16:9", width: 1920, height: 1080 },
} as const;
export type WrappedFormat = keyof typeof WRAPPED_FORMATS;

export type CellShape = "round" | "square" | "circle";

export const WRAPPED_SPEEDS = ["0.75", "1", "1.5"] as const;
export type WrappedSpeed = (typeof WRAPPED_SPEEDS)[number];
/**
 * How one scene hands over to the next. The first fourteen cover the frame with something and clear onto the next
 * scene; the last five move the scene itself.
 */
export const WRAPPED_TRANSITIONS = [
  "layers",
  "slash",
  "arrow",
  "wave",
  "drip",
  "bloom",
  "pulse",
  "blink",
  "spin",
  "fan",
  "doors",
  "brush",
  "scan",
  "flash",
  "iris",
  "wipe",
  "lift",
  "drop",
  "zoom",
] as const;
export type BuiltInTransition = (typeof WRAPPED_TRANSITIONS)[number];
/** A transition by its id: one of the built-in ones, or one added with `defineTransition`. */
export type WrappedTransition = BuiltInTransition | (string & {});

/** A palette is the graph's five levels, the surfaces around them and what each rarity wears. Level 4 is the accent. */
export type { WrappedPalette } from "./palette-data";

/** Everything a viewer can change. It lives in the URL, so the link is the video. */
export interface WrappedConfig {
  palette: string;
  /** Accent for the custom palette, as #rrggbb. */
  accent: string;
  /** Background for the custom palette. */
  mode: "dark" | "light";
  format: WrappedFormat;
  shape: CellShape;
  speed: WrappedSpeed;
  /** The way out of a scene, by scene key, where the creator picked one. Missing means the cut's luck picks. */
  cuts: Readonly<Record<string, WrappedTransition>>;
  /** Scene keys switched off. Empty means every scene plays. */
  hidden: readonly string[];
  /** Scene keys in the order the viewer dragged them into. Empty means the director's order. */
  order: readonly string[];
  /** Rewritten scene texts, keyed "<scene key>.<field name>". Missing means the director's words. */
  edits: Readonly<Record<string, string>>;
  grain: boolean;
}

/** What a scene's animation gets to work with. */
export interface SceneContext {
  /** The scene's root element. Query inside it, never outside. */
  root: HTMLElement;
  format: WrappedFormat;
  /** Seeded, so the same link always animates the same way. */
  rng: Rng;
}

/**
 * One scene as the director placed it: what it renders and how it animates.
 * Built with `defineScene`, which closes over the scene's own props so the
 * engine can play any mix of scenes without knowing their shapes.
 */
export interface SceneInstance {
  /** Stable within one video, used to hide a scene from the configurator. */
  key: string;
  /** Shown in the configurator's scene list. */
  label: string;
  /** Set on scenes that are this person's own: a unique moment or a pull, with how rare it is. */
  drop?: "common" | "rare" | "epic" | "legendary";
  /** The texts a viewer may rewrite, with what they say right now. */
  fields: readonly { name: string; label: string; multiline: boolean; value: string }[];
  /** The same scene with some of its texts rewritten, keyed by field name. */
  withEdits: (edits: Readonly<Record<string, string>>) => SceneInstance;
  content: ReactNode;
  /**
   * What the scene shows, as a string. Equal signatures mean the same picture, so the engine keeps the scene's built
   * animation instead of building it again (building one costs real time; rebuilding them all froze the reveal).
   */
  signature: string;
  /** Brings the scene in and holds it. The engine adds the way out. */
  animate: (context: SceneContext) => gsap.core.Timeline;
}

/**
 * A mark to press into the corner of the frame: its outline as SVG path data in a 24 by 24 box. Several paths are
 * pressed out one by one, so the shapes of a mark made of parts stay apart. Bring your own logo; none ship here.
 */
export type StageMark = string | readonly string[];

/** Who the video is about, for the chrome at the top. */
export interface WrappedSubject {
  handle: string;
  /** Their name, for a director that wants to greet them by it. The stage itself shows the handle. */
  name?: string | null;
  /** Their picture. Left out, the stage shows the handle's initials. */
  avatarUrl?: string | null;
  /** What the video is called: "Orbit Wrapped". */
  caption: string;
  /** The window the numbers cover, already formatted: "Oct 2025 to Oct 2026". For your own scenes and cards. */
  period?: string;
  /** A mark pressed into the corner of the frame. Left out, the corner keeps the plain discs. */
  mark?: StageMark;
  /** A quiet line saying where the video is from: a site address, a product name. Left out, nothing is shown. */
  brand?: string;
}

/**
 * A finished cut: the subject plus the scenes in order. A source's director
 * builds one from its data and a seed that the source assigns by luck.
 */
export interface WrappedCut {
  subject: WrappedSubject;
  scenes: readonly SceneInstance[];
}

/**
 * The player's stage and playhead, on loan to a render. While it is out the video does not play: `show` puts any
 * moment on the stage, and `release` gives everything back the way it was.
 */
export interface StageTake {
  stage: HTMLElement;
  /** How long the video plays at the speed it is set to. */
  seconds: number;
  show: (seconds: number) => void;
  /** False once the video was rebuilt under the render (a setting changed, a scene joined). */
  intact: () => boolean;
  release: () => void;
}
