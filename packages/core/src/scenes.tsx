import { gsap } from "gsap";
import type { CSSProperties } from "react";

import { animateChart, Chart, type SceneChart } from "./charts";
import {
  countUp,
  defineScene,
  EASE_OUT,
  headingLines,
  hold,
  Lines,
  linesIn,
  linesField,
  rich,
  riseIn,
  textField,
} from "./motion";
import { countText, numberInk } from "./number-ink";
import { RARITY_LABELS, type Rarity } from "./rarity";

/*
 * The scene library. Every source builds its video from these: a source only
 * decides what each scene says. Scenes take a `variant` where a second layout
 * or motion keeps two videos from looking alike; the director picks it with
 * the seeded source.
 */

/* ---------- shared pieces ---------- */

/** A year as GitHub draws it: columns of seven, starting on a Sunday. Levels are 0 to 4, -1 is an empty slot. */
export interface CalendarLevels {
  levels: readonly number[];
  /** Empty slots before the first day, so the first column lines up with its weekday. */
  lead: number;
  /** Month labels across the top, when the scene wants them. */
  months?: readonly string[];
}

function Calendar({ calendar, months = false }: { calendar: CalendarLevels; months?: boolean }) {
  return (
    <div className="wr-frame">
      {months && calendar.months ? (
        <div className="wr-months">
          {calendar.months.map((month, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- a month name repeats across a year boundary
            <span key={`${month}-${index}`}>{month}</span>
          ))}
        </div>
      ) : null}
      <div className="wr-graph">
        {Array.from({ length: calendar.lead }, (_unused, index) => (
          <i key={`lead-${index}`} className="wr-cell" data-l="-1" />
        ))}
        {calendar.levels.map((level, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- one cell per day, positional
          <i key={index} className="wr-cell" data-l={level} />
        ))}
      </div>
    </div>
  );
}

/** 9x9 pixel art: "x" lit, "o" half lit, "." off. */
export type PixelArt = readonly string[];

/** Something a person pulled, as the share card shows it. */
export interface WrappedToken {
  name: string;
  /** "Coder type", "Lucky drop". */
  kind: string;
  rarity: Rarity;
  art: PixelArt;
}

export function Pixel({ art, className = "wr-pixel" }: { art: PixelArt; className?: string }) {
  return (
    <div className={className}>
      {art
        .join("")
        .split("")
        .map((char, index) => (
          // oxlint-disable-next-line react/no-array-index-key -- a fixed 9x9 grid
          <i key={index} data-on={char === "x" ? 2 : char === "o" ? 1 : 0} />
        ))}
    </div>
  );
}

const cellsOf = (root: HTMLElement, selector = ".wr-graph .wr-cell") => root.querySelectorAll(selector);

/* ---------- opening ---------- */

export const openingScene = defineScene<{
  title: string;
  period: string;
  calendar: CalendarLevels;
  variant: number;
}>({
  fields: [textField("title", "Headline"), textField("period", "Line under it")],
  align: "center",
  render: ({ title, period, calendar }) => (
    <>
      <div style={{ marginBottom: 70 }}>
        <Calendar calendar={calendar} />
      </div>
      <Lines lines={headingLines(title)} />
      <p className="wr-lede" style={{ marginTop: 30 }}>
        {rich(period)}
      </p>
    </>
  ),
  animate: ({ root }, { variant }) => {
    const tl = gsap.timeline();
    const cells = cellsOf(root);
    const frame = root.querySelector(".wr-frame");
    if (variant === 0) {
      // Cells fly in from everywhere and settle into the year.
      tl.from(cells, {
        scale: 0,
        autoAlpha: 0,
        x: () => gsap.utils.random(-420, 420),
        y: () => gsap.utils.random(-640, 640),
        rotate: () => gsap.utils.random(-90, 90),
        duration: 1.3,
        ease: EASE_OUT,
        stagger: { amount: 0.9, grid: "auto", from: "random" },
      });
      tl.from(frame, { scale: 0.85, duration: 1.6, ease: EASE_OUT }, 0);
    } else {
      // The year types itself out, week by week, like a ticker.
      tl.from(frame, { autoAlpha: 0, y: 40, duration: 0.8, ease: EASE_OUT });
      tl.from(
        cells,
        {
          autoAlpha: 0,
          scale: 0.2,
          duration: 0.25,
          ease: "power2.out",
          stagger: { amount: 1.2, grid: "auto", axis: "x", from: "start" },
        },
        0.1,
      );
    }
    linesIn(tl, root, { at: 0.9, stagger: 0.12 });
    riseIn(tl, root.querySelector(".wr-lede"), { at: 1.3 });
    tl.to(
      cells,
      {
        keyframes: [
          { scale: 1.35, duration: 0.18 },
          { scale: 1, duration: 0.4 },
        ],
        stagger: { amount: 0.8, grid: "auto", axis: "x", from: "start" },
      },
      1.9,
    );
    hold(tl, 0.5);
    return tl;
  },
});

