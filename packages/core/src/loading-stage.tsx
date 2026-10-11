import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { beamFrames, LOOP_SECONDS, placeholderYear, weekFrames } from "./loading-sweep";
import { paletteStyle, resolvePalette } from "./palettes";
import { initials, StageBackdrop } from "./stage";
import { WRAPPED_FORMATS, type StageMark, type WrappedConfig } from "./types";

/** How long one line stays up before the next one rises. */
const LINE_MS = 2600;

/** Whether a frame colour (#rrggbb) is a light one: the beam's flare deepens colours there instead of brightening. */
function isLight(colour: string): boolean {
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(colour.slice(at, at + 2), 16));
  return (red * 299 + green * 587 + blue * 114) / 255000 > 0.6;
}

/** Who the wait is for, as far as the address says. The rest arrives with the year. */
export interface LoadingSubject {
  /** Shown in the frame's corner the way the video shows it. Left out when the link does not say whose year it is. */
  handle?: string;
  /** What the video is called: "Orbit Wrapped". */
  caption: string;
  /** A picture that can be had before the year is. It fades in over the initials, and a failed one is dropped. */
  avatarUrl?: string;
  mark?: StageMark;
  /** A quiet line saying where the video is from: a site address, a product name. Left out, nothing is shown. */
  brand?: string;
}

/**
 * The video's frame while its year is on the way: the same light, the same corner, the same name, and a blank year
 * with the scan's beam passing over it. Weeks light as the beam crosses and fade behind it, so the wait looks like
 * the reveal it leads to. When the year arrives the frame stays where it is and the first scene plays in it.
 */
export function LoadingStage({
  subject,
  lines,
  config,
  scale,
}: {
  subject: LoadingSubject;
  /** What to read meanwhile. More than one take turns. */
  lines: readonly string[];
  config: WrappedConfig;
  scale: number;
}) {
  const format = WRAPPED_FORMATS[config.format];
  const weeks = useMemo(() => placeholderYear(subject.handle ?? subject.caption), [subject.handle, subject.caption]);
  const yearRef = useRef<HTMLDivElement>(null);
  const palette = resolvePalette(config);
  const frame = isLight(palette.bg) ? "light" : "dark";

  useEffect(() => {
    const year = yearRef.current;
    if (!year || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lit = [...year.querySelectorAll<HTMLElement>("[data-load-lit]")];
    const beam = year.querySelector<HTMLElement>("[data-load-beam]");
    // Started together, they share one clock: the weeks light exactly where the beam is.
    const timing = { duration: LOOP_SECONDS * 1000, iterations: Infinity };
    const animations = lit.map((week, column) => week.animate(weekFrames(column / (lit.length - 1), frame), timing));
    if (beam) animations.push(beam.animate(beamFrames(), timing));
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [frame]);

  // Every line is in the frame from the start and they trade places by attribute: nothing is inserted while waiting.
  const [turn, setTurn] = useState({ on: 0, past: -1 });
  useEffect(() => {
    if (lines.length < 2) return;
    const timer = setInterval(() => setTurn(({ on }) => ({ on: (on + 1) % lines.length, past: on })), LINE_MS);
    return () => clearInterval(timer);
  }, [lines.length]);
  const on = lines.length > 1 ? turn.on % lines.length : 0;
  const past = lines.length > 1 ? turn.past : -1;

  const [avatar, setAvatar] = useState<"waiting" | "shown" | "gone">("waiting");
  const avatarRef = useRef<HTMLImageElement>(null);
  // On a server-rendered page the picture can finish before React is listening, and its load event is never heard.
  useEffect(() => {
    const image = avatarRef.current;
    if (image?.complete) setAvatar(image.naturalWidth > 0 ? "shown" : "gone");
  }, []);

  return (
    <div
      className="wr-stage wr-loading"
      data-format={config.format}
      data-shape={config.shape}
      aria-hidden
      style={
        {
          width: format.width,
          height: format.height,
          transform: `scale(${scale})`,
          ...paletteStyle(palette),
        } as CSSProperties
      }
    >
      <StageBackdrop mark={subject.mark} />

      <section className="wr-scene" data-on="" data-align="center">
        <div className="wr-frame">
          <div ref={yearRef} className="wr-load-year">
            {weeks.map((week, column) => (
              // oxlint-disable-next-line react/no-array-index-key -- one column per week, positional
              <span key={column} className="wr-load-week">
                {week.map((_level, day) => (
                  // oxlint-disable-next-line react/no-array-index-key -- one cell per day, positional
                  <i key={day} className="wr-cell" />
                ))}
                <span className="wr-load-lit" data-load-lit>
                  {week.map((level, day) => (
                    // oxlint-disable-next-line react/no-array-index-key -- one cell per day, positional
                    <i key={day} className="wr-cell" data-l={level} />
                  ))}
                </span>
              </span>
            ))}
            <span className="wr-load-beam" data-load-beam>
              <i />
              <i />
            </span>
          </div>
        </div>
        <div className="wr-load-lines wr-lede">
          {lines.map((line, index) => (
            <p key={line} data-on={index === on ? "" : undefined} data-past={index === past ? "" : undefined}>
              {line}
            </p>
          ))}
        </div>
      </section>

      <div className="wr-chrome">
        {subject.handle ? (
          <div className="wr-who">
            <div className="wr-avatar">
              <span>{initials(subject.handle)}</span>
              {subject.avatarUrl && avatar !== "gone" ? (
                <img
                  ref={avatarRef}
                  src={subject.avatarUrl}
                  alt=""
                  data-shown={avatar === "shown" ? "" : undefined}
                  onLoad={() => setAvatar("shown")}
                  onError={() => setAvatar("gone")}
                />
              ) : null}
            </div>
            <div>
              @{subject.handle}
              <small>{subject.caption}</small>
            </div>
          </div>
        ) : null}
        {subject.brand ? <div className="wr-brand">{subject.brand}</div> : null}
      </div>

      {config.grain ? <div className="wr-grain" aria-hidden /> : null}
    </div>
  );
}
