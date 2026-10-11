import { type CSSProperties, useMemo, useState } from "react";

import {
  CUSTOM_PALETTE,
  randomAccent,
  resolvePalette,
  type SceneInstance,
  SceneThumb,
  type WrappedConfig,
} from "@react-wrapped/core";

const COLUMNS: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" };
const SWATCHES: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 };
const SWATCH: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 9,
  boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.12)",
};

export function OwnColour({ scene, config }: { scene: SceneInstance; config: WrappedConfig }) {
  const [accent, setAccent] = useState("#ff5c8a");
  // One colour in, a whole palette out. Dark or light still comes from the config's `mode`.
  const own = useMemo((): WrappedConfig => ({ ...config, palette: CUSTOM_PALETTE, accent }), [config, accent]);
  const palette = resolvePalette(own);
  return (
    <div style={COLUMNS}>
      <SceneThumb scene={scene} config={own} width={280} loop />
      <div>
        <div role="group" aria-label="Accent colour">
          <input
            type="color"
            aria-label="Accent colour"
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
          />
          <button type="button" onClick={() => setAccent(randomAccent())}>
            Surprise me
          </button>
        </div>
        {/* The five levels the accent was stretched into, then the four rarity colours cut from it. */}
        <div style={SWATCHES}>
          {[...palette.levels, ...Object.values(palette.rarity)].map((colour, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- nine fixed swatches, and two may share a colour
            <i key={index} title={colour} style={{ ...SWATCH, background: colour }} />
          ))}
        </div>
        <output>{`palette: "custom", accent: "${accent}"`}</output>
      </div>
    </div>
  );
}
