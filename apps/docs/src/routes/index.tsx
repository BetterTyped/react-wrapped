import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { Code } from "../components/code";
import { HeroPlayer } from "../components/hero-player";
import { CountUp, useScrollDrift } from "../components/motion";
import { DemoStage, FixedStage, LookControls, PaletteSwatches, useLookConfig } from "../components/preview";
import { SiteFrame } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { CHART_DOCS, CHART_TYPES, type ChartType, examplesOf } from "../registry/charts";
import { SCENE_IDS } from "../registry/scenes";
import { TRANSITIONS } from "../registry/transitions";
import { seoHead, siteNodes } from "../seo/head";
import { hypeStack, PACKAGES, SITE } from "../site";
import { bigNumberScene, chartScene, WRAPPED_PALETTES, WrappedPlayer, type WrappedSubject } from "@react-wrapped/kit";

export const Route = createFileRoute("/")({
  head: () => seoHead({ title: SITE.title, description: SITE.description, path: "/", nodes: siteNodes() }),
  component: Home,
});

const INSTALL = "pnpm add @react-wrapped/kit gsap";

const SCENES_CODE = `import { bigNumberScene, chartScene, WrappedView } from "@react-wrapped/kit";
import "@react-wrapped/kit/styles.css";

const scenes = [
  bigNumberScene(
    { eyebrow: "This year you made", value: 1687, title: ["contributions."],
      lede: "That's **4.6 a day**.", counter: "climb", variant: 0 },
    { key: "total", label: "Total" },
  ),
  chartScene(
    { eyebrow: "Your year", title: ["Then came", "*launch week.*"],
      lede: "The busiest stretch, lit.",
      chart: { type: "spark", values: weeks, band: { from: 20, to: 27, label: "Launch week" } } },
    { key: "launch", label: "Launch week" },
  ),
];

<WrappedView subject={subject} seed="ada-2026" scenes={scenes}
  config={config} onConfigChange={setConfig} />`;

/** A made-up year by the week: steady, with eight loud weeks in the middle. */
const weeks = Array.from(
  { length: 52 },
  (_unused, week) => 18 + Math.round(9 * Math.sin(week / 3)) + ((week * 7) % 6) + (week >= 20 && week <= 27 ? 34 : 0),
);

/** The two scenes the code above describes, built the way it builds them. */
const MADE_SCENES = [
  bigNumberScene(
    {
      eyebrow: "This year you made",
      value: 1687,
      title: ["contributions."],
      lede: "That's **4.6 a day**.",
      counter: "climb",
      variant: 0,
    },
    { key: "total", label: "Total" },
  ),
  chartScene(
    {
      eyebrow: "Your year",
      title: ["Then came", "*launch week.*"],
      lede: "The busiest stretch, lit.",
      chart: { type: "spark", values: weeks, band: { from: 20, to: 27, label: "Launch week" } },
    },
    { key: "launch", label: "Launch week" },
  ),
];

const MADE_SUBJECT: WrappedSubject = {
  handle: "ada",
  name: "Ada",
  avatarUrl: null,
  caption: "Orbit Wrapped",
  period: "2026",
};

const FACTS = [
  { value: CHART_TYPES.length, label: "charts, each with its own entrance" },
  { value: TRANSITIONS.length, label: "transitions between scenes" },
  { value: SCENE_IDS.length, label: "ready-made scenes to fill with your numbers" },
  { value: Object.keys(WRAPPED_PALETTES).length, label: "palettes, each in dark and light" },
] as const;

const PARTS = [
  {
    path: "/docs/charts/",
    title: "Charts",
    text: "Twenty-one pictures of a year's numbers. A chart is data you hand a scene, and it plays its own entrance.",
    demo: { type: "chart", example: "Radar" },
  },
  {
    path: "/docs/transitions/",
    title: "Transitions",
    text: "Covers in the palette's colours, and moves that take the scene out.",
    demo: { type: "transition", id: "drip" },
  },
  {
    path: "/examples/full-wrapped/",
    title: "Player and editor",
    text: "A timeline that is also the editor: hide, reorder, rewrite.",
    demo: { type: "scene", key: "example:list" },
  },
  {
    path: "/docs/scanner/year-scan/",
    title: "Year scan",
    text: "A beam sweeps the year and finds the scenes hidden in it.",
    demo: { type: "scene", key: "example:opening" },
  },
  {
    path: "/docs/graphics/share-card/",
    title: "Graphics to keep",
    text: "A share card and a card per insight, saved as PNGs.",
    demo: { type: "scene", key: "example:summary" },
  },
] as const;

