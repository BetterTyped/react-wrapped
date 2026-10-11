import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { FastForward, RotateCcw, ScanLine } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { readingSeconds } from "./motion";
import { RARITY_LABELS, type Rarity } from "./rarity";
import { type CalendarLevels, PIXEL_ART, type PixelArt } from "./scenes";
import type { WrappedPalette } from "./types";

gsap.registerPlugin(useGSAP);

/** A generated scene still hidden somewhere in the year. Where is up to the scan, new on every run. */
export interface HiddenDrop {
  id: string;
  name: string;
  rarity: Rarity;
  /** "Achievement", "Easter egg". */
  kind: string;
  line: string;
  art: PixelArt;
}

const BURST = 22;
const SPARKLES = 16;
/** Particles the cell throws when it cracks, reused for the found tiles' idle sparkle. */
const CRACK = 18;
/**
 * The legendary card's spinning foil border, in the theme's own legendary color: it, its lighter tint and white.
 * Never a fixed gold: a second hue on a green or purple year clashes.
 */
const foil = (tone: string) =>
  `conic-gradient(from 0deg, ${tone}, color-mix(in oklch, ${tone} 35%, white), ${tone}, color-mix(in oklch, ${tone} 60%, white), white, ${tone})`;
const FLYER_WIDTH = 300;
const FLYER_RATIO = 4 / 3;

interface Run {
  /** Changes on every run, so replaying the same drops starts a fresh timeline. */
  id: number;
  queue: readonly string[];
  /** A replay shows the finds again; nothing new joins the video. */
  replay: boolean;
}

/** A find opened from its badge or its tile: no scan, the card comes up and stays until it is closed. */
interface Peek {
  /** Changes on every click, so opening the same card twice starts a fresh timeline. */
  id: number;
  drop: string;
  /** What was clicked. The card comes out of it and goes back into it. */
  from: "badge" | "tile";
}

/** What keeps a legendary card alive while it is up: the turning foil border, the ray wheel, the shine, sparkles. */
function legendLoops(flight: HTMLElement): gsap.core.Animation[] {
  const legend = (selector: string) => flight.querySelectorAll<HTMLElement>(selector);
  return [
    gsap.to(legend("[data-legend-spin]"), { rotate: 360, duration: 2.4, ease: "none", repeat: -1 }),
    gsap.to(legend("[data-legend-rays]"), { rotate: -360, duration: 26, ease: "none", repeat: -1 }),
    // The shine starts and rests with its band wholly off the card: 115% is just off the left edge, -15% just off
    // the right. It used to run on to -130%, where the gradient's next copy had slid back onto the card and sat
    // there, lit, for the whole pause between sweeps.
    gsap.fromTo(
      legend("[data-legend-foil]"),
      { backgroundPosition: "115% 0", autoAlpha: 1 },
      { backgroundPosition: "-15% 0", duration: 0.9, ease: "power1.inOut", repeat: -1, repeatDelay: 1.2 },
    ),
    gsap.fromTo(
      legend("[data-legend-sparkles] i"),
      { scale: 0, autoAlpha: 0 },
      {
        keyframes: [
          { scale: 1, autoAlpha: 1, duration: 0.25 },
          { scale: 0, autoAlpha: 0, duration: 0.55 },
        ],
        stagger: { each: 0.12, repeat: -1, from: "random" },
      },
    ),
  ];
}

/** Pixel art outside the video: drawn with inline colours, so it needs no stage around it. */
export function PixelGlyph({ art, colour, cell = 11 }: { art: PixelArt; colour: string; cell?: number }) {
  return (
    <span className="grid grid-cols-9" style={{ gap: Math.max(1, Math.round(cell / 4)) }}>
      {art
        .join("")
        .split("")
        .map((char, index) => (
          <i
            // oxlint-disable-next-line react/no-array-index-key -- a fixed 9x9 grid
            key={index}
            className="rounded-[2px]"
            style={{
              width: cell,
              height: cell,
              background:
                char === "x"
                  ? colour
                  : char === "o"
                    ? `color-mix(in oklch, ${colour} 50%, transparent)`
                    : "rgb(255 255 255 / 0.06)",
            }}
          />
        ))}
    </span>
  );
}

/** A random active day nobody else is hiding on. Empty years fall back to any day. */
function pickSpot(levels: readonly number[], taken: readonly number[]): number {
  const active = levels.flatMap((level, day) => (level > 0 && !taken.includes(day) ? [day] : []));
  const pool = active.length > 0 ? active : levels.map((_level, day) => day).filter((day) => !taken.includes(day));
  return pool[Math.floor(Math.random() * pool.length)] ?? 0;
}

/** Waits a few frames for an element React is about to render. */
function whenRendered(selector: string, frames = 30): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    let left = frames;
    const look = () => {
      const match = document.querySelector<HTMLElement>(selector);
      if (match || left <= 0) {
        resolve(match);
        return;
      }
      left -= 1;
      requestAnimationFrame(look);
    };
    look();
  });
}

/**
 * The reveal for generated scenes: the person's own year, scanned. Until the
 * first pass the year is blank, cells shifting as if something moves under
 * them. A beam sweeps it, colouring each week as it goes, doubles back and
 * locks onto a random day. The cell flares, a card flies out to the middle of
 * the screen, turns over, and lands in its slot in the cut. The panel stays
 * afterwards: the finds are listed, and the scan can be run again.
 */
