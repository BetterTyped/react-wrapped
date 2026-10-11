import { Dices } from "lucide-react";
import { type ReactNode, useId } from "react";

import { Chips } from "./chips";
import { cn } from "./internal/cn";
import { Switch } from "./internal/switch";
import { CUSTOM_PALETTE, isPresetPalette, randomAccent, themePalette, WRAPPED_PALETTES } from "./palettes";
import { WRAPPED_FORMATS, WRAPPED_SPEEDS, type CellShape, type WrappedConfig } from "./types";

const RAINBOW = ["#ff4d6d", "#ffb703", "#3ddc84", "#3a86ff", "#b15cff"] as const;

const SHAPES: Record<CellShape, string> = { round: "Rounded", square: "Square", circle: "Dots" };
const SPEED_LABELS: Record<(typeof WRAPPED_SPEEDS)[number], string> = { "0.75": "0.75x", "1": "1x", "1.5": "1.5x" };
function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={htmlFor} className="text-[14px] font-semibold tracking-[-0.01em]">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * Every knob that applies to the whole video. Each change lands in the URL, so the link always matches what is on
 * screen. What belongs to one scene (its words, its transition) is edited on that scene, from the timeline.
 */
export function WrappedConfigurator({
  config,
  onChange,
  className,
}: {
  config: WrappedConfig;
  onChange: (next: WrappedConfig) => void;
  className?: string;
}) {
  const accentId = useId();
  const grainId = useId();
  const set = <K extends keyof WrappedConfig>(key: K, value: WrappedConfig[K]) => onChange({ ...config, [key]: value });
  // Themes are colors; dark or light is one switch for all of them. Swatches show the theme as it will play.
  const palettes = [
    ...Object.entries(WRAPPED_PALETTES).map(([id, theme]) => {
      const palette = isPresetPalette(id) ? themePalette(id, config.mode) : theme;
      return { id, label: theme.label, levels: palette.levels, bg: palette.bg };
    }),
    // "Your color" shows the whole spectrum on its swatch: it is the one that can be anything.
    { id: CUSTOM_PALETTE, label: "Your color", levels: RAINBOW, bg: config.mode === "dark" ? "#111214" : "#ffffff" },
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Field label="Colors">
        <div role="radiogroup" aria-label="Palette" className="grid grid-cols-3 gap-2">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={config.palette === palette.id}
              onClick={() => set("palette", palette.id)}
              className="flex cursor-pointer flex-col gap-1.5 rounded-2xl bg-card p-2 text-left ring-1 ring-border aria-checked:ring-2 aria-checked:ring-foreground"
            >
              <span className="grid grid-cols-5 gap-[2px] rounded-[9px] p-1.5" style={{ background: palette.bg }}>
                {palette.levels.map((color) => (
                  <i key={color} className="aspect-square rounded-[2px]" style={{ background: color }} />
                ))}
              </span>
              <span className="truncate text-[12.5px] font-semibold">{palette.label}</span>
            </button>
          ))}
        </div>
        {config.palette === CUSTOM_PALETTE ? (
          <div className="flex items-center gap-3">
            <input
              id={accentId}
              type="color"
              value={config.accent}
              aria-label="Accent color"
              onChange={(event) => set("accent", event.target.value)}
              className="h-10 w-13 cursor-pointer rounded-xl border border-border bg-card p-1"
            />
            <button
              type="button"
              onClick={() => set("accent", randomAccent())}
              aria-label="Pick a random color"
              title="Random color"
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl ring-1 ring-border transition-transform hover:-translate-y-px"
            >
              <Dices className="size-4" />
            </button>
          </div>
        ) : null}
        <Chips
          label="Dark or light"
          value={config.mode}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          onChange={(mode) => set("mode", mode)}
        />
      </Field>

      <Field label="Format">
        <Chips
          label="Format"
          value={config.format}
          options={Object.entries(WRAPPED_FORMATS).map(([value, format]) => ({
            value: value as WrappedConfig["format"],
            label: format.label,
          }))}
          onChange={(format) => set("format", format)}
        />
      </Field>

      <Field label="Cells">
        <Chips
          label="Cell shape"
          value={config.shape}
          options={Object.entries(SHAPES).map(([value, label]) => ({ value: value as CellShape, label }))}
          onChange={(shape) => set("shape", shape)}
        />
      </Field>

      <Field label="Speed">
        <Chips
          label="Speed"
          value={config.speed}
          options={WRAPPED_SPEEDS.map((speed) => ({ value: speed, label: SPEED_LABELS[speed] }))}
          onChange={(speed) => set("speed", speed)}
        />
      </Field>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between gap-3 text-[14px]">
        <label htmlFor={grainId}>Film grain</label>
        <Switch id={grainId} checked={config.grain} onCheckedChange={(grain) => set("grain", grain)} />
      </div>
    </div>
  );
}
