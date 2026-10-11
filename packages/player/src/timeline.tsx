import { type PointerEvent, type RefObject, useEffect, useRef, useState } from "react";

import {
  resolvePalette,
  type SceneInstance,
  type SceneMark,
  SceneThumb,
  type SlotClassNames,
  useLabels,
  WRAPPED_FORMATS,
  type WrappedConfig,
} from "@react-wrapped/core";
import { ChevronLeft, ChevronRight, PencilLine, Switch, useSlots } from "@react-wrapped/core/internal";

/** Every part of the timeline a class can be given to, by its `data-wr-slot`. */
export const TIMELINE_SLOTS = [
  // The root: the row and the preview that opens over it.
  "timeline",
  // The row of segments, the part that is clicked and dragged.
  "timeline-track",
  // One scene's share of the row.
  "timeline-segment",
  // The bar drawn inside a segment.
  "timeline-segment-bar",
  // The played part of a bar.
  "timeline-segment-fill",
  // What holds the preview over its segment.
  "timeline-popover",
  // The preview card.
  "timeline-preview",
  // The still of the scene in the card.
  "timeline-preview-thumb",
  // The scene's name.
  "timeline-preview-title",
  // How long the scene plays, or that it is off.
  "timeline-preview-length",
  // How rare a found scene is.
  "timeline-preview-rarity",
  // The creator's row of controls in the card.
  "timeline-controls",
  "timeline-move-earlier",
  "timeline-move-later",
  "timeline-edit",
  // The switch that takes a scene out of the video, and the dot that slides in it.
  "timeline-toggle",
  "timeline-toggle-thumb",
] as const;

export type TimelineSlot = (typeof TIMELINE_SLOTS)[number];

/** What the creator can do to the cut from the timeline. Left out for anyone just watching. */
export interface TimelineEditing {
  hidden: readonly string[];
  onToggle: (key: string, on: boolean) => void;
  /** Moves a scene one place earlier (-1) or later (1). */
  onMove: (key: string, by: -1 | 1) => void;
  onEdit: (key: string) => void;
}

/**
 * A switched-off scene keeps a sliver of the timeline, so it can be found and switched back on. On a phone the whole
 * row is about 60px wide, so the sliver is thinner there.
 */
const offSegment = "wr:w-1.5 wr:flex-none wr:sm:w-3.5";
/** The two arrows that move a scene along the cut. */
const move =
  "wr:grid wr:size-8 wr:cursor-pointer wr:place-items-center wr:rounded-lg wr:text-muted-foreground wr:hover:bg-muted wr:hover:text-foreground wr:disabled:pointer-events-none wr:disabled:opacity-35";

/**
 * The video's timeline, and the place the cut is managed from. Every scene is a segment as long as it plays. Hover one
 * for a still of it, its name and how long it runs; the creator also gets a switch (off scenes go grey and do not
 * play), the pencil for its words and its transition, and arrows to move it earlier or later. Click or drag anywhere
 * to scrub.
 */
