import {
  isWrappedPresetPalette,
  resolveWrappedPalette,
  wrappedThemePalette,
  WRAPPED_CUSTOM_PALETTE,
  WRAPPED_PALETTES as SHARED_PALETTES,
  type WrappedPalette,
  type WrappedPresetPaletteId,
} from "@internal/enums";

import type { WrappedConfig } from "./types";

/*
 * The palettes themselves live in `@internal/enums`: the backend draws the README card, the trophy case and the
 * badges from the same table, so an embedded image wears the theme of the video it came from.
 */
export const WRAPPED_PALETTES = SHARED_PALETTES;
export type PresetPaletteId = WrappedPresetPaletteId;
export const CUSTOM_PALETTE = WRAPPED_CUSTOM_PALETTE;
export const isPresetPalette = isWrappedPresetPalette;
/** A theme in dark or light, for a picker's swatch. */
export const themePalette = wrappedThemePalette;

/** A bright, saturated accent at a random hue, for the "surprise me" button. Mid lightness so both backgrounds read. */
export function randomAccent(random = Math.random): string {
  const hue = Math.floor(random() * 360);
  const saturation = 70 + random() * 25;
  const lightness = 52 + random() * 12;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = (saturation / 100) * Math.min(lightness / 100, 1 - lightness / 100);
  const channel = (n: number) => {
    const value = lightness / 100 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function resolvePalette(config: Pick<WrappedConfig, "palette" | "accent" | "mode">): WrappedPalette {
  return resolveWrappedPalette(config);
}

/** The palette as CSS custom properties for the stage element: surfaces, the five levels, and the rarity colors. */
export function paletteStyle(palette: WrappedPalette): Record<string, string> {
  return {
    "--wr-bg": palette.bg,
    "--wr-card": palette.card,
    "--wr-fg": palette.fg,
    "--wr-muted": palette.muted,
    ...Object.fromEntries(palette.levels.map((color, index) => [`--wr-l${index}`, color])),
    "--wr-common": palette.rarity.common,
    "--wr-rare": palette.rarity.rare,
    "--wr-epic": palette.rarity.epic,
    "--wr-legendary": palette.rarity.legendary,
  };
}
