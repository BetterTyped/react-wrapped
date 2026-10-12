import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { Code } from "../components/code";
import { HeroPlayer } from "../components/hero-player";
import { CountUp } from "../components/motion";
import { DemoStage, FixedStage, LookControls, useLookConfig } from "../components/preview";
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

/** The charts the home page shows: eight kinds of picture, each in a palette of its own. */
const WALL: readonly { type: ChartType; palette: keyof typeof WRAPPED_PALETTES }[] = [
  { type: "funnel", palette: "evergreen" },
  { type: "radar", palette: "synthwave" },
  { type: "bubbles", palette: "candy" },
  { type: "spark", palette: "ice" },
  { type: "hours", palette: "grape" },
  { type: "rings", palette: "ocean" },
  { type: "wheel", palette: "halloween" },
  { type: "bars", palette: "sunset" },
];

/** The light a cell shows under the pointer: its own palette's colour. */
const spotOf = (palette: keyof typeof WRAPPED_PALETTES) =>
  ({ "--spot": `color-mix(in oklch, ${WRAPPED_PALETTES[palette].levels[3]} 26%, transparent)` }) as CSSProperties;

const PARTS = [
  {
    path: "/examples/full-wrapped/",
    title: "Player and editor",
    text: "A timeline that is also the editor: switch scenes off, reorder them, rewrite their words.",
    demo: { type: "scene", key: "example:list" },
  },
  {
    path: "/docs/scanner/year-scan/",
    title: "Year scan",
    text: "A beam sweeps the year and finds the scenes hidden in it. They join the video as they turn up.",
    demo: { type: "scene", key: "example:opening" },
  },
  {
    path: "/docs/graphics/share-card/",
    title: "Graphics to keep",
    text: "A share card and a card per insight, drawn in the browser and saved as PNGs.",
    demo: { type: "scene", key: "example:summary" },
  },
] as const;

/**
 * The four scenes that stand beside the hero's player, each in a palette of its own: how far from the middle, how
 * far down, how bright, and the colour of the light under it.
 */
const FAN = [
  {
    demo: { type: "scene", key: "example:split" },
    palette: "candy",
    width: 190,
    x: -619,
    top: 104,
    o: 0.62,
    far: true,
  },
  { demo: { type: "scene", key: "example:chart" }, palette: "ice", width: 232, x: -407, top: 66, o: 0.85, far: false },
  {
    demo: { type: "scene", key: "example:big-day" },
    palette: "halloween",
    width: 232,
    x: 175,
    top: 66,
    o: 0.85,
    far: false,
  },
  {
    demo: { type: "scene", key: "example:opening" },
    palette: "grape",
    width: 190,
    x: 429,
    top: 104,
    o: 0.5,
    far: true,
  },
] as const;

const fanStyle = (card: (typeof FAN)[number]) =>
  ({
    "--x": `${card.x}px`,
    "--top": `${card.top}px`,
    "--o": card.o,
    "--glow": WRAPPED_PALETTES[card.palette].levels[3],
  }) as CSSProperties;

const WALL_COLUMNS = { "--cols": 4 } as CSSProperties;
const PARTS_COLUMNS = { "--cols": 3 } as CSSProperties;

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
    <>
      <div className="d-head">
        <div>
          <p className="d-eyebrow">Transitions</p>
          <h2 id="transitions">
            {TRANSITIONS.length} ways out of a scene.
            <span className="d-mute">All on one timeline.</span>
          </h2>
        </div>
        <SiteLink path="/docs/transitions/" className="d-more">
          All {TRANSITIONS.length} transitions →
        </SiteLink>
      </div>
      <div className="d-cuts">
        <div>
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
          <p className="d-cuts-says">
            <strong>{current.name}.</strong> {current.says}{" "}
            <SiteLink path={`/docs/transitions/${current.id}/`}>Read about {current.name}</SiteLink>
          </p>
        </div>
        <div className="d-preview-plate">
          <DemoStage key={current.id} demo={{ type: "transition", id: current.id }} max={520} format="square" />
        </div>
      </div>
    </>
  );
}