/* ---------- one big number ---------- */

/**
 * The big counter's ink, handed to its styles: it starts flush with the lines around it instead of a digit's blank
 * side further in, and a count too wide for the column is set smaller until it fits.
 */
const megaInk = (text: string) => {
  const ink = numberInk(text);
  return { "--wr-ink-inset": ink.inset, "--wr-ink-width": ink.width } as CSSProperties;
};

/** The tile's number, moved so its ink is in the middle of the tile, not its box. */
const tileInk = (text: string) => ({ "--wr-ink-nudge": numberInk(text).nudge }) as CSSProperties;

export const bigNumberScene = defineScene<{
  eyebrow: string;
  value: number;
  suffix?: string;
  title: readonly string[];
  lede: string;
  calendar?: CalendarLevels;
  /** Shown under the title instead of a calendar: a row of lit cells, one per unit, up to 60. */
  cells?: number;
  counter: "climb" | "slot";
  variant: number;
}>({
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline"), textField("lede", "Line under it")],
  render: ({ eyebrow, value, suffix, title, lede, calendar, cells }) => (
    <>
      <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
      <div className="wr-mega" data-count={value} data-suffix={suffix ?? ""} style={megaInk(countText(value, suffix))}>
        0
      </div>
      <Lines lines={title} />
      {calendar ? (
        <div style={{ margin: "56px 0 44px" }}>
          <Calendar calendar={calendar} months />
        </div>
      ) : null}
      {cells ? (
        <div className="wr-cell-row">
          {Array.from({ length: Math.min(cells, 60) }, (_unused, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- positional cells
            <i key={index} className="wr-cell" data-l={[2, 3, 4, 3][index % 4]} />
          ))}
        </div>
      ) : null}
      <p className="wr-lede wr-rise">{rich(lede)}</p>
    </>
  ),
  animate: ({ root }, { counter, variant }) => {
    const tl = gsap.timeline();
    const mega = root.querySelector(".wr-mega");
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0 });
    tl.from(
      mega,
      variant === 0
        ? { yPercent: 40, autoAlpha: 0, filter: "blur(20px)", duration: 1.1, ease: EASE_OUT }
        : { scale: 0.4, autoAlpha: 0, transformOrigin: "left bottom", duration: 1, ease: "back.out(2)" },
      0.15,
    );
    countUp(tl, mega, { at: 0.2, duration: 2, style: counter });
    linesIn(tl, root, { at: 0.35 });
    const frame = root.querySelector(".wr-frame");
    if (frame) {
      tl.from(frame, { autoAlpha: 0, y: 40, duration: 0.8, ease: EASE_OUT }, 0.4);
      tl.from(
        cellsOf(root),
        {
          scale: 0,
          duration: 0.5,
          ease: "back.out(3)",
          stagger: { amount: 1.6, grid: "auto", axis: "x", from: "start" },
        },
        0.5,
      );
    }
    const row = root.querySelectorAll(".wr-cell-row .wr-cell");
    if (row.length > 0) {
      tl.from(row, { scale: 0, autoAlpha: 0, duration: 0.35, ease: "back.out(4)", stagger: 1.8 / row.length }, 0.2);
      tl.to(row, { y: -12, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.out", stagger: 0.012 }, 2.1);
    }
    hold(tl, 1.1);
    return tl;
  },
});

/* ---------- one day ---------- */

