import { currentWrappedPalette } from "@internal/enums";
import { z } from "zod";

import { CUSTOM_PALETTE, isPresetPalette } from "./palettes";
import {
  WRAPPED_FORMATS,
  WRAPPED_SPEEDS,
  WRAPPED_TRANSITIONS,
  type WrappedConfig,
  type WrappedTransition,
} from "./types";

export const DEFAULT_WRAPPED_CONFIG: WrappedConfig = {
  palette: "github",
  accent: "#39d353",
  mode: "dark",
  format: "story",
  shape: "round",
  speed: "1",
  cuts: {},
  hidden: [],
  order: [],
  edits: {},
  grain: true,
};

/*
 * The config as URL search params, short keys so a shared link stays readable.
 * Every field falls back to its default on anything unexpected: a link someone
 * mangled while pasting should still play, not throw.
 */
export const wrappedSearchSchema = z.object({
  p: z.string().max(24).optional().catch(undefined),
  a: z
    .string()
    .regex(/^[0-9a-f]{6}$/i)
    .optional()
    .catch(undefined),
  m: z.enum(["dark", "light"]).optional().catch(undefined),
  f: z
    .enum(Object.keys(WRAPPED_FORMATS) as [keyof typeof WRAPPED_FORMATS])
    .optional()
    .catch(undefined),
  c: z.enum(["round", "square", "circle"]).optional().catch(undefined),
  s: z.enum(WRAPPED_SPEEDS).optional().catch(undefined),
  t: z.string().max(800).optional().catch(undefined),
  h: z.string().max(240).optional().catch(undefined),
  o: z.string().max(400).optional().catch(undefined),
  e: z.string().max(3000).optional().catch(undefined),
  g: z.literal(0).optional().catch(undefined),
});
export type WrappedSearch = z.infer<typeof wrappedSearchSchema>;

const editsSchema = z.record(z.string().max(80), z.string().max(240));

/** Edits travel as JSON in one param. Anything that is not a flat map of short strings is dropped. */
function parseEdits(raw: string | undefined): Readonly<Record<string, string>> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  const result = editsSchema.safeParse(parsed);
  return result.success ? result.data : {};
}

const isTransition = (style: string): style is WrappedTransition =>
  (WRAPPED_TRANSITIONS as readonly string[]).includes(style);

/**
 * Picked transitions travel as "scene:style" pairs. A pair that names no transition is dropped, so the scene plays
 * the cut its luck picked. That covers a link from when one transition was set for the whole video ("t=wipe").
 */
function parseCuts(raw: string | undefined): Readonly<Record<string, WrappedTransition>> {
  const cuts: Record<string, WrappedTransition> = {};
  for (const pair of raw?.split(",") ?? []) {
    const at = pair.lastIndexOf(":");
    const style = pair.slice(at + 1);
    if (at > 0 && isTransition(style)) cuts[pair.slice(0, at)] = style;
  }
  return cuts;
}

/**
 * `defaults` is what an empty link plays as. Every source but GitHub brings its own (its platform's colours), and
 * must pass the same ones to `searchFromConfig`, so that "left out" means the same thing both ways.
 */
export function configFromSearch(search: WrappedSearch, defaults = DEFAULT_WRAPPED_CONFIG): WrappedConfig {
  const d = defaults;
  // A link from before dark and light became one switch ("github-light") still opens as what it was.
  const linked = search.p ? currentWrappedPalette(search.p, search.m) : null;
  const known = linked && (isPresetPalette(linked.palette) || linked.palette === CUSTOM_PALETTE);
  return {
    palette: linked && known ? linked.palette : d.palette,
    accent: search.a ? `#${search.a.toLowerCase()}` : d.accent,
    mode: (known ? linked?.mode : undefined) ?? search.m ?? d.mode,
    format: search.f ?? d.format,
    shape: search.c ?? d.shape,
    speed: search.s ?? d.speed,
    cuts: parseCuts(search.t),
    hidden: search.h ? search.h.split(",").filter(Boolean) : d.hidden,
    order: search.o ? search.o.split(",").filter(Boolean) : d.order,
    edits: parseEdits(search.e),
    grain: search.g !== 0,
  };
}

/** The config as search params, leaving out anything at its default. */
export function searchFromConfig(config: WrappedConfig, defaults = DEFAULT_WRAPPED_CONFIG): WrappedSearch {
  const d = defaults;
  const custom = config.palette === CUSTOM_PALETTE;
  return {
    p: config.palette === d.palette ? undefined : config.palette,
    a: custom && config.accent !== d.accent ? config.accent.replace("#", "") : undefined,
    // Dark or light applies to every theme, so it travels with any of them.
    m: config.mode !== d.mode ? config.mode : undefined,
    f: config.format === d.format ? undefined : config.format,
    c: config.shape === d.shape ? undefined : config.shape,
    s: config.speed === d.speed ? undefined : config.speed,
    t:
      Object.keys(config.cuts).length > 0
        ? Object.entries(config.cuts)
            .map(([key, style]) => `${key}:${style}`)
            .join(",")
        : undefined,
    h: config.hidden.length > 0 ? config.hidden.join(",") : undefined,
    o: config.order.length > 0 ? config.order.join(",") : undefined,
    e: Object.keys(config.edits).length > 0 ? JSON.stringify(config.edits) : undefined,
    g: config.grain ? undefined : 0,
  };
}

/**
 * The scenes in the viewer's order. A scene the viewer has not placed (a drop the scan just found) keeps its place in
 * the story: it goes right after the scene the director put before it, the director's last scene stays last, and one
 * with nothing before it goes first. So a find lands in its story slot even after the cut was reordered by hand.
 */
export function arrangeScenes<T extends { key: string }>(scenes: readonly T[], order: readonly string[]): T[] {
  if (order.length === 0) return [...scenes];
  const byKey = new Map(scenes.map((scene) => [scene.key, scene]));
  const arranged = order.flatMap((key) => {
    const scene = byKey.get(key);
    return scene ? [scene] : [];
  });
  const placed = new Set(arranged.map((scene) => scene.key));
  scenes.forEach((scene, index) => {
    if (placed.has(scene.key)) return;
    placed.add(scene.key);
    if (index === scenes.length - 1) {
      arranged.push(scene);
      return;
    }
    const before = scenes.slice(0, index).findLast((earlier) => arranged.includes(earlier));
    arranged.splice(before ? arranged.indexOf(before) + 1 : 0, 0, scene);
  });
  return arranged;
}

/** A scene's own edits, out of the config's flat map. */
export function editsFor(edits: Readonly<Record<string, string>>, sceneKey: string): Record<string, string> {
  const prefix = `${sceneKey}.`;
  return Object.fromEntries(
    Object.entries(edits)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );
}