function Home() {
  return (
    <SiteFrame>
      <div className="d-home">
        <section className="d-hero">
          <div className="d-hero-copy">
            <p className="d-hero-kicker">
              <b>Open source</b>
              <span>
                The engine behind{" "}
                <a href={hypeStack("docs-home", "/wrapped")} target="_blank" rel="noopener">
                  Hype Stack's Wrapped
                </a>
              </span>
            </p>
            <h1>
              Year in review videos, <span className="d-mute">in React.</span>
            </h1>
            <p className="d-hero-lead">
              Turn a year of numbers into a short video that plays in the page. Scenes, charts and transitions on one
              timeline, with a player, an editor and MP4 export.
            </p>
            <div className="d-hero-actions">
              <SiteLink path="/docs/" className="d-pill d-pill-solid">
                Get started
              </SiteLink>
              <Command />
            </div>
          </div>
          <div className="d-fan">
            {FAN.map((card) => (
              <div
                key={card.palette}
                className={card.far ? "d-fan-card d-fan-far" : "d-fan-card"}
                style={fanStyle(card)}
                aria-hidden
              >
                <FixedStage demo={card.demo} width={card.width} format="story" palette={card.palette} />
              </div>
            ))}
            <HeroPlayer />
          </div>
          <p className="d-hero-note">Live in the page. Not a recording.</p>
        </section>

        <section className="d-facts" aria-label="At a glance">
          {FACTS.map((fact) => (
            <p key={fact.label}>
              <strong>
                <CountUp value={fact.value} />
              </strong>
              <span>{fact.label}</span>
            </p>
          ))}
        </section>

        <section className="d-band" aria-labelledby="scenes" data-reveal>
          <div className="d-head">
            <div>
              <p className="d-eyebrow">How it works</p>
              <h2 id="scenes">
                A video is a list of scenes.
                <span className="d-mute">A scene is a function.</span>
              </h2>
              <p>
                You call each scene with what it should say. A chart is data you hand it. The library brings the stage,
                the motion, the transition after each scene, and the player around it all.
              </p>
            </div>
            <SiteLink path="/docs/first-wrapped/" className="d-more">
              Your first Wrapped →
            </SiteLink>
          </div>
          <div className="d-made">
            <Code language="tsx" code={SCENES_CODE} file="my-wrapped.tsx" />
            <MadePlayer />
          </div>
        </section>

        <section className="d-band" aria-labelledby="charts" data-reveal>
          <div className="d-head">
            <div>
              <p className="d-eyebrow">Charts</p>
              <h2 id="charts">
                A chart is data.
                <span className="d-mute">The motion comes with it.</span>
              </h2>
            </div>
            <SiteLink path="/docs/charts/" className="d-more">
              All {CHART_TYPES.length} charts →
            </SiteLink>
          </div>
          <ul className="d-grid" style={WALL_COLUMNS}>
            {WALL.map(({ type, palette }, index) => (
              <li key={type}>
                <SiteLink path={`/docs/charts/${type}/`} data-glow style={spotOf(palette)}>
                  <DemoStage
                    demo={{ type: "chart", example: examplesOf(type)[0].name }}
                    format="square"
                    palette={palette}
                  />
                  <span className="d-grid-name">
                    {CHART_DOCS[type].name}
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </span>
                </SiteLink>
              </li>
            ))}
          </ul>
        </section>

        <section className="d-band" aria-labelledby="transitions" data-reveal>
          <Cuts />
        </section>

        <section className="d-band" aria-labelledby="parts" data-reveal>
          <div className="d-head">
            <div>
              <p className="d-eyebrow">Eight packages</p>
              <h2 id="parts">
                Use it whole.
                <span className="d-mute">Or take the parts.</span>
              </h2>
              <p>
                <code>WrappedView</code> is the whole page in one component. Every piece of it is also a package of its
                own, so you can build a different page from the same parts.
              </p>
            </div>
            <SiteLink path="/examples/from-parts/" className="d-more">
              Built from parts →
            </SiteLink>
          </div>
          <ul className="d-grid d-grid-stack" style={PARTS_COLUMNS}>
            {PARTS.map((part) => (
              <li key={part.title}>
                <SiteLink path={part.path} data-glow>
                  <DemoStage demo={part.demo} format="square" />
                  <span className="d-grid-name">{part.title}</span>
                  <span className="d-grid-text">{part.text}</span>
                </SiteLink>
              </li>
            ))}
          </ul>
          <div className="d-wear">
            <p>
              <strong>Ten palettes, dark and light.</strong> Pick one and the previews across this site follow.{" "}
              <SiteLink path="/docs/theming/">How theming works</SiteLink>
            </p>
            <LookControls formats={false} />
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
            <p className="d-eyebrow">From Hype Stack</p>
            <h2 id="live">See it running for real.</h2>
            <p>
              react-wrapped is a free tool from Hype Stack, the full stack React template. Hype Stack's Wrapped plays
              real years with it: sign in, and yours plays in a few seconds.
            </p>
          </div>
          <div className="d-promo-actions">
            <a className="d-pill d-pill-solid" href={hypeStack("docs-home", "/wrapped")} target="_blank" rel="noopener">
              Make your Wrapped
            </a>
            <a className="d-pill" href={hypeStack("docs-home")} target="_blank" rel="noopener">
              What is Hype Stack?
            </a>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
