import type { CSSProperties } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { animateChart, Chart, type SceneChart } from "@react-wrapped/charts";
import {
  Calendar,
  createRng,
  DEFAULT_WRAPPED_CONFIG,
  exitScene,
  HANDOVER,
  paletteStyle,
  resolvePalette,
  type SceneInstance,
  type WrappedFormat,
  WrappedStage,
  type WrappedTransition,
} from "@react-wrapped/core";
import { directSample, sampleTraits, sampleYear } from "@react-wrapped/sample";
import { gsap } from "./gsap";
import { CHART_WALL } from "./charts";
import "../../packages/core/src/styles.css";
import "./film.css";

/*
 * What the film's scenes reach for on `window.RW`. Every picture comes from the library itself: the charts are its
 * `Chart` with its own entrances, the year grid is its `Calendar`, and the playing video is its `WrappedStage` with
 * the sample year's real scenes and real cuts. Each mount renders at once (flushSync), so a scene can measure and
 * build its timeline on the next line.
 */

type Mode = "dark" | "light";

/** A palette as the stage's custom properties. */
function paletteVars(palette = "evergreen", mode: Mode = "dark"): Record<string, string> {
  return paletteStyle(resolvePalette({ palette, accent: "#39d353", mode }));
}

function render(host: HTMLElement, node: React.ReactNode) {
  const root = createRoot(host);
  flushSync(() => root.render(node));
  return host.firstElementChild as HTMLElement;
}

/** A bare stage: the palette and the library's type, no frame, no light. What a chart or a calendar sits in. */
function bare(palette: string, mode: Mode, width: number, format: WrappedFormat, extra?: CSSProperties) {
  return {
    className: "wr-stage rw-bare",
    "data-format": format,
    "data-shape": "round",
    style: { ...paletteVars(palette, mode), width, ...extra } as CSSProperties,
  };
}

/** One chart, drawn at `width` (920 is its own size), with its entrance ready to place on a timeline. */
function mountChart(
  host: HTMLElement,
  chart: SceneChart,
  { palette = "evergreen", mode = "dark" as Mode, width = 920 } = {},
) {
  const stage = render(
    host,
    <div {...bare(palette, mode, width, "story")}>
      <div className="wr-chart-tone" data-rarity="common">
        <Chart chart={chart} />
      </div>
    </div>,
  );
  return {
    stage,
    /** The chart's own entrance, on `tl` at `at` seconds. */
    animate: (tl: gsap.core.Timeline, at: number) => animateChart(tl, stage, at),
  };
}

/** The sample year as the library's contribution grid. */
function mountCalendar(host: HTMLElement, { handle = "ada", palette = "evergreen", months = false } = {}) {
  const year = sampleYear(handle);
  return render(
    host,
    <div {...bare(palette, "dark", 0, "landscape", { width: "auto" })}>
      <Calendar calendar={year.calendar} months={months} />
    </div>,
  );
}

/**
 * A timeline's labels. When HyperFrames renders, every timeline is a proxy that forwards the methods and not the
 * fields, so the labels are read from the real timeline behind it.
 */
const labelsOf = (tl: gsap.core.Timeline) => ((tl as { __hfReal?: gsap.core.Timeline }).__hfReal ?? tl).labels;

interface StageOptions {
  handle?: string;
  palette?: string;
  mode?: Mode;
  format?: WrappedFormat;
  /** Scene keys from the sample cut, in the order they play. */
  keys: readonly string[];
  /** The cut out of each scene but the last. */
  cuts?: readonly WrappedTransition[];
  /** How long each scene plays before its cut, at most. Its own length when left out. */
  caps?: readonly (number | undefined)[];
  /** The stage's chrome: progress segments, who it is about. */
  chrome?: boolean;
}

/**
 * The library's real video frame playing the sample year: its scenes, its cuts between them, its progress segments.
 * Put together the way the player does it (packages/core/src/use-wrapped-timeline.ts), as one timeline that is
 * placed on the film's.
 */
function mountStage(host: HTMLElement, options: StageOptions) {
  const { handle = "ada", palette = "evergreen", mode = "dark", format = "story", keys, chrome = true } = options;
  const year = sampleYear(handle);
  const cut = directSample(year, sampleTraits(year), []);
  const scenes = keys
    .map((key) => cut.scenes.find((scene) => scene.key === key))
    .filter((scene): scene is SceneInstance => Boolean(scene));
  const config = { ...DEFAULT_WRAPPED_CONFIG, palette, mode, format, grain: false };
  const stage = render(
    host,
    <WrappedStage stageRef={null} subject={cut.subject} scenes={scenes} config={config} scale={1} />,
  );
  stage.classList.add("rw-stage");
  if (!chrome) stage.querySelector("[data-wr-chrome]")?.remove();

  /** The whole run as one timeline: each scene's entrance, then its cut, the next scene starting at the handover. */
  const timeline = (seed = cut.seed) => {
    const motion = createRng(seed).fork("motion");
    const cover = stage.querySelector<HTMLElement>("[data-wr-cover]");
    const segments = [...stage.querySelectorAll<HTMLElement>(".wr-segments b")];
    const master = gsap.timeline();
    const spans: { root: HTMLElement; on: number; off: number }[] = [];
    let nextAt = 0;
    const roots = [...stage.querySelectorAll<HTMLElement>("[data-wr-scene]")];
    scenes.forEach((scene, index) => {
      const root = roots.find((element) => element.dataset.wrScene === scene.key);
      if (!root) return;
      // In layout while it is built: staggers and fits measure where things are.
      root.setAttribute("data-on", "");
      const tl = scene.animate({ root, format, rng: motion.fork(scene.key) });
      tl.progress(1, true).progress(0, true);
      root.removeAttribute("data-on");
      const at = nextAt;
      master.add(tl, at);
      let off = Number.POSITIVE_INFINITY;
      if (index < scenes.length - 1) {
        const out = gsap.timeline();
        exitScene(out, root, { style: options.cuts?.[index] ?? "lift", cover });
        const cutAt = at + Math.min(tl.duration(), options.caps?.[index] ?? Number.POSITIVE_INFINITY);
        master.add(out, cutAt);
        nextAt = cutAt + (labelsOf(out)[HANDOVER] ?? Math.max(0, out.duration() - 0.25));
        off = cutAt + out.duration();
      }
      spans.push({ root, on: at, off });
    });
    // A scene is in layout from its start until its cut has finished: set, not toggled from a callback, so any
    // frame seeked on its own shows the right scene.
    spans.forEach(({ root, on, off }, index) => {
      gsap.set(root, { display: "none" });
      master.set(root, { display: "flex" }, on);
      if (Number.isFinite(off)) master.set(root, { display: "none" }, off);
      const bar = segments[index];
      const end = spans[index + 1]?.on ?? master.duration();
      if (bar) master.fromTo(bar, { width: "0%" }, { width: "100%", duration: end - on, ease: "none" }, on);
    });
    master.progress(1, true).progress(0, true);
    return master;
  };

  return { stage, subject: cut.subject, scenes: scenes.map((scene) => scene.key), timeline };
}

/** The sample year in numbers, for the film's own words and tables. */
function sample(handle = "ada") {
  const year = sampleYear(handle);
  return {
    handle: year.handle,
    totals: year.totals,
    months: year.months.slice(-12).map(({ label, total, activeDays }) => ({ label, total, activeDays })),
    streak: year.streak.length,
    keys: directSample(year, sampleTraits(year), []).scenes.map((scene) => scene.key),
  };
}

export { CHART_WALL, mountCalendar, mountChart, mountStage, paletteVars, sample };