/** The install line as one thing to press: it copies itself and says so. */
function Command() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" className="d-command" onClick={() => void copy()} aria-label={`Copy: ${INSTALL}`}>
      <code>{INSTALL}</code>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** The small player's own classes, by slot: the library's way of styling one part of it. */
const MADE_CLASSES = { timeline: "d-made-quiet" } as const;

/** What the code beside it plays: the same two scenes, in the library's own player. */
function MadePlayer() {
  const look = useLookConfig();
  const config = useMemo(() => ({ ...look, format: "story" as const }), [look]);
  // After the first paint, like the hero's: the words come first.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="d-made-player">
      {ready ? (
        <WrappedPlayer
          subject={MADE_SUBJECT}
          seed="ada-2026"
          scenes={MADE_SCENES}
          config={config}
          classNames={MADE_CLASSES}
          autoplay
        />
      ) : null}
    </div>
  );
}

/** One row of live charts. It drifts sideways with the page, and each tile opens its chart. */
function Rail({ types, direction }: { types: readonly ChartType[]; direction: 1 | -1 }) {
  const ref = useScrollDrift(direction);
  return (
    <ul ref={ref} className="d-rail">
      {types.map((type) => (
        <li key={type}>
          <SiteLink path={`/docs/charts/${type}/`} data-glow>
            <span className="d-rail-stage">
              <FixedStage demo={{ type: "chart", example: examplesOf(type)[0].name }} width={228} />
            </span>
            <strong>{CHART_DOCS[type].name}</strong>
          </SiteLink>
        </li>
      ))}
    </ul>
  );
}

/** Every transition on one stage. It walks through them by itself until the reader picks one. */
function Cuts() {
  const [picked, setPicked] = useState<string>(TRANSITIONS[0].id);
  const [walking, setWalking] = useState(true);
  useEffect(() => {
    if (!walking || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setPicked((now) => {
        const index = TRANSITIONS.findIndex((entry) => entry.id === now);
        return TRANSITIONS[(index + 1) % TRANSITIONS.length].id;
      });
    }, 5600);
    return () => clearInterval(timer);
  }, [walking]);
  const current = TRANSITIONS.find((entry) => entry.id === picked) ?? TRANSITIONS[0];
  return (
    <div className="d-cuts">
      <div>
        <p className="d-eyebrow">Transitions</p>
        <h2 id="transitions">
          {TRANSITIONS.length} ways out of <span className="d-shine">a scene</span>
        </h2>
        <p>
          Covers drawn in the palette's colours, and moves that carry the old scene off. Each one sits on the same
          timeline as the scenes, so scrubbing back through a cut undoes it exactly.
        </p>
        <div className="d-chips" role="group" aria-label="Transition">
          {TRANSITIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={entry.id === picked}
              onClick={() => {
                setWalking(false);
                setPicked(entry.id);
              }}
            >
              {entry.name}
            </button>
          ))}
        </div>
      </div>
      <div className="d-cuts-stage">
        <div className="d-preview-plate">
          <DemoStage key={current.id} demo={{ type: "transition", id: current.id }} max={520} />
        </div>
        <p>
          {current.says} <SiteLink path={`/docs/transitions/${current.id}/`}>Read about {current.name}</SiteLink>
        </p>
      </div>
    </div>
  );
}

