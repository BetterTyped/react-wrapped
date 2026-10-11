import { createFileRoute } from "@tanstack/react-router";

import { Code } from "../components/code";
import { HeroPlayer } from "../components/hero-player";
import { DemoStage, LookControls } from "../components/preview";
import { SiteFrame } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { CHART_DOCS, CHART_TYPES, examplesOf } from "../registry/charts";
import { TRANSITIONS } from "../registry/transitions";
import { seoHead, siteNodes } from "../seo/head";
import { hypeStack, PACKAGES, SITE } from "../site";

export const Route = createFileRoute("/")({
  head: () => seoHead({ title: SITE.title, description: SITE.description, path: "/", nodes: siteNodes() }),
  component: Home,
});

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

/** The charts the home page shows off: one of each kind of picture. */
const WALL = ["spark", "bars", "funnel", "rings", "radar", "hours", "bubbles", "river"] as const;

const FACTS = [
  { value: String(CHART_TYPES.length), label: "charts, each with its own entrance" },
  { value: String(TRANSITIONS.length), label: "transitions between scenes" },
  { value: "3", label: "formats from one cut: 9:16, 1:1, 16:9" },
  { value: "0", label: "CSS frameworks to set up" },
] as const;

const PARTS = [
  {
    path: "/docs/charts/",
    title: "Charts",
    text: "Twenty-one pictures of a year's numbers. A chart is data you hand a scene.",
    demo: { type: "chart", example: "Radar" },
  },
  {
    path: "/docs/transitions/",
    title: "Transitions",
    text: "Covers in the palette's colours, and moves that take the scene out. Add your own.",
    demo: { type: "transition", id: "drip" },
  },
  {
    path: "/examples/full-wrapped/",
    title: "Player and editor",
    text: "A timeline that is also the editor: switch scenes off, reorder them, rewrite their words.",
    demo: { type: "chart", example: "Bars" },
  },
  {
    path: "/examples/full-wrapped/",
    title: "Year scan",
    text: "A beam sweeps the year and finds the scenes hidden in it. They join the video as they turn up.",
    demo: { type: "chart", example: "Month up close" },
  },
  {
    path: "/examples/full-wrapped/",
    title: "Graphics to keep",
    text: "A share card and a card per insight, drawn in the browser and saved as PNGs.",
    demo: { type: "chart", example: "Dot share" },
  },
  {
    path: "/docs/theming/",
    title: "Palettes and formats",
    text: "Ten palettes, dark and light, your own accent. Three formats from the same scenes.",
    demo: { type: "chart", example: "Rings" },
  },
] as const;

function Home() {
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
            Year in review videos, <em>in React.</em>
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
          <Code language="bash" code="pnpm add @react-wrapped/kit gsap" />
        </div>
        <div className="d-hero-stage">
          <HeroPlayer />
          <p className="d-hero-note">Not a recording. This is the library playing a made-up year.</p>
        </div>
      </section>

      <section className="d-facts" aria-label="At a glance">
        {FACTS.map((fact) => (
          <p key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </p>
        ))}
      </section>

      <section className="d-band" aria-labelledby="scenes">
        <div className="d-split">
          <div>
            <h2 id="scenes">A video is a list of scenes</h2>
            <p>
              Each scene is a function you call with what it should say. A chart is data you hand it. The library brings
              the stage, the motion, the transition after each scene, and the player around it all.
            </p>
            <p>
              Everything runs on one timeline, so the video can be scrubbed, edited from its own timeline, and saved
              frame by frame as a file.
            </p>
            <div className="d-hero-actions">
              <SiteLink path="/docs/installation/" className="d-pill">
                Install it
              </SiteLink>
            </div>
          </div>
          <Code language="tsx" code={SCENES_CODE} file="my-wrapped.tsx" />
        </div>
      </section>

      <section className="d-band" aria-labelledby="charts">
        <div className="d-band-head">
          <div>
            <h2 id="charts">Charts that arrive the way they are read</h2>
            <p>
              What a chart is made of stands first, the numbers come in with a direction, and the point lands last with
              its pill. Change the look and all of them follow.
            </p>
          </div>
          <LookControls />
        </div>
        <ul className="d-wall">
          {WALL.map((type) => (
            <li key={type}>
              <SiteLink path={`/docs/charts/${type}/`}>
                <DemoStage demo={{ type: "chart", example: examplesOf(type)[0].name }} max={340} />
                <strong>{CHART_DOCS[type].name}</strong>
              </SiteLink>
            </li>
          ))}
        </ul>
        <p className="d-band-more">
          <SiteLink path="/docs/charts/" className="d-pill">
            See all {CHART_TYPES.length} charts
          </SiteLink>
        </p>
      </section>

      <section className="d-band" aria-labelledby="parts">
        <div className="d-band-head">
          <div>
            <h2 id="parts">Use it whole, or take the parts</h2>
            <p>
              <code>WrappedView</code> is the whole page in one component. Every piece of it is also a package of its
              own, so you can build a different page from the same parts.
            </p>
          </div>
        </div>
        <ul className="d-cards d-cards-wide">
          {PARTS.map((part) => (
            <li key={part.title}>
              <SiteLink path={part.path}>
                <span className="d-card-stage" aria-hidden>
                  <DemoStage demo={part.demo} max={380} />
                </span>
                <strong>{part.title}</strong>
                <span>{part.text}</span>
              </SiteLink>
            </li>
          ))}
        </ul>
        <ul className="d-packages">
          {PACKAGES.map((entry) => (
            <li key={entry.name}>
              <code>{entry.name}</code>
              <span>{entry.holds}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="d-promo" aria-labelledby="live">
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
