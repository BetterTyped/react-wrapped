import { createFileRoute } from "@tanstack/react-router";

import { Code } from "../components/code";
import { DemoStage, LookControls } from "../components/preview";
import { SiteFrame } from "../components/shell";
import { SiteLink } from "../components/site-link";
import { CHART_TYPES } from "../registry/charts";
import { SECTIONS } from "../registry/pages";
import { TRANSITIONS } from "../registry/transitions";
import { seoHead, siteNodes } from "../seo/head";
import { hypeStack, PACKAGES, SITE } from "../site";

export const Route = createFileRoute("/")({
  head: () => seoHead({ title: SITE.title, description: SITE.description, path: "/", nodes: siteNodes() }),
  component: Home,
});

const QUICK_START = `import { WrappedView } from "@react-wrapped/kit";
import "@react-wrapped/kit/styles.css";

export function MyWrapped({ year }) {
  const [config, setConfig] = useState(DEFAULT_WRAPPED_CONFIG);
  return (
    <WrappedView
      subject={{ handle: year.handle, caption: "My Wrapped", period: "2026" }}
      seed={year.handle}
      scenes={directYear(year)}
      config={config}
      onConfigChange={setConfig}
    />
  );
}`;

function Home() {
  const parts = [
    {
      path: "/docs/charts/",
      count: CHART_TYPES.length,
      title: "Charts",
      text: "Each a picture of its own numbers, each with its own entrance.",
      demo: { type: "chart", example: "Spark" } as const,
    },
    {
      path: "/docs/transitions/",
      count: TRANSITIONS.length,
      title: "Transitions",
      text: "Covers in the palette's colours, and moves that take the scene out.",
      demo: { type: "transition", id: "drip" } as const,
    },
    {
      path: "/designs/",
      count: null,
      title: "Designs",
      text: "Everything on one page, in every palette, dark and light, in three formats.",
      demo: { type: "chart", example: "Radar" } as const,
    },
  ];
  return (
    <SiteFrame>
      <section className="d-hero">
        <div className="d-hero-copy">
          <p className="d-hero-kicker">
            Open source, MIT. The engine behind{" "}
            <a href={hypeStack("docs-home", "/wrapped")} target="_blank" rel="noopener">
              Hype Stack's Wrapped
            </a>
            .
          </p>
          <h1>
            Year in review videos, <em>in React.</em>
          </h1>
          <p className="d-hero-lead">
            Turn a year of numbers into a short video that plays in the page. Animated scenes, {CHART_TYPES.length}{" "}
            charts, {TRANSITIONS.length} transitions, a player with a timeline editor, a scanner that finds hidden
            scenes, and share cards. Use it whole or take the parts.
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
          <DemoStage demo={{ type: "transition", id: "wave" }} />
          <LookControls />
        </div>
      </section>

      <section className="d-band" aria-labelledby="parts">
        <h2 id="parts">Take the parts you need</h2>
        <ul className="d-cards d-cards-wide">
          {parts.map((part) => (
            <li key={part.path}>
              <SiteLink path={part.path}>
                <span className="d-card-stage" aria-hidden>
                  <DemoStage demo={part.demo} max={420} />
                </span>
                <strong>
                  {part.count ? `${part.count} ` : ""}
                  {part.title}
                </strong>
                <span>{part.text}</span>
              </SiteLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="d-band d-split" aria-labelledby="start">
        <div>
          <h2 id="start">One component, or all of its parts</h2>
          <p>
            <code>WrappedView</code> is the whole page: the player, the settings, the scan and the graphics. Every piece
            of it is exported on its own too, so you can build a different page from the same parts.
          </p>
          <ul className="d-plain-list">
            {PACKAGES.map((entry) => (
              <li key={entry.name}>
                <code>{entry.name}</code>
                <span>{entry.holds}</span>
              </li>
            ))}
          </ul>
        </div>
        <Code language="tsx" code={QUICK_START} file="my-wrapped.tsx" />
      </section>

      <section className="d-band" aria-labelledby="browse">
        <h2 id="browse">Browse the docs</h2>
        <ul className="d-index">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <SiteLink path={section.pages[0].path}>
                <strong>{section.title}</strong>
                <span>
                  {section.pages.length} {section.pages.length === 1 ? "page" : "pages"}
                </span>
              </SiteLink>
            </li>
          ))}
        </ul>
      </section>
    </SiteFrame>
  );
}
