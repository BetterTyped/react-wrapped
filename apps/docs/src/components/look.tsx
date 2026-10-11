import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { DEFAULT_WRAPPED_CONFIG, WRAPPED_FORMATS, WRAPPED_PALETTES, type WrappedConfig } from "@react-wrapped/kit";

/*
 * The look a reader picked: palette, dark or light, and format. Every preview on the site plays in it, and the
 * choice follows the reader from page to page. It lives in its own file so a demo can read it without pulling in the
 * previews that draw the demo.
 */

export type Look = Pick<WrappedConfig, "palette" | "mode" | "format">;

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