export const bigDayScene = defineScene<{
  eyebrow: string;
  count: number;
  /** After the count, for one too big to show whole: "K", "M". */
  suffix?: string;
  unit: string;
  title: readonly string[];
  lede: string;
}>({
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline"), textField("lede", "Line under it")],
  render: ({ eyebrow, count, suffix, unit, title, lede }) => {
    const text = countText(count, suffix);
    return (
      <>
        <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
        <div className="wr-big-cell">
          <div className="wr-burst">
            {Array.from({ length: 18 }, (_unused, index) => (
              // oxlint-disable-next-line react/no-array-index-key -- burst particles are positional
              <i key={index} />
            ))}
          </div>
          <strong
            data-count={count}
            data-suffix={suffix ?? ""}
            // How many characters the finished count takes, so a long one is set smaller and stays inside the tile.
            data-chars={Math.min(6, text.length)}
            style={tileInk(text)}
          >
            0
          </strong>
          <small>{unit}</small>
        </div>
        <Lines lines={title} />
        <p className="wr-lede wr-rise" style={{ marginTop: 34 }}>
          {rich(lede)}
        </p>
      </>
    );
  },
  animate: ({ root, rng }) => {
    const tl = gsap.timeline();
    const cell = root.querySelector(".wr-big-cell");
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0 });
    tl.from(
      cell,
      {
        scale: 0.04,
        rotate: rng.pick([-45, 45, 180]),
        borderRadius: "4px",
        duration: 1.2,
        ease: "elastic.out(1, 0.6)",
      },
      0.15,
    );
    tl.fromTo(
      root.querySelectorAll(".wr-burst i"),
      { x: 0, y: 0, scale: 0.4, autoAlpha: 1 },
      {
        x: (index: number) => Math.cos((index / 18) * Math.PI * 2) * (260 + ((index * 37) % 120)),
        y: (index: number) => Math.sin((index / 18) * Math.PI * 2) * (260 + ((index * 53) % 120)),
        scale: 1,
        autoAlpha: 0,
        duration: 1.2,
        ease: "expo.out",
        // They appear when the burst starts, not when the scene is built: until then they would sit on the number.
        immediateRender: false,
      },
      0.35,
    );
    countUp(tl, root.querySelector(".wr-big-cell strong"), {
      at: 0.3,
      duration: 1.2,
      style: rng.pick(["climb", "slot"] as const),
    });
    linesIn(tl, root, { at: 0.6 });
    tl.to(cell, { rotate: 4, yoyo: true, repeat: 1, duration: 0.5, ease: "sine.inOut" }, 1.6);
    hold(tl, 0.9);
    return tl;
  },
});

const FULL_WIDTH = { width: "100%" } as const;
const NO_TOP_MARGIN = { marginTop: 0 } as const;

/* ---------- bars ---------- */

export const barsScene = defineScene<{
  eyebrow: string;
  title: readonly string[];
  bars: readonly { label: string; value: number; peak?: boolean }[];
  lede: string;
}>({
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline"), textField("lede", "Line under it")],
  render: ({ eyebrow, title, bars, lede }) => {
    const max = Math.max(1, ...bars.map((bar) => bar.value));
    return (
      <>
        <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
        <Lines lines={title} />
        <div className="wr-bars">
          {bars.map((bar, index) => (
            // oxlint-disable-next-line react/no-array-index-key -- weekday and month labels repeat
            <div key={`${bar.label}-${index}`} className="wr-bar" data-peak={bar.peak || undefined}>
              <i style={{ height: `${Math.max(5, (bar.value / max) * 100)}%` }} />
              <span>{bar.label}</span>
            </div>
          ))}
        </div>
        <p className="wr-lede wr-rise">{rich(lede)}</p>
      </>
    );
  },
  animate: ({ root, rng }) => {
    const tl = gsap.timeline();
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0 });
    linesIn(tl, root, { at: 0.1 });
    tl.from(
      root.querySelectorAll(".wr-bar i"),
      {
        scaleY: 0,
        duration: 1.1,
        ease: "elastic.out(1, 0.55)",
        stagger: { each: 0.08, from: rng.pick(["start", "center", "end"] as const) },
      },
      0.5,
    );
    tl.from(root.querySelectorAll(".wr-bar span"), { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.06 }, 0.7);
    tl.to(
      root.querySelectorAll(".wr-bar[data-peak] i"),
      { scaleX: 1.08, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" },
      1.8,
    );
    hold(tl, 1.1);
    return tl;
  },
});

