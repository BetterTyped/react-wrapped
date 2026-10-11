import { useId } from "react";

import type { StageMark } from "./types";
// oxlint-disable-next-line import/no-unassigned-import -- The mark's own stylesheet.
import "./platform-mark.css";

/** How far the light and the shade reach into the mark, in the mark's own 24-unit box. */
const DEPTH = 0.42;
const SOFTNESS = 0.3;

/** One inner edge: everything outside the mark, blurred and nudged across it, kept only where the mark is. */
function edge(name: string, offset: number, colour: string) {
  return (
    <>
      <feOffset in="outside" dx={offset} dy={offset} result={`${name}-moved`} />
      <feFlood floodColor={colour} result={`${name}-colour`} />
      <feComposite in={`${name}-colour`} in2={`${name}-moved`} operator="in" result={`${name}-edge`} />
      <feComposite in={`${name}-edge`} in2="SourceAlpha" operator="in" result={name} />
    </>
  );
}

/**
 * A mark, raised out of a pressed coin in the stage's corner. A flat logo would sit on the frame like a
 * sticker; this one is lit from the top left like the discs it replaces: a light edge where the light lands, a shaded
 * edge where it falls away, both cut to the mark's own outline.
 */
export function PlatformMark({ mark }: { mark: StageMark }) {
  const id = useId();
  const fill = `${id}-fill`;
  const emboss = `${id}-emboss`;
  return (
    <div className="wr-mark" aria-hidden>
      <div className="wr-mark-well" />
      <svg viewBox="0 0 24 24">
        <defs>
          <linearGradient id={fill} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--wr-mark-glyph-high)" />
            <stop offset="1" stopColor="var(--wr-mark-glyph-low)" />
          </linearGradient>
          <filter id={emboss} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feComponentTransfer in="SourceAlpha" result="inverse">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur in="inverse" stdDeviation={SOFTNESS} result="outside" />
            {edge("light", DEPTH, "color-mix(in oklch, var(--wr-fg) 26%, transparent)")}
            {edge("shade", -DEPTH, "oklch(0 0 0 / 0.4)")}
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="shade" />
              <feMergeNode in="light" />
            </feMerge>
          </filter>
        </defs>
        {/* A mark of several shapes is pressed out shape by shape, so each keeps its own edge. */}
        {(typeof mark === "string" ? [mark] : mark).map((path) => (
          <path key={path} d={path} fill={`url(#${fill})`} filter={`url(#${emboss})`} />
        ))}
      </svg>
    </div>
  );
}
