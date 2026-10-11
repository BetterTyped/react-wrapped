import { type ReactNode, type Ref, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  arrangeScenes,
  type CalendarLevels,
  editsFor,
  type LoadingSubject,
  luckyCut,
  resolvePalette,
  type SceneInstance,
  type WrappedConfig,
  type WrappedSubject,
  type WrappedTransition,
} from "@react-wrapped/core";
import { cn } from "@react-wrapped/core/internal";
import { GraphicsGallery, type WrappedGraphic } from "@react-wrapped/graphics";
import {
  type SceneCut,
  SceneEditor,
  ShareActions,
  WrappedConfigurator,
  WrappedPlayer,
  type WrappedPlayerHandle,
  WrappedPlayerLoading,
} from "@react-wrapped/player";
import { type HiddenDrop, useScanGate, YearScan } from "@react-wrapped/scan";

const panel = "wr:rounded-[28px] wr:bg-card wr:p-4 wr:ring-1 wr:ring-border wr:md:p-6";
/** The player and the column beside it share one height on desktop, so their edges line up. */
const rowHeight = "wr:lg:h-[calc(100vh-140px)] wr:lg:max-h-[1000px] wr:lg:min-h-[640px]";
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
    /** Told why the video file could not be made, to show it your own way. Left out, it is said under the buttons. */
    onError?: (message: string) => void;
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
    /**
     * The scan comes first. Until the creator has run it once, the scan is the page: "your Wrapped is almost ready",
     * one button, and the video with everything around it only after. For someone's own year; an example that should
     * play the moment its page opens leaves this out.
     */
    gate?: boolean;
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
    /** The player's handle: play, pause, seek, and where each scene starts. Null while there is no video. */
    playerRef?: Ref<WrappedPlayerHandle | null>;
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
  // The player's handle, kept here for the download and handed on to whoever asked for it with `playerRef`.
  const outerPlayerRef = useRef(props.playerRef);
  outerPlayerRef.current = props.playerRef;
  const setPlayer = useCallback((handle: WrappedPlayerHandle | null) => {
    playerRef.current = handle;
    const outer = outerPlayerRef.current;
    if (typeof outer === "function") outer(handle);
    else if (outer) outer.current = handle;
  }, []);
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
  // The scan comes first: a creator who has opened nothing yet gets the scan as the page (see `useScanGate`).
  const opening = loaded?.opening;
  const { gated, onRunChange: onScanChange } = useScanGate({
    enabled: Boolean(loaded && editable && opening?.gate && opening.drops.length > 0),
    found: opening?.found.length ?? 0,
    id: loaded?.seed ?? null,
  });
  // Whether this view ever was its scan: the video then rises into place instead of just being there.
  const cameFromScan = useRef(false);
  if (gated) cameFromScan.current = true;
  // The video takes the scan's place at the top of the view, so that is where the page should be looking. The
  // browser would rather keep the scan in sight and scroll down after it.
  const rootRef = useRef<HTMLDivElement>(null);
  const wasGatedRef = useRef(gated);
  useLayoutEffect(() => {
    if (wasGatedRef.current && !gated) rootRef.current?.scrollIntoView({ block: "start" });
    wasGatedRef.current = gated;
  }, [gated]);

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
      ref={rootRef}
      // What the scan looks inside for a timeline segment to land a found card on.
      data-wr-view=""
      className={cn(
        // Under the page's bar when the view is scrolled back to after the first scan.
        "wr-root wr:scroll-mt-24",
        // The creator's column is a track that opens: who the page belongs to is often known a beat after the page
        // is up, and a column that just appeared would shove the frame sideways. It eases in as well as out, because
        // the settings mount on the same frame and a curve that starts fast would spend that long frame jumping.
        // grid-cols-1: on a phone the one column is the screen. Left to size itself it grows to its widest panel and
        // runs off the right edge.
        "wr:grid wr:grid-cols-1 wr:gap-y-3 wr:lg:transition-[grid-template-columns,column-gap] wr:lg:duration-700 wr:lg:ease-[cubic-bezier(0.6,0,0.2,1)] wr:motion-reduce:transition-none",
        editable && !gated
          ? "wr:lg:grid-cols-[minmax(0,1fr)_380px] wr:lg:gap-x-3"
          : "wr:lg:grid-cols-[minmax(0,1fr)_0px] wr:lg:gap-x-0",
      )}
    >
      {/* While the scan is the page there is no video to show. The scan below keeps its place in the tree, so it is
          the same scan, mid-run or not, when the video arrives above it. */}
      {gated ? null : (
        <div
          inert={rendering}
          className={cn(
            panel,
            "wr:flex wr:min-h-[560px] wr:flex-col",
            rowHeight,
            cameFromScan.current && "wr-view-enter",
          )}
        >
          {loaded ? (
            <WrappedPlayer
              ref={setPlayer}
              subject={loaded.subject}
              seed={loaded.seed}
              scenes={visible}
              config={config}
              autoplay={loaded.autoplay ?? true}
              editing={editable ? editing : undefined}
              className="wr:flex-1"
            />
          ) : loading ? (
            <>
              <p role="status" className="wr:sr-only">
                {loading.lines[0]}
              </p>
              <WrappedPlayerLoading
                subject={loading.subject}
                lines={loading.lines}
                config={config}
                className="wr:flex-1"
              />
            </>
          ) : null}
        </div>
      )}
      {/* One pixel of room all round, so the clip that hides the opening column does not shave the panels' rings. */}
      <div className={cn("wr:-m-px wr:overflow-hidden wr:p-px", (!editable || gated) && "wr:max-lg:hidden")}>
        {editable && !gated ? (
          <div className={`wr:flex wr:min-h-0 wr:flex-col wr:gap-3 wr:lg:w-[380px] ${rowHeight}`}>
            {loaded?.share ? (
              <ShareActions
                className={panel}
                player={playerRef}
                config={config}
                fileName={loaded.share.fileName}
                onRendering={setRendering}
                onError={loaded.share.onError}
              />
            ) : null}
            <div
              inert={rendering}
              className={cn(
                panel,
                "wr:min-h-0 wr:flex-1 wr:overflow-y-auto wr:overscroll-contain wr:transition-opacity",
                rendering && "wr:opacity-50",
              )}
            >
              <WrappedConfigurator config={config} onChange={onConfigChange} />
            </div>
          </div>
        ) : null}
      </div>
      {loaded && !editable && loaded.viewer ? <div className="wr:lg:col-span-2">{loaded.viewer}</div> : null}
      {loaded && editable ? (
        <>
          {loaded.opening && loaded.opening.drops.length > 0 ? (
            <div
              inert={rendering}
              className={cn(
                "wr:transition-opacity wr:lg:col-span-2",
                rendering && "wr:opacity-50",
                // As the page, the scan takes the box the video is about to take.
                gated && `wr:min-h-[420px] ${rowHeight}`,
              )}
            >
              <YearScan
                calendar={loaded.opening.calendar}
                palette={resolvePalette(config)}
                drops={loaded.opening.drops}
                found={loaded.opening.found}
                onOpen={loaded.opening.onOpen}
                describeDay={loaded.opening.describeDay}
                actions={loaded.opening.actions}
                sessionKey={loaded.opening.sessionKey}
                gate={gated}
                onRunChange={loaded.opening.gate ? onScanChange : undefined}
              />
            </div>
          ) : null}
          {!gated && loaded.share?.graphics && loaded.share.graphics.length > 0 ? (
            <div className="wr:lg:col-span-2">
              <GraphicsGallery graphics={loaded.share.graphics} palette={resolvePalette(config)} />
            </div>
          ) : null}
          <div className="wr:lg:col-span-2">
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
