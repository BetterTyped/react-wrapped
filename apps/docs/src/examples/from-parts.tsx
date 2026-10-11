import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from "react";

import { hourName, type SceneChart } from "@react-wrapped/charts";
import {
  arrangeScenes,
  DEFAULT_WRAPPED_CONFIG,
  editsFor,
  luckyCut,
  resolvePalette,
  type SceneInstance,
  type WrappedConfig,
  type WrappedTransition,
} from "@react-wrapped/core";
import { GraphicsGallery, renderInsightCard, renderShareCard, type WrappedGraphic } from "@react-wrapped/graphics";
import { type SceneCut, SceneEditor, WrappedConfigurator, WrappedPlayer } from "@react-wrapped/player";
import { directSample, formatShort, hoursOfDay, sampleInsights, sampleTraits, sampleYear } from "@react-wrapped/sample";
import { useOpenedDrops, YearScan } from "@react-wrapped/scan";
import { chartScene } from "@react-wrapped/scenes";

/*
 * The same page as the full Wrapped example, put together by hand: no `WrappedView`, and nothing imported from
 * `@react-wrapped/kit`. Every piece comes from the package that owns it. The layout is the page's own, written as
 * inline styles on the library's chrome tokens, so it follows the same light and dark as the parts inside it.
 */

const PAGE: CSSProperties = { display: "grid", gap: 12, minWidth: 0 };
// The player and the column beside it: side by side where there is room, stacked on a phone.
const TOP: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12 };
const PANEL: CSSProperties = {
  minWidth: 0,
  padding: 20,
  borderRadius: 28,
  background: "var(--wr-ui-card)",
  color: "var(--wr-ui-fg)",
  boxShadow: "inset 0 0 0 1px var(--wr-ui-border)",
};
// The player fits its frame into the room it is given, so its panel has a height.
const PLAYER_PANEL: CSSProperties = { ...PANEL, flex: "999 1 420px", display: "grid", height: "min(780px, 92vh)" };
const SIDE: CSSProperties = { flex: "1 1 320px", display: "grid", gap: 12, alignContent: "start", minWidth: 0 };
// As the page, the scan takes the box the video is about to take.
const GATE_BOX: CSSProperties = { display: "grid", height: "min(780px, 92vh)", minHeight: 420 };
const BUTTON: CSSProperties = {
  width: "100%",
  height: 44,
  border: 0,
  borderRadius: 999,
  background: "var(--wr-ui-fg)",
  color: "var(--wr-ui-bg)",
  font: "inherit",
  fontWeight: 600,
  cursor: "pointer",
};

/** A scene this page adds to the director's own: the hours of the day on a clock, right after the week. */
function withDayScene(scenes: readonly SceneInstance[], hours: readonly number[]): SceneInstance[] {
  const chart: SceneChart = { type: "clock", hours };
  const day = chartScene(
    {
      eyebrow: "Your day",
      title: ["Your best hour is", `*${hourName(hours.indexOf(Math.max(...hours)))}.*`],
      chart,
      lede: "Commits by hour of the day. The lit hour is your busiest.",
    },
    { key: "day", label: "Your day" },
  );
  const after = scenes.findIndex((scene) => scene.key === "week");
  return [...scenes.slice(0, after + 1), day, ...scenes.slice(after + 1)];
}

