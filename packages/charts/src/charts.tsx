import { useId } from "react";

import { CHART_ENTRANCES, notesIn, restIn } from "./chart-entrances";
import { DEFAULT_LABELS, EASE_OUT, useLabels } from "@react-wrapped/core";

/*
 * The charts a generated scene can carry, so every achievement tells its story
 * its own way: a streak lights up a stretch of the year, a big day towers over
 * its neighbours, a funnel narrows the year down to reviews. Each chart is
 * drawn at the stage's own resolution (920 wide) and animates on the scene's
 * timeline, so it seeks and exports like everything else.
 */

const WIDTH = 920;

export type SceneChart =
  /** A line over the year (weekly values), with a highlighted stretch and an optional line to cross. */
  | {
      type: "spark";
      values: readonly number[];
      /** The stretch that matters, as a selection. Give it a real span: from a value to itself it is a sliver. */
      band?: { from: number; to: number; label: string };
      threshold?: { value: number; label: string };
    }
  /** Columns, one of them the point. */
  | { type: "bars"; bars: readonly { label?: string; value: number; peak?: boolean }[]; peakLabel?: string }
  /** A dial of segments, filled up to a share. It carries no number: the scene's own words say it. */
  | { type: "gauge"; share: number }
  /** A row of slim pills, each lit by how much there was (0 is dark): every Friday of a year, every week. */
  | { type: "meter"; pills: readonly number[]; from: string; to: string; note?: string }
  /** An area chart made of graph cells: columns filling up, one cell marked. */
  | { type: "pixels"; values: readonly number[]; mark?: { index: number; label: string } }
  /** A ring cut into segments (months, hours), each as bright as it was busy, a number in the middle. */
  | { type: "wheel"; segments: readonly { label: string; value: number }[] }
  /** The year narrowing down, step by step. */
  | { type: "funnel"; steps: readonly { label: string; value: number }[] }
  /** Every day as a tick; the quiet stretch bracketed. */
  | { type: "ticks"; values: readonly number[]; gap: { from: number; to: number; label: string } }
  /** Concentric rings, one per part. */
  | { type: "rings"; parts: readonly { name: string; color: string; share: number }[] }
  /** Two parts of a whole, the second one the point. */
  | {
      type: "donut";
      parts: readonly [{ label: string; value: number }, { label: string; value: number }];
      centre: string;
    }
  /** A short run of days, the marked ones lit. */
  | {
      type: "days";
      days: readonly { label: string; sub: string; level: number; count: number; marked?: boolean }[];
    }
  /** A day as a clock face: 24 values, midnight first. The point is the busiest hour, or `mark` when given. */
  | { type: "clock"; hours: readonly number[]; mark?: number }
  /**
   * Parts of a whole over time, as stacked ribbons, first on top. One stream can be the point; `note` marks a moment
   * on it. `ticks` are the labels along the bottom.
   */
  | {
      type: "river";
      ticks: readonly string[];
      streams: readonly { name: string; values: readonly number[]; point?: boolean }[];
      note?: { index: number; label: string };
    }
  /** A share (0 to 1) as a hundred dots. `from` and `to` name what the lit and the dark ends are. */
  | { type: "dots"; share: number; label: string; from: string; to: string }
  /** Then against now, a row per thing counted. `point` is the row to light: the biggest jump when left out. */
  | { type: "dumbbell"; rows: readonly { label: string; was: number; now: number }[]; point?: number }
  /** Parts of a whole as discs, biggest first (it is the point). `share` is in percent. At most five are drawn. */
  | { type: "bubbles"; parts: readonly { name: string; share: number }[] }
  /** One month, a cell per day. `lead` is how many cells are empty before the 1st, counting from Monday. */
  | { type: "month"; lead: number; days: readonly number[] }
  /**
   * One outline over several axes, each 0 to 1. The strongest axis is turned to the top and carries `note`. Give
   * every axis an `everyone` and that shape is drawn underneath.
   */
  | { type: "radar"; axes: readonly { label: string; value: number; everyone?: number }[]; note: string }
  /** Where one stands among many: how many sit at each step, least to most, and which step is theirs. */
  | { type: "standing"; bars: readonly number[]; at: number; label: string; from: string; to: string }
  /** Two things pulling against each other per period: `up` above the line, `down` below. `mark` lights one fall. */
  | {
      type: "mirror";
      pairs: readonly { up: number; down: number }[];
      up: string;
      down: string;
      mark?: { index: number; label: string };
    }
  /** A week by the hour: seven rows, Monday first, of 24 values. The point is the busiest slot, or `mark`. */
  | { type: "hours"; rows: readonly (readonly number[])[]; mark?: { day: number; hour: number } };

const fmt = (value: number) => value.toLocaleString("en-US");

/*
 * The shared pieces. Every chart is built from the same few: a glow behind what matters, a hairline through the point
 * being made, the number or the note in a pill on that line, and ends that dissolve so the chart reads as a stretch
 * of something longer. A new Wrapped picks a chart type and hands it numbers; it never draws its own.
 */

/** What a pill takes at this size, near enough: the type is 26px Inter. */
const pillWidth = (text: string) => text.length * 15.4 + 44;

/** A number or a note in a pill. `rarity` fills it with the find's color: the one thing the chart is about. */
function Pill({ x, y, text, tone = "plain" }: { x: number; y: number; text: string; tone?: "plain" | "rarity" }) {
  const width = pillWidth(text);
  const left = Math.min(WIDTH - width, Math.max(0, x - width / 2));
  return (
    <g data-chart-note>
      <rect
        x={left}
        y={y - 26}
        width={width}
        height={52}
        rx={26}
        style={{ fill: tone === "rarity" ? "var(--wr-rarity)" : "var(--wr-bg)" }}
        stroke="var(--wr-fg)"
        strokeOpacity={tone === "rarity" ? 0 : 0.16}
        strokeWidth="1.5"
      />
      <text
        x={left + width / 2}
        y={y + 9}
        textAnchor="middle"
        className="wr-chart-pill"
        style={{ fill: tone === "rarity" ? "var(--wr-bg)" : "var(--wr-fg)" }}
      >
        {text}
      </text>
    </g>
  );
}

/** The hairline a pill sits on. */
function Marker({ x, from, to }: { x: number; from: number; to: number }) {
  return (
    <line
      data-chart-note
      data-origin={`${x} ${to}`}
      x1={x}
      x2={x}
      y1={from}
      y2={to}
      stroke="var(--wr-fg)"
      strokeOpacity="0.22"
      strokeWidth="2"
    />
  );
}

/** A mask that dissolves both ends of a chart. Put it in `defs`, then `mask="url(#id)"` on the group. */
function EndsMask({ id, height, fade = 0.06 }: { id: string; height: number; fade?: number }) {
  return (
    <>
      <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset={fade} stopColor="#fff" stopOpacity="1" />
        <stop offset={1 - fade} stopColor="#fff" stopOpacity="1" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={height}>
        <rect width={WIDTH} height={height} fill={`url(#${id}-fade)`} />
      </mask>
    </>
  );
}

/**
 * A line through the points that bends instead of zigzagging: each point is a control point and the curve passes
 * through the midpoints, so it never overshoots below the baseline the way a spline can.
 */
function smoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length < 3) return `M${points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" L")}`;
  const [first, ...rest] = points;
  const last = rest.at(-1) ?? first;
  const curves = rest.slice(0, -1).map((point, index) => {
    const next = rest[index + 1];
    return `Q${point.x.toFixed(1)},${point.y.toFixed(1)} ${((point.x + next.x) / 2).toFixed(1)},${((point.y + next.y) / 2).toFixed(1)}`;
  });
  return `M${first.x.toFixed(1)},${first.y.toFixed(1)} ${curves.join(" ")} L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
}

const SPARK_HEIGHT = 400;

/**
 * The year as one glowing line over its own light. A stretch that matters (a streak) is lit as a column with its
 * note in a pill above; a line to cross (ten thousand) is dashed, with a dot and a pill where the year crossed it.
 */
function Spark({ chart }: { chart: Extract<SceneChart, { type: "spark" }> }) {
  const id = useId();
  const { values, band, threshold } = chart;
  const top = 104;
  const base = SPARK_HEIGHT - 16;
  const max = Math.max(1, ...values, (threshold?.value ?? 0) * 1.08);
  const x = (index: number) => (index / Math.max(1, values.length - 1)) * WIDTH;
  const y = (value: number) => base - (value / max) * (base - top);
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const line = smoothPath(points);
  const area = `${line} L${WIDTH},${SPARK_HEIGHT} L0,${SPARK_HEIGHT} Z`;
  // The selection: a column a little wider than its stretch, so the first and last value sit inside it.
  const bandLeft = band ? x(band.from) - 8 : 0;
  const bandWidth = band ? Math.max(16, x(band.to) - x(band.from) + 16) : 0;
  const bandTop = top - 26;
  const bandCentre = bandLeft + bandWidth / 2;
  const crossed = threshold ? values.findIndex((value) => value >= threshold.value) : -1;
  const crossX = crossed === -1 ? WIDTH - 90 : x(crossed);

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${SPARK_HEIGHT}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0.42" />
          <stop offset="1" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0.07" />
          <stop offset="1" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0.2" />
        </linearGradient>
        <EndsMask id={`${id}-ends`} height={SPARK_HEIGHT} fade={0.04} />
        {band ? (
          <clipPath id={`${id}-lit`}>
            <rect x={bandLeft} y="0" width={bandWidth} height={SPARK_HEIGHT} />
          </clipPath>
        ) : null}
      </defs>
      {band ? (
        // A quiet tint with a hairline around it. At full strength the column read as a grey slab laid over the year.
        <rect
          data-chart-band
          x={bandLeft}
          y={bandTop}
          width={bandWidth}
          height={base - top + 42}
          rx="18"
          fill={`url(#${id}-band)`}
          style={{ stroke: "var(--wr-rarity)" }}
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
      ) : null}
      {threshold ? (
        <line
          data-chart-note
          x1="0"
          x2={WIDTH}
          y1={y(threshold.value)}
          y2={y(threshold.value)}
          style={{ stroke: "var(--wr-rarity)" }}
          strokeOpacity="0.7"
          strokeWidth="3"
          strokeDasharray="4 12"
          strokeLinecap="round"
        />
      ) : null}
      <g data-chart-wipe mask={`url(#${id}-ends)`}>
        <path d={area} fill={`url(#${id}-area)`} />
        <path
          d={line}
          fill="none"
          style={{ stroke: "var(--wr-l4)" }}
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {band ? (
          // The very same line, shown only inside the band: a separately smoothed stretch would not sit on it.
          <path
            d={line}
            fill="none"
            clipPath={`url(#${id}-lit)`}
            style={{ stroke: "var(--wr-rarity)", filter: "drop-shadow(0 0 14px var(--wr-rarity))" }}
            strokeWidth="8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </g>
      {band ? (
        <>
          {/* A short stem from the label to its selection. Run down to the floor, it cut the selection in two. */}
          <Marker x={bandCentre} from={66} to={bandTop} />
          <Pill x={bandCentre} y={40} text={band.label} tone="rarity" />
        </>
      ) : null}
      {threshold ? (
        <>
          {crossed === -1 ? null : (
            <circle
              data-chart-note
              cx={crossX}
              cy={y(threshold.value)}
              r="10"
              style={{ fill: "var(--wr-rarity)", filter: "drop-shadow(0 0 16px var(--wr-rarity))" }}
            />
          )}
          <Marker x={crossX} from={y(threshold.value) - 34} to={base} />
          <Pill x={crossX} y={y(threshold.value) - 56} text={threshold.label} tone="rarity" />
        </>
      ) : null}
    </svg>
  );
}

