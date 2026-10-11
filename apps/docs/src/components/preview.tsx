import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Demo } from "../content/types";
import { CHART_EXAMPLES } from "../registry/charts";
import type { TransitionId } from "../registry/transitions";
import {
  CutPreview,
  DEFAULT_WRAPPED_CONFIG,
  factScene,
  type SceneInstance,
  SceneThumb,
  WRAPPED_FORMATS,
  WRAPPED_PALETTES,
  type WrappedConfig,
} from "@react-wrapped/core";

/*
 * The live previews. Every one of them is the library's own stage playing a real scene, in whatever palette, mode
 * and format the reader last picked: the choice follows them from page to page.
 */

type Look = Pick<WrappedConfig, "palette" | "mode" | "format">;

// Square by default: a chart fills the frame, so it reads at the size of a docs page and of a small tile.
const DEFAULT_LOOK: Look = { palette: DEFAULT_WRAPPED_CONFIG.palette, mode: "dark", format: "square" };
const STORED = "react-wrapped:docs:look";

const LookContext = createContext<{ look: Look; setLook: (next: Look) => void }>({
  look: DEFAULT_LOOK,
  setLook: () => {},
});

export function LookProvider({ children }: { children: ReactNode }) {
  const [look, setLookState] = useState(DEFAULT_LOOK);
  // After the first paint, so the server's HTML and the browser's first render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORED);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return;
      const { palette, mode, format } = parsed as Partial<Look>;
      setLookState({
        palette: typeof palette === "string" && palette in WRAPPED_PALETTES ? palette : DEFAULT_LOOK.palette,
        mode: mode === "light" ? "light" : "dark",
        format: format && format in WRAPPED_FORMATS ? format : DEFAULT_LOOK.format,
      });
    } catch {
      // Blocked storage: the default look.
    }
  }, []);
  const value = useMemo(
    () => ({
      look,
      setLook: (next: Look) => {
        setLookState(next);
        try {
          window.localStorage.setItem(STORED, JSON.stringify(next));
        } catch {
          // Blocked storage: the choice lasts for this page.
        }
      },
    }),
    [look],
  );
  return <LookContext.Provider value={value}>{children}</LookContext.Provider>;
}

export const useLook = () => useContext(LookContext);

export const useLookConfig = (): WrappedConfig => {
  const { look } = useLook();
  return useMemo(() => ({ ...DEFAULT_WRAPPED_CONFIG, ...look }), [look]);
};

/** Palette, dark or light, and format: what a reader can change about every preview on the site. */
export function LookControls() {
  const { look, setLook } = useLook();
  return (
    <div className="d-look">
      <div role="group" aria-label="Palette" className="d-look-swatches">
        {Object.entries(WRAPPED_PALETTES).map(([id, palette]) => (
          <button
            key={id}
            type="button"
            title={palette.label}
            aria-label={palette.label}
            aria-pressed={look.palette === id}
            onClick={() => setLook({ ...look, palette: id })}
            style={{ background: palette.levels[4] }}
          />
        ))}
      </div>
      <div role="group" aria-label="Dark or light" className="d-look-chips">
        {(["dark", "light"] as const).map((mode) => (
          <button key={mode} type="button" aria-pressed={look.mode === mode} onClick={() => setLook({ ...look, mode })}>
            {mode === "dark" ? "Dark" : "Light"}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Format" className="d-look-chips">
        {Object.entries(WRAPPED_FORMATS).map(([id, format]) => (
          <button
            key={id}
            type="button"
            aria-pressed={look.format === id}
            onClick={() => setLook({ ...look, format: id as Look["format"] })}
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The widest a preview is drawn in each format, so a tall one does not run off the bottom of the screen. */
const WIDEST = { story: 340, square: 520, landscape: 720 } as const;

/**
 * Sizes a stage to the room it has. The box keeps the format's shape from the first paint, so nothing below it
 * moves when the stage inside is measured and drawn to fit.
 */
function Fit({ max, children }: { max?: number; children: (width: number) => ReactNode }) {
  const { look } = useLook();
  const format = WRAPPED_FORMATS[look.format];
  const widest = Math.min(max ?? Infinity, WIDEST[look.format]);
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
  return undefined;
}

/** One live preview, the size of the room it is given. */
export function DemoStage({ demo, max }: { demo: Demo; max?: number }) {
  const config = useLookConfig();
  if (demo.type === "transition") {
    if (!FIRST || !SECOND) return null;
    return (
      <Fit max={max}>
        {(width) => (
          <CutPreview style={demo.id as TransitionId} first={FIRST} second={SECOND} config={config} width={width} />
        )}
      </Fit>
    );
  }
  const scene = sceneOf(demo);
  if (!scene) return null;
  return <Fit max={max}>{(width) => <SceneThumb scene={scene} config={config} width={width} loop />}</Fit>;
}

/** A preview as a page shows it: the stage on a plate, the look controls under it. */
export function Preview({ demo, caption }: { demo: Demo; caption?: string }) {
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