export function FromParts({ gate = false }: { gate?: boolean }) {
  const [config, setConfig] = useState<WrappedConfig>({ ...DEFAULT_WRAPPED_CONFIG, format: "story" });
  const sample = useMemo(() => {
    const year = sampleYear();
    return { year, traits: sampleTraits(year), hours: hoursOfDay(year) };
  }, []);

  /* ---------- the scenes ---------- */

  // The drops opened so far. The director is asked again each time one is opened: that is how a find joins the video.
  const { opened, open } = useOpenedDrops(null);
  const cut = useMemo(() => directSample(sample.year, sample.traits, opened), [sample, opened]);
  const scenes = useMemo(() => withDayScene(cut.scenes, sample.hours), [cut.scenes, sample.hours]);
  // The viewer's order. A scene they never placed (a new find) goes after the scene the director put before it.
  const arranged = useMemo(() => arrangeScenes(scenes, config.order), [scenes, config.order]);
  // The viewer's rewritten texts, scene by scene. A scene nobody edited stays the same object.
  const ordered = useMemo(
    () =>
      arranged.map((scene) => {
        const edits = editsFor(config.edits, scene.key);
        return Object.keys(edits).length > 0 ? scene.withEdits(edits) : scene;
      }),
    [arranged, config.edits],
  );
  // What plays. The timeline still gets every scene, so one that is off can be switched back on.
  const playing = useMemo(
    () => ordered.filter((scene) => !config.hidden.includes(scene.key)),
    [ordered, config.hidden],
  );

  /* ---------- editing from the timeline ---------- */

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const keys = ordered.map((scene) => scene.key);
  const editing = {
    scenes: ordered,
    hidden: config.hidden,
    onToggle: (key: string, on: boolean) =>
      setConfig({
        ...config,
        hidden: on ? config.hidden.filter((hidden) => hidden !== key) : [...config.hidden, key],
      }),
    onMove: (key: string, by: -1 | 1) => {
      const from = keys.indexOf(key);
      const to = from + by;
      if (from === -1 || to < 0 || to >= keys.length) return;
      const order = [...keys];
      [order[from], order[to]] = [order[to], order[from]];
      setConfig({ ...config, order });
    },
    onEdit: setEditingKey,
  };

  // The way out of the scene being edited. The last scene playing has none, and neither has one switched off.
  const editingAt = playing.findIndex((scene) => scene.key === editingKey);
  const editingNext = editingAt === -1 ? undefined : playing[editingAt + 1];
  const lucky = editingKey ? luckyCut(cut.seed, editingKey) : null;
  const editingCut: SceneCut | null =
    editingKey && editingNext && lucky
      ? { style: config.cuts[editingKey] ?? lucky, original: lucky, next: editingNext }
      : null;
  const saveScene = (values: Record<string, string>, style: WrappedTransition | null) => {
    if (!editingKey) return;
    const others = Object.entries(config.edits).filter(([name]) => !name.startsWith(`${editingKey}.`));
    const mine = Object.entries(values).map(([field, value]): [string, string] => [`${editingKey}.${field}`, value]);
    const cuts = Object.fromEntries(Object.entries(config.cuts).filter(([key]) => key !== editingKey));
    // Only a transition that differs from the seed's own pick is kept.
    if (style && style !== lucky) cuts[editingKey] = style;
    setConfig({ ...config, edits: Object.fromEntries([...others, ...mine]), cuts });
  };

  /* ---------- the scan first ---------- */

  const [running, setRunning] = useState(false);
  const [passed, setPassed] = useState(false);
  // With `gate`, the scan is the page until one run has come to rest with something found.
  const gated = gate && !passed && (opened.length === 0 || running);
  const onRunChange = (now: boolean) => {
    setRunning(now);
    if (!now && opened.length > 0) setPassed(true);
  };
  // The video takes the scan's place at the top, so that is where the page should be looking.
  const rootRef = useRef<HTMLDivElement>(null);
  const wasGated = useRef(gated);
  useLayoutEffect(() => {
    if (wasGated.current && !gated) rootRef.current?.scrollIntoView({ block: "start" });
    wasGated.current = gated;
  }, [gated]);

  /* ---------- the graphics to keep ---------- */

  const { palette: paletteId, accent, mode } = config;
  const palette = useMemo(() => resolvePalette({ palette: paletteId, accent, mode }), [paletteId, accent, mode]);
  const insights = useMemo(() => sampleInsights(sample.year, sample.traits), [sample]);
  const graphics = useMemo((): WrappedGraphic[] => {
    const hidden = new Set(cut.pending.map((drop) => drop.id));
    return [
      {
        id: "share-card",
        title: "Share card",
        line: "The year on one card, sized for a post.",
        image: () => renderShareCard(cut.card, palette),
        fileName: `${sample.year.handle}-wrapped`,
        wide: true,
      },
      ...insights.map((card) => ({
        id: `insight-${card.id}`,
        title: card.name,
        line: card.insight,
        image: () => renderInsightCard(card, palette),
        fileName: `${sample.year.handle}-${card.id}`,
        wide: true,
        // A card that belongs to a drop stays locked until the scan has found that drop.
        locked: card.traitId ? hidden.has(card.traitId) : false,
      })),
    ];
  }, [cut.card, cut.pending, insights, palette, sample.year.handle]);

  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // The clipboard is blocked here. The address bar still has the link.
    }
  };

  return (
    <div ref={rootRef} style={PAGE}>
      {/* While the scan is the page there is no video. The scan below keeps its place in the tree either way. */}
      {gated ? null : (
        <div style={TOP}>
          <div style={PLAYER_PANEL}>
            <WrappedPlayer subject={cut.subject} seed={cut.seed} scenes={playing} config={config} editing={editing} />
          </div>
          <div style={SIDE}>
            <div style={PANEL}>
              <button type="button" style={BUTTON} onClick={() => void copyLink()}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <div style={PANEL}>
              <WrappedConfigurator config={config} onChange={setConfig} />
            </div>
          </div>
        </div>
      )}
      <div style={gated ? GATE_BOX : undefined}>
        <YearScan
          calendar={cut.calendar}
          palette={palette}
          drops={cut.drops}
          found={opened}
          onOpen={open}
          describeDay={(day) => formatShort(sample.year.days[day].date)}
          gate={gated}
          onRunChange={onRunChange}
        />
      </div>
      {gated ? null : <GraphicsGallery graphics={graphics} palette={palette} />}
      <SceneEditor
        scene={ordered.find((scene) => scene.key === editingKey) ?? null}
        original={arranged.find((scene) => scene.key === editingKey) ?? null}
        cut={editingCut}
        config={config}
        onSave={saveScene}
        onClose={() => setEditingKey(null)}
      />
    </div>
  );
}
