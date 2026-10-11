import { gsap } from "gsap";
import { type CSSProperties, Fragment, type Ref, useEffect, useLayoutEffect, useRef } from "react";

import { exitScene, HANDOVER, StageCover } from "./cuts";
import { fitScene, setText } from "./motion";
import { paletteStyle, resolvePalette } from "./palettes";
import { PlatformMark } from "./platform-mark";
import { createRng } from "./rng";
import {
  WRAPPED_FORMATS,
  type SceneInstance,
  type WrappedConfig,
  type WrappedSubject,
  type StageMark,
  type WrappedTransition,
} from "./types";

export function initials(handle: string) {
  return (
    handle
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 2)
      .toUpperCase() || "??"
  );
}

/** What sits behind every scene: the one soft light, and the platform's mark (or the plain discs) in the corner. */
export function StageBackdrop({ mark }: { mark?: StageMark }) {
  return (
    <>
      <div className="wr-light" aria-hidden />
      {mark ? (
        <PlatformMark mark={mark} />
      ) : (
        <div className="wr-rings" aria-hidden>
          <i>
            <i>
              <i>
                <i />
              </i>
            </i>
          </i>
        </div>
      )}
    </>
  );
}

/**
 * The video frame at its real resolution, scaled down to fit. Scenes are all
 * mounted at once and hidden; the timeline decides which one is on screen.
 * Around them sit the light, the rings, the progress segments, who it is about,
 * and where it came from: the address in small type, half strength, bottom left.
 */
export function WrappedStage({
  stageRef,
  subject,
  scenes,
  config,
  scale,
}: {
  stageRef: Ref<HTMLDivElement>;
  subject: WrappedSubject;
  scenes: readonly SceneInstance[];
  config: WrappedConfig;
  scale: number;
}) {
  const format = WRAPPED_FORMATS[config.format];
  const style = {
    width: format.width,
    height: format.height,
    transform: `scale(${scale})`,
    ...paletteStyle(resolvePalette(config)),
  } as CSSProperties;

  return (
    <div ref={stageRef} className="wr-stage" data-format={config.format} data-shape={config.shape} style={style}>
      <StageBackdrop mark={subject.mark} />

      {scenes.map((scene) => (
        <Fragment key={scene.key}>{scene.content}</Fragment>
      ))}

      <StageCover format={config.format} />

      <div className="wr-chrome" data-wr-chrome>
        <div className="wr-segments">
          {scenes.map((scene) => (
            <i key={scene.key}>
              <b />
            </i>
          ))}
        </div>
        <div className="wr-who">
          <div className="wr-avatar">
            {subject.avatarUrl ? (
              <img src={subject.avatarUrl} alt="" crossOrigin="anonymous" />
            ) : (
              initials(subject.handle)
            )}
          </div>
          <div>
            @{subject.handle}
            <small>{subject.caption}</small>
          </div>
        </div>
        {subject.brand ? <div className="wr-brand">{subject.brand}</div> : null}
      </div>

      {config.grain ? <div className="wr-grain" aria-hidden /> : null}
    </div>
  );
}

/**
 * A still of one scene as it looks once it has played in, small: the scrubber's hover preview, so a cut is easy to find
 * without scrubbing to it. The scene's own content on a bare stage, counters showing their final numbers.
 */