const BARS_HEIGHT = 400;

/**
 * Columns sharing one light: every bar is cut from the same top-to-bottom gradient, so tall ones reach the bright part
 * and short ones stay in the dim. The bars that are the point are solid in the find's color and glow; the tallest of
 * them can carry its number in a pill.
 */
function Bars({ chart }: { chart: Extract<SceneChart, { type: "bars" }> }) {
  const id = useId();
  const { bars } = chart;
  const labelled = bars.some((bar) => bar.label);
  const top = 96;
  const base = labelled ? BARS_HEIGHT - 62 : BARS_HEIGHT - 12;
  const gap = bars.length > 10 ? 12 : 18;
  const width = (WIDTH - gap * (bars.length - 1)) / bars.length;
  // One corner radius for every bar, small against its width. Rounding by half the width turned short bars into
  // ovals; with a fixed radius a short bar is a tidy stub and a tall one a column, and they read as one family.
  const corner = Math.min(14, width * 0.28);
  const stub = corner * 2 + 6;
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  // A day with nothing is an empty slot on the floor; anything else stands on a stub and grows from there.
  const heightOf = (value: number) => (value > 0 ? stub + (value / max) * (base - top - stub) : corner * 1.4);
  const tallest = bars.reduce<number>(
    (best, bar, index) => (bar.peak && (best === -1 || bar.value > bars[best].value) ? index : best),
    -1,
  );
  const pilled = tallest !== -1 && chart.peakLabel ? tallest : -1;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${BARS_HEIGHT}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-bar`} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={base}>
          <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--wr-l3)" }} />
          <stop offset="1" style={{ stopColor: "var(--wr-l2)" }} />
        </linearGradient>
        <linearGradient id={`${id}-peak`} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={base}>
          <stop offset="0" style={{ stopColor: "var(--wr-rarity)" }} />
          <stop offset="1" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {bars.map((bar, index) => {
        const height = heightOf(bar.value);
        const x = index * (width + gap);
        const empty = bar.value <= 0;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- bars are positional
          <g key={index} data-chart-col data-peak={bar.peak && !empty ? "" : undefined}>
            <rect
              data-chart-bar
              x={x}
              y={base - height}
              width={width}
              height={height}
              rx={corner}
              fill={empty ? "var(--wr-fg)" : `url(#${id}-${bar.peak ? "peak" : "bar"})`}
              opacity={empty ? 0.1 : bar.peak ? 1 : 0.72}
              style={bar.peak && !empty ? { filter: "drop-shadow(0 0 20px var(--wr-rarity))" } : undefined}
            />
            {/* Each bar says its number. The one the chart is about says it in a pill instead. */}
            {empty || index === pilled ? null : (
              <text
                data-chart-note
                x={x + width / 2}
                y={base - height - 14}
                textAnchor="middle"
                className="wr-chart-value"
                style={{ fill: bar.peak ? "var(--wr-rarity)" : "var(--wr-muted)" }}
              >
                {cellCount(bar.value)}
              </text>
            )}
            {labelled ? (
              <text
                data-chart-bar-label
                x={x + width / 2}
                y={BARS_HEIGHT - 14}
                textAnchor="middle"
                className="wr-chart-label"
                style={{ fill: bar.peak ? "var(--wr-rarity)" : "var(--wr-muted)" }}
              >
                {bar.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {pilled !== -1 && chart.peakLabel ? (
        <Pill
          x={pilled * (width + gap) + width / 2}
          y={base - heightOf(bars[pilled].value) - 44}
          text={chart.peakLabel}
          tone="rarity"
        />
      ) : null}
    </svg>
  );
}

const FUNNEL_HEIGHT = 460;
/** The ribbon is drawn three times, each nested in the last: a wide faint flow, a body, a bright core. */
const FUNNEL_LAYERS = [
  { scale: 1, opacity: 0.26 },
  { scale: 0.66, opacity: 0.5 },
  { scale: 0.34, opacity: 1 },
] as const;

/**
 * A flow that narrows from left to right: nested ribbons, level where a stage sits and easing down into the next, a
 * hairline through each stage with its number in a pill, and a glow behind the wide end. The color runs from the
 * year's own into the rarity of what was earned. It runs off both ends instead of being capped, which is what keeps it
 * a flow and not an object (a capped one read as a bottle).
 */
function Funnel({ chart }: { chart: Extract<SceneChart, { type: "funnel" }> }) {
  const id = useId();
  const { steps } = chart;
  const max = Math.max(1, ...steps.map((step) => step.value));
  const span = WIDTH / steps.length;
  const centre = 254;
  const level = span * 0.2;
  // Square-root heights, so a small last stage is still a ribbon and not a hair.
  const heights = steps.map((step) => 56 + 304 * Math.sqrt(step.value / max));
  const stageX = (index: number) => span * (index + 0.5);

  /** One ribbon: level across each stage, an S-curve between stages, mirrored around the centre line. */
  const ribbon = (scale: number) => {
    const edge = (side: -1 | 1) => heights.map((height) => centre + (side * height * scale) / 2);
    const top = edge(-1);
    const bottom = edge(1);
    const from = (index: number) => (index === 0 ? 0 : stageX(index) - level);
    const to = (index: number) => (index === steps.length - 1 ? WIDTH : stageX(index) + level);
    const forward = top
      .map((y, index) => {
        if (index === 0) return `M0,${y} L${to(0)},${y}`;
        const bend = (from(index) - to(index - 1)) / 2;
        return `C${to(index - 1) + bend},${top[index - 1]} ${from(index) - bend},${y} ${from(index)},${y} L${to(index)},${y}`;
      })
      .join(" ");
    const backward = bottom
      .map((y, index) => {
        if (index === steps.length - 1) return `L${WIDTH},${y} L${from(index)},${y}`;
        const bend = (from(index + 1) - to(index)) / 2;
        return `C${from(index + 1) - bend},${bottom[index + 1]} ${to(index) + bend},${y} ${to(index)},${y} L${from(index)},${y}`;
      })
      .toReversed()
      .join(" ");
    return `${forward} ${backward} Z`;
  };

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${FUNNEL_HEIGHT}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} />
          <stop offset="0.45" style={{ stopColor: "var(--wr-l3)" }} />
          <stop offset="0.8" style={{ stopColor: "var(--wr-rarity)" }} />
        </linearGradient>
        {/* Both ends dissolve, so the flow comes from somewhere and goes on. */}
        <linearGradient id={`${id}-ends`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.07" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={FUNNEL_HEIGHT}>
          <rect width={WIDTH} height={FUNNEL_HEIGHT} fill={`url(#${id}-ends)`} />
        </mask>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0.4" />
          <stop offset="1" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        data-chart-glow
        cx={stageX(0)}
        cy={centre}
        rx={span * 1.2}
        ry={heights[0] * 0.78}
        fill={`url(#${id}-glow)`}
      />
      <g data-chart-wipe mask={`url(#${id}-mask)`}>
        {FUNNEL_LAYERS.map((layer) => (
          <path key={layer.scale} d={ribbon(layer.scale)} fill={`url(#${id}-fill)`} opacity={layer.opacity} />
        ))}
      </g>
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const x = stageX(index);
        const figure = fmt(step.value);
        const pill = figure.length * 19 + 46;
        return (
          <g key={step.label} data-chart-note>
            <line
              x1={x}
              x2={x}
              y1={48}
              y2={FUNNEL_HEIGHT - 6}
              stroke="var(--wr-fg)"
              strokeOpacity="0.22"
              strokeWidth="2"
            />
            <text
              x={x}
              y={30}
              textAnchor="middle"
              className="wr-chart-label"
              fill={last ? "var(--wr-rarity)" : "var(--wr-muted)"}
            >
              {step.label}
            </text>
            <rect x={x - pill / 2} y={centre - 30} width={pill} height={60} rx={30} fill="var(--wr-bg)" />
            <text x={x} y={centre + 11} textAnchor="middle" className="wr-chart-figure" fill="var(--wr-fg)">
              {figure}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const PULSE_HEIGHT = 380;
/** Ring fills by rank, as steps of the palette's brightest color: one family, never a color per part. */
const RANK_OPACITY = [1, 0.7, 0.46, 0.28] as const;

/**
 * A pulse: each day a stroke around a centre line, as tall as the day was busy. It zooms in on the stretch around the
 * quiet part, which is not an empty hole but the point: a soft lit band where the line runs flat and bright, with what
 * it was in a pill above.
 */
function Ticks({ chart }: { chart: Extract<SceneChart, { type: "ticks" }> }) {
  const id = useId();
  const { values, gap } = chart;
  const centre = 232;
  const reach = 128;
  // Zoom in around the gap, so it is a visible part of the picture and not a notch in a whole year.
  const length = gap.to - gap.from + 1;
  const span = Math.min(values.length, Math.max(84, length * 5));
  const start = Math.min(values.length - span, Math.max(0, Math.round((gap.from + gap.to) / 2 - span / 2)));
  const days = values.slice(start, start + span);
  const max = Math.max(1, ...days);
  const step = WIDTH / span;
  const x = (index: number) => (index - start) * step;
  const gapLeft = x(gap.from);
  const gapRight = x(gap.to + 1);
  const gapCentre = (gapLeft + gapRight) / 2;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${PULSE_HEIGHT}`} aria-hidden>
      <defs>
        <linearGradient
          id={`${id}-tick`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={centre - reach}
          x2="0"
          y2={centre + reach}
        >
          <stop offset="0" style={{ stopColor: "var(--wr-l3)" }} stopOpacity="0.5" />
          <stop offset="0.5" style={{ stopColor: "var(--wr-l4)" }} />
          <stop offset="1" style={{ stopColor: "var(--wr-l3)" }} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${id}-rest`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0" />
          <stop offset="0.5" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0.34" />
          <stop offset="1" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0" />
        </linearGradient>
        <EndsMask id={`${id}-ends`} height={PULSE_HEIGHT} />
      </defs>
      <rect
        data-chart-band
        x={gapLeft}
        y={centre - reach - 14}
        width={Math.max(12, gapRight - gapLeft)}
        height={(reach + 14) * 2}
        rx="22"
        fill={`url(#${id}-rest)`}
      />
      <g mask={`url(#${id}-ends)`}>
        <line x1="0" x2={WIDTH} y1={centre} y2={centre} stroke="var(--wr-fg)" strokeOpacity="0.16" strokeWidth="2" />
        {days.map((value, index) => {
          if (value === 0) return null;
          const height = 16 + Math.sqrt(value / max) * (reach * 2 - 16);
          const width = Math.max(2, step * 0.56);
          return (
            <rect
              // oxlint-disable-next-line react/no-array-index-key -- one stroke per day
              key={index}
              data-chart-tick
              x={index * step + (step - width) / 2}
              y={centre - height / 2}
              width={width}
              height={height}
              rx={width / 2}
              fill={`url(#${id}-tick)`}
            />
          );
        })}
      </g>
      <line
        data-chart-note
        x1={gapLeft + 10}
        x2={gapRight - 10}
        y1={centre}
        y2={centre}
        style={{ stroke: "var(--wr-rarity)", filter: "drop-shadow(0 0 12px var(--wr-rarity))" }}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Marker x={gapCentre} from={66} to={centre - 12} />
      <Pill x={gapCentre} y={40} text={gap.label} tone="rarity" />
    </svg>
  );
}

/**
 * The dash that lights `share` (0 to 1) of a ring whose stroke has round ends. A round end reaches half the stroke past
 * each end of its dash, so a dash as long as the share draws the share plus one whole stroke: at 97% the two ends met
 * and the ring read as full. The dash gives that stroke back, and the arc is pushed along by half of it
 * (`strokeDashoffset={-stroke / 2}`), so what is lit starts at twelve o'clock and covers its share and no more. A share
 * shorter than the stroke is a dot.
 */
export function ringDash(share: number, length: number, stroke: number): number {
  return Math.max(0.01, Math.min(1, share) * length - stroke);
}

/** Concentric arcs, one per part, biggest outside, all in the palette's own color at fading strengths. */
function Rings({ chart }: { chart: Extract<SceneChart, { type: "rings" }> }) {
  const id = useId();
  const size = 320;
  const stroke = 26;
  return (
    <div className="wr-chart-rings">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0.35" />
            <stop offset="1" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle data-chart-glow cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id}-glow)`} />
        {chart.parts.map((part, index) => {
          const radius = size / 2 - stroke / 2 - index * (stroke + 10);
          const length = 2 * Math.PI * radius;
          return (
            <g key={part.name} transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--wr-fg)"
                strokeOpacity="0.07"
                strokeWidth={stroke}
              />
              <circle
                data-chart-ring
                data-length={length}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                style={{
                  stroke: "var(--wr-l4)",
                  filter: index === 0 ? "drop-shadow(0 0 12px var(--wr-l4))" : undefined,
                }}
                strokeOpacity={RANK_OPACITY[Math.min(index, RANK_OPACITY.length - 1)]}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${ringDash(part.share / 100, length, stroke)} ${length}`}
                strokeDashoffset={-stroke / 2}
              />
            </g>
          );
        })}
      </svg>
      <ul>
        {chart.parts.map((part, index) => (
          <li key={part.name} data-chart-note>
            <i
              style={{ background: "var(--wr-l4)", opacity: RANK_OPACITY[Math.min(index, RANK_OPACITY.length - 1)] }}
            />
            {part.name}
            <b>{part.share}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Two parts of a whole: the rest as a quiet track, the part that is the point as a lit arc, its share in the middle. */
function Donut({ chart }: { chart: Extract<SceneChart, { type: "donut" }> }) {
  const size = 320;
  const stroke = 46;
  const radius = size / 2 - stroke / 2 - 8;
  const length = 2 * Math.PI * radius;
  const [first, second] = chart.parts;
  const share = second.value / Math.max(1, first.value + second.value);
  return (
    <div className="wr-chart-rings">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            // The rest of the ring is a quiet track in the frame's own ink: in the theme's color it fought the lit arc
            // on warm palettes.
            stroke="var(--wr-fg)"
            strokeOpacity="0.1"
            strokeWidth={stroke}
          />
          <circle
            data-chart-ring
            data-length={length}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            style={{ stroke: "var(--wr-rarity)", filter: "drop-shadow(0 0 16px var(--wr-rarity))" }}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${ringDash(share, length, stroke)} ${length}`}
            strokeDashoffset={-stroke / 2}
          />
        </g>
        <text x={size / 2} y={size / 2 + 18} textAnchor="middle" className="wr-chart-centre" fill="currentColor">
          {chart.centre}
        </text>
      </svg>
      <ul>
        {chart.parts.map((part, index) => (
          <li key={part.label} data-chart-note>
            <i
              style={{
                background: index === 1 ? "var(--wr-rarity)" : "color-mix(in oklch, var(--wr-fg) 22%, transparent)",
              }}
            />
            {part.label}
            <b>{fmt(part.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A short run of dates as tall cards. The marked ones are lifted and lit: those are the point. */
/** A count short enough to sit inside a cell: 12 stays, 536,128 becomes 536K. */
const cellCount = (value: number) =>
  value < 1000
    ? String(value)
    : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 0 }).format(value);

/**
 * A short run of dates in the graph's own language: one big cell per day, lit by how much happened on it, with the
 * date underneath. The days that are the point get a ring in the drop's rarity. Every cell sits on the same line.
 */
function Days({ chart }: { chart: Extract<SceneChart, { type: "days" }> }) {
  return (
    <div className="wr-chart-days">
      {chart.days.map((day) => (
        <div key={`${day.label}-${day.sub}`} className="wr-chart-day" data-marked={day.marked ? "" : undefined}>
          <i data-l={day.level} data-value={day.count}>
            {cellCount(day.count)}
          </i>
          <b>{day.label}</b>
          <small>{day.sub}</small>
        </div>
      ))}
    </div>
  );
}

const GAUGE_HEIGHT = 470;
const GAUGE_SEGMENTS = 15;

/**
 * A dial: fifteen chunky segments around half a circle, filled up to the share in the find's color, the rest left
 * dark. Nothing in the middle: the number belongs to the scene's words, and saying it twice is noise.
 */
function Gauge({ chart }: { chart: Extract<SceneChart, { type: "gauge" }> }) {
  const cx = WIDTH / 2;
  const cy = GAUGE_HEIGHT - 24;
  const outer = 420;
  const inner = 296;
  const round = 12;
  const sweep = 180 / GAUGE_SEGMENTS;
  // The gap between two segments is a constant width, not a constant angle: that is what makes each segment a wedge,
  // wider at the rim than at the hub. So each edge sits a fixed distance off the dividing line, which is a bigger
  // angle near the hub than at the rim. (The corners are rounded by a stroke, whose half width is part of that.)
  const space = 12;
  const inset = (radius: number) => (Math.asin((space / 2 + round) / radius) * 180) / Math.PI;
  const lit = Math.max(1, Math.round(Math.min(1, Math.max(0, chart.share)) * GAUGE_SEGMENTS));
  const point = (radius: number, degrees: number) => {
    const angle = (degrees * Math.PI) / 180;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  };

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${GAUGE_HEIGHT}`} aria-hidden>
      {Array.from({ length: GAUGE_SEGMENTS }, (_unused, index) => {
        const from = 180 + index * sweep;
        const to = 180 + (index + 1) * sweep;
        const rim = outer - round;
        const hub = inner + round;
        const on = index < lit;
        const shape = `M${point(rim, from + inset(rim))} A${rim},${rim} 0 0 1 ${point(rim, to - inset(rim))} L${point(hub, to - inset(hub))} A${hub},${hub} 0 0 0 ${point(hub, from + inset(hub))} Z`;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- segments are positional
          <g key={index}>
            {/* The dark slot stays under a lit segment: the dial stands whole first, then fills. */}
            <path
              data-chart-slot
              data-origin={`${cx} ${cy}`}
              d={shape}
              strokeWidth={round * 2}
              strokeLinejoin="round"
              opacity="0.1"
              style={{ fill: "var(--wr-fg)", stroke: "var(--wr-fg)" }}
            />
            {on ? (
              <path
                data-chart-lit
                data-chart-point={index === lit - 1 ? "" : undefined}
                data-origin={`${cx} ${cy}`}
                d={shape}
                strokeWidth={round * 2}
                strokeLinejoin="round"
                style={{
                  fill: "var(--wr-rarity)",
                  stroke: "var(--wr-rarity)",
                  filter: index === lit - 1 ? "drop-shadow(0 0 22px var(--wr-rarity))" : undefined,
                }}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

const METER_HEIGHT = 372;

/**
 * A row of slim pills, one per thing counted: dark where there was nothing, lit in the find's color where there was,
 * brighter the more there was. Where the row starts and ends is written under it.
 */
function Meter({ chart }: { chart: Extract<SceneChart, { type: "meter" }> }) {
  const { pills } = chart;
  const gap = pills.length > 40 ? 6 : 10;
  const width = (WIDTH - gap * (pills.length - 1)) / pills.length;
  const top = chart.note ? 92 : 12;
  const base = METER_HEIGHT - 58;
  const max = Math.max(0.0001, ...pills);
  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${METER_HEIGHT}`} aria-hidden>
      {pills.map((value, index) => {
        const on = value > 0;
        return (
          <rect
            // oxlint-disable-next-line react/no-array-index-key -- pills are positional
            key={index}
            data-chart-pill
            x={index * (width + gap)}
            y={top}
            width={width}
            height={base - top}
            rx={width / 2}
            opacity={on ? 0.5 + 0.5 * (value / max) : 0.1}
            style={{
              fill: on ? "var(--wr-rarity)" : "var(--wr-fg)",
              filter: on && value === max ? "drop-shadow(0 0 12px var(--wr-rarity))" : undefined,
            }}
          />
        );
      })}
      <text data-chart-note x="0" y={METER_HEIGHT - 12} className="wr-chart-label" fill="var(--wr-muted)">
        {chart.from}
      </text>
      <text
        data-chart-note
        x={WIDTH}
        y={METER_HEIGHT - 12}
        textAnchor="end"
        className="wr-chart-label"
        fill="var(--wr-muted)"
      >
        {chart.to}
      </text>
      {chart.note ? <Pill x={WIDTH / 2} y={40} text={chart.note} tone="rarity" /> : null}
    </svg>
  );
}

const PIXEL_COLUMNS = 26;
const PIXEL_ROWS = 12;

/**
 * An area chart in the contribution graph's own language: a grid of cells, each column filled up to its value and
 * brighter towards its top, the empty cells still faintly there. One cell can be the point, lit in the find's color
 * with its label in a pill above.
 */
function Pixels({ chart }: { chart: Extract<SceneChart, { type: "pixels" }> }) {
  const { values, mark } = chart;
  const gap = 6;
  const cell = (WIDTH - gap * (PIXEL_COLUMNS - 1)) / PIXEL_COLUMNS;
  const top = mark ? 96 : 8;
  const height = top + PIXEL_ROWS * cell + (PIXEL_ROWS - 1) * gap + 8;
  // The values resampled to the grid's columns: each column is the last value that falls in it.
  const columns = Array.from({ length: PIXEL_COLUMNS }, (_unused, column) => {
    const at = Math.min(values.length - 1, Math.round(((column + 1) / PIXEL_COLUMNS) * values.length) - 1);
    return values[Math.max(0, at)] ?? 0;
  });
  const max = Math.max(1, ...columns);
  const filled = columns.map((value) => (value > 0 ? Math.max(1, Math.round((value / max) * PIXEL_ROWS)) : 0));
  const markColumn = mark
    ? Math.min(PIXEL_COLUMNS - 1, Math.floor((mark.index / Math.max(1, values.length)) * PIXEL_COLUMNS))
    : -1;
  const x = (column: number) => column * (cell + gap);
  const y = (row: number) => top + (PIXEL_ROWS - 1 - row) * (cell + gap);

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden>
      {/* Column by column: the empty slots first, then the lit cells standing up on them from the floor. */}
      {columns.map((_value, column) => (
        // oxlint-disable-next-line react/no-array-index-key -- columns are positional
        <g key={`off-${column}`} data-chart-slots>
          {Array.from({ length: PIXEL_ROWS - filled[column] }, (_unused, index) => (
            <rect
              // oxlint-disable-next-line react/no-array-index-key -- cells are positional
              key={index}
              x={x(column)}
              y={y(filled[column] + index)}
              width={cell}
              height={cell}
              rx={cell * 0.2}
              fill="var(--wr-fg)"
              opacity="0.06"
            />
          ))}
        </g>
      ))}
      {columns.map((_value, column) =>
        filled[column] > 0 ? (
          // oxlint-disable-next-line react/no-array-index-key -- columns are positional
          <g key={`on-${column}`} data-chart-col data-column={column}>
            {Array.from({ length: filled[column] }, (_unused, row) => {
              const tip = column === markColumn && row === filled[column] - 1;
              return (
                <rect
                  // oxlint-disable-next-line react/no-array-index-key -- cells are positional
                  key={row}
                  data-chart-point={tip ? "" : undefined}
                  x={x(column)}
                  y={y(row)}
                  width={cell}
                  height={cell}
                  rx={cell * 0.2}
                  opacity={tip ? 1 : 0.28 + 0.72 * ((row + 1) / filled[column]) ** 1.6}
                  style={{
                    fill: tip ? "var(--wr-rarity)" : "var(--wr-l4)",
                    filter: tip ? "drop-shadow(0 0 14px var(--wr-rarity))" : undefined,
                  }}
                />
              );
            })}
          </g>
        ) : null,
      )}
      {mark && markColumn !== -1 ? (
        <>
          <Marker x={x(markColumn) + cell / 2} from={66} to={y(filled[markColumn] - 1) - 6} />
          <Pill x={x(markColumn) + cell / 2} y={40} text={mark.label} tone="rarity" />
        </>
      ) : null}
    </svg>
  );
}

const WHEEL_HEIGHT = 640;

/**
 * A ring cut into segments, one per month or hour, each as bright as it was busy and the busiest in the find's
 * color, with a hairline circle around it carrying the labels. Nothing in the middle.
 */
function Wheel({ chart }: { chart: Extract<SceneChart, { type: "wheel" }> }) {
  const { segments } = chart;
  const cx = WIDTH / 2;
  const cy = WHEEL_HEIGHT / 2;
  const radius = 222;
  const stroke = 58;
  const sweep = 360 / segments.length;
  const gap = 2.4;
  const max = Math.max(1, ...segments.map((segment) => segment.value));
  const peak = segments.reduce((best, segment, index) => (segment.value > segments[best].value ? index : best), 0);
  const point = (r: number, degrees: number) => {
    const angle = ((degrees - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${WHEEL_HEIGHT}`} aria-hidden>
      <circle
        data-chart-rim
        data-origin={`${cx} ${cy}`}
        cx={cx}
        cy={cy}
        r={radius + stroke / 2 + 14}
        fill="none"
        stroke="var(--wr-fg)"
        strokeOpacity="0.14"
        strokeWidth="2"
      />
      {segments.map((segment, index) => {
        const from = point(radius, index * sweep + gap / 2);
        const to = point(radius, (index + 1) * sweep - gap / 2);
        const label = point(radius + stroke / 2 + 44, (index + 0.5) * sweep);
        const top = index === peak && segment.value > 0;
        return (
          <g key={segment.label + index}>
            <path
              data-chart-arc
              data-chart-point={top ? "" : undefined}
              // How long the arc is, for drawing it, and its full width, for the swell it lands with.
              data-length={((radius * (sweep - gap) * Math.PI) / 180).toFixed(1)}
              data-width={stroke}
              d={`M${from.x.toFixed(1)},${from.y.toFixed(1)} A${radius},${radius} 0 0 1 ${to.x.toFixed(1)},${to.y.toFixed(1)}`}
              fill="none"
              strokeWidth={stroke}
              opacity={top ? 1 : segment.value > 0 ? 0.22 + 0.68 * (segment.value / max) : 0.08}
              style={{
                stroke: top ? "var(--wr-rarity)" : segment.value > 0 ? "var(--wr-l4)" : "var(--wr-fg)",
                filter: top ? "drop-shadow(0 0 16px var(--wr-rarity))" : undefined,
              }}
            />
            <text
              data-chart-arc-label
              // The label comes out from the ring: this is the step back towards the middle it starts from.
              data-from={`${((cx - label.x) * 0.12).toFixed(1)} ${((cy - label.y) * 0.12).toFixed(1)}`}
              x={label.x}
              y={label.y + 9}
              textAnchor="middle"
              className="wr-chart-label"
              style={{ fill: top ? "var(--wr-rarity)" : "var(--wr-muted)" }}
            >
              {segment.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * An hour of the day as people say it in English: "12 am", "3 pm". For a director's own lines. The charts write
 * their hours through the labels (`charts.hour`), so a provider can say them another way.
 */
export const hourName = (hour: number) => DEFAULT_LABELS.charts.hour(hour);
/** A value as one of the graph's five levels, 0 for nothing. */
const levelOf = (value: number, max: number) => (value > 0 ? Math.max(1, Math.ceil((value / max) * 4)) : 0);

const CLOCK_HEIGHT = 700;

/**
 * A day as a clock face: one wedge per hour, midnight at the top, each as long as the hour was busy. Every hour keeps
 * its unlit slot behind it, so a quiet night is a visible gap and not a missing piece. The busiest hour is the find's
 * color and says its name in a pill.
 */
function Clock({ chart }: { chart: Extract<SceneChart, { type: "clock" }> }) {
  const id = useId();
  const labels = useLabels();
  const hours = Array.from({ length: 24 }, (_unused, hour) => Math.max(0, chart.hours[hour] ?? 0));
  const cx = WIDTH / 2;
  const cy = CLOCK_HEIGHT / 2;
  const hub = 120;
  const rim = 254;
  const round = 6;
  // The same constant gap as the dial: an edge sits a fixed distance off the dividing line, so a slot is a wedge.
  const space = 9;
  const max = Math.max(1, ...hours);
  const peak = chart.mark === undefined ? hours.indexOf(Math.max(...hours)) : Math.min(23, Math.max(0, chart.mark));
  const xy = (degrees: number, radius: number) => {
    const angle = ((degrees - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };
  const at = (degrees: number, radius: number) => {
    const point = xy(degrees, radius);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  };
  const inset = (radius: number) => (Math.asin((space / 2 + round) / radius) * 180) / Math.PI;
  const wedge = (hour: number, reach: number) => {
    const from = hour * 15;
    const to = from + 15;
    const inner = hub + round;
    const outer = reach - round;
    return `M${at(from + inset(outer), outer)} A${outer},${outer} 0 0 1 ${at(to - inset(outer), outer)} L${at(to - inset(inner), inner)} A${inner},${inner} 0 0 0 ${at(from + inset(inner), inner)} Z`;
  };
  const peakAngle = peak * 15 + 7.5;
  const pillAt = xy(peakAngle, rim + 66);
  const stemFrom = xy(peakAngle, rim + 8);
  const stemTo = xy(peakAngle, rim + 38);
  const lit = hours[peak] > 0;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${CLOCK_HEIGHT}`} aria-hidden>
      <defs>
        <radialGradient id={`${id}-hour`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={rim}>
          <stop offset={hub / rim} style={{ stopColor: "var(--wr-l2)" }} />
          <stop offset="0.8" style={{ stopColor: "var(--wr-l3)" }} />
          <stop offset="1" style={{ stopColor: "var(--wr-l4)" }} />
        </radialGradient>
      </defs>
      {hours.map((value, hour) => {
        const on = lit && hour === peak;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- hours are positional
          <g key={hour}>
            <path
              data-chart-slot
              d={wedge(hour, rim)}
              strokeWidth={round * 2}
              strokeLinejoin="round"
              opacity="0.06"
              style={{ fill: "var(--wr-fg)", stroke: "var(--wr-fg)" }}
            />
            {value > 0 ? (
              <path
                data-chart-hour={hour}
                data-chart-point={on ? "" : undefined}
                data-origin={`${cx} ${cy}`}
                d={wedge(hour, hub + 34 + (value / max) * (rim - hub - 34))}
                strokeWidth={round * 2}
                strokeLinejoin="round"
                fill={on ? undefined : `url(#${id}-hour)`}
                stroke={on ? undefined : `url(#${id}-hour)`}
                style={
                  on
                    ? {
                        fill: "var(--wr-rarity)",
                        stroke: "var(--wr-rarity)",
                        filter: "drop-shadow(0 0 22px var(--wr-rarity))",
                      }
                    : undefined
                }
              />
            ) : null}
          </g>
        );
      })}
      {/* Night and day, said once in the middle: a moon towards midnight, a sun towards noon. */}
      <g data-chart-hub data-origin={`${cx} ${cy}`}>
        <circle cx={cx} cy={cy - 34} r="11" fill="var(--wr-fg)" opacity="0.22" />
        <circle cx={cx + 6} cy={cy - 38} r="9.5" fill="var(--wr-bg)" />
        <circle cx={cx} cy={cy + 34} r="11" fill="var(--wr-fg)" opacity="0.5" />
      </g>
      {[0, 6, 12, 18].map((hour) => {
        // The pill names the busiest hour; a clock label under it would only collide with it.
        const away = Math.abs(((peakAngle - hour * 15 + 540) % 360) - 180);
        if (lit && away < 26) return null;
        const point = xy(hour * 15, rim + 50);
        return (
          <text
            key={hour}
            data-chart-tick-label
            x={point.x}
            y={point.y + 9}
            textAnchor="middle"
            className="wr-chart-label"
            fill="var(--wr-muted)"
          >
            {labels.charts.hour(hour)}
          </text>
        );
      })}
      {lit ? (
        <>
          <line
            data-chart-note
            data-origin={`${stemFrom.x.toFixed(1)} ${stemFrom.y.toFixed(1)}`}
            x1={stemFrom.x}
            y1={stemFrom.y}
            x2={stemTo.x}
            y2={stemTo.y}
            stroke="var(--wr-fg)"
            strokeOpacity="0.22"
            strokeWidth="2"
          />
          <Pill x={pillAt.x} y={pillAt.y} text={labels.charts.hour(peak)} tone="rarity" />
        </>
      ) : null}
    </svg>
  );
}

/** A smooth curve through the points, as the path commands that follow the first point. */
function splineThrough(points: readonly { x: number; y: number }[]): string {
  return points
    .slice(0, -1)
    .map((point, index) => {
      const before = points[index - 1] ?? point;
      const next = points[index + 1];
      const after = points[index + 2] ?? next;
      return `C${(point.x + (next.x - before.x) / 6).toFixed(1)},${(point.y + (next.y - before.y) / 6).toFixed(1)} ${(next.x - (after.x - point.x) / 6).toFixed(1)},${(next.y - (after.y - point.y) / 6).toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`;
    })
    .join(" ");
}

const RIVER_HEIGHT = 560;
/** A stream's value at a moment: nothing where it has no number, never below zero. */
const valueAt = (stream: { values: readonly number[] }, index: number) => Math.max(0, stream.values[index] ?? 0);
/** What the streams that are not the point are filled with, top to bottom. */
const RIVER_TONES = ["var(--wr-l4)", "var(--wr-l2)", "var(--wr-l1)"] as const;

/**
 * Parts of a whole over time, as ribbons stacked around a centre line: each as thick as its share that month, with a
 * hair of background between them. It runs the full width with nothing written on the bands; the names and where each
 * ended are a legend underneath. The year flows in from the left and lands solid on its final split. One stream can be
 * the point (the find's color), and one moment can carry a note.
 */
function River({ chart }: { chart: Extract<SceneChart, { type: "river" }> }) {
  const id = useId();
  const { streams, ticks, note } = chart;
  const length = Math.max(2, ...streams.map((stream) => stream.values.length));
  const totals = Array.from({ length }, (_unused, index) =>
    streams.reduce((sum, stream) => sum + valueAt(stream, index), 0),
  );
  const x = (index: number) => (index / (length - 1)) * WIDTH;
  const mid = 306;
  const reach = 400 / Math.max(0.0001, ...totals);
  const gap = 5;

  const bands: { name: string; path: string; fill: string; point: boolean; swatch: string; share: number }[] = [];
  let floor = totals.map((total) => -total / 2);
  let plain = 0;
  for (const stream of streams) {
    const from = floor;
    const to = from.map((value, index) => value + valueAt(stream, index));
    // Each band gives up a few pixels to its neighbour, so they read as ribbons and not one slab.
    const edge = (index: number, side: "top" | "bottom") => {
      const a = mid + from[index] * reach;
      const b = mid + to[index] * reach;
      const air = Math.min(gap, (b - a) / 2);
      return { x: x(index), y: side === "top" ? a + air : b - air };
    };
    const top = totals.map((_total, index) => edge(index, "top"));
    const bottom = totals.map((_total, index) => edge(index, "bottom")).toReversed();
    const tone = RIVER_TONES[Math.min(plain, RIVER_TONES.length - 1)];
    bands.push({
      name: stream.name,
      path: `M${top[0].x.toFixed(1)},${top[0].y.toFixed(1)} ${splineThrough(top)} L${bottom[0].x.toFixed(1)},${bottom[0].y.toFixed(1)} ${splineThrough(bottom)} Z`,
      fill: stream.point ? "" : plain === 0 ? `url(#${id}-first)` : tone,
      point: Boolean(stream.point),
      swatch: stream.point ? "var(--wr-rarity)" : tone,
      share: Math.round((valueAt(stream, length - 1) / Math.max(0.0001, totals[length - 1])) * 100),
    });
    if (!stream.point) plain += 1;
    floor = to;
  }

  const noteStream = note ? streams.findIndex((stream) => stream.point) : -1;
  const noteIndex = note ? Math.min(length - 1, Math.max(0, note.index)) : 0;
  // Where the marked stream's upper edge is at that moment: the dot sits on it.
  const noteY =
    mid +
    (streams
      .slice(0, Math.max(0, noteStream))
      .reduce((sum, stream) => sum + valueAt(stream, noteIndex), -totals[noteIndex] / 2) *
      reach +
      gap);

  return (
    <>
      <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${RIVER_HEIGHT}`} aria-hidden>
        <defs>
          <linearGradient id={`${id}-first`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} />
            <stop offset="1" style={{ stopColor: "var(--wr-l3)" }} />
          </linearGradient>
          <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={WIDTH} y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-30" y="0" width={WIDTH + 60} height={RIVER_HEIGHT}>
            <rect x="-30" y="0" width={WIDTH + 60} height={RIVER_HEIGHT} fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <g data-chart-flow mask={`url(#${id}-mask)`}>
          {bands.map((band) => (
            <path
              key={band.name}
              data-chart-stream
              // The centre line every stream swells out from.
              data-origin={`0 ${mid}`}
              d={band.path}
              fill={band.point ? undefined : band.fill}
              style={
                band.point
                  ? { fill: "var(--wr-rarity)", filter: "drop-shadow(0 0 16px var(--wr-rarity))" }
                  : band.fill.startsWith("var(")
                    ? { fill: band.fill }
                    : undefined
              }
            />
          ))}
        </g>
        {ticks.map((tick, index) => (
          <text
            // oxlint-disable-next-line react/no-array-index-key -- ticks are positional
            key={index}
            data-chart-tick-label
            x={Math.min(WIDTH - 10, Math.max(10, (index / Math.max(1, ticks.length - 1)) * WIDTH))}
            y={RIVER_HEIGHT - 12}
            textAnchor="middle"
            className="wr-chart-label"
            fill="var(--wr-muted)"
          >
            {tick}
          </text>
        ))}
        {note && noteStream !== -1 ? (
          <>
            <Marker x={x(noteIndex)} from={66} to={noteY - 18} />
            <circle
              data-chart-point
              cx={x(noteIndex)}
              cy={noteY}
              r="11"
              strokeWidth="4.5"
              style={{
                fill: "var(--wr-rarity)",
                stroke: "var(--wr-bg)",
                filter: "drop-shadow(0 0 14px var(--wr-rarity))",
              }}
            />
            <Pill x={x(noteIndex)} y={40} text={note.label} tone="rarity" />
          </>
        ) : null}
      </svg>
      <ul className="wr-chart-legend">
        {bands.map((band) => (
          <li key={band.name} data-chart-key data-point={band.point ? "" : undefined}>
            <i style={{ background: band.swatch }} />
            {band.name}
            <b data-share={band.share}>{band.share}%</b>
          </li>
        ))}
      </ul>
    </>
  );
}

const DOT_COLUMNS = 20;
const DOT_ROWS = 5;

/**
 * A share as a hundred dots, filled column by column so it reads as a level rising from the left. The lit ones are the
 * find's color, the last of them glows and carries the count in a pill; the rest stay as dark dots. What the two ends
 * stand for is written under them.
 */
function Dots({ chart }: { chart: Extract<SceneChart, { type: "dots" }> }) {
  const id = useId();
  const pitch = WIDTH / DOT_COLUMNS;
  const top = 104;
  const total = DOT_COLUMNS * DOT_ROWS;
  const share = Math.min(1, Math.max(0, chart.share));
  const lit = share > 0 ? Math.max(1, Math.round(share * total)) : 0;
  const litWidth = Math.ceil(lit / DOT_ROWS) * pitch;
  const lastX = (Math.ceil(lit / DOT_ROWS) - 0.5) * pitch;
  const height = top + DOT_ROWS * pitch + 58;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-lit`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={Math.max(1, litWidth)} y2="0">
          <stop offset="0" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0.45" />
          <stop offset="1" style={{ stopColor: "var(--wr-rarity)" }} />
        </linearGradient>
      </defs>
      {Array.from({ length: total }, (_unused, index) => {
        const column = Math.floor(index / DOT_ROWS);
        const row = index % DOT_ROWS;
        const on = index < lit;
        const cx = column * pitch + pitch / 2;
        const cy = top + (DOT_ROWS - 1 - row) * pitch + pitch / 2;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- dots are positional
          <g key={index}>
            {/* The dark dot stays under a lit one: the hundred stand first, then the share fills in over them. */}
            <circle data-chart-slot cx={cx} cy={cy} r={pitch * 0.37} fill="var(--wr-fg)" opacity="0.07" />
            {on ? (
              <circle
                data-chart-lit
                data-chart-point={index === lit - 1 ? "" : undefined}
                cx={cx}
                cy={cy}
                r={pitch * 0.37}
                fill={`url(#${id}-lit)`}
                style={index === lit - 1 ? { filter: "drop-shadow(0 0 20px var(--wr-rarity))" } : undefined}
              />
            ) : null}
          </g>
        );
      })}
      {lit > 0 ? (
        <>
          <Marker x={lastX} from={66} to={top - 4} />
          <Pill x={lastX} y={40} text={chart.label} tone="rarity" />
        </>
      ) : null}
      <text data-chart-note x="0" y={height - 12} className="wr-chart-label" fill="var(--wr-muted)">
        {chart.from}
      </text>
      <text
        data-chart-note
        x={WIDTH}
        y={height - 12}
        textAnchor="end"
        className="wr-chart-label"
        fill="var(--wr-muted)"
      >
        {chart.to}
      </text>
    </svg>
  );
}

const DUMBBELL_PITCH = 148;
/** How many times over a count grew. Something from nothing beats any ratio. */
const growth = (row: { was: number; now: number }) => (row.was > 0 ? row.now / row.was : row.now > 0 ? Infinity : 0);

/**
 * Then against now, one row per thing counted: a ring where it stood before, a dot where it stands now, and the
 * stretch between them as a comet, faint where it left and bright where it arrived. The number sits over the dot, the
 * old one under the ring, the change in percent at the row's end. One row is the point and takes the find's color.
 * Each row has its own scale, so a small count moves as far as a big one.
 */
function Dumbbell({ chart }: { chart: Extract<SceneChart, { type: "dumbbell" }> }) {
  const id = useId();
  const labels = useLabels();
  const left = 232;
  const right = 786;
  const point =
    chart.point ?? chart.rows.reduce((best, row, index) => (growth(row) > growth(chart.rows[best]) ? index : best), 0);
  const rows = chart.rows.map((row, index) => {
    const max = Math.max(1, row.was, row.now) * 1.15;
    const at = (value: number) => left + (value / max) * (right - left);
    const up = row.now >= row.was;
    const lit = index === point;
    return {
      ...row,
      index,
      up,
      lit,
      y: 72 + index * DUMBBELL_PITCH,
      from: at(row.was),
      to: at(row.now),
      color: lit ? "var(--wr-rarity)" : up ? "var(--wr-l4)" : "var(--wr-fg)",
      delta:
        row.was > 0
          ? `${up ? "+" : ""}${Math.round(((row.now - row.was) / row.was) * 100)}%`
          : row.now > 0
            ? labels.charts.new
            : "",
    };
  });
  const height = 72 + (rows.length - 1) * DUMBBELL_PITCH + 72;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden>
      <defs>
        {rows.map((row) => (
          <linearGradient
            key={row.label}
            id={`${id}-${row.index}`}
            gradientUnits="userSpaceOnUse"
            x1={row.from}
            y1="0"
            x2={row.to}
            y2="0"
          >
            <stop offset="0" style={{ stopColor: row.color }} stopOpacity={row.up ? 0.12 : 0.08} />
            <stop offset="1" style={{ stopColor: row.color }} stopOpacity={row.up ? 0.95 : 0.4} />
          </linearGradient>
        ))}
      </defs>
      {rows.map((row) => (
        // What the entrance needs to know about the row: where its track starts, where last year ended (the point
        // everything grows out of), and how far this year's dot travels from there.
        <g
          key={row.label}
          data-chart-row
          data-track={`${left} ${row.y}`}
          data-origin={`${row.from} ${row.y}`}
          data-travel={row.from - row.to}
          data-was={row.was}
          data-now={row.now}
        >
          <text data-chart-row-label x="0" y={row.y + 9} className="wr-chart-label" fill="var(--wr-muted)">
            {row.label}
          </text>
          <line
            data-chart-track
            x1={left}
            x2={right}
            y1={row.y}
            y2={row.y}
            stroke="var(--wr-fg)"
            strokeOpacity="0.07"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* A gradient along a perfectly level line has no box to span; a hair of slope gives it one. */}
          <line
            data-chart-stretch
            x1={row.from}
            x2={row.to}
            y1={row.y}
            y2={row.y + 0.01}
            stroke={`url(#${id}-${row.index})`}
            strokeWidth="21"
            strokeLinecap="round"
          />
          <g data-chart-then>
            <circle
              cx={row.from}
              cy={row.y}
              r="14"
              strokeWidth="4.5"
              strokeOpacity="0.45"
              style={{ fill: "var(--wr-bg)", stroke: "var(--wr-fg)" }}
            />
            <text x={row.from} y={row.y + 52} textAnchor="middle" className="wr-chart-value" fill="var(--wr-muted)">
              {fmt(row.was)}
            </text>
          </g>
          <g data-chart-now>
            <circle
              data-chart-now-dot
              cx={row.to}
              cy={row.y}
              r="20"
              style={{
                fill: row.up ? row.color : "var(--wr-muted)",
                filter: row.lit
                  ? "drop-shadow(0 0 22px var(--wr-rarity))"
                  : row.up
                    ? "drop-shadow(0 0 12px var(--wr-l3))"
                    : undefined,
              }}
            />
            <text
              data-chart-now-figure
              x={row.to}
              y={row.y - 36}
              textAnchor="middle"
              className="wr-chart-figure"
              fill="var(--wr-fg)"
            >
              {fmt(row.now)}
            </text>
          </g>
          <text
            data-chart-delta
            x={WIDTH}
            y={row.y + 9}
            textAnchor="end"
            className="wr-chart-label"
            style={{ fill: row.lit ? "var(--wr-rarity)" : row.up ? "var(--wr-l4)" : "var(--wr-muted)" }}
          >
            {row.delta}
          </text>
        </g>
      ))}
    </svg>
  );
}

const BUBBLES_MAX_HEIGHT = 660;
const BUBBLES_MAIN_RADIUS = 230;

/**
 * Where each disc sits, in units of the biggest one's radius: the biggest in the middle, the rest packed around it so
 * each almost touches it and its neighbour, and none overlap. The second sits up and to the right; the others chain
 * off it, one above and the rest below.
 */
export function packBubbles(shares: readonly number[]): { x: number; y: number; radius: number }[] {
  const top = Math.max(0.0001, shares[0] ?? 0);
  const radius = shares.map((share) => Math.sqrt(Math.max(0.0001, share) / top));
  const gap = 0.02;
  const reach = (index: number) => 1 + radius[index] + gap;
  // How far round the middle disc two neighbours must be apart to almost touch each other.
  const step = (a: number, b: number) =>
    Math.acos(
      Math.min(
        1,
        Math.max(-1, (reach(a) ** 2 + reach(b) ** 2 - (radius[a] + radius[b] + gap) ** 2) / (2 * reach(a) * reach(b))),
      ),
    );
  const start = (-20 * Math.PI) / 180;
  const angles = [0, start];
  if (shares.length > 2) angles[2] = start - step(1, 2);
  for (let index = 3; index < shares.length; index += 1) {
    const before = index === 3 ? 1 : index - 1;
    angles[index] = angles[before] + step(before, index);
  }
  return shares.map((_share, index) =>
    index === 0
      ? { x: 0, y: 0, radius: 1 }
      : { x: reach(index) * Math.cos(angles[index]), y: reach(index) * Math.sin(angles[index]), radius: radius[index] },
  );
}

/**
 * Parts of a whole as a few big flat discs. Area is the share, the share is the big number, the name sits under it.
 * Color steps down the graph's own scale with size and the biggest takes the find's color; each disc fades top to
 * bottom into the next tone down. They almost touch and never overlap.
 */
function Bubbles({ chart }: { chart: Extract<SceneChart, { type: "bubbles" }> }) {
  const id = useId();
  // Biggest first, whatever order they came in: the layout is built around the biggest.
  const parts = chart.parts
    .filter((part) => part.share > 0)
    .toSorted((a, b) => b.share - a.share)
    .slice(0, 5);
  if (parts.length === 0) return null;
  const packed = packBubbles(parts.map((part) => part.share));
  const bounds = packed.reduce(
    (box, disc) => ({
      left: Math.min(box.left, disc.x - disc.radius),
      right: Math.max(box.right, disc.x + disc.radius),
      top: Math.min(box.top, disc.y - disc.radius),
      bottom: Math.max(box.bottom, disc.y + disc.radius),
    }),
    { left: 0, right: 0, top: 0, bottom: 0 },
  );
  const scale = Math.min(
    BUBBLES_MAIN_RADIUS,
    WIDTH / (bounds.right - bounds.left),
    BUBBLES_MAX_HEIGHT / (bounds.bottom - bounds.top),
  );
  const height = (bounds.bottom - bounds.top) * scale;
  const offsetX = (WIDTH - (bounds.right - bounds.left) * scale) / 2 - bounds.left * scale;
  const offsetY = -bounds.top * scale;
  const top = parts[0].share;
  // The tone a disc gets from its size against the biggest: the graph's levels, brightest for the nearly-as-big.
  const toneOf = (share: number, index: number) =>
    index === 0 ? "top" : share / top >= 0.3 ? "4" : share / top >= 0.15 ? "3" : "2";

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${height.toFixed(1)}`} aria-hidden>
      <defs>
        {(
          [
            ["top", "var(--wr-rarity)", "var(--wr-l4)"],
            ["4", "var(--wr-l4)", "var(--wr-l3)"],
            ["3", "var(--wr-l3)", "var(--wr-l2)"],
            ["2", "var(--wr-l2)", "var(--wr-l1)"],
          ] as const
        ).map(([tone, from, to]) => (
          <linearGradient key={tone} id={`${id}-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: from }} />
            <stop offset="1" style={{ stopColor: to }} />
          </linearGradient>
        ))}
      </defs>
      {parts.map((part, index) => {
        const disc = packed[index];
        const cx = disc.x * scale + offsetX;
        const cy = disc.y * scale + offsetY;
        const radius = disc.radius * scale;
        const tone = toneOf(part.share, index);
        const ink = tone === "2" ? "var(--wr-fg)" : "var(--wr-bg)";
        const figure = index === 0 ? Math.min(84, radius * 0.38) : Math.max(26, radius * 0.34);
        const nameSize = index === 0 ? 27 : Math.max(18, Math.min(24, radius * 0.19));
        // A name that would not fit across its disc is cut short; on a disc too small for two lines it is left out.
        const room = Math.floor((radius * 1.66) / (nameSize * 0.56));
        const name = part.name.length > room ? `${part.name.slice(0, Math.max(1, room - 1))}…` : part.name;
        const named = radius >= 54;
        const baseline = cy + figure * (named ? 0.2 : 0.36);
        return (
          <g
            key={part.name}
            data-chart-disc
            data-origin={`${cx.toFixed(1)} ${cy.toFixed(1)}`}
            // Where the biggest disc's middle is from here: the others bud out of it.
            data-from={`${(packed[0].x * scale + offsetX - cx).toFixed(1)} ${(packed[0].y * scale + offsetY - cy).toFixed(1)}`}
          >
            <circle cx={cx} cy={cy} r={radius} fill={`url(#${id}-${tone})`} />
            {radius >= 30 ? (
              <text
                data-share={Math.round(part.share)}
                x={cx}
                y={baseline}
                textAnchor="middle"
                className="wr-chart-bubble"
                style={{ fill: ink, fontSize: figure, letterSpacing: index === 0 ? "-0.04em" : "-0.02em" }}
              >
                {Math.round(part.share)}%
              </text>
            ) : null}
            {named ? (
              <text
                data-chart-disc-name
                x={cx}
                y={baseline + (index === 0 ? 44 : Math.max(24, figure * 0.64))}
                textAnchor="middle"
                className="wr-chart-bubble-name"
                opacity="0.72"
                style={{ fill: ink, fontSize: nameSize }}
              >
                {name}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * One month up close: a cell per day under the weekday it fell on, lit by how much happened and saying its number.
 * The cells outside the month stay as dark slots, so the month sits in a full grid. The biggest day is the find's
 * color.
 */
function Month({ chart }: { chart: Extract<SceneChart, { type: "month" }> }) {
  const gap = 12;
  const cellWidth = (WIDTH - gap * 6) / 7;
  const cellHeight = 88;
  const top = 50;
  const lead = Math.min(6, Math.max(0, chart.lead));
  const rows = Math.ceil((lead + chart.days.length) / 7);
  const max = Math.max(1, ...chart.days);
  const peak = chart.days.indexOf(Math.max(...chart.days));
  const labels = useLabels();

  return (
    <svg
      className="wr-chart-svg"
      viewBox={`0 0 ${WIDTH} ${top + rows * (cellHeight + gap) - gap}`}
      data-rows={rows}
      aria-hidden
    >
      {Array.from({ length: 7 }, (_unused, column) => (
        <text
          // oxlint-disable-next-line react/no-array-index-key -- weekdays are positional
          key={column}
          data-chart-head
          x={column * (cellWidth + gap) + cellWidth / 2}
          y="24"
          textAnchor="middle"
          className="wr-chart-label"
          fill="var(--wr-muted)"
        >
          {labels.charts.weekdayLetter(column)}
        </text>
      ))}
      {Array.from({ length: rows * 7 }, (_unused, index) => {
        const day = index - lead;
        const x = (index % 7) * (cellWidth + gap);
        const y = top + Math.floor(index / 7) * (cellHeight + gap);
        if (day < 0 || day >= chart.days.length) {
          return (
            // oxlint-disable-next-line react/no-array-index-key -- cells are positional
            <rect
              key={index}
              data-chart-cell
              x={x}
              y={y}
              width={cellWidth}
              height={cellHeight}
              rx="21"
              fill="var(--wr-fg)"
              opacity="0.045"
            />
          );
        }
        const value = chart.days[day];
        const lit = day === peak && value > 0;
        const level = levelOf(value, max);
        return (
          // oxlint-disable-next-line react/no-array-index-key -- cells are positional
          <g key={index} data-chart-cell data-chart-point={lit ? "" : undefined}>
            <rect
              x={x}
              y={y}
              width={cellWidth}
              height={cellHeight}
              rx="21"
              style={{
                fill: lit ? "var(--wr-rarity)" : `var(--wr-l${level})`,
                filter: lit ? "drop-shadow(0 0 22px var(--wr-rarity))" : undefined,
              }}
            />
            <text
              x={x + cellWidth / 2}
              y={y + cellHeight / 2 + 11}
              textAnchor="middle"
              className="wr-chart-figure"
              opacity={value > 0 ? 1 : 0.5}
              style={{ fill: lit || level > 2 ? "var(--wr-bg)" : "var(--wr-fg)" }}
            >
              {cellCount(value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const RADAR_HEIGHT = 640;
const unit = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A year as one outline: an axis per thing measured, on a grid of nested polygons. The shape is a lit plate with a
 * fine bright edge and a solid dot on every peak, in the line's own color with a soft shadow. The axis it reaches
 * furthest on is turned to the top, takes the find's color and carries the note. When every axis says where everyone
 * else stands, that shape lies underneath as a pale plate.
 */
function Radar({ chart }: { chart: Extract<SceneChart, { type: "radar" }> }) {
  const id = useId();
  const count = chart.axes.length;
  if (count < 3) return null;
  // The strongest axis goes to twelve o'clock, where the note is.
  const strongest = chart.axes.reduce((best, axis, index) => (axis.value > chart.axes[best].value ? index : best), 0);
  const axes = [...chart.axes.slice(strongest), ...chart.axes.slice(0, strongest)];
  const cx = WIDTH / 2;
  const cy = 336;
  const reach = 240;
  const at = (index: number, share: number) => {
    const angle = ((index * 360) / count - 90) * (Math.PI / 180);
    return { x: cx + reach * share * Math.cos(angle), y: cy + reach * share * Math.sin(angle) };
  };
  const polygon = (shares: readonly number[]) =>
    shares
      .map((share, index) => {
        const point = at(index, share);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      })
      .join(" ");
  // A dot needs a little reach to be a peak at all.
  const you = axes.map((axis) => Math.max(0.06, unit(axis.value)));
  const everyone = axes.every((axis) => axis.everyone !== undefined)
    ? axes.map((axis) => unit(axis.everyone ?? 0))
    : null;
  const tip = at(0, you[0]);

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${RADAR_HEIGHT}`} aria-hidden>
      <defs>
        <radialGradient id={`${id}-fill`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={reach}>
          <stop offset="0" style={{ stopColor: "var(--wr-l3)" }} stopOpacity="0.12" />
          <stop offset="1" style={{ stopColor: "var(--wr-l4)" }} stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`${id}-tip`} gradientUnits="userSpaceOnUse" cx={tip.x} cy={tip.y} r="200">
          <stop offset="0" style={{ stopColor: "var(--wr-rarity)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0.45" />
          <stop offset="1" style={{ stopColor: "var(--wr-rarity)" }} stopOpacity="0" />
        </radialGradient>
      </defs>
      {[1, 0.66, 0.33].map((share, ring) => (
        <polygon
          key={share}
          data-chart-grid
          data-origin={`${cx} ${cy}`}
          points={polygon(axes.map(() => share))}
          fill="var(--wr-fg)"
          fillOpacity={ring === 0 ? 0.045 : 0.03}
          stroke="var(--wr-fg)"
          strokeOpacity={ring === 0 ? 0.16 : 0.08}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ))}
      {axes.map((axis, index) => {
        const end = at(index, 1);
        return (
          <line
            key={axis.label}
            data-chart-axis
            data-origin={`${cx} ${cy}`}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="var(--wr-fg)"
            strokeOpacity="0.07"
            strokeWidth="2.5"
          />
        );
      })}
      {everyone ? (
        <polygon
          data-chart-everyone
          data-origin={`${cx} ${cy}`}
          points={polygon(everyone)}
          fill="var(--wr-fg)"
          fillOpacity="0.1"
          stroke="var(--wr-fg)"
          strokeOpacity="0.22"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : null}
      <g data-chart-plate data-origin={`${cx} ${cy}`}>
        <polygon points={polygon(you)} fill={`url(#${id}-fill)`} />
        <polygon points={polygon(you)} fill={`url(#${id}-tip)`} opacity="0.55" />
        {you.map((share, index) => {
          const end = at(index, share);
          return (
            <line
              // oxlint-disable-next-line react/no-array-index-key -- axes are positional
              key={index}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              strokeOpacity="0.22"
              strokeWidth="2"
              style={{ stroke: "var(--wr-l4)" }}
            />
          );
        })}
        <polygon
          points={polygon(you)}
          fill="none"
          strokeWidth="4"
          strokeLinejoin="round"
          style={{ stroke: "var(--wr-l4)", filter: "drop-shadow(0 0 12px var(--wr-l4))" }}
        />
        <polygon points={polygon(you)} fill="none" stroke={`url(#${id}-tip)`} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {/* The peaks are their own layer: the outline unfurls first, then a dot lands on each corner. */}
      <g>
        {you.map((share, index) => {
          const peak = at(index, share);
          const top = index === 0;
          const color = top ? "var(--wr-rarity)" : "var(--wr-l4)";
          return (
            <circle
              // oxlint-disable-next-line react/no-array-index-key -- axes are positional
              key={index}
              data-chart-peak
              data-chart-point={top ? "" : undefined}
              cx={peak.x}
              cy={peak.y}
              r={top ? 11.5 : 8.5}
              style={{ fill: color, filter: `drop-shadow(0 0 ${top ? 20 : 14}px ${color})` }}
            />
          );
        })}
      </g>
      {axes.map((axis, index) => {
        // The note stands where the strongest axis would be named.
        if (index === 0) return null;
        const point = at(index, 1.18);
        const anchor = Math.abs(point.x - cx) < 14 ? "middle" : point.x > cx ? "start" : "end";
        return (
          <text
            key={axis.label}
            data-chart-axis-label
            x={point.x + (anchor === "start" ? -12 : anchor === "end" ? 12 : 0)}
            y={point.y + 9}
            textAnchor={anchor}
            className="wr-chart-label"
            fill="var(--wr-muted)"
          >
            {axis.label}
          </text>
        );
      })}
      <Marker x={tip.x} from={66} to={tip.y - 14} />
      <Pill x={tip.x} y={40} text={chart.note} tone="rarity" />
    </svg>
  );
}

const STANDING_HEIGHT = 520;

/**
 * Where one stands among many: a row of slim bars for how many people sit at each step from least to most. Everyone
 * behind is lit, everyone ahead is left grey, and the bar one stands on is the find's color with its note in a pill.
 * Every bar keeps its unlit slot. What the two ends mean is written under them.
 */
function Standing({ chart }: { chart: Extract<SceneChart, { type: "standing" }> }) {
  const id = useId();
  const { bars } = chart;
  const gap = bars.length > 34 ? 8 : 12;
  const width = (WIDTH - gap * (bars.length - 1)) / bars.length;
  const top = 106;
  const base = STANDING_HEIGHT - 60;
  const max = Math.max(1, ...bars);
  const at = Math.min(bars.length - 1, Math.max(0, chart.at));
  const x = at * (width + gap) + width / 2;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${STANDING_HEIGHT}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-bar`} gradientUnits="userSpaceOnUse" x1="0" y1={top} x2="0" y2={base}>
          <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} />
          <stop offset="0.6" style={{ stopColor: "var(--wr-l3)" }} />
          <stop offset="1" style={{ stopColor: "var(--wr-l2)" }} />
        </linearGradient>
      </defs>
      {bars.map((value, index) => {
        const height = Math.max(width, (value / max) * (base - top));
        const on = index === at;
        const behind = index < at;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- bars are positional
          <g key={index}>
            <rect
              x={index * (width + gap)}
              y={top}
              width={width}
              height={base - top}
              rx={width / 2}
              fill="var(--wr-fg)"
              opacity="0.045"
            />
            <rect
              data-chart-bar
              x={index * (width + gap)}
              y={base - height}
              width={width}
              height={height}
              rx={width / 2}
              fill={on ? undefined : behind ? `url(#${id}-bar)` : "var(--wr-fg)"}
              opacity={on ? 1 : behind ? 0.9 : 0.16}
              style={on ? { fill: "var(--wr-rarity)", filter: "drop-shadow(0 0 20px var(--wr-rarity))" } : undefined}
            />
          </g>
        );
      })}
      <Marker x={x} from={66} to={top - 6} />
      <Pill x={x} y={40} text={chart.label} tone="rarity" />
      <text data-chart-note x="0" y={STANDING_HEIGHT - 12} className="wr-chart-label" fill="var(--wr-muted)">
        {chart.from}
      </text>
      <text
        data-chart-note
        x={WIDTH}
        y={STANDING_HEIGHT - 12}
        textAnchor="end"
        className="wr-chart-label"
        fill="var(--wr-muted)"
      >
        {chart.to}
      </text>
    </svg>
  );
}

/**
 * Two things that pull against each other, period by period: one grows up from a centre line, the other down from it.
 * What rose is the year's own color, what fell is the frame's quiet ink, and one period can be the point: lit in the
 * find's color with its note in a pill underneath. Both totals are written above, each over its own side.
 */
function Mirror({ chart }: { chart: Extract<SceneChart, { type: "mirror" }> }) {
  const id = useId();
  const { pairs, mark } = chart;
  const gap = pairs.length > 30 ? 8 : 14;
  const width = (WIDTH - gap * (pairs.length - 1)) / pairs.length;
  const corner = Math.min(14, width * 0.4);
  const mid = 292;
  const up = 190;
  const down = 160;
  const maxUp = Math.max(1, ...pairs.map((pair) => pair.up));
  const maxDown = Math.max(1, ...pairs.map((pair) => pair.down));
  const marked = mark ? Math.min(pairs.length - 1, Math.max(0, mark.index)) : -1;
  const height = mid + down + (mark ? 104 : 12);
  const markX = marked * (width + gap) + width / 2;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-up`} gradientUnits="userSpaceOnUse" x1="0" y1={mid - up} x2="0" y2={mid}>
          <stop offset="0" style={{ stopColor: "var(--wr-l4)" }} />
          <stop offset="1" style={{ stopColor: "var(--wr-l2)" }} />
        </linearGradient>
        <linearGradient id={`${id}-down`} gradientUnits="userSpaceOnUse" x1="0" y1={mid} x2="0" y2={mid + down}>
          <stop offset="0" style={{ stopColor: "var(--wr-fg)" }} stopOpacity="0.16" />
          <stop offset="1" style={{ stopColor: "var(--wr-fg)" }} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <text data-chart-note x="0" y="46" className="wr-chart-label" style={{ fill: "var(--wr-l4)" }}>
        {chart.up}
      </text>
      <text data-chart-note x={WIDTH} y="46" textAnchor="end" className="wr-chart-label" fill="var(--wr-muted)">
        {chart.down}
      </text>
      {pairs.map((pair, index) => {
        const x = index * (width + gap);
        // Square-root heights: beside the one period that dwarfs the rest, an ordinary one is still a bar.
        const rise = pair.up > 0 ? Math.max(corner * 2, Math.sqrt(pair.up / maxUp) * up) : 0;
        const fall = pair.down > 0 ? Math.max(corner * 2, Math.sqrt(pair.down / maxDown) * down) : 0;
        const on = index === marked;
        return (
          // oxlint-disable-next-line react/no-array-index-key -- periods are positional
          <g key={index}>
            <rect x={x} y={mid - up} width={width} height={up + down} rx={corner} fill="var(--wr-fg)" opacity="0.04" />
            {rise > 0 ? (
              <rect
                data-chart-bar
                x={x}
                y={mid - rise - 4}
                width={width}
                height={rise}
                rx={corner}
                fill={`url(#${id}-up)`}
              />
            ) : null}
            {fall > 0 ? (
              <rect
                data-chart-fall
                x={x}
                y={mid + 4}
                width={width}
                height={fall}
                rx={corner}
                fill={on ? undefined : `url(#${id}-down)`}
                style={on ? { fill: "var(--wr-rarity)", filter: "drop-shadow(0 0 20px var(--wr-rarity))" } : undefined}
              />
            ) : null}
          </g>
        );
      })}
      {mark && marked !== -1 ? (
        <>
          <Marker x={markX} from={mid + down + 14} to={mid + down + 40} />
          <Pill x={markX} y={mid + down + 68} text={mark.label} tone="rarity" />
        </>
      ) : null}
    </svg>
  );
}

/**
 * A week by the hour: seven rows, Monday first, twenty-four cells each, lit on the graph's own scale by how much
 * happened in that hour of that weekday. The busiest cell is the find's color and names its slot in a pill.
 */
function Hours({ chart }: { chart: Extract<SceneChart, { type: "hours" }> }) {
  const labels = useLabels();
  const left = 46;
  const gap = 6;
  const cellWidth = (WIDTH - left - gap * 23) / 24;
  const cellHeight = 46;
  const top = 86;
  const rows = Array.from({ length: 7 }, (_unused, row) =>
    Array.from({ length: 24 }, (_cell, hour) => Math.max(0, chart.rows[row]?.[hour] ?? 0)),
  );
  const max = Math.max(1, ...rows.flat());
  const busiest = rows.reduce(
    (found, row, day) =>
      row.reduce((inner, value, hour) => (value > inner.value ? { day, hour, value } : inner), found),
    { day: 0, hour: 0, value: 0 },
  );
  const marked = chart.mark
    ? { day: Math.min(6, Math.max(0, chart.mark.day)), hour: Math.min(23, Math.max(0, chart.mark.hour)) }
    : null;
  const best = marked ? { ...marked, value: rows[marked.day][marked.hour] } : busiest;
  const bottom = top + 7 * (cellHeight + gap) - gap;
  const pillX = left + best.hour * (cellWidth + gap) + cellWidth / 2;

  return (
    <svg className="wr-chart-svg" viewBox={`0 0 ${WIDTH} ${bottom + 48}`} aria-hidden>
      {rows.map((row, day) => (
        // oxlint-disable-next-line react/no-array-index-key -- weekdays are positional
        <g key={day}>
          <text
            data-chart-head
            x="12"
            y={top + day * (cellHeight + gap) + cellHeight / 2 + 9}
            textAnchor="middle"
            className="wr-chart-label"
            fill="var(--wr-muted)"
          >
            {labels.charts.weekdayLetter(day)}
          </text>
          {row.map((value, hour) => {
            const lit = best.value > 0 && day === best.day && hour === best.hour;
            const level = levelOf(value, max);
            return (
              <rect
                // oxlint-disable-next-line react/no-array-index-key -- hours are positional
                key={hour}
                data-chart-slot={level > 0 ? undefined : ""}
                data-chart-cell={level > 0 ? "" : undefined}
                data-chart-point={lit ? "" : undefined}
                data-day={day}
                data-hour={hour}
                x={left + hour * (cellWidth + gap)}
                y={top + day * (cellHeight + gap)}
                width={cellWidth}
                height={cellHeight}
                rx="9"
                opacity={lit || level > 0 ? 1 : 0.055}
                style={{
                  fill: lit ? "var(--wr-rarity)" : level > 0 ? `var(--wr-l${level})` : "var(--wr-fg)",
                  filter: lit ? "drop-shadow(0 0 18px var(--wr-rarity))" : undefined,
                }}
              />
            );
          })}
        </g>
      ))}
      {[0, 6, 12, 18].map((hour) => (
        <text
          key={hour}
          data-chart-tick-label
          x={left + hour * (cellWidth + gap)}
          y={bottom + 38}
          className="wr-chart-label"
          fill="var(--wr-muted)"
        >
          {labels.charts.hour(hour)}
        </text>
      ))}
      {best.value > 0 ? (
        <>
          <Marker x={pillX} from={66} to={top - 8} />
          <Pill
            x={pillX}
            y={40}
            text={labels.charts.weekdayHour(labels.charts.weekday(best.day), labels.charts.hour(best.hour))}
            tone="rarity"
          />
        </>
      ) : null}
    </svg>
  );
}

/** A generated scene's chart. What it shows is said by the scene's description, never by a caption under it. */
export function Chart({ chart }: { chart: SceneChart }) {
  return (
    <figure className="wr-chart" data-chart={chart.type}>
      {chart.type === "spark" ? <Spark chart={chart} /> : null}
      {chart.type === "bars" ? <Bars chart={chart} /> : null}
      {chart.type === "funnel" ? <Funnel chart={chart} /> : null}
      {chart.type === "ticks" ? <Ticks chart={chart} /> : null}
      {chart.type === "rings" ? <Rings chart={chart} /> : null}
      {chart.type === "donut" ? <Donut chart={chart} /> : null}
      {chart.type === "days" ? <Days chart={chart} /> : null}
      {chart.type === "gauge" ? <Gauge chart={chart} /> : null}
      {chart.type === "meter" ? <Meter chart={chart} /> : null}
      {chart.type === "pixels" ? <Pixels chart={chart} /> : null}
      {chart.type === "wheel" ? <Wheel chart={chart} /> : null}
      {chart.type === "clock" ? <Clock chart={chart} /> : null}
      {chart.type === "river" ? <River chart={chart} /> : null}
      {chart.type === "dots" ? <Dots chart={chart} /> : null}
      {chart.type === "dumbbell" ? <Dumbbell chart={chart} /> : null}
      {chart.type === "bubbles" ? <Bubbles chart={chart} /> : null}
      {chart.type === "month" ? <Month chart={chart} /> : null}
      {chart.type === "radar" ? <Radar chart={chart} /> : null}
      {chart.type === "standing" ? <Standing chart={chart} /> : null}
      {chart.type === "mirror" ? <Mirror chart={chart} /> : null}
      {chart.type === "hours" ? <Hours chart={chart} /> : null}
    </figure>
  );
}

/** Each chart's entrance, placed on the scene's timeline at `at`. */
export function animateChart(tl: gsap.core.Timeline, root: HTMLElement, at: number) {
  const figure = root.querySelector<HTMLElement>(".wr-chart");
  if (!figure) return;
  // A chart with a choreography of its own plays that; the rest share the moves below.
  const own = CHART_ENTRANCES[figure.dataset.chart ?? ""];
  if (own) {
    own(tl, figure, at);
    restIn(tl, figure, at);
    return;
  }
  const all = (selector: string) => figure.querySelectorAll<SVGElement | HTMLElement>(selector);
  // A chart is made of a few of the pieces below, never all of them. A move with nothing to move is left out: handed
  // to GSAP it would still take up time on the timeline, and be warned about in the console once per piece.
  const moves = {
    from: (pieces: NodeListOf<Element>, vars: gsap.TweenVars, position: number) => {
      if (pieces.length > 0) tl.from(pieces, vars, position);
    },
    to: (pieces: NodeListOf<Element>, vars: gsap.TweenVars, position: number) => {
      if (pieces.length > 0) tl.to(pieces, vars, position);
    },
  };

  moves.from(
    all("[data-chart-band]"),
    { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: EASE_OUT },
    at + 0.3,
  );
  // A pulse grows out from its centre line; columns rise from the floor.
  moves.from(
    all("[data-chart-tick]"),
    {
      scaleY: 0,
      transformOrigin: "50% 50%",
      duration: 0.45,
      ease: "back.out(2)",
      stagger: { amount: 0.9, from: "start" },
    },
    at,
  );
  moves.from(
    all("[data-chart-bar]"),
    { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "back.out(1.6)", stagger: 0.05 },
    at,
  );
  // What falls from a centre line grows downwards from it.
  moves.from(
    all("[data-chart-fall]"),
    { scaleY: 0, transformOrigin: "50% 0%", duration: 0.7, ease: "back.out(1.6)", stagger: 0.05 },
    at + 0.15,
  );
  // Discs and outlines swell from their own middle, or from the point they are drawn around.
  for (const [index, pop] of [...all("[data-chart-pop]")].entries()) {
    const origin = pop.dataset.origin;
    tl.from(
      pop,
      {
        scale: 0,
        autoAlpha: 0,
        duration: 0.7,
        ease: "back.out(1.5)",
        ...(origin ? { svgOrigin: origin } : { transformOrigin: "50% 50%" }),
      },
      at + index * 0.1,
    );
  }
  // A dial or a wheel lights up segment by segment; a meter's pills stand up along the row.
  moves.from(
    all("[data-chart-seg]"),
    { autoAlpha: 0, duration: 0.3, ease: "power1.out", stagger: { amount: 0.8, from: "start" } },
    at,
  );
  moves.from(
    all("[data-chart-pill]"),
    {
      scaleY: 0,
      transformOrigin: "50% 100%",
      duration: 0.5,
      ease: "back.out(1.8)",
      stagger: { amount: 0.9, from: "start" },
    },
    at,
  );
  // Drawn left to right in one stroke, the way a funnel is read.
  moves.from(all("[data-chart-glow]"), { autoAlpha: 0, duration: 1.2, ease: "power1.out" }, at);
  // Clipped from the scene's first frame, not from this tween's start: left to render late, the whole chart stood
  // there while the title came in, vanished, and was drawn again.
  const wiped = all("[data-chart-wipe]");
  if (wiped.length > 0) {
    tl.fromTo(
      wiped,
      { clipPath: "inset(0% 100% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power2.inOut" },
      at,
    );
  }
  for (const [index, ring] of [...all("[data-chart-ring]")].entries()) {
    const length = Number(ring.dataset.length ?? 0);
    const start = at + index * 0.14;
    // Out of sight until it is drawn: a stroke of no length with round ends is still a dot, and it sat there from
    // the scene's first frame.
    tl.from(ring, { autoAlpha: 0, duration: 0.1, ease: "none" }, start);
    tl.from(ring, { strokeDasharray: `0 ${length}`, duration: 1.2, ease: "power2.inOut" }, start);
  }
  moves.from(all(".wr-chart-day"), { y: 30, autoAlpha: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.05 }, at);
  moves.to(
    all(".wr-chart-day[data-marked]"),
    {
      keyframes: [
        { scale: 1.12, duration: 0.18 },
        { scale: 1, duration: 0.3 },
      ],
      stagger: 0.12,
    },
    at + 1.1,
  );
  notesIn(tl, figure, at);
  restIn(tl, figure, at);
}
