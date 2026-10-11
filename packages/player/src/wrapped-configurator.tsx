import { type ReactNode, useId } from "react";

import {
  type CellShape,
  CUSTOM_PALETTE,
  isPresetPalette,
  randomAccent,
  themePalette,
  useLabels,
  WRAPPED_FORMATS,
  WRAPPED_PALETTES,
  WRAPPED_SPEEDS,
  type WrappedConfig,
} from "@react-wrapped/core";
import { Chips, cn, Dices, Switch } from "@react-wrapped/core/internal";

const RAINBOW = ["#ff4d6d", "#ffb703", "#3ddc84", "#3a86ff", "#b15cff"] as const;

/** The cell shapes in the order the picker offers them. */
const SHAPES: readonly CellShape[] = ["round", "square", "circle"];

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="wr:flex wr:flex-col wr:gap-2.5">
      <label htmlFor={htmlFor} className="wr:text-[14px] wr:font-semibold wr:tracking-[-0.01em]">
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
  const labels = useLabels();
  const set = <K extends keyof WrappedConfig>(key: K, value: WrappedConfig[K]) => onChange({ ...config, [key]: value });
  // Themes are colors; dark or light is one switch for all of them. Swatches show the theme as it will play.
  const palettes = [
    ...Object.entries(WRAPPED_PALETTES).map(([id, theme]) => {
      const palette = isPresetPalette(id) ? themePalette(id, config.mode) : theme;
      return { id, label: labels.palettes[id] ?? theme.label, levels: palette.levels, bg: palette.bg };
    }),
    // "Your color" shows the whole spectrum on its swatch: it is the one that can be anything.
    {
      id: CUSTOM_PALETTE,
      label: labels.palettes[CUSTOM_PALETTE] ?? labels.settings.customPalette,
      levels: RAINBOW,
      bg: config.mode === "dark" ? "#111214" : "#ffffff",
    },
  ];

  return (
    <div className={cn("wr-root wr:flex wr:flex-col wr:gap-6", className)}>
      <Field label={labels.settings.colors}>
        <div role="radiogroup" aria-label={labels.settings.palette} className="wr:grid wr:grid-cols-3 wr:gap-2">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={config.palette === palette.id}
              onClick={() => set("palette", palette.id)}
              className="wr:flex wr:cursor-pointer wr:flex-col wr:gap-1.5 wr:rounded-2xl wr:bg-card wr:p-2 wr:text-left wr:ring-1 wr:ring-border wr:aria-checked:ring-2 wr:aria-checked:ring-foreground"
            >
              <span
                className="wr:grid wr:grid-cols-5 wr:gap-[2px] wr:rounded-[9px] wr:p-1.5"
                style={{ background: palette.bg }}
              >
                {palette.levels.map((color) => (
                  <i key={color} className="wr:aspect-square wr:rounded-[2px]" style={{ background: color }} />
                ))}
              </span>
              <span className="wr:truncate wr:text-[12.5px] wr:font-semibold">{palette.label}</span>
            </button>
          ))}
        </div>
        {config.palette === CUSTOM_PALETTE ? (
          <div className="wr:flex wr:items-center wr:gap-3">
            <input
              id={accentId}
              type="color"
              value={config.accent}
              aria-label={labels.settings.accent}
              onChange={(event) => set("accent", event.target.value)}
              className="wr:h-10 wr:w-13 wr:cursor-pointer wr:rounded-xl wr:border wr:border-border wr:bg-card wr:p-1"
            />
            <button
              type="button"
              onClick={() => set("accent", randomAccent())}
              aria-label={labels.settings.randomAccent}
              title={labels.settings.randomAccentHint}
              className="wr:grid wr:size-10 wr:shrink-0 wr:cursor-pointer wr:place-items-center wr:rounded-xl wr:ring-1 wr:ring-border wr:transition-transform wr:hover:-translate-y-px"
            >
              <Dices className="wr:size-4" />
            </button>
          </div>
        ) : null}
        <Chips
          label={labels.settings.mode}
          value={config.mode}
          options={[
            { value: "dark", label: labels.settings.dark },
            { value: "light", label: labels.settings.light },
          ]}
          onChange={(mode) => set("mode", mode)}
        />
      </Field>

      <Field label={labels.settings.format}>
        <Chips
          label={labels.settings.format}
          value={config.format}
          options={Object.entries(WRAPPED_FORMATS).map(([value, format]) => ({
            value: value as WrappedConfig["format"],
            label: labels.formats[value] ?? format.label,
          }))}
          onChange={(format) => set("format", format)}
        />
      </Field>

      <Field label={labels.settings.cells}>
        <Chips
          label={labels.settings.cellShape}
          value={config.shape}
          options={SHAPES.map((value) => ({ value, label: labels.settings.shapes[value] }))}
          onChange={(shape) => set("shape", shape)}
        />
      </Field>

      <Field label={labels.settings.speed}>
        <Chips
          label={labels.settings.speed}
          value={config.speed}
          options={WRAPPED_SPEEDS.map((speed) => ({ value: speed, label: labels.settings.speedValue(speed) }))}
          onChange={(speed) => set("speed", speed)}
        />
      </Field>

      <div className="wr:h-px wr:bg-border" />

      <div className="wr:flex wr:items-center wr:justify-between wr:gap-3 wr:text-[14px]">
        <label htmlFor={grainId}>{labels.settings.grain}</label>
        <Switch id={grainId} checked={config.grain} onCheckedChange={(grain) => set("grain", grain)} />
      </div>
    </div>
  );
}
