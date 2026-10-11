import { getFontEmbedCSS, toBlob } from "html-to-image";
import type { CSSProperties } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { Chart, type SceneChart } from "@react-wrapped/charts";
import { paletteStyle, type Rarity, RARITY_LABELS, type WrappedPalette } from "@react-wrapped/core";

/**
 * One thing a year turned out to be, as a card worth posting: the number, the chart that shows it, and the line that
 * says what it means. The chart is the one the video plays for the same achievement.
 */
export interface InsightCardSpec {
  handle: string;
  /** "GitHub Wrapped, Oct 2025 to Oct 2026" */
  caption: string;
  /** What the card is called: the achievement's name, or what part of the year it shows. */
  name: string;
  /** Set for an achievement: its word goes under the name and its color lights the chart's point. */
  rarity?: Rarity;
  /** The headline number, and what it counts, read as one sentence: "31%" "of your work landed on a Friday". */
  stat: { value: string; label: string };
  /** One line saying what the chart shows. */
  insight: string;
  chart: SceneChart;
  /** A quiet line saying where the video is from: a site address, a product name. Left out, nothing is shown. */
  brand?: string;
}

const WIDTH = 1200;
const HEIGHT = 630;
/** The column the chart gets. Must match the grid in insight-card.css. */
const PLOT_WIDTH = 660;
/**
 * The width each chart is drawn at before it is scaled to the column. The video's 920 for the ones that span the
 * frame; a ring with its legend is a fixed 320 beside a list, so it is drawn narrower and comes out bigger.
 */
const drawnWidth = (chart: SceneChart) => (chart.type === "rings" || chart.type === "donut" ? 720 : 920);

/** The number fills its column whatever its length: "31%" is set bigger than "12,480". */
const valueSize = (value: string) => (value.length <= 3 ? 176 : value.length <= 5 ? 138 : 108);

export function InsightCard({ spec, palette }: { spec: InsightCardSpec; palette: WrappedPalette }) {
  // The colors are set inline, not left to the stage's stylesheet rules: the capture keeps an element's own style
  // attribute and nothing a selector gave it. The chart's point is the rarity's color; a Common, or a card about the
  // year itself, lights it in the frame's own ink (grey reads as "disabled" on a bar).
  const rarity = spec.rarity ? palette.rarity[spec.rarity] : palette.fg;
  const point = spec.rarity && spec.rarity !== "common" ? rarity : palette.fg;
  const width = drawnWidth(spec.chart);
  return (
    <div className="wr-insight" style={{ ...paletteStyle(palette), "--wr-rarity": rarity } as CSSProperties}>
      <div className="wr-insight-light" />
      <div className="wr-insight-copy">
        <div className="wr-insight-name">
          {spec.name}
          {spec.rarity ? <span>{RARITY_LABELS[spec.rarity]}</span> : null}
        </div>
        <div className="wr-insight-stat">
          <strong style={{ fontSize: valueSize(spec.stat.value) }}>{spec.stat.value}</strong>
          <span>{spec.stat.label}</span>
        </div>
        <p>{spec.insight}</p>
      </div>
      <div className="wr-insight-side">
        <div className="wr-insight-who">
          <b>@{spec.handle}</b> · {spec.caption}
        </div>
        <div className="wr-insight-plot">
          <div
            style={
              {
                "--wr-rarity": point,
                width,
                transform: `translateY(-50%) scale(${PLOT_WIDTH / width})`,
              } as CSSProperties
            }
          >
            <Chart chart={spec.chart} />
          </div>
        </div>
        {spec.brand ? <div className="wr-insight-source">{spec.brand}</div> : null}
      </div>
    </div>
  );
}

/** What a chart's shapes and labels take from the stylesheet, by class or through a custom property. */
const SVG_STYLES = [
  "fill",
  "stroke",
  "stop-color",
  "filter",
  "font-size",
  "font-weight",
  "letter-spacing",
  "font-variant-numeric",
] as const;

/**
 * Writes every SVG node's resolved style onto the node itself. The capture copies computed styles for HTML, but takes
 * an `<svg>` as it stands, children and all: a label sized by a class came out at the browser's default 16px, and a
 * gradient stop colored through a custom property came out black.
 */
function settleSvgStyles(card: HTMLElement) {
  for (const node of card.querySelectorAll<SVGElement>("svg *")) {
    const computed = getComputedStyle(node);
    for (const property of SVG_STYLES) node.style.setProperty(property, computed.getPropertyValue(property));
  }
}

/** The page's fonts as embeddable CSS, read once: every card is set in the same Inter. */
let fonts: Promise<string> | null = null;
/** Captures run one at a time. Each copies the style of every node it draws, and eight at once froze the page. */
let queue: Promise<unknown> = Promise.resolve();

async function capture(spec: InsightCardSpec, palette: WrappedPalette): Promise<Blob> {
  // Drawn for real, off screen: the capture copies what the browser laid out, so the card has to exist.
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${WIDTH}px;height:${HEIGHT}px;pointer-events:none;`;
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => root.render(<InsightCard spec={spec} palette={palette} />));
  const card = host.firstElementChild as HTMLElement;

  await document.fonts.ready;
  settleSvgStyles(card);
  fonts ??= getFontEmbedCSS(card);
  const blob = await fonts
    .then((fontEmbedCSS) => toBlob(card, { width: WIDTH, height: HEIGHT, pixelRatio: 2, fontEmbedCSS }))
    .finally(() => {
      root.unmount();
      host.remove();
    });
  if (!blob) throw new Error("The browser could not draw the card.");
  return blob;
}

/** The card as a PNG at twice its size, sharp on any screen and ready to post. */
export function renderInsightCard(spec: InsightCardSpec, palette: WrappedPalette): Promise<Blob> {
  const next = queue.then(
    () => capture(spec, palette),
    () => capture(spec, palette),
  );
  queue = next.catch(() => null);
  return next;
}