export function YearScan({
  calendar,
  palette,
  drops,
  found,
  onOpen,
  describeDay,
  actions,
  sessionKey = null,
}: {
  calendar: CalendarLevels;
  /** The video's palette, so the year looks the way it does in the video. */
  palette: WrappedPalette;
  /** Every generated scene, found or not, in the order they were rolled. */
  drops: readonly HiddenDrop[];
  found: readonly string[];
  onOpen: (id: string) => void;
  /** How a day reads on a card: "Mar 14". */
  describeDay: (day: number) => string;
  /** Extra buttons in the header, like the full list of achievements. */
  actions?: ReactNode;
  /** Where this visit remembers each find's day, so replays reopen the same tiles. Null keeps it in memory. */
  sessionKey?: string | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  // Looping effects (the legendary foil and sparkles) live outside the timeline, so they are stopped by hand.
  const loopsRef = useRef<gsap.core.Animation[]>([]);
  const skipRef = useRef<(() => void) | null>(null);
  const cardRef = useRef<(() => void) | null>(null);
  // The backdrop: stops the whole scan. Set while a card is up.
  const stopRef = useRef<(() => void) | null>(null);
  // Once stopping, the card on screen still lands, but no further one is opened.
  const stoppingRef = useRef(false);
  const beamColumnRef = useRef(0);
  const [run, setRun] = useState<Run | null>(null);
  const [step, setStep] = useState(0);
  const [peek, setPeek] = useState<Peek | null>(null);
  // The year stays blank until a scan has passed over it once.
  const [veiled, setVeiled] = useState(true);
  // Where each find hides: random the first time, then the same tile for the rest of the visit.
  const [spots, setSpots] = useState<Record<string, number>>({});
  const spotsLoadedRef = useRef(false);

  useEffect(() => {
    if (!sessionKey) return;
    try {
      const raw = window.sessionStorage.getItem(sessionKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        const restored = Object.fromEntries(
          Object.entries(parsed).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
        );
        // What this visit already found wins over anything placed before storage was read.
        setSpots((now) => ({ ...now, ...restored }));
      }
    } catch {
      // Blocked storage: the spots live for this page only.
    }
    spotsLoadedRef.current = true;
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey || !spotsLoadedRef.current) return;
    try {
      window.sessionStorage.setItem(sessionKey, JSON.stringify(spots));
    } catch {
      // Blocked storage: nothing to keep.
    }
  }, [sessionKey, spots]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pending = drops.filter((drop) => !found.includes(drop.id));
  const currentId = run ? run.queue[step] : peek?.drop;
  const current = drops.find((drop) => drop.id === currentId) ?? null;
  const total = calendar.lead + calendar.levels.length;
  const columns = Math.ceil(total / 7);

  // Finds from an earlier visit get a place in the year, and the year shows.
  useEffect(() => {
    if (run || found.length === 0) return;
    setVeiled(false);
    setSpots((now) => {
      const next = { ...now };
      for (const id of found) {
        if (next[id] === undefined) next[id] = pickSpot(calendar.levels, Object.values(next));
      }
      return next;
    });
  }, [found, run, calendar.levels]);

  // While blank and idle, the year twitches now and then: something is in there. Web Animations, not GSAP: a
  // GSAP tween reads the cell's computed transform first, and with the video restyling the page every frame that
  // one read costs a whole-page style pass. Only while the panel is on screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !veiled || run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cells = [...root.querySelectorAll<HTMLElement>("[data-cell][data-day]")];
    if (cells.length === 0) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const twitch = () => {
      for (let index = 0; index < 4; index += 1) {
        const cell = cells[Math.floor(Math.random() * cells.length)];
        const dx = (Math.random() * 2 - 1).toFixed(1);
        cell.animate(
          [
            { transform: "none" },
            { transform: `translate(${dx}px, -1px)` },
            { transform: `translate(${-dx}px, 1px)` },
            { transform: "none" },
          ],
          { duration: 300, easing: "ease-out" },
        );
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !timer) timer = setInterval(twitch, 220);
      if (!entry?.isIntersecting && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [veiled, run]);

  // A finished year keeps a little life: now and then a found tile throws a few sparks. Web Animations on the crack
  // particles already in the panel, so nothing is inserted and nothing reads computed styles.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || veiled || run || found.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sparks = [...root.querySelectorAll<HTMLElement>("[data-scan-crack] i")].slice(0, 6);
    let timer: ReturnType<typeof setInterval> | null = null;
    const spark = () => {
      const tiles = [...root.querySelectorAll<HTMLElement>("[data-found]")];
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      if (!tile) return;
      const colour = tile.style.getPropertyValue("--found");
      const x = tile.offsetLeft + tile.offsetWidth / 2;
      const y = tile.offsetTop + tile.offsetHeight / 2;
      sparks.forEach((particle, index) => {
        const angle = (index / sparks.length) * Math.PI * 2 + Math.random();
        const reach = 18 + Math.random() * 22;
        Object.assign(particle.style, { left: `${x}px`, top: `${y}px`, background: colour });
        particle.animate(
          [
            { transform: "translate(0, 0) scale(0.5)", opacity: 1, visibility: "visible" },
            {
              transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach}px) scale(1)`,
              opacity: 0,
              visibility: "visible",
            },
          ],
          { duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !timer) timer = setInterval(spark, 1700);
      if (!entry?.isIntersecting && timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [veiled, run, found.length]);

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      const flight = flightRef.current;
      if (!root || !flight || !run || !current || !contextSafe) return;
      const grid = root.querySelector<HTMLElement>("[data-scan-grid]");
      const beam = root.querySelector<HTMLElement>("[data-scan-beam]");
      const reticle = root.querySelector<HTMLElement>("[data-scan-reticle]");
      const band = root.querySelector<HTMLElement>("[data-scan-band]");
      const ring = root.querySelector<HTMLElement>("[data-scan-ring]");
      const backdrop = flight.querySelector<HTMLElement>("[data-flight-backdrop]");
      const flyer = flight.querySelector<HTMLElement>("[data-flyer]");
      const inner = flight.querySelector<HTMLElement>("[data-flyer-inner]");
      const back = flight.querySelector<HTMLElement>("[data-flyer-back]");
      const rays = flight.querySelector<HTMLElement>("[data-flyer-rays]");
      if (!grid || !beam || !reticle || !band || !ring || !backdrop || !flyer || !inner || !back || !rays) return;

      const cells = [...grid.querySelectorAll<HTMLElement>("[data-cell]")];
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const colour = palette.rarity[current.rarity];
      const loud = current.rarity === "epic" || current.rarity === "legendary";
      const { replay } = run;
      const isLast = step + 1 >= run.queue.length;

      // Where it hides: the tile it was found on before, or a random one nobody else holds.
      const day =
        spots[current.id] ??
        pickSpot(
          calendar.levels,
          Object.entries(spots)
            .filter(([id]) => id !== current.id)
            .map(([, taken]) => taken),
        );
      const slot = calendar.lead + day;
      const hit = cells[slot];
      const target = Math.floor(slot / 7);

      // Geometry, in the grid's own pixels: where a (fractional) column sits.
      const columnLeft = (column: number) => cells[Math.min(cells.length - 1, column * 7)]?.offsetLeft ?? 0;
      const cellWidth = hit.offsetWidth;
      // A quick setter: moving the beam every frame must not build (and style-read) a tween every frame.
      const setBeamX = gsap.quickSetter(beam, "x", "px");
      const placeBeam = (column: number) => {
        const low = Math.floor(column);
        const high = Math.min(columns - 1, low + 1);
        const left = columnLeft(low) + (columnLeft(high) - columnLeft(low)) * (column - low);
        setBeamX(left + cellWidth / 2);
      };
      let lastColumn = -1;
      const sweep = { column: beamColumnRef.current };
      const onSweep = () => {
        placeBeam(sweep.column);
        const column = Math.round(sweep.column);
        if (column === lastColumn) return;
        lastColumn = column;
        const week = cells.slice(column * 7, column * 7 + 7).filter((cell) => cell.dataset.day !== undefined);
        // The first pass colours the year in; later passes make it shimmer.
        for (const cell of week) cell.dataset.lit = "";
        // Light only: tiles never change size, so they never spill over their neighbours.
        gsap.fromTo(
          week,
          { filter: "brightness(1.9)" },
          { filter: "brightness(1)", duration: 0.55, ease: "power2.out", overwrite: "auto" },
        );
      };

      const tl = gsap.timeline();
      timelineRef.current = tl;
      tl.set([reticle, band, ring], { autoAlpha: 0 });
      tl.set(beam, { autoAlpha: 1 });
      placeBeam(sweep.column);

      if (reduced) {
        tl.call(() => setVeiled(false));
      } else {
        if (veiled) {
          // The first pass reads the whole year, edge to edge, then doubles back.
          tl.set(sweep, { column: 0 });
          tl.to(sweep, { column: columns - 1, duration: 1.7, ease: "sine.inOut", onUpdate: onSweep });
          tl.call(() => setVeiled(false));
        } else {
          const away = target > columns / 2 ? -1 : 1;
          const past = Math.max(0, Math.min(columns - 1, target + away * gsap.utils.random(6, 12, 1)));
          tl.to(sweep, {
            column: past,
            duration: Math.max(0.5, Math.abs(past - sweep.column) * 0.03),
            ease: "sine.inOut",
            onUpdate: onSweep,
          });
        }
        tl.to(sweep, { column: target, duration: 0.85, ease: "power3.inOut", onUpdate: onSweep });
      }
      tl.call(() => {
        beamColumnRef.current = target;
        placeBeam(target);
        setSpots((now) => ({ ...now, [current.id]: day }));
      });

      // The lock: a band along the row, a reticle closing in on the day.
      const cx = hit.offsetLeft + hit.offsetWidth / 2;
      const cy = hit.offsetTop + hit.offsetHeight / 2;
      const reach = hit.offsetWidth + 14;
      tl.set(band, { top: hit.offsetTop - 3, height: hit.offsetHeight + 6, transformOrigin: `${cx}px 50%` });
      tl.set(reticle, { width: reach, height: reach });
      tl.fromTo(band, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.35, ease: "power3.out" });
      tl.fromTo(
        reticle,
        { left: cx, top: cy, scale: 3, rotate: 45, autoAlpha: 0 },
        { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
        "<",
      );
      // Two ticks of the reticle; the cell itself stays its size.
      tl.to(reticle, { scale: 1.12, duration: 0.09, yoyo: true, repeat: 3, ease: "power1.inOut" });

      // The crack: the cell pops in its rarity, throws sparks, a ring rolls out, and the rare ones flash the panel.
      tl.set(hit, { "--hit": colour, attr: { "data-hit": "" } } as gsap.TweenVars);
      tl.fromTo(
        ring,
        { left: cx, top: cy, scale: 0, autoAlpha: 1, boxShadow: `0 0 0 3px ${colour}` },
        { scale: 1, autoAlpha: 0, duration: 0.8, ease: "expo.out" },
        "<",
      );
      tl.fromTo(
        root.querySelectorAll("[data-scan-crack] i"),
        { left: cx, top: cy, x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
        {
          x: (index: number) => Math.cos((index / CRACK) * Math.PI * 2) * (60 + ((index * 37) % 80)),
          y: (index: number) => Math.sin((index / CRACK) * Math.PI * 2) * (40 + ((index * 23) % 50)),
          scale: 1,
          autoAlpha: 0,
          duration: 0.95,
          ease: "expo.out",
          // To-vars, or the sparks are drawn at the cell the moment the timeline is built and give the spot away.
          immediateRender: false,
        },
        "<",
      );
      if (loud) {
        tl.fromTo(
          root.querySelector("[data-scan-flash]"),
          { autoAlpha: 0 },
          {
            keyframes: [
              { autoAlpha: 0.7, duration: 0.08 },
              { autoAlpha: 0, duration: 0.7 },
            ],
          },
          "<",
        );
        tl.to(grid, { keyframes: [{ x: -5 }, { x: 5 }, { x: -3 }, { x: 0 }], duration: 0.24 }, "<");
      }
      tl.to([beam, band, reticle], { autoAlpha: 0, duration: 0.3 }, "<");

      // The card leaves the cell for the middle of the screen, face down.
      const width = Math.min(FLYER_WIDTH, window.innerWidth * 0.78);
      const height = width * FLYER_RATIO;
      const centre = { x: window.innerWidth / 2 - width / 2, y: window.innerHeight / 2 - height / 2 };
      // Measured the moment the card leaves, so scrolling during the sweep cannot throw it off.
      const launch = { x: 0, y: 0, scale: 0.05 };
      const measureLaunch = () => {
        const from = hit.getBoundingClientRect();
        launch.x = from.left + from.width / 2 - width / 2;
        launch.y = from.top + from.height / 2 - height / 2;
        launch.scale = Math.max(0.04, from.width / width);
      };
      tl.set(flyer, { width, height });
      tl.set(inner, { rotateY: 180 });
      tl.set(back, { boxShadow: "inset 0 0 0 2px rgb(255 255 255 / 0.14)" });
      // The crack plays out on an undimmed panel first; then the room darkens and the card leaves.
      tl.call(measureLaunch, undefined, "+=0.15");
      tl.set(backdrop, { pointerEvents: "auto" }, "<");
      tl.to(backdrop, { autoAlpha: 1, duration: 0.4 }, "<");
      tl.fromTo(
        flyer,
        {
          x: () => launch.x,
          y: () => launch.y,
          scale: () => launch.scale,
          rotate: 0,
          autoAlpha: 1,
        },
        {
          x: centre.x,
          y: centre.y,
          scale: 1,
          rotate: gsap.utils.random(-4, 4),
          duration: reduced ? 0.01 : 0.75,
          ease: "expo.out",
          // In a fromTo this belongs in the to-vars: the launch is measured when the card leaves, not when built.
          immediateRender: false,
        },
        "<",
      );
      // It hums before it turns: longer and louder the rarer it is.
      tl.to(back, {
        boxShadow: `inset 0 0 0 2px ${colour}, 0 0 70px 12px ${colour}`,
        duration: 0.5,
        ease: "power2.out",
      });
      if (!reduced) {
        tl.to(
          flyer,
          {
            keyframes: loud
              ? [{ x: centre.x - 5 }, { x: centre.x + 5 }, { x: centre.x - 4 }, { x: centre.x + 4 }, { x: centre.x }]
              : [{ y: centre.y - 8 }, { y: centre.y }],
            duration: current.rarity === "legendary" ? 0.7 : 0.4,
            ease: "none",
          },
          "<0.2",
        );
      }
      // The turn. A click on the face-down card jumps straight here.
      tl.addLabel("turn");
      tl.to(flyer, { rotate: 0, duration: 0.5, ease: "back.out(1.6)" });
      tl.to(
        inner,
        {
          rotateY: 0,
          duration: reduced ? 0.01 : 0.6,
          ease: "back.out(1.4)",
        },
        "<",
      );
      tl.fromTo(
        flight.querySelectorAll("[data-flyer-burst] i"),
        { x: 0, y: 0, scale: 0.6, autoAlpha: 1 },
        {
          x: (index: number) => Math.cos((index / BURST) * Math.PI * 2) * (width * 0.7 + ((index * 37) % 90)),
          y: (index: number) => Math.sin((index / BURST) * Math.PI * 2) * (height * 0.55 + ((index * 23) % 70)),
          scale: 1,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          immediateRender: false,
        },
        "<0.2",
      );
      if (loud) {
        tl.fromTo(rays, { autoAlpha: 0, rotate: 0, scale: 0.6 }, { autoAlpha: 0.9, scale: 1, duration: 0.5 }, "<");
        tl.to(rays, { rotate: 60, duration: 2.6, ease: "none" }, "<");
      }
      // Legendary gets the full show: a flash, shockwaves, a second ray wheel, a living foil border and sparkles.
      const legendary = current.rarity === "legendary" && !reduced;
      const legend = (selector: string) => flight.querySelectorAll<HTMLElement>(selector);
      if (legendary) {
        tl.fromTo(
          legend("[data-legend-flash]"),
          { autoAlpha: 0 },
          {
            keyframes: [
              { autoAlpha: 0.9, duration: 0.08 },
              { autoAlpha: 0, duration: 1 },
            ],
          },
          "<",
        );
        tl.fromTo(
          legend("[data-legend-wave]"),
          { scale: 0.2, autoAlpha: 1 },
          { scale: 4.5, autoAlpha: 0, duration: 1.3, ease: "expo.out", stagger: 0.2 },
          "<",
        );
        tl.fromTo(
          legend("[data-legend-rays]"),
          { autoAlpha: 0, rotate: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1.1, duration: 0.7, ease: "expo.out" },
          "<",
        );
        tl.fromTo(legend("[data-legend-border]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "<0.2");
        tl.call(
          contextSafe(() => {
            loopsRef.current.push(...legendLoops(flight));
          }),
          undefined,
          "<",
        );
      }
      tl.from(
        flight.querySelectorAll("[data-flyer-line]"),
        { y: 14, autoAlpha: 0, duration: 0.45, ease: "expo.out", stagger: 0.06 },
        "<0.15",
      );
      // The scene joins the video while the card sits face up: the re-render and the timeline rebuild happen now,
      // not when the viewer clicks, so the card can leave the instant they do.
      let opened = replay;
      const openScene = () => {
        if (opened) return;
        opened = true;
        onOpen(current.id);
      };
      tl.call(openScene, undefined, "+=0.15");
      // Face up for as long as this card's own text takes to read, and never less than its show takes to play out.
      const read = readingSeconds([
        current.name,
        RARITY_LABELS[current.rarity],
        current.line,
        `Found on ${describeDay(day)}`,
      ]);
      tl.to({}, { duration: Math.max(read, reduced ? 1 : legendary ? 2.65 : 1.75) });
      // A click on the backdrop skips straight to the card leaving for its slot.
      skipRef.current = () => {
        if (tl.progress() < 1) tl.progress(1);
      };
      // The card itself: still face down, a click turns it now; once the turn has begun, a click sends it home.
      cardRef.current = () => {
        if (tl.time() < tl.labels.turn) tl.play("turn");
        else skipRef.current?.();
      };
      // The backdrop stops the scan altogether. A card already turned over has been found, so it still lands; one
      // still face down is put back unopened. Either way nothing else is opened until the scan is run again.
      stopRef.current = contextSafe(() => {
        stoppingRef.current = true;
        if (tl.time() >= tl.labels.turn) {
          skipRef.current?.();
          return;
        }
        tl.kill();
        skipRef.current = null;
        cardRef.current = null;
        stopRef.current = null;
        stoppingRef.current = false;
        gsap.to([backdrop, flyer, rays], { autoAlpha: 0, duration: 0.25 });
        gsap.set(backdrop, { pointerEvents: "none" });
        gsap.set([beam, band, reticle], { autoAlpha: 0 });
        hit.removeAttribute("data-hit");
        setRun(null);
        setStep(0);
      });

      // Into the cut: the scene joins the video, and the card lands in its slot.
      const land = contextSafe(async () => {
        openScene();
        const slotCard = await whenRendered(`[data-seg="drop-${current.id}"] [data-seg-bar]`);
        const finish = () => {
          gsap.set(backdrop, { pointerEvents: "none" });
          hit.removeAttribute("data-hit");
          const stop = stoppingRef.current;
          stoppingRef.current = false;
          if (isLast || stop) {
            setRun(null);
            setStep(0);
          } else setStep(step + 1);
        };
        skipRef.current = null;
        cardRef.current = null;
        stopRef.current = null;
        for (const loop of loopsRef.current) loop.kill();
        loopsRef.current = [];
        const out = gsap.timeline({ onComplete: finish });
        out.to(backdrop, { autoAlpha: 0, duration: 0.45 });
        out.to(rays, { autoAlpha: 0, duration: 0.3 }, "<");
        out.to(
          legend("[data-legend-rays], [data-legend-border], [data-legend-sparkles] i, [data-legend-foil]"),
          { autoAlpha: 0, duration: 0.3 },
          "<",
        );
        if (!slotCard || reduced) {
          out.to(flyer, { autoAlpha: 0, scale: 0.9, duration: 0.3 }, "<");
          return;
        }
        const to = slotCard.getBoundingClientRect();
        out.to(
          flyer,
          {
            x: to.left + to.width / 2 - width / 2,
            y: to.top + to.height / 2 - height / 2,
            scale: to.width / width,
            duration: 0.6,
            ease: "power3.inOut",
          },
          "<",
        );
        out.to(flyer, { autoAlpha: 0, duration: 0.18 }, ">-0.18");
        if (replay) {
          out.fromTo(
            slotCard,
            { boxShadow: `0 0 0 2px ${colour}, 0 0 40px 4px ${colour}` },
            { boxShadow: "0 0 0 0px transparent", duration: 1, clearProps: "boxShadow" },
          );
        }
      });
      tl.call(() => void land());
    },
    { dependencies: [run?.id, step] },
  );

  // A find opened from its badge or its tile. No scan and no turn: the card comes up out of what was clicked, face
  // up, and stays until a click on it, a click on the backdrop or Escape sends it back.
  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      const flight = flightRef.current;
      if (!root || !flight || !peek || !current || !contextSafe) return;
      const origin = root.querySelector<HTMLElement>(`[data-find-${peek.from}="${current.id}"]`);
      const backdrop = flight.querySelector<HTMLElement>("[data-flight-backdrop]");
      const flyer = flight.querySelector<HTMLElement>("[data-flyer]");
      const inner = flight.querySelector<HTMLElement>("[data-flyer-inner]");
      const rays = flight.querySelector<HTMLElement>("[data-flyer-rays]");
      const card = flight.querySelector<HTMLElement>("[data-flyer-card]");
      if (!origin || !backdrop || !flyer || !inner || !rays || !card) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const loud = current.rarity === "epic" || current.rarity === "legendary";
      const legendary = current.rarity === "legendary" && !reduced;
      const legend = (selector: string) => flight.querySelectorAll<HTMLElement>(selector);
      const width = Math.min(FLYER_WIDTH, window.innerWidth * 0.78);
      const height = width * FLYER_RATIO;
      // Measured when the card leaves and again when it goes back: the page may scroll while it is up.
      const home = () => {
        const at = origin.getBoundingClientRect();
        return {
          x: at.left + at.width / 2 - width / 2,
          y: at.top + at.height / 2 - height / 2,
          scale: Math.max(0.04, at.height / height),
        };
      };

      // A card still on its way back from an earlier click is dropped where it is.
      timelineRef.current?.kill();
      for (const loop of loopsRef.current) loop.kill();
      loopsRef.current = [];
      gsap.set(flyer, { width, height, rotate: 0, autoAlpha: 1, ...home() });
      gsap.set(inner, { rotateY: 0 });
      gsap.set(rays, { autoAlpha: 0 });
      gsap.set(backdrop, { pointerEvents: "auto" });

      const tl = gsap.timeline();
      timelineRef.current = tl;
      tl.to(backdrop, { autoAlpha: 1, duration: 0.3 });
      tl.to(
        flyer,
        {
          x: window.innerWidth / 2 - width / 2,
          y: window.innerHeight / 2 - height / 2,
          scale: 1,
          duration: reduced ? 0.01 : 0.45,
          ease: "expo.out",
        },
        "<",
      );
      tl.fromTo(
        flight.querySelectorAll("[data-flyer-line]"),
        { y: 10, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, ease: "expo.out", stagger: 0.04 },
        "<0.1",
      );
      if (loud) {
        tl.fromTo(rays, { autoAlpha: 0, rotate: 0, scale: 0.6 }, { autoAlpha: 0.9, scale: 1, duration: 0.5 }, "<");
      }
      if (legendary) {
        tl.fromTo(
          legend("[data-legend-rays]"),
          { autoAlpha: 0, rotate: 0, scale: 0.4 },
          { autoAlpha: 1, scale: 1.1, duration: 0.7, ease: "expo.out" },
          "<",
        );
        tl.fromTo(legend("[data-legend-border]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "<");
      }
      // The card can stay up for as long as it likes, so what moves around it loops instead of running out.
      tl.call(
        contextSafe(() => {
          if (loud && !reduced) {
            loopsRef.current.push(gsap.to(rays, { rotate: 360, duration: 16, ease: "none", repeat: -1 }));
          }
          if (legendary) loopsRef.current.push(...legendLoops(flight));
        }),
        undefined,
        "<",
      );

      const keys = new AbortController();
      const close = contextSafe(() => {
        keys.abort();
        cardRef.current = null;
        stopRef.current = null;
        tl.kill();
        for (const loop of loopsRef.current) loop.kill();
        loopsRef.current = [];
        gsap.set(backdrop, { pointerEvents: "none" });
        const out = gsap.timeline({ onComplete: () => setPeek(null) });
        timelineRef.current = out;
        out.to(backdrop, { autoAlpha: 0, duration: 0.3 });
        out.to(
          [rays, ...legend("[data-legend-rays], [data-legend-border], [data-legend-sparkles] i, [data-legend-foil]")],
          { autoAlpha: 0, duration: 0.2 },
          "<",
        );
        out.to(flyer, { ...home(), duration: reduced ? 0.01 : 0.32, ease: "power3.in" }, "<");
        out.to(flyer, { autoAlpha: 0, duration: 0.12 }, ">-0.12");
        origin.focus({ preventScroll: true });
      });
      cardRef.current = close;
      stopRef.current = close;
      window.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") close();
        },
        { signal: keys.signal },
      );
      // Enter and Space close it too, and a second Enter does not reopen what is underneath.
      card.focus({ preventScroll: true });
      return () => keys.abort();
    },
    { dependencies: [peek?.id] },
  );

  const startRun = (queue: readonly string[], replay: boolean) => {
    if (queue.length === 0) return;
    if (replay) {
      // A replay starts from a blank year; each find comes out of the same tile as before.
      for (const cell of rootRef.current?.querySelectorAll<HTMLElement>("[data-lit]") ?? []) delete cell.dataset.lit;
      setVeiled(true);
    }
    setStep(0);
    setRun({ id: Date.now(), queue, replay });
  };

  const findAll = () => {
    timelineRef.current?.kill();
    for (const loop of loopsRef.current) loop.kill();
    loopsRef.current = [];
    skipRef.current = null;
    const flight = flightRef.current;
    if (flight) {
      gsap.to(flight.querySelectorAll("[data-flight-backdrop], [data-flyer], [data-flyer-rays], [data-legend-rays]"), {
        autoAlpha: 0,
        duration: 0.25,
      });
      gsap.set(flight.querySelector("[data-flight-backdrop]"), { pointerEvents: "none" });
    }
    const root = rootRef.current;
    if (root) {
      gsap.set(root.querySelectorAll("[data-scan-beam], [data-scan-band], [data-scan-reticle]"), { autoAlpha: 0 });
    }
    const next = { ...spots };
    for (const drop of pending) {
      if (next[drop.id] === undefined) next[drop.id] = pickSpot(calendar.levels, Object.values(next));
      onOpen(drop.id);
    }
    setSpots(next);
    setVeiled(false);
    setRun(null);
    setStep(0);
  };

  if (drops.length === 0) return null;
  const allFound = pending.length === 0;
  const markers = new Map(
    drops.flatMap((drop) =>
      found.includes(drop.id) && spots[drop.id] !== undefined ? [[spots[drop.id], drop] as const] : [],
    ),
  );
  const shownDay = current ? spots[current.id] : undefined;
  const left = run ? run.queue.length - step - 1 : 0;

  let headline = `Your year is hiding ${drops.length} ${drops.length === 1 ? "scene" : "scenes"}.`;
  if (run) {
    if (run.replay) headline = "Scanning your year again.";
    else headline = left > 0 ? `Scanning your year. ${left} more after this one.` : "Scanning for the last one.";
  } else if (allFound) headline = `You found all ${drops.length}.`;
  else if (found.length > 0)
    headline = `${pending.length} more ${pending.length === 1 ? "is" : "are"} hiding in your year.`;

  let button: ReactNode = (
    <button
      type="button"
      onClick={() =>
        startRun(
          pending.map((drop) => drop.id),
          false,
        )
      }
      disabled={peek !== null}
      className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-transform hover:-translate-y-px"
      style={{ background: palette.levels[4], color: palette.bg }}
    >
      <ScanLine className="size-4" />
      {found.length > 0 ? "Keep scanning" : "Scan my year"}
    </button>
  );
  if (run) {
    button =
      !run.replay && left > 0 ? (
        <button
          type="button"
          onClick={findAll}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-semibold ring-1 ring-current/25"
        >
          <FastForward className="size-4" />
          Find all
        </button>
      ) : null;
  } else if (allFound) {
    button = (
      <button
        type="button"
        onClick={() =>
          startRun(
            drops.map((drop) => drop.id),
            true,
          )
        }
        disabled={peek !== null}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[14px] font-semibold ring-1 ring-current/25 transition-transform hover:-translate-y-px"
      >
        <RotateCcw className="size-4" />
        Scan again
      </button>
    );
  }

  const tone = current ? palette.rarity[current.rarity] : palette.fg;

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-[28px] p-4 md:p-6"
      style={{ background: palette.bg, color: palette.fg } as CSSProperties}
    >
      <div
        data-scan-flash
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ background: `radial-gradient(circle at 50% 60%, ${tone}, transparent 70%)` }}
      />
      <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[clamp(1.25rem,1.8vw,1.625rem)] font-semibold leading-tight tracking-[-0.03em]">
            {headline}
          </p>
          <p className="mt-1 text-[14.5px]" style={{ color: palette.muted }}>
            {allFound
              ? "They are in your video now. Run the scan again to watch them come out."
              : "Achievements you earned and a few easter eggs. Each one joins your video when the scan finds it."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {button}
        </div>
      </div>

      <div className="relative">
        <div
          data-scan-grid
          data-veiled={veiled ? "" : undefined}
          className="relative grid grid-flow-col gap-[3px]"
          style={
            {
              gridTemplateRows: "repeat(7, auto)",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              "--blank": palette.levels[0],
            } as CSSProperties
          }
        >
          {Array.from({ length: total }, (_unused, slot) => {
            const day = slot - calendar.lead;
            if (day < 0) {
              // oxlint-disable-next-line react/no-array-index-key -- one cell per slot, positional
              return (
                <i
                  key={slot}
                  data-cell
                  className="aspect-square rounded-[22%]"
                  style={{ background: palette.levels[0] }}
                />
              );
            }
            const marker = veiled ? undefined : markers.get(day);
            return (
              <i
                // oxlint-disable-next-line react/no-array-index-key -- one cell per day, positional
                key={slot}
                data-cell
                data-day={day}
                className="relative aspect-square rounded-[22%] transition-[background-color] duration-200 in-data-veiled:not-data-lit:bg-(--blank)! data-hit:z-10 data-hit:shadow-[0_0_0_2px_var(--hit),0_0_18px_3px_var(--hit)]"
                data-found={marker ? "" : undefined}
                style={
                  {
                    background: palette.levels[Math.max(0, calendar.levels[day])],
                    "--found": marker ? palette.rarity[marker.rarity] : undefined,
                    boxShadow: marker
                      ? `0 0 0 2px ${palette.rarity[marker.rarity]}, 0 0 14px 2px ${palette.rarity[marker.rarity]}`
                      : undefined,
                    zIndex: marker ? 5 : undefined,
                  } as CSSProperties
                }
              >
                {marker ? (
                  // Inside the tile, so the tile itself is never swapped for another element mid-scan.
                  <button
                    type="button"
                    data-find-tile={marker.id}
                    disabled={run !== null}
                    onClick={() => setPeek({ id: Date.now(), drop: marker.id, from: "tile" })}
                    aria-label={`Open ${marker.name}`}
                    title={marker.name}
                    className="absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-default"
                  />
                ) : null}
              </i>
            );
          })}
          <i
            data-scan-band
            aria-hidden
            className="pointer-events-none absolute inset-x-0 rounded-full opacity-0"
            style={{
              background: `linear-gradient(90deg, transparent, color-mix(in oklch, ${tone} 30%, transparent) 50%, transparent)`,
            }}
          />
          <i
            data-scan-reticle
            aria-hidden
            className="pointer-events-none absolute z-20 size-7 -translate-x-1/2 -translate-y-1/2 rounded-[7px] opacity-0"
            style={{ boxShadow: `0 0 0 2px ${tone}` }}
          />
          <i
            data-scan-ring
            aria-hidden
            className="pointer-events-none absolute z-20 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          />
          <span aria-hidden data-scan-crack className="pointer-events-none absolute inset-0 z-20">
            {Array.from({ length: CRACK }, (_unused, index) => (
              <i
                // oxlint-disable-next-line react/no-array-index-key -- particles are positional
                key={index}
                className="absolute -m-1 size-2 rounded-[2px] opacity-0"
                style={{ background: tone }}
              />
            ))}
          </span>
        </div>
        <span data-scan-beam aria-hidden className="pointer-events-none absolute -inset-y-2 left-0 w-0 opacity-0">
          <i
            className="absolute inset-y-0 -left-5 w-10"
            style={{
              background: `linear-gradient(90deg, transparent, color-mix(in oklch, ${palette.levels[4]} 22%, transparent) 50%, transparent)`,
            }}
          />
          <i
            className="absolute inset-y-0 -left-px w-0.5 rounded-full"
            style={{ background: palette.fg, boxShadow: `0 0 10px 1px ${palette.levels[4]}` }}
          />
        </span>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Your finds">
        {drops.map((drop) => {
          const spot = found.includes(drop.id) && !veiled ? spots[drop.id] : undefined;
          const colour = palette.rarity[drop.rarity];
          return (
            <li key={drop.id}>
              {spot === undefined ? (
                <span
                  className="flex items-center gap-2.5 rounded-[14px] py-1.5 pr-3.5 pl-1.5"
                  style={{ background: palette.card, color: palette.muted }}
                >
                  <span className="rounded-[9px] p-1.5" style={{ background: palette.bg }}>
                    <PixelGlyph art={PIXEL_ART.question} colour={palette.muted} cell={3} />
                  </span>
                  <span className="text-[13px] font-semibold">Still hidden</span>
                </span>
              ) : (
                <button
                  type="button"
                  data-find-badge={drop.id}
                  disabled={run !== null}
                  onClick={() => setPeek({ id: Date.now(), drop: drop.id, from: "badge" })}
                  title="Open this card"
                  className="flex cursor-pointer items-center gap-2.5 rounded-[14px] py-1.5 pr-3.5 pl-1.5 text-left transition-transform hover:-translate-y-px disabled:cursor-default"
                  style={{
                    background: `color-mix(in oklch, ${colour} 14%, ${palette.card})`,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${colour} 40%, transparent)`,
                  }}
                >
                  <span
                    className="rounded-[9px] p-1.5"
                    style={{ background: `color-mix(in oklch, ${colour} 10%, ${palette.bg})` }}
                  >
                    <PixelGlyph art={drop.art} colour={colour} cell={3} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight">{drop.name}</span>
                    <span className="block text-[11.5px]" style={{ color: palette.muted }}>
                      {describeDay(spot)}
                    </span>
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {mounted
        ? createPortal(
            <div ref={flightRef} className="pointer-events-none fixed inset-0 z-[80]" aria-live="polite">
              <div
                data-flight-backdrop
                aria-hidden
                onClick={() => stopRef.current?.()}
                className="absolute inset-0 opacity-0"
                style={{
                  background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, ${tone} 28%, transparent), transparent 55%), rgb(8 8 10 / 0.62)`,
                  backdropFilter: "blur(3px)",
                }}
              />
              <div
                data-flyer-rays
                aria-hidden
                className="absolute top-1/2 left-1/2 -mt-[45vmin] -ml-[45vmin] size-[90vmin] rounded-full opacity-0"
                style={{
                  background: `repeating-conic-gradient(from 0deg, color-mix(in oklch, ${tone} 30%, transparent) 0deg 8deg, transparent 8deg 24deg)`,
                  maskImage: "radial-gradient(circle, black 20%, transparent 70%)",
                }}
              />
              {current?.rarity === "legendary" ? (
                <>
                  <div
                    data-legend-rays
                    aria-hidden
                    className="absolute top-1/2 left-1/2 -mt-[60vmin] -ml-[60vmin] size-[120vmin] rounded-full opacity-0"
                    style={{
                      background: `repeating-conic-gradient(from 6deg, color-mix(in oklch, ${tone} 28%, transparent) 0deg 3deg, transparent 3deg 15deg)`,
                      maskImage: "radial-gradient(circle, black 15%, transparent 68%)",
                    }}
                  />
                  <div
                    data-legend-flash
                    aria-hidden
                    className="absolute inset-0 opacity-0"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, color-mix(in oklch, ${tone} 55%, white), color-mix(in oklch, ${tone} 25%, transparent) 45%, transparent 75%)`,
                    }}
                  />
                </>
              ) : null}
              <div data-flyer className="invisible absolute top-0 left-0 opacity-0 [perspective:1100px]">
                {current?.rarity === "legendary" ? (
                  <>
                    {[0, 1].map((wave) => (
                      <i
                        key={wave}
                        data-legend-wave
                        aria-hidden
                        className="absolute top-1/2 left-1/2 -mt-[50%] -ml-[50%] aspect-square w-full rounded-full opacity-0"
                        style={{
                          boxShadow: `0 0 0 3px ${tone}, 0 0 40px 6px color-mix(in oklch, ${tone} 60%, transparent)`,
                        }}
                      />
                    ))}
                    <span aria-hidden data-legend-sparkles className="absolute inset-0">
                      {Array.from({ length: SPARKLES }, (_unused, index) => {
                        const angle = (index / SPARKLES) * Math.PI * 2;
                        const reach = 0.62 + ((index * 37) % 20) / 100;
                        return (
                          <i
                            // oxlint-disable-next-line react/no-array-index-key -- sparkles are positional
                            key={index}
                            className="absolute -m-1.5 size-3 rotate-45 rounded-[2px] opacity-0"
                            style={{
                              left: `${50 + Math.cos(angle) * reach * 100}%`,
                              top: `${50 + Math.sin(angle) * reach * 80}%`,
                              background: `color-mix(in oklch, ${tone} 30%, white)`,
                              boxShadow: `0 0 12px 3px ${tone}`,
                            }}
                          />
                        );
                      })}
                    </span>
                    <div
                      data-legend-border
                      aria-hidden
                      className="absolute -inset-[4px] overflow-hidden rounded-[32px] opacity-0"
                      style={{ boxShadow: `0 0 50px 4px color-mix(in oklch, ${tone} 55%, transparent)` }}
                    >
                      <i
                        data-legend-spin
                        className="absolute top-1/2 left-1/2 -mt-[100%] -ml-[100%] size-[200%]"
                        style={{ background: foil(tone) }}
                      />
                    </div>
                  </>
                ) : null}
                <span aria-hidden data-flyer-burst className="absolute top-1/2 left-1/2">
                  {Array.from({ length: BURST }, (_unused, index) => (
                    <i
                      // oxlint-disable-next-line react/no-array-index-key -- burst particles are positional
                      key={index}
                      className="absolute -m-1.5 size-3 rounded-[3px] opacity-0"
                      style={{ background: tone }}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  data-flyer-card
                  aria-label={peek ? "Close this card" : "Turn the card over, then add it to your video"}
                  title={peek ? "Click to close" : "Click to turn it over, click again to add it"}
                  onClick={() => cardRef.current?.()}
                  className="pointer-events-auto absolute inset-0 z-10 cursor-pointer rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                />
                <div data-flyer-inner className="relative size-full [transform-style:preserve-3d]">
                  <div
                    className="absolute inset-0 flex flex-col overflow-hidden rounded-[28px] p-6 [backface-visibility:hidden]"
                    style={{
                      background: `linear-gradient(165deg, color-mix(in oklch, ${tone} 26%, ${palette.card}), ${palette.card} 62%)`,
                      boxShadow: `inset 0 0 0 2px ${tone}, 0 40px 90px -20px black`,
                      color: palette.fg,
                    }}
                  >
                    {current?.rarity === "legendary" ? (
                      <i
                        data-legend-foil
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen"
                        style={{
                          background: `linear-gradient(115deg, transparent 35%, color-mix(in oklch, ${tone} 50%, transparent) 46%, rgb(255 255 255 / 0.85) 50%, color-mix(in oklch, ${tone} 45%, transparent) 54%, transparent 65%)`,
                          backgroundSize: "300% 100%",
                          // One band, one pass: a repeated gradient brings a second band in behind the first.
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    ) : null}
                    {current ? (
                      <>
                        <div data-flyer-line className="grid flex-1 place-items-center">
                          <PixelGlyph art={current.art} colour={tone} cell={14} />
                        </div>
                        <p data-flyer-line className="text-[25px] font-semibold leading-[1.05] tracking-[-0.035em]">
                          {current.name}
                        </p>
                        <p data-flyer-line className="mt-1.5 text-[14px] font-semibold" style={{ color: tone }}>
                          {RARITY_LABELS[current.rarity]}
                        </p>
                        <p
                          data-flyer-line
                          className="mt-2 line-clamp-3 text-[14px] leading-[1.4]"
                          style={{ color: palette.muted }}
                        >
                          {current.line}
                        </p>
                        <p
                          data-flyer-line
                          className="mt-3 text-[12.5px] font-semibold"
                          style={{ color: palette.muted }}
                        >
                          {shownDay === undefined ? " " : `Found on ${describeDay(shownDay)}`}
                        </p>
                      </>
                    ) : null}
                  </div>
                  <div
                    data-flyer-back
                    className="absolute inset-0 grid place-items-center rounded-[28px] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    style={{
                      background: `radial-gradient(circle at 50% 40%, color-mix(in oklch, ${palette.levels[4]} 18%, ${palette.card}), ${palette.bg} 75%)`,
                    }}
                  >
                    <PixelGlyph art={PIXEL_ART.question} colour={palette.levels[4]} cell={12} />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
