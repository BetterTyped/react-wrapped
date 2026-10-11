import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { type Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import { Timeline, type TimelineEditing } from "./timeline";
import {
  LoadingStage,
  type LoadingSubject,
  type SceneInstance,
  type StageTake,
  useWrappedTimeline,
  WRAPPED_FORMATS,
  type WrappedConfig,
  type WrappedFormat,
  WrappedStage,
  type WrappedSubject,
} from "@react-wrapped/core";
import { cn } from "@react-wrapped/core/internal";

/** The tallest the frame may get on a phone, as a share of the viewport, so the controls stay on screen. */
const PHONE_HEIGHT_SHARE = 0.72;

const shell = "wr:flex wr:min-w-0 wr:flex-col wr:gap-4";
const room = "wr:grid wr:min-h-[320px] wr:flex-1 wr:place-items-center";
const frame =
  "wr:relative wr:overflow-hidden wr:rounded-[22px] wr:shadow-[0_40px_80px_-40px_oklch(0.2_0.05_170/0.55)] wr:ring-1 wr:ring-black/5";
const transport = "wr:flex wr:items-center wr:gap-3 wr:px-1";
const control = "wr:grid wr:size-11 wr:shrink-0 wr:place-items-center wr:rounded-full wr:[&_svg]:size-4";
const clock =
  "wr:shrink-0 wr:whitespace-nowrap wr:text-right wr:text-[14px] wr:font-medium wr:tabular-nums wr:text-muted-foreground";

/** Fits the fixed-size frame into whatever room the layout gives it. Full screen, it takes the whole height. */
function useStageFit(format: WrappedFormat, fullscreen: boolean) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const { width, height } = WRAPPED_FORMATS[format];

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const maxHeight = fullscreen
        ? box.clientHeight
        : Math.min(box.clientHeight || Infinity, window.innerHeight * PHONE_HEIGHT_SHARE);
      setScale(Math.min(box.clientWidth / width, maxHeight / height));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [width, height, fullscreen]);

  return {
    boxRef,
    scale,
    style: { width: width * scale, height: height * scale, visibility: scale ? "visible" : "hidden" } as const,
  };
}

/**
 * The player before its video exists: the frame at the size and place the video will take, with the wait playing in
 * it, and the transport underneath at rest. When the year arrives nothing around the frame moves.
 */
export function WrappedPlayerLoading({
  subject,
  lines,
  config,
  className,
}: {
  subject: LoadingSubject;
  lines: readonly string[];
  config: WrappedConfig;
  className?: string;
}) {
  const { boxRef, scale, style } = useStageFit(config.format, false);
  return (
    <div className={cn("wr-root", shell, className)}>
      <div ref={boxRef} className={room}>
        <div className={frame} style={style}>
          <LoadingStage subject={subject} lines={lines} config={config} scale={scale} />
        </div>
      </div>
      <div aria-hidden className={cn(transport, "wr:opacity-40")}>
        <span className={cn(control, "wr:bg-foreground wr:text-background")}>
          <Play fill="currentColor" />
        </span>
        <span className={cn(control, "wr:ring-1 wr:ring-border")}>
          <RotateCcw />
        </span>
        <span className="wr:flex wr:h-11 wr:flex-1 wr:items-center">
          <i className="wr:h-2 wr:w-full wr:rounded-full wr:bg-muted" />
        </span>
        <span className={clock}>0:00 / 0:00</span>
        <span className={cn(control, "wr:ring-1 wr:ring-border")}>
          <Maximize2 />
        </span>
      </div>
    </div>
  );
}

/** What the player lends out: its stage and playhead, for making the video file. Null while there is no video. */
export interface WrappedPlayerHandle {
  take: () => StageTake | null;
}

/**
 * The video and its transport. Tap the left or right third of the frame to
 * step between scenes the way a story does, the middle to pause; space bar too.
 */
export function WrappedPlayer({
  subject,
  scenes,
  config,
  autoplay = true,
  editing,
  seed,
  className,
  ref,
}: {
  ref?: Ref<WrappedPlayerHandle>;
  subject: WrappedSubject;
  /** Seeds the motion choices (cuts between scenes, counter styles), so a link always replays the same. */
  seed: string;
  scenes: readonly SceneInstance[];
  config: WrappedConfig;
  autoplay?: boolean;
  /**
   * The creator's controls on the timeline: every scene in order (switched-off ones included), which are off, and what
   * switching, moving and editing one does. Left out for anyone just watching.
   */
  editing?: TimelineEditing & { scenes: readonly SceneInstance[] };
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const { boxRef, scale, style } = useStageFit(config.format, fullscreen);

  const { playing, marks, toggle, restart, seekTime, step, take, duration } = useWrappedTimeline({
    stageRef,
    scenes,
    config,
    seed,
    trackRef,
    clockRef,
    autoplay,
  });
  useImperativeHandle(ref, () => ({ take }), [take]);

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen();
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "wr-root",
        shell,
        // Full screen plays on a dark room whatever the site theme is.
        fullscreen && "wr-dark wr:bg-background wr:p-6 wr:text-foreground wr:md:p-10",
        className,
      )}
    >
      <div ref={boxRef} className={room}>
        {/* Taps on the frame are a shortcut for touch; the buttons below are the accessible controls. */}
        <div
          aria-hidden
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            if (x < 0.33) step(-1);
            else if (x > 0.66) step(1);
            else toggle();
          }}
          className={cn(frame, "wr:cursor-pointer")}
          style={style}
        >
          <WrappedStage stageRef={stageRef} subject={subject} scenes={scenes} config={config} scale={scale} />
        </div>
      </div>

      <div
        role="toolbar"
        aria-label="Video controls. Left and right arrows step between scenes."
        className={transport}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "f") toggleFullscreen();
        }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className={cn(
            control,
            "wr:cursor-pointer wr:bg-foreground wr:text-background wr:transition-transform wr:hover:-translate-y-px",
          )}
        >
          {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={restart}
          aria-label="Play from the start"
          className={cn(
            control,
            "wr:cursor-pointer wr:ring-1 wr:ring-border wr:transition-transform wr:hover:-translate-y-px",
          )}
        >
          <RotateCcw />
        </button>
        <Timeline
          trackRef={trackRef}
          scenes={editing?.scenes ?? scenes}
          marks={marks}
          duration={duration}
          config={config}
          editing={editing}
          onSeek={seekTime}
        />
        <span ref={clockRef} className={clock}>
          0:00 / 0:00
        </span>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Leave full screen" : "Full screen"}
          className={cn(
            control,
            "wr:cursor-pointer wr:ring-1 wr:ring-border wr:transition-transform wr:hover:-translate-y-px",
          )}
        >
          {fullscreen ? <Minimize2 /> : <Maximize2 />}
        </button>
      </div>
    </div>
  );
}