function Home() {
  const half = Math.ceil(CHART_TYPES.length / 2);
  return (
    <SiteFrame>
      <section className="d-hero">
        <div className="d-hero-copy">
          <p className="d-hero-kicker">
            <span className="d-dot" aria-hidden />
            Open source. The engine behind{" "}
            <a href={hypeStack("docs-home", "/wrapped")} target="_blank" rel="noopener">
              Hype Stack's Wrapped
            </a>
          </p>
          <h1>
            Year in review videos, <em className="d-shine">in React.</em>
          </h1>
          <p className="d-hero-lead">
            Turn a year of numbers into a short video that plays in the page. Scenes, charts and transitions on one GSAP
            timeline, a player you can edit from, and an MP4 at the end.
          </p>
          <div className="d-hero-actions">
            <SiteLink path="/docs/" className="d-pill d-pill-solid">
              Get started
            </SiteLink>
            <SiteLink path="/examples/full-wrapped/" className="d-pill">
              Play a full Wrapped
            </SiteLink>
          </div>
          <Command />
        </div>
        <div className="d-hero-stage">
          <div className="d-float d-float-a" aria-hidden>
            <FixedStage demo={{ type: "chart", example: "Rings" }} width={172} />
          </div>
          <HeroPlayer />
          <div className="d-float d-float-b" aria-hidden>
            <FixedStage demo={{ type: "chart", example: "Bars" }} width={188} />
          </div>
          <div className="d-float d-float-c" aria-hidden>
            <FixedStage demo={{ type: "chart", example: "Bubbles" }} width={150} />
          </div>
          <p className="d-hero-note">Not a recording. This is the library playing a made-up year.</p>
        </div>
      </section>

      <section className="d-facts" aria-label="At a glance">
        {FACTS.map((fact, index) => (
          <p key={fact.label} data-reveal data-glow style={{ "--i": index } as CSSProperties}>
            <strong className="d-shine">
              <CountUp value={fact.value} />
            </strong>
            <span>{fact.label}</span>
          </p>
        ))}
      </section>

      <section className="d-band" aria-labelledby="scenes" data-reveal>
        <div className="d-split">
          <div>
            <p className="d-eyebrow">How it works</p>
            <h2 id="scenes">
              A video is <span className="d-shine">a list of scenes</span>
            </h2>
            <p>
              Each scene is a function you call with what it should say. A chart is data you hand it. The library brings
              the stage, the motion, the transition after each scene, and the player around it all.
            </p>
            <p>
              Everything runs on one timeline, so the video can be scrubbed, edited from its own timeline, and saved
              frame by frame as a file.
            </p>
            <div className="d-hero-actions">
              <SiteLink path="/docs/installation/" className="d-pill d-pill-solid">
                Install it
              </SiteLink>
              <SiteLink path="/docs/first-wrapped/" className="d-pill">
                Your first Wrapped
              </SiteLink>
            </div>
          </div>
          <div className="d-made">
            <Code language="tsx" code={SCENES_CODE} file="my-wrapped.tsx" />
            <MadePlayer />
          </div>
        </div>
      </section>

      <section className="d-band" aria-labelledby="charts" data-reveal>
        <div className="d-band-head">
          <div>
            <p className="d-eyebrow">Charts</p>
            <h2 id="charts">
              Charts that arrive <span className="d-shine">the way they are read</span>
            </h2>
            <p>
              What a chart is made of stands first, the numbers come in with a direction, and the point lands last with
              its pill. Change the look and all of them follow.
            </p>
          </div>
          <LookControls formats={false} />
        </div>
        <div className="d-rails">
          <Rail types={CHART_TYPES.slice(0, half)} direction={1} />
          <Rail types={CHART_TYPES.slice(half)} direction={-1} />
        </div>
        <p className="d-band-more">
          <SiteLink path="/docs/charts/" className="d-pill">
            See all {CHART_TYPES.length} charts
          </SiteLink>
        </p>
      </section>

      <section className="d-band" aria-labelledby="transitions" data-reveal>
        <Cuts />
      </section>

      <section className="d-band" aria-labelledby="parts" data-reveal>
        <div className="d-band-head">
          <div>
            <p className="d-eyebrow">Eight packages</p>
            <h2 id="parts">
              Use it whole, or <span className="d-shine">take the parts</span>
            </h2>
            <p>
              <code>WrappedView</code> is the whole page in one component. Every piece of it is also a package of its
              own, so you can build a different page from the same parts.
            </p>
          </div>
        </div>
        <ul className="d-bento">
          {PARTS.map((part, index) => (
            <li key={part.title}>
              <SiteLink path={part.path} data-glow>
                <span className="d-card-stage" aria-hidden>
                  <DemoStage demo={part.demo} max={index === 0 ? 560 : 300} />
                </span>
                <strong>{part.title}</strong>
                <span>{part.text}</span>
              </SiteLink>
            </li>
          ))}
        </ul>
        <div className="d-wear">
          <div>
            <h3>Ten palettes. Try one: this whole site wears it.</h3>
            <p>
              Dark and light, three formats from the same scenes, and your own accent when none of the ten is yours.{" "}
              <SiteLink path="/docs/theming/">How theming works</SiteLink>
            </p>
          </div>
          <PaletteSwatches />
        </div>
        <ul className="d-packages">
          {PACKAGES.map((entry) => (
            <li key={entry.name}>
              <code>{entry.name}</code>
              <span>{entry.holds}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="d-promo" aria-labelledby="live" data-reveal>
        <div>
          <h2 id="live">See it running for real</h2>
          <p>
            react-wrapped is a free tool from Hype Stack, the full stack React template. Hype Stack's Wrapped plays real
            years with it: sign in, and yours plays in a few seconds.
          </p>
        </div>
        <div className="d-promo-actions">
          <a className="d-pill d-pill-hype" href={hypeStack("docs-home", "/wrapped")} target="_blank" rel="noopener">
            Make your Wrapped
          </a>
          <a className="d-pill" href={hypeStack("docs-home")} target="_blank" rel="noopener">
            What is Hype Stack?
          </a>
        </div>
      </section>
    </SiteFrame>
  );
}
