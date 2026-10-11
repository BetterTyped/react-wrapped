import { Check, Download, Link2, Square } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { arrangeScenes, editsFor } from "./config";
import { luckyCut } from "./cuts";
import { frameTimes, renderVideo, VIDEO_FPS } from "./export-video";
import { GraphicsGallery, type WrappedGraphic } from "./graphics-gallery";
import type { LoadingSubject } from "./loading-stage";
import { resolvePalette } from "./palettes";
import { type SceneCut, SceneEditor } from "./scene-editor";
import type { CalendarLevels } from "./scenes";
import {
  WRAPPED_FORMATS,
  type SceneInstance,
  type WrappedConfig,
  type WrappedSubject,
  type WrappedTransition,
} from "./types";
import { WrappedConfigurator } from "./wrapped-configurator";
import { WrappedPlayer, type WrappedPlayerHandle, WrappedPlayerLoading } from "./wrapped-player";
import { type HiddenDrop, YearScan } from "./year-scan";
import { useCopied } from "@/hooks/use-copied";
import { cn } from "@/lib/utils";

const panel = "rounded-[28px] bg-card p-4 ring-1 ring-border md:p-6";
/** The player and the column beside it share one height on desktop, so their edges line up. */
const rowHeight = "lg:h-[calc(100vh-140px)] lg:max-h-[1000px] lg:min-h-[640px]";
const pill =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-transform hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

/** "about 40s left", "about 2 min left". Rounded, so the line does not tick like a stopwatch. */
function timeLeft(seconds: number): string {
  if (seconds >= 90) return `about ${Math.round(seconds / 60)} min left`;
  return `about ${Math.max(5, Math.ceil(seconds / 5) * 5)}s left`;
}

/**
 * The two things people do first: send the link, save the video. Side by side, never stacked. The video is made
 * here, in the page, from the player's own stage; while it is, the button counts up and stops it.
 */
function ShareActions({
  player,
  config,
  fileName,
  onRendering,
}: {
  player: RefObject<WrappedPlayerHandle | null>;
  config: WrappedConfig;
  fileName: string;
  /** The stage is busy being filmed: the page keeps its hands off the video until this says false again. */
  onRendering: (rendering: boolean) => void;
}) {
  const [linkCopied, copyLink] = useCopied();
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
    onRendering(true);
    try {
      const video = await renderVideo(take, WRAPPED_FORMATS[config.format], {
        signal: stop.signal,
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
        toast.error(error instanceof Error ? error.message : "The video did not come through. Try again.");
      }
    } finally {
      take.release();
      stopRef.current = null;
      setMaking(null);
      onRendering(false);
    }
  };

  return (
    <div className={`${panel} grid grid-cols-2 gap-2`}>
      <button
        type="button"
        onClick={() => copyLink(window.location.href)}
        className={`${pill} bg-foreground px-3 text-background`}
      >
        {linkCopied ? <Check /> : <Link2 />}
        {linkCopied ? "Copied" : "Copy link"}
      </button>
      {percent === null ? (
        <button type="button" onClick={() => void download()} className={`${pill} px-3 ring-1 ring-border`}>
          <Download />
          Download
        </button>
      ) : (
        <button
          type="button"
          onClick={() => stopRef.current?.abort()}
          aria-label={`Stop making the video, ${percent}% done`}
          title="Stop"
          className={`${pill} px-3 tabular-nums ring-1 ring-border`}
        >
          <Square fill="currentColor" />
          {percent}%
        </button>
      )}
      {/* Why it is not instant: the file is not a screen recording, every frame is drawn for it. */}
      {making ? (
        <p className="col-span-2 px-1 pt-1 text-[13px] leading-[1.45] text-muted-foreground tabular-nums">
          Drawing {making.frames.toLocaleString("en-US")} frames at full size, one by one, so the video is sharp and
          smooth on any machine{making.left === null ? "." : `. ${timeLeft(making.left).replace(/^a/, "A")}.`}
        </p>
      ) : null}
    </div>
  );
}

