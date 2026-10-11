import type { CSSProperties } from "react";

import { PIXEL_ART, RARITY_LABELS, type Rarity, resolvePalette, type WrappedConfig } from "@react-wrapped/core";
import { type HiddenDrop, PixelGlyph } from "@react-wrapped/scan";

const GRID: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 };
const TILE: CSSProperties = { display: "grid", gap: 12, padding: 16, borderRadius: 18 };
const NAME: CSSProperties = { display: "block", fontWeight: 650, fontSize: 15 };
const SMALL: CSSProperties = { display: "block", fontSize: 13, fontWeight: 600 };

// Easiest to hardest. The colours are the palette's own, so they change with the theme.
const RARITIES: readonly Rarity[] = ["common", "rare", "epic", "legendary"];

export function Rarities({ drops, config }: { drops: readonly HiddenDrop[]; config: WrappedConfig }) {
  const palette = resolvePalette(config);
  const tile = { ...TILE, background: palette.card, color: palette.fg };
  return (
    <div style={GRID}>
      {RARITIES.map((rarity) => (
        <div key={rarity} style={tile}>
          <PixelGlyph art={PIXEL_ART.trophy} colour={palette.rarity[rarity]} cell={8} />
          <span>
            <b style={NAME}>{RARITY_LABELS[rarity]}</b>
            <small style={{ ...SMALL, color: palette.rarity[rarity] }}>{palette.rarity[rarity]}</small>
          </span>
        </div>
      ))}
      {drops.map((drop) => (
        <div key={drop.id} style={tile}>
          <PixelGlyph art={drop.art} colour={palette.rarity[drop.rarity]} cell={8} />
          <span>
            <b style={NAME}>{drop.name}</b>
            <small style={{ ...SMALL, color: palette.rarity[drop.rarity] }}>
              {`${drop.kind}, ${RARITY_LABELS[drop.rarity]}`}
            </small>
          </span>
        </div>
      ))}
    </div>
  );
}