export function SceneThumb({
  scene,
  config,
  width,
  loop = false,
}: {
  scene: SceneInstance;
  config: WrappedConfig;
  width: number;
  /** Plays the scene's own entrance again and again instead of standing still: how the designs page shows a chart. */
  loop?: boolean;
}) {
  const format = WRAPPED_FORMATS[config.format];
  const scale = width / format.width;
  const stageRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    for (const counter of stageRef.current?.querySelectorAll<HTMLElement>("[data-count]") ?? []) {
      setText(counter, Number(counter.dataset.count ?? 0).toLocaleString("en-US") + (counter.dataset.suffix ?? ""));
    }
    // A still is the scene as it plays, so it is fitted to the frame the same way.
    const still = stageRef.current?.querySelector<HTMLElement>(".wr-scene");
    if (still) fitScene(still);
  }, [scene, config.format]);

  useEffect(() => {
    const stage = stageRef.current;
    const root = stage?.querySelector<HTMLElement>(".wr-scene");
    if (!loop || !stage || !root) return;
    // The scene's own timeline, so what loops here is exactly what plays in a video. Its closing hold is the breath
    // on the finished picture between laps.
    const lap = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 });
    lap.add(scene.animate({ root, format: config.format, rng: createRng(scene.key) }));
    // Only while it can be seen: a shelf of these would otherwise all run at once, off screen included.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) lap.play();
      else lap.pause();
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      lap.revert();
    };
  }, [loop, scene, config.format]);

  return (
    <div
      className="wr-root wr:relative wr:overflow-hidden wr:rounded-[12px]"
      style={{ width, height: format.height * scale }}
    >
      <div
        ref={stageRef}
        className="wr-stage wr-thumb"
        data-format={config.format}
        data-shape={config.shape}
        style={
          {
            width: format.width,
            height: format.height,
            transform: `scale(${scale})`,
            ...paletteStyle(resolvePalette(config)),
          } as CSSProperties
        }
      >
        <div className="wr-light" aria-hidden />
        {scene.content}
      </div>
    </div>
  );
}

/**
 * One cut on a loop between two stills, small: the designs page shows every transition this way, side by side. The
 * first scene is mounted twice, so the loop ends on the picture it began with and each still leaves only once a lap,
 * the way a scene does in a real video.
 */
export function CutPreview({
  style,
  first,
  second,
  config,
  width,
}: {
  style: WrappedTransition;
  first: SceneInstance;
  second: SceneInstance;
  config: WrappedConfig;
  width: number;
}) {
  const format = WRAPPED_FORMATS[config.format];
  const scale = width / format.width;
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    for (const counter of stageRef.current?.querySelectorAll<HTMLElement>("[data-count]") ?? []) {
      setText(counter, Number(counter.dataset.count ?? 0).toLocaleString("en-US") + (counter.dataset.suffix ?? ""));
    }
    for (const still of stageRef.current?.querySelectorAll<HTMLElement>(".wr-scene") ?? []) fitScene(still);
  }, [first, second, config.format]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Each still sits in a holder that keeps it out of sight until its turn; the cut itself moves the scene inside.
    const holders = [...stage.querySelectorAll<HTMLElement>("[data-still]")];
    const cover = stage.querySelector<HTMLElement>("[data-wr-cover]");
    const loop = gsap.timeline({ paused: true, repeat: -1 });
    holders.slice(0, -1).forEach((holder, index) => {
      const still = holder.querySelector<HTMLElement>(".wr-scene");
      if (!still) return;
      const cut = gsap.timeline();
      exitScene(cut, still, { style, cover });
      const at = loop.duration() + 0.9;
      loop.add(cut, at);
      loop.set(holders[index + 1], { visibility: "visible" }, at + (cut.labels[HANDOVER] ?? cut.duration()));
    });
    loop.to({}, { duration: 0.9 });
    // Only while it can be seen: a page of these would otherwise all run at once, off screen included.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loop.play();
      else loop.pause();
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      loop.revert();
    };
  }, [style, first, second, config.format]);

  return (
    <div
      className="wr-root wr:relative wr:overflow-hidden wr:rounded-[12px]"
      style={{ width, height: format.height * scale }}
    >
      <div
        ref={stageRef}
        className="wr-stage wr-thumb"
        data-format={config.format}
        data-shape={config.shape}
        style={
          {
            width: format.width,
            height: format.height,
            transform: `scale(${scale})`,
            ...paletteStyle(resolvePalette(config)),
          } as CSSProperties
        }
      >
        <div className="wr-light" aria-hidden />
        {[first, second, first].map((scene, index) => (
          // Hidden in the markup, not by the loop: the page is server-rendered, and until it wakes up the stills would
          // sit on top of each other.
          // oxlint-disable-next-line react/no-array-index-key -- three fixed stills, the first one twice
          <div key={index} data-still className={index === 0 ? "wr:contents" : "wr:invisible wr:contents"}>
            {scene.content}
          </div>
        ))}
        <StageCover format={config.format} />
      </div>
    </div>
  );
}