/** Everything the view needs once the year is in. */
interface LoadedProps {
  loading?: undefined;
  subject: WrappedSubject;
  /** The cut's luck: assigned by the source, never changed by the viewer. */
  seed: string;
  scenes: readonly SceneInstance[];
  /** What the owner takes away. Left out on previews, where there is nothing of yours to share yet. */
  share?: {
    /** The video file's name, extension included. */
    fileName: string;
    /** Everything the owner gets to keep: cards, the trophy case, a badge per achievement and egg. */
    graphics?: readonly WrappedGraphic[];
  };
  /** Generated scenes hidden in the year. Each joins `scenes` once the scan has found it and `onOpen` ran. */
  opening?: {
    calendar: CalendarLevels;
    drops: readonly HiddenDrop[];
    found: readonly string[];
    onOpen: (id: string) => void;
    describeDay: (day: number) => string;
    actions?: ReactNode;
    sessionKey?: string | null;
  };
  /** What a viewer sees under the video, usually a way to make their own. */
  viewer?: ReactNode;
  autoplay?: boolean;
}

/** The view while its year is on the way: who it is for, and what to read meanwhile (more than one line take turns). */
interface LoadingProps {
  loading: { subject: LoadingSubject; lines: readonly string[] };
}

const NO_SCENES: readonly SceneInstance[] = [];

/**
 * A whole Wrapped: the player, the knobs, and the ways out (link, card,
 * badge). Every source renders this with its own scenes and card; nothing here
 * knows where the numbers came from.
 *
 * It is also the page while the year is still on the way (`loading`): the same frame with the wait playing in it,
 * and for the creator the settings beside it, already working. A source renders this one component for both, so the
 * layout is never rebuilt when the year lands, and the creator's column slides open instead of shoving the frame.
 */