/* ---------- chart ---------- */

/**
 * A story beat told with one of the engine's charts: the line above, the headline, the chart, one line under it. The
 * chart's point is lit in the frame's own ink: a rarity's color belongs to something that was found.
 */
export const chartScene = defineScene<{
  eyebrow: string;
  title: readonly string[];
  chart: SceneChart;
  lede: string;
}>({
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline"), textField("lede", "Line under it")],
  render: ({ eyebrow, title, chart, lede }) => (
    <>
      <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
      <Lines lines={title} />
      <div className="wr-chart-tone" data-rarity="common" style={FULL_WIDTH}>
        <Chart chart={chart} />
      </div>
      <p className="wr-lede wr-rise" style={NO_TOP_MARGIN}>
        {rich(lede)}
      </p>
    </>
  ),
  animate: ({ root }) => {
    const tl = gsap.timeline();
    riseIn(tl, root.querySelector(".wr-eyebrow"), { at: 0 });
    linesIn(tl, root, { at: 0.1 });
    animateChart(tl, root, 0.6);
    riseIn(tl, root.querySelector(".wr-lede"), { at: 1.4 });
    hold(tl, 1.5);
    return tl;
  },
});

/* ---------- ranked list ---------- */

export const listScene = defineScene<{
  eyebrow: string;
  title: readonly string[];
  items: readonly { name: string; value: number; unit: string; meta?: string; color?: string | null }[];
}>({
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline")],
  render: ({ eyebrow, title, items }) => {
    const top = Math.max(1, items[0]?.value ?? 1);
    return (
      <>
        <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
        <Lines lines={title} />
        <div className="wr-list">
          {items.map((item, index) => (
            <div key={item.name} className="wr-item">
              <div className="wr-item-rank">0{index + 1}</div>
              <div className="wr-item-name">{item.name}</div>
              <div className="wr-meter">
                <i style={{ width: `${Math.round((item.value / top) * 100)}%` }} />
              </div>
              <div className="wr-item-meta">
                <span>
                  {item.color ? <i className="wr-dot" style={{ background: item.color }} /> : null}
                  {item.meta}
                </span>
                <span>
                  <b data-count={item.value}>0</b> {item.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  },
  animate: ({ root, rng }) => {
    const tl = gsap.timeline();
    const fromX = rng.pick([140, -140]);
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0 });
    linesIn(tl, root, { at: 0.1 });
    tl.from(
      root.querySelectorAll(".wr-item"),
      { x: fromX, autoAlpha: 0, rotate: fromX > 0 ? 2 : -2, duration: 1, ease: EASE_OUT, stagger: 0.16 },
      0.45,
    );
    tl.from(root.querySelectorAll(".wr-meter i"), { scaleX: 0, duration: 1.2, ease: "power3.out", stagger: 0.16 }, 0.8);
    root
      .querySelectorAll(".wr-item-meta [data-count]")
      .forEach((element, index) => countUp(tl, element, { at: 0.8 + index * 0.16, duration: 1.2 }));
    hold(tl, 1.2);
    return tl;
  },
});

/* ---------- split ---------- */

export const splitScene = defineScene<{
  eyebrow: string;
  title: readonly string[];
  parts: readonly { name: string; color: string; share: number }[];
}>({
  fields: [textField("eyebrow", "Line above"), linesField("title", "Headline")],
  render: ({ eyebrow, title, parts }) => (
    <>
      <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
      <Lines lines={title} />
      <div className="wr-split">
        {parts.map((part) => (
          <i key={part.name} style={{ flexGrow: Math.max(part.share, 1.5), backgroundColor: part.color }} />
        ))}
      </div>
      <div className="wr-legend">
        {parts.map((part) => (
          <div key={part.name}>
            <span>
              <i className="wr-key" style={{ background: part.color }} />
              {part.name}
            </span>
            <span data-count={part.share} data-suffix="%">
              0%
            </span>
          </div>
        ))}
      </div>
    </>
  ),
  animate: ({ root }) => {
    const tl = gsap.timeline();
    riseIn(tl, root.querySelectorAll(".wr-rise"), { at: 0 });
    linesIn(tl, root, { at: 0.1 });
    // One bar, drawn left to right in a single stroke.
    tl.fromTo(
      root.querySelector(".wr-split"),
      { clipPath: "inset(0% 100% 0% 0% round 26px)" },
      { clipPath: "inset(0% 0% 0% 0% round 26px)", duration: 1.3, ease: "expo.inOut" },
      0.45,
    );
    tl.from(
      root.querySelectorAll(".wr-legend > div"),
      { y: 30, autoAlpha: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.1 },
      0.9,
    );
    root
      .querySelectorAll(".wr-legend [data-count]")
      .forEach((element, index) => countUp(tl, element, { at: 0.9 + index * 0.1, duration: 1 }));
    hold(tl, 1.2);
    return tl;
  },
});

/* ---------- a fun fact ---------- */

/*
 * Three kinds of text at most, ever: one small label, the title, one description. No lead-in on top of a label, no
 * quieter second paragraph, no caption under a chart. A chart's explanation is the description.
 */
export const factScene = defineScene<{
  stamp: string;
  /** Colours the stamp by rarity, for achievements and easter eggs. */
  rarity?: "common" | "rare" | "epic" | "legendary";
  title: readonly string[];
  /** The one line under the title. With a chart, it says what the chart shows. */
  description: string;
  art?: PixelArt;
  /** The scene's own picture of the numbers. Takes the art's place. */
  chart?: SceneChart;
  variant: number;
}>({
  fields: [textField("stamp", "Tag"), linesField("title", "Headline"), textField("description", "Line under it")],
  render: ({ stamp, rarity, title, description, art, chart, variant }) => (
    <>
      {art && !chart && variant === 0 ? <Pixel art={art} /> : null}
      <Lines lines={title} />
      {/* Under the name, never over it: the name is the headline, the rarity is what it is. */}
      <span className="wr-stamp wr-rise" data-rarity={rarity}>
        {stamp}
      </span>
      {chart ? (
        <div className="wr-chart-tone" data-rarity={rarity} style={{ width: "100%" }}>
          <Chart chart={chart} />
        </div>
      ) : null}
      <p className="wr-lede wr-rise" style={{ marginTop: chart ? 0 : 34 }}>
        {rich(description)}
      </p>
      {art && !chart && variant === 1 ? <Pixel art={art} /> : null}
    </>
  ),
  animate: ({ root, rng }) => {
    const tl = gsap.timeline();
    riseIn(tl, root.querySelector(".wr-eyebrow"), { at: 0 });
    const pixels = root.querySelectorAll(".wr-pixel i");
    if (pixels.length > 0) {
      tl.from(
        pixels,
        {
          scale: 0,
          autoAlpha: 0,
          duration: 0.45,
          ease: "back.out(3)",
          stagger: { amount: 0.9, grid: [9, 9], from: rng.pick(["center", "edges", "random", "start"] as const) },
        },
        0,
      );
    }
    linesIn(tl, root, { at: 0.3 });
    // The rarity comes in under the name, as quietly as the name's own lines.
    riseIn(tl, root.querySelector(".wr-stamp"), { at: 0.65 });
    animateChart(tl, root, 0.8);
    riseIn(tl, root.querySelector(".wr-lede"), { at: root.querySelector(".wr-chart") ? 1.6 : 0.9 });
    tl.to(
      root.querySelectorAll('.wr-pixel i[data-on="2"]'),
      { scale: 1.18, duration: 0.2, yoyo: true, repeat: 1, stagger: { amount: 0.4, grid: [9, 9], from: "edges" } },
      1.4,
    );
    hold(tl, 1.5);
    return tl;
  },
});

/* ---------- persona ---------- */

export const personaScene = defineScene<{
  eyebrow: string;
  name: string;
  line: string;
  art: PixelArt;
}>({
  fields: [textField("eyebrow", "Line above"), textField("name", "Coder type"), textField("line", "Line under it")],
  align: "center",
  render: ({ eyebrow, name, line, art }) => (
    <>
      <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
      <Pixel art={art} />
      <Lines lines={name.startsWith("The ") ? ["The", name.slice(4)] : [name]} />
      <p className="wr-lede wr-rise" style={{ marginTop: 34 }}>
        {rich(line)}
      </p>
    </>
  ),
  animate: ({ root }) => {
    const tl = gsap.timeline();
    riseIn(tl, root.querySelector(".wr-eyebrow"), { at: 0 });
    tl.from(
      root.querySelectorAll(".wr-pixel i"),
      {
        scale: 0,
        autoAlpha: 0,
        duration: 0.45,
        ease: "back.out(3)",
        stagger: { amount: 1, grid: [9, 9], from: "center" },
      },
      0.2,
    );
    tl.to(
      root.querySelectorAll('.wr-pixel i[data-on="2"]'),
      { scale: 1.18, duration: 0.2, yoyo: true, repeat: 1, stagger: { amount: 0.4, grid: [9, 9], from: "edges" } },
      1.3,
    );
    linesIn(tl, root, { at: 0.8, stagger: 0.12 });
    riseIn(tl, root.querySelector(".wr-lede"), { at: 1.1 });
    hold(tl, 1.4);
    return tl;
  },
});

/* ---------- the share card ---------- */

export const summaryScene = defineScene<{
  handle: string;
  avatarUrl: string | null;
  caption: string;
  calendar?: CalendarLevels;
  stats: readonly { label: string; value: string }[];
  /** What this person pulled, as tokens: pixel art, a small kind and rarity line, the name. */
  tokens?: readonly WrappedToken[];
}>({
  fields: [textField("caption", "Line under your name")],
  align: "center",
  render: ({ handle, avatarUrl, caption, calendar, stats, tokens }) => (
    <div className="wr-card">
      <div>
        <div className="wr-card-head">
          <div className="wr-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" crossOrigin="anonymous" /> : handle.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3>@{handle}</h3>
            <p>{caption}</p>
          </div>
        </div>
        {calendar ? <Calendar calendar={calendar} /> : null}
      </div>
      <div>
        <div className="wr-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="wr-stat">
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        {tokens && tokens.length > 0 ? (
          <div className="wr-tokens">
            {tokens.map((token) => (
              <div key={token.name} className="wr-token" data-rarity={token.rarity}>
                <Pixel art={token.art} className="wr-pixel wr-pixel-token" />
                <div>
                  <b>{token.name}</b>
                  <small>{RARITY_LABELS[token.rarity]}</small>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  ),
  animate: ({ root }) => {
    const tl = gsap.timeline();
    tl.from(root.querySelector(".wr-card"), {
      y: 160,
      scale: 0.9,
      autoAlpha: 0,
      rotate: -2,
      duration: 1.2,
      ease: EASE_OUT,
    });
    // The year draws in left to right as one sweep: one element, not 371 cell tweens. The card is rebuilt each time a
    // drop is found, and per-cell tweens made that rebuild stall the reveal.
    tl.fromTo(
      root.querySelector(".wr-card .wr-graph"),
      { clipPath: "inset(0% 100% 0% 0%)" },
      // Clipped from the first frame: rendered late, the year showed with the card and was then swept in again.
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power2.inOut" },
      0.35,
    );
    tl.from(
      root.querySelectorAll(".wr-stat"),
      { y: 40, autoAlpha: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.1 },
      0.6,
    );
    tl.from(
      root.querySelectorAll(".wr-token"),
      { scale: 0.6, autoAlpha: 0, duration: 0.9, ease: "elastic.out(1, 0.6)", stagger: 0.15 },
      1.1,
    );
    hold(tl, 2.5);
    return tl;
  },
});

/* ---------- trophy case ---------- */

/** How many trophies a frame holds before the rest become "+N more". */
const TROPHY_LIMIT = 12;

export const trophiesScene = defineScene<{
  eyebrow: string;
  title: readonly string[];
  lede: string;
  /** Hardest first; `hidden` ones are still in the year, waiting for the scan. */
  items: readonly (WrappedToken & { hidden?: boolean })[];
}>({
  render: ({ eyebrow, title, lede, items }) => {
    const shown = items.slice(0, TROPHY_LIMIT);
    const more = items.length - shown.length;
    return (
      <>
        <p className="wr-eyebrow wr-rise">{rich(eyebrow)}</p>
        <Lines lines={title} />
        <p className="wr-lede wr-rise" style={{ marginTop: 28 }}>
          {rich(lede)}
        </p>
        <div className="wr-trophies">
          {shown.map((item, index) =>
            item.hidden ? (
              // oxlint-disable-next-line react/no-array-index-key -- hidden trophies have no name to key by
              <div key={`hidden-${index}`} className="wr-trophy" data-hidden="">
                <Pixel art={PIXEL_ART.question} className="wr-pixel wr-pixel-token" />
                <div>
                  <b>?</b>
                  <small>Still hidden</small>
                </div>
              </div>
            ) : (
              <div key={item.name} className="wr-trophy" data-rarity={item.rarity}>
                <Pixel art={item.art} className="wr-pixel wr-pixel-token" />
                <div>
                  <b>{item.name}</b>
                  <small>{RARITY_LABELS[item.rarity]}</small>
                </div>
              </div>
            ),
          )}
          {more > 0 ? (
            <div className="wr-trophy" data-hidden="">
              <div>
                <b>+{more} more</b>
              </div>
            </div>
          ) : null}
        </div>
      </>
    );
  },
  animate: ({ root }) => {
    const tl = gsap.timeline();
    riseIn(tl, root.querySelector(".wr-eyebrow"), { at: 0 });
    linesIn(tl, root, { at: 0.15 });
    riseIn(tl, root.querySelector(".wr-lede"), { at: 0.6 });
    tl.from(
      root.querySelectorAll(".wr-trophy"),
      { y: 40, scale: 0.85, autoAlpha: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.07 },
      0.8,
    );
    // The rare ones catch the light once everything has landed.
    tl.to(
      root.querySelectorAll('.wr-trophy[data-rarity="legendary"], .wr-trophy[data-rarity="epic"]'),
      {
        keyframes: [
          { scale: 1.06, duration: 0.18 },
          { scale: 1, duration: 0.35 },
        ],
        stagger: 0.12,
      },
      ">0.1",
    );
    tl.to(
      root.querySelectorAll(".wr-trophy[data-hidden]"),
      { keyframes: [{ rotate: -3 }, { rotate: 3 }, { rotate: -2 }, { rotate: 0 }], duration: 0.4, stagger: 0.1 },
      "<",
    );
    hold(tl, 2.2);
    return tl;
  },
});

/* ---------- pixel art ---------- */

export const PIXEL_ART = {
  mountain: [
    "....x....",
    "...xxx...",
    "..xxoxx..",
    "..xooox..",
    ".xxoooxx.",
    ".xooooox.",
    "xxoooooxx",
    "xooooooox",
    "xxxxxxxxx",
  ],
  bolt: [
    ".....xx..",
    "....xx...",
    "...xx....",
    "..xxxxx..",
    "....xx...",
    "...xx....",
    "..xx.....",
    ".xx......",
    ".........",
  ],
  flame: [
    "....x....",
    "...xx....",
    "...xxx...",
    "..xxoxx..",
    "..xooox..",
    ".xxooxxx.",
    ".xoooox..",
    "..xooxx..",
    "...xxx...",
  ],
  globe: [
    "..xxxxx..",
    ".xooxoox.",
    "xoooxooox",
    "xxxxxxxxx",
    "xoooxooox",
    "xxxxxxxxx",
    "xoooxooox",
    ".xooxoox.",
    "..xxxxx..",
  ],
  check: [
    ".........",
    "........x",
    ".......xx",
    "x.....xx.",
    "xx...xx..",
    ".xx.xx...",
    "..xxx....",
    "...x.....",
    ".........",
  ],
  tree: [
    "....x....",
    "...xxx...",
    "..xoxox..",
    "...xxx...",
    "..xxoxx..",
    ".xoxxxox.",
    "xxxxoxxxx",
    "....o....",
    "...ooo...",
  ],
  palm: [
    "..xx.xx..",
    ".x..x..x.",
    "....o....",
    "....o....",
    "....o....",
    "...o.....",
    "...o.....",
    "ooooooooo",
    ".........",
  ],
  eye: [
    ".........",
    "..xxxxx..",
    ".x.....x.",
    "x..ooo..x",
    "x..oxo..x",
    "x..ooo..x",
    ".x.....x.",
    "..xxxxx..",
    ".........",
  ],
  lock: [
    "..xxxxx..",
    ".x.....x.",
    ".x.....x.",
    "xxxxxxxxx",
    "xooooooox",
    "xoooxooox",
    "xoooxooox",
    "xooooooox",
    "xxxxxxxxx",
  ],
  rocket: [
    "....x....",
    "...xxx...",
    "...xox...",
    "...xxx...",
    "..xxxxx..",
    ".x.xxx.x.",
    "...ooo...",
    "....o....",
    "...o.o...",
  ],
  calendar: [
    "x.x...x.x",
    "xxxxxxxxx",
    "x.......x",
    "x.o.o.o.x",
    "x.......x",
    "x.o.x.o.x",
    "x.......x",
    "xxxxxxxxx",
    ".........",
  ],
  moon: [
    "...xxx...",
    ".xxx.....",
    ".xx......",
    "xx.......",
    "xx.......",
    "xx.......",
    ".xx....x.",
    ".xxxxxxx.",
    "...xxx...",
  ],
  duck: [
    "...xx....",
    "..xxxx...",
    "..xoxxoo.",
    "..xxxx...",
    ".xxxxxxx.",
    "xxxxxxxxx",
    "xxxxxxxxx",
    ".xxxxxxx.",
    "..ooooo..",
  ],
  plant: [
    "...x.x...",
    "..xxoxx..",
    ".xo.x.ox.",
    "..x.x.x..",
    "....x....",
    "..ooooo..",
    "..ooooo..",
    "...ooo...",
    "...ooo...",
  ],
  mug: [
    ".x.x.x...",
    "..x.x.x..",
    ".........",
    "xxxxxxx..",
    "xoooooxxx",
    "xoooooxox",
    "xoooooxxx",
    "xoooooo..",
    ".xxxxx...",
  ],
  cat: [
    "x.....x..",
    "xx...xx..",
    "xxxxxxx..",
    "xoxxxox..",
    "xxxoxxx..",
    ".xxxxx...",
    "..xxxxx.x",
    "..xxxxxx.",
    "..x.x.x..",
  ],
  owl: [
    ".x.....x.",
    ".xxxxxxx.",
    "xooxxxoox",
    "xxoxxxoxx",
    ".xxxoxxx.",
    ".xoxxxox.",
    ".xxoooxx.",
    "..xxxxx..",
    "..x...x..",
  ],
  hedgehog: [
    "..x.x.x..",
    ".xxxxxxx.",
    "xxxxxxxxx",
    "xxxxxxxoo",
    "xxxxxxoxo",
    ".xxxxxooo",
    "..x...x..",
    ".........",
    ".........",
  ],
  octopus: [
    "..xxxxx..",
    ".xxxxxxx.",
    ".xoxxxox.",
    ".xxxxxxx.",
    "..xxxxx..",
    ".x.x.x.x.",
    "x.x.x.x.x",
    ".x.x.x.x.",
    ".........",
  ],
  fox: [
    "x......x.",
    "xx....xx.",
    "xxxxxxxx.",
    "xoxxxxox.",
    ".xxooxx..",
    "..xxxx...",
    "...xx..xx",
    "..xxxxxx.",
    "..x..x...",
  ],
  dragon: [
    "x.......x",
    "xx.xxx.xx",
    ".xxxxxxx.",
    "..xoxox..",
    "..xxxxx..",
    ".xxxoxxx.",
    "xx.xxx.xx",
    "x..x.x..x",
    ".........",
  ],
  phoenix: [
    "....x....",
    "...xox...",
    "x..xxx..x",
    "xx.xxx.xx",
    ".xxxoxxx.",
    "..xxxxx..",
    "...xxx...",
    "..x.x.x..",
    ".x..x..x.",
  ],
  crown: [
    ".........",
    "x...x...x",
    "xx.xxx.xx",
    "xxxxxxxxx",
    "xoxxoxxox",
    "xxxxxxxxx",
    "xxxxxxxxx",
    ".........",
    ".........",
  ],
  trophy: [
    "xxxxxxxxx",
    "x.xxxxx.x",
    "x.xxxxx.x",
    ".xxxxxxx.",
    "..xxxxx..",
    "...xxx...",
    "....x....",
    "..xxxxx..",
    ".xxxxxxx.",
  ],
  question: [
    "..xxxxx..",
    ".xx...xx.",
    ".x....xx.",
    ".....xx..",
    "....xx...",
    "....x....",
    ".........",
    "....x....",
    ".........",
  ],
} as const satisfies Record<string, PixelArt>;
