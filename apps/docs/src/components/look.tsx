import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_WRAPPED_CONFIG, WRAPPED_FORMATS, WRAPPED_PALETTES, type WrappedConfig } from "@react-wrapped/kit";

/*
 * The look a reader picked: palette, dark or light, and format. Every preview on the site plays in it, and the
 * choice follows the reader from page to page. It lives in its own file so a demo can read it without pulling in the
 * previews that draw the demo.
 */

export type Look = Pick<WrappedConfig, "palette" | "mode" | "format">;

// Square by default: a chart fills the frame, so it reads at the size of a docs page and of a small tile. The palette
// is the library's own green, and the site itself is drawn in it until the reader picks another.
const DEFAULT_LOOK: Look = { palette: DEFAULT_WRAPPED_CONFIG.palette, mode: "dark", format: "square" };
export const LOOK_KEY = "react-wrapped:docs:look";
const STORED = LOOK_KEY;

/** The custom properties the site's lights and accents are drawn from, in the order of `PALETTE_LIGHTS`' colours. */
export const LIGHT_PROPERTIES = ["--d-g1", "--d-g2", "--d-g3", "--d-hot"] as const;

/**
 * What the site wears for each palette: its three brightest steps and its epic colour. The page's lights, its accent
 * and the mark are all drawn from these four, so picking a palette for the previews repaints the site around them.
 */
export const PALETTE_LIGHTS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.entries(WRAPPED_PALETTES).map(([id, palette]) => [
    id,
    [palette.levels[2], palette.levels[3], palette.levels[4], palette.rarity.epic],
  ]),
);

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
  // The site wears the palette. The first page already has it (see THEME_SCRIPT); this follows every change.
  useEffect(() => {
    const lights = PALETTE_LIGHTS[look.palette];
    if (!lights) return;
    LIGHT_PROPERTIES.forEach((name, index) => document.documentElement.style.setProperty(name, lights[index]));
  }, [look.palette]);
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

/** The palettes as swatches. Picking one repaints every preview, and the site around them. */
export function PaletteSwatches() {
  const { look, setLook } = useLook();
  return (
    <div role="group" aria-label="Palette" className="d-look-swatches">
      {Object.entries(WRAPPED_PALETTES).map(([id, palette]) => (
        <button
          key={id}
          type="button"
          title={palette.label}
          aria-label={palette.label}
          aria-pressed={look.palette === id}
          onClick={() => setLook({ ...look, palette: id })}
          style={{ background: palette.levels[3] }}
        />
      ))}
    </div>
  );
}

/** Palette, dark or light, and format: what a reader can change about every preview on the site. */
export function LookControls({ formats = true }: { formats?: boolean }) {
  const { look, setLook } = useLook();
  return (
    <div className="d-look">
      <PaletteSwatches />
      <div role="group" aria-label="Dark or light" className="d-look-chips">
        {(["dark", "light"] as const).map((mode) => (
          <button key={mode} type="button" aria-pressed={look.mode === mode} onClick={() => setLook({ ...look, mode })}>
            {mode === "dark" ? "Dark" : "Light"}
          </button>
        ))}
      </div>
      {formats ? (
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
      ) : null}
    </div>
  );
}