export function WrappedView(
  props: (LoadedProps | LoadingProps) & {
    config: WrappedConfig;
    onConfigChange: (next: WrappedConfig) => void;
    /**
     * Whether this is the creator. One account, one Wrapped: only they get the scan, the strip, the settings and
     * the share tools. Anyone else watching the link gets the video and `viewer` under it.
     */
    editable?: boolean;
  },
) {
  const { config, onConfigChange, editable = true } = props;
  const loading = props.loading ?? null;
  const loaded = props.loading ? null : props;
  const scenes = loaded?.scenes ?? NO_SCENES;

  const arranged = useMemo(() => arrangeScenes(scenes, config.order), [scenes, config.order]);
  // The viewer's rewritten texts, applied per scene. Scenes nobody edited stay the same object.
  const ordered = useMemo(
    () =>
      arranged.map((scene) => {
        const edits = editsFor(config.edits, scene.key);
        return Object.keys(edits).length > 0 ? scene.withEdits(edits) : scene;
      }),
    [arranged, config.edits],
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const playerRef = useRef<WrappedPlayerHandle>(null);
  // While the video file is being made the stage is being filmed frame by frame: nothing else may move it.
  const [rendering, setRendering] = useState(false);
  const visible = useMemo(
    () => ordered.filter((scene) => !config.hidden.includes(scene.key)),
    [ordered, config.hidden],
  );
  // The way out of the scene being edited. The last scene playing has none, and neither has one switched off.
  const editingAt = visible.findIndex((scene) => scene.key === editingKey);
  const editingNext = editingAt === -1 ? undefined : visible[editingAt + 1];
  const editingLucky = loaded && editingKey ? luckyCut(loaded.seed, editingKey) : null;
  const editingCut: SceneCut | null =
    editingKey && editingNext && editingLucky
      ? { style: config.cuts[editingKey] ?? editingLucky, original: editingLucky, next: editingNext }
      : null;
  const saveScene = (key: string, values: Record<string, string>, style: WrappedTransition | null) => {
    const prefix = `${key}.`;
    const kept = Object.entries(config.edits).filter(([name]) => !name.startsWith(prefix));
    const added = Object.entries(values).map(([field, value]) => [`${prefix}${field}`, value]);
    // Only a transition that differs from the luck's own is kept, so the link stays short.
    const cuts = Object.fromEntries(Object.entries(config.cuts).filter(([scene]) => scene !== key));
    if (style && style !== editingLucky) cuts[key] = style;
    onConfigChange({ ...config, edits: Object.fromEntries([...kept, ...added]), cuts });
  };
  const keys = ordered.map((scene) => scene.key);
  const editing = {
    scenes: ordered,
    hidden: config.hidden,
    onToggle: (key: string, on: boolean) =>
      onConfigChange({
        ...config,
        hidden: on ? config.hidden.filter((hidden) => hidden !== key) : [...config.hidden, key],
      }),
    onMove: (key: string, by: -1 | 1) => {
      const from = keys.indexOf(key);
      const to = from + by;
      if (from === -1 || to < 0 || to >= keys.length) return;
      const order = [...keys];
      [order[from], order[to]] = [order[to], order[from]];
      onConfigChange({ ...config, order });
    },
    onEdit: setEditingKey,
  };

  return (
    <div
      className={cn(
        // The creator's column is a track that opens: who the page belongs to is often known a beat after the page
        // is up, and a column that just appeared would shove the frame sideways. It eases in as well as out, because
        // the settings mount on the same frame and a curve that starts fast would spend that long frame jumping.
        // grid-cols-1: on a phone the one column is the screen. Left to size itself it grows to its widest panel and
        // runs off the right edge.
        "grid grid-cols-1 gap-y-3 lg:transition-[grid-template-columns,column-gap] lg:duration-700 lg:ease-[cubic-bezier(0.6,0,0.2,1)] motion-reduce:transition-none",
        editable ? "lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-3" : "lg:grid-cols-[minmax(0,1fr)_0px] lg:gap-x-0",
      )}
    >
      <div inert={rendering} className={`${panel} flex min-h-[560px] flex-col ${rowHeight}`}>
        {loaded ? (
          <WrappedPlayer
            ref={playerRef}
            subject={loaded.subject}
            seed={loaded.seed}
            scenes={visible}
            config={config}
            autoplay={loaded.autoplay ?? true}
            editing={editable ? editing : undefined}
            className="flex-1"
          />
        ) : loading ? (
          <>
            <p role="status" className="sr-only">
              {loading.lines[0]}
            </p>
            <WrappedPlayerLoading subject={loading.subject} lines={loading.lines} config={config} className="flex-1" />
          </>
        ) : null}
      </div>
      {/* One pixel of room all round, so the clip that hides the opening column does not shave the panels' rings. */}
      <div className={cn("-m-px overflow-hidden p-px", !editable && "max-lg:hidden")}>
        {editable ? (
          <div className={`flex min-h-0 flex-col gap-3 lg:w-[380px] ${rowHeight}`}>
            {loaded?.share ? (
              <ShareActions
                player={playerRef}
                config={config}
                fileName={loaded.share.fileName}
                onRendering={setRendering}
              />
            ) : null}
            <div
              inert={rendering}
              className={cn(
                panel,
                "min-h-0 flex-1 overflow-y-auto overscroll-contain transition-opacity",
                rendering && "opacity-50",
              )}
            >
              <WrappedConfigurator config={config} onChange={onConfigChange} />
            </div>
          </div>
        ) : null}
      </div>
      {loaded && !editable && loaded.viewer ? <div className="lg:col-span-2">{loaded.viewer}</div> : null}
      {loaded && editable ? (
        <>
          {loaded.opening && loaded.opening.drops.length > 0 ? (
            <div inert={rendering} className={cn("transition-opacity lg:col-span-2", rendering && "opacity-50")}>
              <YearScan
                calendar={loaded.opening.calendar}
                palette={resolvePalette(config)}
                drops={loaded.opening.drops}
                found={loaded.opening.found}
                onOpen={loaded.opening.onOpen}
                describeDay={loaded.opening.describeDay}
                actions={loaded.opening.actions}
                sessionKey={loaded.opening.sessionKey}
              />
            </div>
          ) : null}
          {loaded.share?.graphics && loaded.share.graphics.length > 0 ? (
            <div className="lg:col-span-2">
              <GraphicsGallery graphics={loaded.share.graphics} palette={resolvePalette(config)} />
            </div>
          ) : null}
          <div className="lg:col-span-2">
            <SceneEditor
              scene={ordered.find((scene) => scene.key === editingKey) ?? null}
              original={arranged.find((scene) => scene.key === editingKey) ?? null}
              cut={editingCut}
              config={config}
              onSave={(values, style) => {
                if (editingKey) saveScene(editingKey, values, style);
              }}
              onClose={() => setEditingKey(null)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
