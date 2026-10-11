import { useNavigate } from "@tanstack/react-router";
import { gsap } from "gsap";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { PAGES } from "../registry/pages";
import { SITE } from "../site";

/*
 * Spin: a reel of the things the library draws. It runs, slows, stops on one, and opens that page. A way into the
 * docs for someone who does not know what to look for yet.
 */

type Kind = "chart" | "scene" | "transition";

interface Stop {
  path: string;
  title: string;
  kind: Kind;
  text: string;
}

const KIND_OF: Readonly<Record<string, Kind>> = { charts: "chart", scenes: "scene", transitions: "transition" };
const KIND_LABEL: Readonly<Record<Kind, string>> = { chart: "Chart", scene: "Scene", transition: "Transition" };

/** Every chart, scene and transition with a page of its own. The overviews are not on the reel. */
export const SPIN_STOPS: readonly Stop[] = PAGES.flatMap((page) => {
  const match = /^\/docs\/(charts|scenes|transitions)\/[^/]+\/$/.exec(page.path);
  return match ? [{ path: page.path, title: page.nav, kind: KIND_OF[match[1]], text: page.description }] : [];
});

const GLYPH: Readonly<Record<Kind, string>> = {
  chart: "M5 20v-8M12 20V5M19 20v-11",
  scene: "M4 5.5h16v13H4zM10.25 9.25v5.5L15 12z",
  transition: "M3.5 6h9v12h-9zM12.5 9.5h8V18h-8M16 5l3 2.2-3 2.2",
};

/** How many cards run past before the reel stops, and how long the reader has before the page opens by itself. */
const LANDS_AT = 32;
const TAIL = 5;
const WAIT_MS = 2600;

interface Round {
  id: number;
  strip: readonly Stop[];
  winner: Stop;
}

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** A reel that ends on `winner`, with no card next to its own twin. */
function reelFor(winner: Stop): Stop[] {
  const strip: Stop[] = [];
  for (let index = 0; index < LANDS_AT + TAIL; index += 1) {
    // The card before this one, and the winner for the cards on either side of where it lands.
    const taken = [strip.at(-1), Math.abs(index - LANDS_AT) === 1 ? winner : undefined];
    strip.push(index === LANDS_AT ? winner : pick(SPIN_STOPS.filter((stop) => !taken.includes(stop))));
  }
  return strip;
}

/** How long the button that opens the page takes to fill: the same wait, told to the stylesheet. */
const GO_STYLE = { "--d-spin-wait": `${WAIT_MS}ms` } as CSSProperties;

export function Spin() {
  const [round, setRound] = useState<Round | null>(null);
  const [landed, setLanded] = useState(false);
  const [counting, setCounting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  // The round before this one: the reel never stops on the same page twice running.
  const beforeRef = useRef<Round | null>(null);

  const spin = useCallback(() => {
    const before = beforeRef.current;
    const winner = pick(SPIN_STOPS.filter((stop) => stop !== before?.winner));
    const next = { id: (before?.id ?? 0) + 1, strip: reelFor(winner), winner };
    beforeRef.current = next;
    setLanded(false);
    setCounting(false);
    setRound(next);
  }, []);

  const close = useCallback(() => {
    setRound(null);
    setLanded(false);
    setCounting(false);
  }, []);

  const open = useCallback(
    (stop: Stop) => {
      close();
      // The site lives under a base path; the router adds it.
      void navigate({ href: `${SITE.base.replace(/\/$/, "")}${stop.path}` });
    },
    [close, navigate],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (round && !dialog.open) dialog.showModal();
    if (!round && dialog.open) dialog.close();
  }, [round]);

  // The run itself: the strip slides until the winner sits under the pin, fast first and slower and slower.
  useEffect(() => {
    const strip = stripRef.current;
    const card = strip?.querySelector<HTMLElement>("li");
    if (!round || !strip || !card) return;
    const step = card.offsetWidth + 12;
    const start = -card.offsetWidth / 2;
    // Never dead centre: a real reel stops a little to one side of it.
    const end = start - LANDS_AT * step + (Math.random() - 0.5) * card.offsetWidth * 0.5;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const land = () => {
      setLanded(true);
      // Someone who asked for less motion gets the pick and decides in their own time.
      setCounting(!still);
      goRef.current?.focus();
    };
    if (still) {
      gsap.set(strip, { x: end });
      land();
      return;
    }
    const run = gsap.fromTo(strip, { x: start }, { x: end, duration: 3.6, ease: "power4.out", onComplete: land });
    return () => {
      run.kill();
    };
  }, [round]);

  // Landed and left alone: the page opens by itself.
  useEffect(() => {
    if (!round || !counting) return;
    const timer = setTimeout(() => open(round.winner), WAIT_MS);
    return () => clearTimeout(timer);
  }, [counting, open, round]);

  return (
    <>
      <button type="button" className="d-spin-button" onClick={spin} aria-label="Spin: open a random page">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M4.5 7.5 12 3.5l7.5 4v9l-7.5 4-7.5-4zM4.5 7.5l7.5 4 7.5-4M12 11.5v9" />
          <path d="M8.2 12.3v.01M15.8 12.3v.01M12 6.6v.01M15.8 15.6v.01" strokeWidth="2.6" />
        </svg>
        <span>Spin</span>
      </button>
      {/* A click on the dialog itself is a click on its backdrop; Escape is the keyboard's way out. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        className="d-spin"
        aria-label="Spin: a random page"
        onClose={close}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {round ? (
          <>
            <div className="d-spin-head">
              <h2>Spin</h2>
              <p>{SPIN_STOPS.length} charts, scenes and transitions. One of them is next.</p>
            </div>
            <div className="d-reel" aria-hidden>
              <ul key={round.id} ref={stripRef} className="d-reel-strip">
                {round.strip.map((stop, index) => (
                  <li
                    // oxlint-disable-next-line react/no-array-index-key -- a reel's cards never reorder
                    key={index}
                    className="d-reel-card"
                    data-kind={stop.kind}
                    data-won={landed && index === LANDS_AT ? "" : undefined}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d={GLYPH[stop.kind]} />
                    </svg>
                    <div>
                      <small>{KIND_LABEL[stop.kind]}</small>
                      <strong>{stop.title}</strong>
                    </div>
                  </li>
                ))}
              </ul>
              <span className="d-reel-pin" />
            </div>
            <div className="d-spin-foot">
              <div className="d-spin-won" aria-live="polite">
                {landed ? (
                  <>
                    <strong>
                      {round.winner.title}{" "}
                      <span className="d-shine">{KIND_LABEL[round.winner.kind].toLowerCase()}</span>
                    </strong>
                    <span>{round.winner.text}</span>
                  </>
                ) : (
                  <span>Spinning.</span>
                )}
              </div>
              <div className="d-spin-actions">
                <button type="button" className="d-pill" onClick={spin} disabled={!landed}>
                  Spin again
                </button>
                <button
                  ref={goRef}
                  type="button"
                  className="d-pill d-pill-solid d-spin-go"
                  data-counting={counting ? "" : undefined}
                  style={GO_STYLE}
                  onClick={() => open(round.winner)}
                  disabled={!landed}
                >
                  <i aria-hidden />
                  <span>Open it</span>
                </button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </>
  );
}
