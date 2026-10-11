import { type RefObject, useEffect, useRef, useState } from "react";

import { frameTimes, renderVideo, VIDEO_FPS } from "./export-video";
import type { WrappedPlayerHandle } from "./wrapped-player";
import {
  type SlotClassNames,
  useLabels,
  useLocale,
  WRAPPED_FORMATS,
  type WrappedConfig,
  type WrappedLabels,
} from "@react-wrapped/core";
import { Check, Download, Link2, type SlotProps, Square, useCopied, useSlots } from "@react-wrapped/core/internal";

/** Every part of the share row a class can be given to, by its `data-wr-slot`. */
export const SHARE_ACTIONS_SLOTS = [
  // The root: the row's own box.
  "share",
  "share-copy",
  "share-download",
  // What the download button turns into while the file is made: it counts up, and stops the file when pressed.
  "share-stop",
  // The line under the buttons that says what is being made and how long is left.
  "share-progress",
  // The line under the buttons that says why a file could not be made.
  "share-problem",
] as const;

export type ShareActionsSlot = (typeof SHARE_ACTIONS_SLOTS)[number];

const pill =
  "wr:inline-flex wr:h-11 wr:cursor-pointer wr:items-center wr:justify-center wr:gap-2 wr:rounded-full wr:px-5 wr:text-[15px] wr:font-semibold wr:transition-transform wr:hover:-translate-y-px wr:disabled:pointer-events-none wr:disabled:opacity-50 wr:[&_svg]:size-4";

/**
 * A pill button's classes as they have always been written out, with the slot's classes after them. The list is
 * joined and not merged on purpose: each button names a second horizontal padding after the pill's own, and merging
 * would drop the pill's, which is the one the stylesheet lets win today. The buttons would get narrower.
 */
const pillSlot = (slot: SlotProps, classes: string): SlotProps => ({
  ...slot,
  className: slot.className ? `${classes} ${slot.className}` : classes,
});

/** "About 40s left.", "About 2 min left." Rounded, so the line does not tick like a stopwatch. */
function timeLeft(seconds: number, labels: WrappedLabels): string {
  if (seconds >= 90) return labels.share.minutesLeft(Math.round(seconds / 60));
  return labels.share.secondsLeft(Math.max(5, Math.ceil(seconds / 5) * 5));
}

/**
 * The two things people do first: send the link, save the video. Side by side, never stacked. The video is made
 * here, in the page, from the player's own stage; while it is, the button counts up and stops it.
 */
export function ShareActions({
  player,
  config,
  fileName,
  onRendering,
  onError,
  className,
  classNames,
}: {
  player: RefObject<WrappedPlayerHandle | null>;
  config: WrappedConfig;
  fileName: string;
  /** The stage is busy being filmed: the page keeps its hands off the video until this says false again. */
  onRendering?: (rendering: boolean) => void;
  /** Told why a video could not be made. Left out, the reason is shown under the buttons. */
  onError?: (message: string) => void;
  /** Classes for the row's own box: a card around it, where the page wants one. */
  className?: string;
  /** A class per part, by slot name (`"share-copy"`). Added after the library's own classes on that part. */
  classNames?: SlotClassNames<ShareActionsSlot>;
}) {
  const slot = useSlots<ShareActionsSlot>(classNames);
  const labels = useLabels();
  const locale = useLocale();
  const [linkCopied, copyLink] = useCopied();
  const [problem, setProblem] = useState<string | null>(null);
  // The file being made: how far it is in whole percents, how many frames it has, how long is left once that is
  // known. Null when none is being made.
  const [making, setMaking] = useState<{ percent: number; frames: number; left: number | null } | null>(null);
  const percent = making?.percent ?? null;
  const stopRef = useRef<AbortController | null>(null);
  // Leaving the page stops a video that is still being made.
  useEffect(() => () => stopRef.current?.abort(), []);

  const download = async () => {
    const take = player.current?.take();
    if (!take) return;
    const stop = new AbortController();
    stopRef.current = stop;
    const frames = frameTimes(take.seconds, VIDEO_FPS).length;
    const started = performance.now();
    setMaking({ percent: 0, frames, left: null });
    setProblem(null);
    onRendering?.(true);
    try {
      const video = await renderVideo(take, WRAPPED_FORMATS[config.format], {
        signal: stop.signal,
        labels,
        onProgress: (share) => {
          const done = Math.floor(share * 100);
          // The first frames say little about the rest: no guess until a few percent are in.
          const left = done >= 3 ? ((performance.now() - started) / 1000) * (1 / share - 1) : null;
          // Once a percent, not once a frame.
          setMaking((now) => (now && now.percent !== done ? { percent: done, frames, left } : now));
        },
      });
      const url = URL.createObjectURL(video);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      // Stopped on purpose is not a failure.
      if (!stop.signal.aborted) {
        const message = error instanceof Error ? error.message : labels.video.failed;
        if (onError) onError(message);
        else setProblem(message);
      }
    } finally {
      take.release();
      stopRef.current = null;
      setMaking(null);
      onRendering?.(false);
    }
  };

  return (
    <div {...slot("share", "wr-root wr:grid wr:grid-cols-2 wr:gap-2", className)}>
      <button
        type="button"
        onClick={() => copyLink(window.location.href)}
        {...pillSlot(slot("share-copy"), `${pill} wr:bg-foreground wr:px-3 wr:text-background`)}
      >
        {linkCopied ? <Check /> : <Link2 />}
        {linkCopied ? labels.share.copied : labels.share.copyLink}
      </button>
      {percent === null ? (
        <button
          type="button"
          onClick={() => void download()}
          {...pillSlot(slot("share-download"), `${pill} wr:px-3 wr:ring-1 wr:ring-border`)}
        >
          <Download />
          {labels.share.download}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => stopRef.current?.abort()}
          aria-label={labels.share.stopMaking(percent)}
          title={labels.share.stop}
          {...pillSlot(slot("share-stop"), `${pill} wr:px-3 wr:tabular-nums wr:ring-1 wr:ring-border`)}
        >
          <Square fill="currentColor" />
          {labels.share.percent(percent)}
        </button>
      )}
      {/* Why it is not instant: the file is not a screen recording, every frame is drawn for it. */}
      {making ? (
        <p
          {...slot(
            "share-progress",
            "wr:col-span-2 wr:px-1 wr:pt-1 wr:text-[13px] wr:leading-[1.45] wr:text-muted-foreground wr:tabular-nums",
          )}
        >
          {labels.share.drawing(
            making.frames.toLocaleString(locale),
            making.left === null ? null : timeLeft(making.left, labels),
          )}
        </p>
      ) : null}
      {problem ? (
        <p
          role="alert"
          {...slot(
            "share-problem",
            "wr:col-span-2 wr:px-1 wr:pt-1 wr:text-[13px] wr:leading-[1.45] wr:text-muted-foreground",
          )}
        >
          {problem}
        </p>
      ) : null}
    </div>
  );
}
