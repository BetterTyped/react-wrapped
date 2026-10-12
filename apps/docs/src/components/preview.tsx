import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { Demo } from "../content/types";
import { PARTS } from "../demos";
import { curtain, tilt } from "../demos/custom-transition";
import { CHART_EXAMPLES } from "../registry/charts";
import { isPart } from "../registry/parts";
import { demoScene } from "../registry/scenes";
import { LookControls, useLook, useLookConfig } from "./look";
import { PART_CSS } from "./part-styles";
import {
  CutPreview,
  factScene,
  isTransition,
  type SceneInstance,
  SceneThumb,
  WRAPPED_FORMATS,
  type WrappedConfig,
} from "@react-wrapped/kit";

/*
 * The live previews. Every one of them is the library's own stage playing a real scene, in whatever palette, mode
 * and format the reader last picked: the choice follows them from page to page.
 */

// The look lives in its own file. It is handed on from here because the rest of the site has always found it here.
export { LookControls, LookProvider, PaletteSwatches, useLook, useLookConfig } from "./look";

/**
 * The transitions the custom transition guide defines. Naming them here loads their file with the first page of the
 * site, before any stage is on it: a stage draws every transition's cover when it mounts.
 */
export const GUIDE_TRANSITIONS = [curtain.id, tilt.id];

/** The widest a preview is drawn in each format, so a tall one does not run off the bottom of the screen. */
const WIDEST = { story: 340, square: 520, landscape: 720 } as const;

/**
 * Sizes a stage to the room it has. The box keeps the format's shape from the first paint, so nothing below it
 * moves when the stage inside is measured and drawn to fit.
 */
function Fit({
  max,
  format: held,
  children,
}: {
  max?: number;
  format?: WrappedConfig["format"];
  children: (width: number) => ReactNode;
}) {
  const { look } = useLook();
  const id = held ?? look.format;
  const format = WRAPPED_FORMATS[id];
  const widest = Math.min(max ?? Infinity, WIDEST[id]);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(widest);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setWidth(Math.max(120, Math.round(box.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [widest]);
  return (
    <div ref={boxRef} className="d-fit" style={{ maxWidth: widest, aspectRatio: `${format.width} / ${format.height}` }}>
      {children(width)}
    </div>
  );
}

const chartScenes = new Map(
  CHART_EXAMPLES.map((example) => [
    example.name,
    factScene(
      {
        stamp: "Epic",
        rarity: "epic",
        title: [example.name],
        description: example.says,
        chart: example.chart,
        variant: 0,
      },
      { key: `chart-${example.name}`, label: example.name },
    ),
  ]),
);

/** The two scenes every transition is shown between. */
const FIRST = chartScenes.get("Bars");
const SECOND = chartScenes.get("Rings");

export function sceneOf(demo: Demo): SceneInstance | undefined {
  if (demo.type === "chart") return chartScenes.get(demo.example);
  if (demo.type === "scene") return demoScene(demo.key);
  return undefined;
}

/**
 * One live preview, the size of the room it is given. A part is a whole component and is not drawn this small.
 * `format` holds it to one shape, for a grid whose cells must stay the same whatever the reader picked elsewhere.
 */
export function DemoStage({
  demo,
  max,
  format,
  palette,
}: {
  demo: Demo;
  max?: number;
  format?: WrappedConfig["format"];
  /** Holds the preview to one palette, for a wall that shows the palettes side by side. */
  palette?: string;
}) {
  const look = useLookConfig();
  const config = useMemo(
    () => ({ ...look, format: format ?? look.format, palette: palette ?? look.palette }),
    [look, format, palette],
  );
  if (demo.type === "transition") {
    if (!FIRST || !SECOND || !isTransition(demo.id)) return null;
    const style = demo.id;
    return (
      <Fit max={max} format={format}>
        {(width) => <CutPreview style={style} first={FIRST} second={SECOND} config={config} width={width} />}
      </Fit>
    );
  }
  const scene = sceneOf(demo);
  if (!scene) return null;
  return (
    <Fit max={max} format={format}>
      {(width) => <SceneThumb scene={scene} config={config} width={width} loop />}
    </Fit>
  );
}

/**
 * One live preview at a width of its own, in a format and a palette of its own: for the hero, where five scenes
 * stand side by side in five palettes and none of them follows the reader's pick.
 */
export function FixedStage({
  demo,
  width,
  format = "square",
  palette,
}: {
  demo: Demo;
  width: number;
  format?: WrappedConfig["format"];
  palette?: string;
}) {
  const look = useLookConfig();
  const config = useMemo(() => ({ ...look, format, palette: palette ?? look.palette }), [look, format, palette]);
  if (demo.type === "transition") {
    if (!FIRST || !SECOND || !isTransition(demo.id)) return null;
    return <CutPreview style={demo.id} first={FIRST} second={SECOND} config={config} width={width} />;
  }
  const scene = sceneOf(demo);
  return scene ? <SceneThumb scene={scene} config={config} width={width} loop /> : null;
}

/**
 * An interactive part as a page shows it: the real component with the sample year, given the width of the page.
 * The buttons and readouts a demo adds around the library's own are plain elements, styled from here.
 */
function PartPreview({ id, caption }: { id: string; caption?: string }) {
  if (!isPart(id)) return null;
  const part = PARTS[id];
  return (
    <figure className="d-preview">
      <style>{PART_CSS}</style>
      <div className="d-part">{part.render()}</div>
      {part.look || caption ? (
        <figcaption>
          {part.look ? <LookControls /> : null}
          {caption ? <p>{caption}</p> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** A preview as a page shows it: the stage on a plate, the look controls under it. */
export function Preview({ demo, caption }: { demo: Demo; caption?: string }) {
  if (demo.type === "part") return <PartPreview id={demo.id} caption={caption} />;
  return (
    <figure className="d-preview">
      <div className="d-preview-plate">
        <DemoStage demo={demo} />
      </div>
      <figcaption>
        <LookControls />
        {caption ? <p>{caption}</p> : null}
      </figcaption>
    </figure>
  );
}
