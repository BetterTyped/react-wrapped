import { gsap } from "gsap";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { exitScene, HANDOVER, luckyCut } from "./cuts";
import { useLabels } from "./labels";
import { EASE_OUT, setText } from "./motion";
import { createRng } from "./rng";
import type { StageTake } from "./types";
import type { SceneInstance, WrappedConfig } from "./types";

/** Seconds as a video player shows them: 0:38. */
function clockTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Scenes overlap by this much: the next one starts coming in while the last one leaves. */
const OVERLAP = 0.25;

export interface SceneMark {
  key: string;
  label: string;
  /** Start, in timeline seconds (before speed is applied). */
  time: number;
}

/**
 * Builds the master timeline from the scenes and keeps it in step with the
 * config. The playhead is not React state: it moves sixty times a second, so the
 * scrubber, the clock and the story segments are updated through refs, and only
 * play and pause re-render.
 */
export function useWrappedTimeline({
  stageRef,
  scenes,
  config,
  seed,
  trackRef,
  clockRef,
  onSceneChange,
  autoplay = true,
}: {
  stageRef: RefObject<HTMLDivElement | null>;
  scenes: readonly SceneInstance[];
  config: WrappedConfig;
  /** Seeds the motion choices: the subject's handle plus the shuffle number. */
  seed: string;
  /** The timeline's row of segments: each scene's bar fills as it plays. */
  trackRef: RefObject<HTMLElement | null>;
  clockRef: RefObject<HTMLElement | null>;
  /** Called when the playhead crosses into another scene. Not on every frame. */
  onSceneChange?: (key: string) => void;
  autoplay?: boolean;
}) {
  const masterRef = useRef<gsap.core.Timeline | null>(null);
  const timeRef = useRef(0);
  const playingRef = useRef(autoplay);
  const marksRef = useRef<readonly SceneMark[]>([]);
  const currentRef = useRef<string | null>(null);
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;
  // Read through a ref: the clock is written on every frame, by a function that must not be rebuilt for a reworded label.
  const labels = useLabels();
  const clockLabelRef = useRef(labels.player.clock);
  clockLabelRef.current = labels.player.clock;
  const [playing, setPlaying] = useState(autoplay);
  const [marks, setMarks] = useState<readonly SceneMark[]>([]);

  const paint = useCallback(() => {
    const master = masterRef.current;
    const stage = stageRef.current;
    if (!master || !stage) return;
    const time = master.time();
    const duration = master.duration();
    timeRef.current = time;
    const clock = clockRef.current;
    if (clock) {
      const speed = master.timeScale();
      setText(clock, clockLabelRef.current(clockTime(time / speed), clockTime(duration / speed)));
    }
    const segments = stage.querySelectorAll<HTMLElement>(".wr-segments b");
    const starts = marksRef.current;
    const current = starts.findLast((mark) => mark.time <= time + 0.01)?.key ?? null;
    if (current && current !== currentRef.current) {
      currentRef.current = current;
      onSceneChangeRef.current?.(current);
    }
    const widths = new Map<string, string>();
    starts.forEach((mark, index) => {
      const end = starts[index + 1]?.time ?? duration;
      // On screen from its start until its cut has finished.
      const root = rootsRef.current.get(mark.key);
      if (root) {
        const on = time >= mark.time - 0.001 && time <= (offsRef.current.get(mark.key) ?? Infinity) + 0.02;
        if (on !== root.hasAttribute("data-on")) root.toggleAttribute("data-on", on);
      }
      const progress = Math.min(1, Math.max(0, (time - mark.time) / (end - mark.time)));
      const width = `${(progress * 100).toFixed(2)}%`;
      widths.set(mark.key, width);
      if (segments[index] && segments[index].style.width !== width) segments[index].style.width = width;
    });
    // The timeline under the video: one bar per scene, written only when it moved.
    for (const fill of trackRef.current?.querySelectorAll<HTMLElement>("[data-seg-fill]") ?? []) {
      const width = widths.get(fill.dataset.segFill ?? "") ?? "0%";
      if (fill.style.width !== width) fill.style.width = width;
    }
  }, [stageRef, trackRef, clockRef]);

  // A reworded clock arrives through React, which writes the resting "0:00" in the new words. The playhead's own
  // time goes back on before the browser paints: a paused video would otherwise sit there reading zero.
  const clockLabel = labels.player.clock;
  useLayoutEffect(() => {
    paint();
  }, [clockLabel, paint]);

  const setPlayingState = useCallback((next: boolean) => {
    playingRef.current = next;
    setPlaying(next);
  }, []);

  /*
   * Built scene timelines, kept between rebuilds and keyed by scene. Finding a drop adds one scene; building every
   * scene again for that froze the page for a second mid-reveal. Now only scenes whose picture changed are built,
   * and the cuts between scenes (cheap) are rebuilt every time, so a new transition costs almost nothing.
   */
  const builtRef = useRef(new Map<string, { signature: string; tl: gsap.core.Timeline }>());
  // Each scene's element, so the playhead can switch scenes in and out of layout without searching for them.
  const rootsRef = useRef(new Map<string, HTMLElement>());
  const offsRef = useRef(new Map<string, number>());
  // The cut out of each scene, kept the same way: rebuilt only when its transition changes or the scene is new.
  const cutsRef = useRef(new Map<string, { style: string; tl: gsap.core.Timeline }>());
  const builtForRef = useRef("");

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const built = builtRef.current;
    const cuts = cutsRef.current;

    // Take the kept scenes and cuts out of the old master, then undo what is left in it (the chrome's entrance).
    const previous = masterRef.current;
    if (previous) {
      for (const { tl } of built.values()) previous.remove(tl);
      for (const { tl } of cuts.values()) previous.remove(tl);
      previous.revert();
    }
    // A new format or seed changes every scene's motion: nothing kept is valid.
    const builtFor = `${config.format}|${seed}`;
    if (builtForRef.current !== builtFor) {
      for (const { tl } of built.values()) tl.revert();
      for (const { tl } of cuts.values()) tl.revert();
      built.clear();
      cuts.clear();
      builtForRef.current = builtFor;
    }
    const keys = new Set(scenes.map((scene) => scene.key));
    for (const [key, entry] of built) {
      if (keys.has(key)) continue;
      entry.tl.revert();
      built.delete(key);
    }
    // The last scene has no way out; a cut kept for a scene that is now last (or gone) is undone.
    const last = scenes.at(-1)?.key;
    for (const [key, entry] of cuts) {
      if (keys.has(key) && key !== last) continue;
      entry.tl.revert();
      cuts.delete(key);
    }

    const motion = createRng(seed).fork("motion");
    const cover = stage.querySelector<HTMLElement>("[data-wr-cover]");
    const master = gsap.timeline({
      paused: true,
      onUpdate: paint,
      onComplete: () => {
        paint();
        setPlayingState(false);
      },
    });

    const nextMarks: SceneMark[] = [];
    const roots = new Map<string, HTMLElement>();
    // When each scene is fully gone (its cut has finished); the last one never is.
    const offs = new Map<string, number>();
    let nextAt = 0;
    for (const off of stage.querySelectorAll<HTMLElement>(".wr-scene[data-on]")) off.removeAttribute("data-on");
    scenes.forEach((scene, index) => {
      const root = stage.querySelector<HTMLElement>(`[data-wr-scene="${scene.key}"]`);
      if (!root) return;
      roots.set(scene.key, root);
      let entry = built.get(scene.key);
      if (!entry || entry.signature !== scene.signature) {
        entry?.tl.revert();
        // In layout while it is built: staggers measure where things are, and nothing measures out of layout.
        root.setAttribute("data-on", "");
        const tl = scene.animate({ root, format: config.format, rng: motion.fork(scene.key) });
        // Set every tween up now, once. Left lazy, each reads computed styles the moment the playhead reaches it,
        // between other tweens' writes, and every read restyles the whole stage.
        tl.progress(1, true).progress(0, true);
        root.removeAttribute("data-on");
        entry = { signature: scene.signature, tl };
        built.set(scene.key, entry);
      }
      const at = nextAt;
      master.add(entry.tl, at);
      nextMarks.push({ key: scene.key, label: scene.label, time: at });
      if (index < scenes.length - 1) {
        const style = config.cuts[scene.key] ?? luckyCut(seed, scene.key);
        let cut = cuts.get(scene.key);
        if (!cut || cut.style !== style) {
          cut?.tl.revert();
          const tl = gsap.timeline();
          exitScene(tl, root, { style, cover });
          cut = { style, tl };
          cuts.set(scene.key, cut);
        }
        const cutAt = at + entry.tl.duration();
        master.add(cut.tl, cutAt);
        // The next scene begins where this cut hands over: under a closed cover, or as the last of this one goes.
        const handover = cut.tl.labels[HANDOVER] ?? Math.max(0, cut.tl.duration() - OVERLAP);
        nextAt = cutAt + handover;
        offs.set(scene.key, cutAt + cut.tl.duration());
      }
    });

    const chrome = stage.querySelector("[data-wr-chrome]");
    if (chrome)
      master.from(chrome.children, { autoAlpha: 0, y: -20, duration: 0.8, ease: EASE_OUT, stagger: 0.1 }, 0.2);

    marksRef.current = nextMarks;
    rootsRef.current = roots;
    offsRef.current = offs;
    master.timeScale(Number(config.speed));
    master.time(Math.min(timeRef.current, master.duration()));
    masterRef.current = master;
    setMarks(nextMarks);
    paint();
    if (playingRef.current && master.progress() < 1) master.play();

    // oxlint-disable-next-line react-hooks/exhaustive-deps -- paint and setPlayingState are stable; speed has its own effect
  }, [scenes, config.format, config.cuts, seed]);

  // Gone for good: undo every kept scene and the master.
  useEffect(() => {
    const built = builtRef.current;
    return () => {
      masterRef.current?.revert();
      for (const { tl } of built.values()) tl.revert();
      for (const { tl } of cutsRef.current.values()) tl.revert();
      built.clear();
    };
  }, []);

  useEffect(() => {
    masterRef.current?.timeScale(Number(config.speed));
    paint();
  }, [config.speed, paint]);

  const toggle = useCallback(() => {
    const master = masterRef.current;
    if (!master) return;
    if (master.progress() >= 1) {
      master.restart();
      setPlayingState(true);
      return;
    }
    const next = master.paused();
    master.paused(!next);
    setPlayingState(next);
  }, [setPlayingState]);

  /** Plays the cut out of a scene from a beat before it, so a newly picked transition shows straight away. */
  const previewCut = useCallback(
    (key: string) => {
      const master = masterRef.current;
      const starts = marksRef.current;
      const index = starts.findIndex((mark) => mark.key === key);
      // A scene that is off, or the last one playing, has no cut to show.
      const next = index === -1 ? undefined : starts[index + 1];
      if (!master || !next) return;
      master.time(Math.max(0, next.time - 1.2));
      master.play();
      setPlayingState(true);
      paint();
    },
    [paint, setPlayingState],
  );

  // A new transition is shown, not just stored. The timeline has been rebuilt by now (layout effect above).
  const pickedRef = useRef(config.cuts);
  useEffect(() => {
    const before = pickedRef.current;
    pickedRef.current = config.cuts;
    const changed = Object.keys({ ...before, ...config.cuts }).find((key) => before[key] !== config.cuts[key]);
    if (changed) previewCut(changed);
  }, [config.cuts, previewCut]);

  const restart = useCallback(() => {
    masterRef.current?.restart();
    setPlayingState(true);
  }, [setPlayingState]);

  const play = useCallback(() => {
    const master = masterRef.current;
    if (!master) return;
    if (master.progress() >= 1) master.restart();
    else master.play();
    setPlayingState(true);
  }, [setPlayingState]);

  const pause = useCallback(() => {
    masterRef.current?.pause();
    setPlayingState(false);
  }, [setPlayingState]);

  /** Scrubbing from the timeline: jump to a moment and stay there. */
  const seekTime = useCallback(
    (seconds: number) => {
      const master = masterRef.current;
      if (!master) return;
      master.pause();
      master.time(Math.min(master.duration(), Math.max(0, seconds)));
      setPlayingState(false);
      paint();
    },
    [paint, setPlayingState],
  );

  /** Story-style taps: back to this scene's start (or the previous one, right after a cut), or on to the next. */
  const step = useCallback(
    (direction: -1 | 1) => {
      const master = masterRef.current;
      if (!master || marks.length === 0) return;
      const time = master.time();
      const current = marks.findLastIndex((mark) => mark.time <= time + 0.01);
      const justStarted = time - (marks[current]?.time ?? 0) < 0.6;
      const target = direction === 1 ? marks[current + 1] : marks[Math.max(0, current - (justStarted ? 1 : 0))];
      if (target) master.time(target.time);
      paint();
    },
    [marks, paint],
  );

  const seekTo = useCallback(
    (key: string) => {
      const master = masterRef.current;
      const mark = marksRef.current.find((item) => item.key === key);
      if (!master || !mark) return;
      master.time(mark.time + 0.05);
      paint();
    },
    [paint],
  );

  /**
   * Lends the stage and the playhead to a render (the video file). Playback stops; the render puts each frame's
   * moment on the stage itself and hands everything back, where it was, when it is done.
   */
  const take = useCallback((): StageTake | null => {
    const master = masterRef.current;
    const stage = stageRef.current;
    if (!master || !stage) return null;
    const wasPlaying = playingRef.current;
    const wasAt = master.time();
    const speed = master.timeScale();
    master.pause();
    setPlayingState(false);
    return {
      stage,
      seconds: master.duration() / speed,
      show: (seconds) => {
        master.time(Math.min(master.duration(), seconds * speed));
        paint();
      },
      // A rebuilt timeline is a different video: the frames made so far belong to the old one.
      intact: () => masterRef.current === master && master.timeScale() === speed,
      release: () => {
        // Rebuilt or gone since: there is nothing left to give back to.
        if (masterRef.current !== master || !stageRef.current) return;
        master.time(wasAt);
        paint();
        if (wasPlaying && master.progress() < 1) {
          master.play();
          setPlayingState(true);
        }
      },
    };
  }, [stageRef, paint, setPlayingState]);

  return {
    playing,
    marks,
    toggle,
    play,
    pause,
    restart,
    seekTime,
    step,
    seekTo,
    take,
    duration: () => masterRef.current?.duration() ?? 0,
  };
}