export function Timeline({
  trackRef,
  scenes,
  marks,
  duration,
  config,
  editing,
  onSeek,
  className,
  classNames,
}: {
  /** The row of segments. The engine fills each segment's bar from here as the video plays. */
  trackRef: RefObject<HTMLDivElement | null>;
  /** Every scene in order. With `editing`, that includes the ones switched off. */
  scenes: readonly SceneInstance[];
  marks: readonly SceneMark[];
  duration: () => number;
  config: WrappedConfig;
  editing?: TimelineEditing;
  onSeek: (seconds: number) => void;
  className?: string;
  /** A class per part, by slot name. Added after the library's own classes on that part. */
  classNames?: SlotClassNames<TimelineSlot>;
}) {
  const slot = useSlots<TimelineSlot>(classNames);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState<{ key: string; x: number } | null>(null);
  const labels = useLabels();
  const speed = Number(config.speed) || 1;
  // Rarity wears the picked theme, like everything else in the video.
  const rarityColors = resolvePalette(config).rarity;
  const total = duration();
  const spans = new Map(
    marks.map((mark, index) => [mark.key, { start: mark.time, length: (marks[index + 1]?.time ?? total) - mark.time }]),
  );
  const isOn = (key: string) => spans.has(key);
  const onCount = scenes.filter((scene) => isOn(scene.key)).length;
  const lastOn = marks.at(-1)?.key;

  // A scene that just joined the cut glows once in its rarity, so a found drop is easy to spot on the line.
  const seen = useRef<Set<string> | null>(null);
  const keys = scenes.map((scene) => scene.key).join(",");
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const now = new Set(keys.split(","));
    const fresh = seen.current ? [...now].filter((key) => !seen.current?.has(key)) : [];
    seen.current = now;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const key of fresh) {
      const bar = track.querySelector<HTMLElement>(`[data-seg="${key}"] [data-seg-bar]`);
      const colour = bar?.dataset.rarity;
      if (!bar || !colour) continue;
      bar.animate(
        [
          { boxShadow: `0 0 0 2px ${colour}, 0 0 26px 6px ${colour}`, transform: "scaleY(2.2)" },
          { boxShadow: "0 0 0 0px transparent", transform: "scaleY(1)" },
        ],
        { duration: 1400, easing: "cubic-bezier(0.16, 1, 0.3, 1)", delay: 450, fill: "backwards" },
      );
    }
  }, [keys, trackRef]);

  /** The segment under a point on the row, and how far across it the point is. */
  const segmentAt = (clientX: number) => {
    const segments = [...(trackRef.current?.querySelectorAll<HTMLElement>("[data-seg]") ?? [])];
    for (const segment of segments) {
      const rect = segment.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right + 3) {
        const wrap = wrapRef.current?.getBoundingClientRect();
        return {
          key: segment.dataset.seg ?? "",
          ratio: Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width))),
          centre: rect.left + rect.width / 2 - (wrap?.left ?? 0),
        };
      }
    }
    return null;
  };

  const seekFrom = (event: PointerEvent<HTMLDivElement>) => {
    const hit = segmentAt(event.clientX);
    const span = hit ? spans.get(hit.key) : undefined;
    if (hit && span) onSeek(span.start + hit.ratio * span.length);
  };

  const show = (clientX: number) => {
    if (closing.current) clearTimeout(closing.current);
    const hit = segmentAt(clientX);
    if (hit) setOpen((now) => (now?.key === hit.key ? now : { key: hit.key, x: hit.centre }));
  };
  const hideSoon = () => {
    if (closing.current) clearTimeout(closing.current);
    closing.current = setTimeout(() => setOpen(null), 140);
  };
  useEffect(
    () => () => {
      if (closing.current) clearTimeout(closing.current);
    },
    [],
  );
  // On touch there is no hover: a tap opens the preview, a tap anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const close = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "mouse") return;
      if (event.target instanceof Node && wrapRef.current?.contains(event.target)) return;
      setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const shown = open ? scenes.find((scene) => scene.key === open.key) : undefined;
  const shownIndex = shown ? scenes.indexOf(shown) : -1;
  const shownSpan = shown ? spans.get(shown.key) : undefined;
  const format = WRAPPED_FORMATS[config.format];
  const thumbWidth = format.width > format.height ? 232 : format.width === format.height ? 176 : 148;
  const half = thumbWidth / 2 + 10;
  const wrapWidth = wrapRef.current?.offsetWidth ?? 0;
  const left = open ? Math.min(Math.max(open.x, half), Math.max(half, wrapWidth - half)) : 0;
  // The still's box has always carried a class attribute, empty while its scene is on. It keeps one.
  const thumb = slot("timeline-preview-thumb", !shownSpan && "wr:opacity-45 wr:grayscale");

  return (
    <div
      ref={wrapRef}
      // min-w-0: in the transport row this is the part that gives way. Without it the row is as wide as its segments
      // want and pushes the clock and the full screen button out of the card on a phone.
      {...slot("timeline", "wr-root wr:relative wr:min-w-0 wr:flex-1", className)}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") hideSoon();
      }}
      onPointerEnter={() => {
        if (closing.current) clearTimeout(closing.current);
      }}
    >
      <div
        ref={trackRef}
        aria-hidden
        {...slot(
          "timeline-track",
          "wr:flex wr:h-11 wr:cursor-pointer wr:touch-none wr:items-center wr:gap-px wr:sm:gap-[3px]",
        )}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          seekFrom(event);
          show(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFrom(event);
          if (event.pointerType === "mouse") show(event.clientX);
        }}
      >
        {scenes.map((scene) => {
          const span = spans.get(scene.key);
          const rarity = scene.drop ? rarityColors[scene.drop] : null;
          const active = open?.key === scene.key;
          return (
            <div
              key={scene.key}
              data-seg={scene.key}
              {...slot("timeline-segment", "wr:relative wr:h-full wr:min-w-0 wr:sm:min-w-[8px]", !span && offSegment)}
              style={span ? { flex: `${Math.max(span.length, 0.4)} 1 0px` } : undefined}
            >
              <div
                data-seg-bar
                data-rarity={rarity ?? undefined}
                {...slot(
                  "timeline-segment-bar",
                  "wr:absolute wr:inset-x-0 wr:top-1/2 wr:h-2 wr:-translate-y-1/2 wr:overflow-hidden wr:rounded-full wr:bg-muted wr:transition-[height] wr:duration-150",
                  active && "wr:h-3",
                  // Off: a hollow sliver, still there to find and switch back on.
                  !span && "wr:bg-transparent wr:ring-1 wr:ring-inset wr:ring-muted-foreground/45",
                )}
                style={rarity && span ? { background: `color-mix(in oklch, ${rarity} 30%, var(--wr-ui-muted))` } : undefined}
              >
                {span ? (
                  <i
                    data-seg-fill={scene.key}
                    {...slot("timeline-segment-fill", "wr:block wr:h-full wr:w-0 wr:rounded-full wr:bg-primary")}
                    style={rarity ? { background: rarity } : undefined}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {shown && open ? (
        <div
          {...slot("timeline-popover", "wr:absolute wr:bottom-full wr:z-30 wr:-translate-x-1/2 wr:pb-1.5")}
          style={{ left }}
        >
          <div
            {...slot(
              "timeline-preview",
              "wr:rounded-[18px] wr:bg-card wr:p-1.5 wr:shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35)] wr:ring-1 wr:ring-border",
            )}
          >
            <div {...thumb} className={thumb.className ?? ""}>
              <SceneThumb scene={shown} config={config} width={thumbWidth} />
            </div>
            <div className="wr:px-1.5 wr:pt-2 wr:pb-1" style={{ width: thumbWidth }}>
              <p className="wr:flex wr:items-baseline wr:justify-between wr:gap-2 wr:text-[13px]">
                <span {...slot("timeline-preview-title", "wr:truncate wr:font-semibold")}>{shown.label}</span>
                <span {...slot("timeline-preview-length", "wr:shrink-0 wr:tabular-nums wr:text-muted-foreground")}>
                  {shownSpan
                    ? // Whole seconds: how the number is written (4s, 1:05) is the label's business.
                      labels.timeline.length(Math.max(0, Math.round(shownSpan.length / speed)))
                    : labels.timeline.off}
                </span>
              </p>
              {shown.drop ? (
                <p
                  {...slot("timeline-preview-rarity", "wr:mt-0.5 wr:text-[12px] wr:font-semibold")}
                  style={{ color: rarityColors[shown.drop] }}
                >
                  {labels.rarity[shown.drop]}
                </p>
              ) : null}
              {editing ? (
                <div {...slot("timeline-controls", "wr:mt-2 wr:flex wr:items-center wr:justify-between wr:gap-1")}>
                  <span className="wr:flex wr:items-center wr:gap-0.5">
                    <button
                      type="button"
                      onClick={() => editing.onMove(shown.key, -1)}
                      disabled={shownIndex <= 0}
                      aria-label={labels.timeline.moveEarlier(shown.label)}
                      title={labels.timeline.earlier}
                      {...slot("timeline-move-earlier", move)}
                    >
                      <ChevronLeft className="wr:size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editing.onMove(shown.key, 1)}
                      disabled={shownIndex >= scenes.length - 1}
                      aria-label={labels.timeline.moveLater(shown.label)}
                      title={labels.timeline.later}
                      {...slot("timeline-move-later", move)}
                    >
                      <ChevronRight className="wr:size-4" />
                    </button>
                    {/* Words to rewrite, or a way out to pick: a scene playing before another one has that. */}
                    {shown.fields.length > 0 || (shownSpan && shown.key !== lastOn) ? (
                      <button
                        type="button"
                        onClick={() => editing.onEdit(shown.key)}
                        aria-label={labels.timeline.edit(shown.label)}
                        title={labels.timeline.editHint}
                        {...slot(
                          "timeline-edit",
                          "wr:grid wr:size-8 wr:cursor-pointer wr:place-items-center wr:rounded-lg wr:text-muted-foreground wr:hover:bg-muted wr:hover:text-foreground",
                        )}
                      >
                        <PencilLine className="wr:size-4" />
                      </button>
                    ) : null}
                  </span>
                  <Switch
                    checked={Boolean(shownSpan)}
                    // The last scene still on cannot be switched off: a video with nothing in it plays nothing.
                    disabled={Boolean(shownSpan) && onCount === 1}
                    onCheckedChange={(on) => editing.onToggle(shown.key, on)}
                    aria-label={labels.timeline.toggle(shown.label)}
                    {...slot("timeline-toggle")}
                    thumb={slot("timeline-toggle-thumb")}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
