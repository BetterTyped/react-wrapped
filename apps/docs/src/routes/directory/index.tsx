import { createFileRoute } from "@tanstack/react-router";
import { type CSSProperties, useId, useState } from "react";

import { CountUp } from "../../components/motion";
import { Fit } from "../../components/preview";
import { SiteFrame } from "../../components/shell";
import { SiteLink } from "../../components/site-link";
import { DIRECTORY, type DirectoryEntry, INTAKES, SHELVES, type ShelfId } from "../../registry/directory";
import { seoHead } from "../../seo/head";
import { hypeStack } from "../../site";
import {
  CUSTOM_PALETTE,
  DEFAULT_WRAPPED_CONFIG,
  MARK_LAYERS,
  MARKS,
  SceneThumb,
  type WrappedConfig,
} from "@react-wrapped/kit";

export const Route = createFileRoute("/directory/")({
  head: () =>
    seoHead({
      title: "Directory: every Wrapped built with react-wrapped",
      description: `${DIRECTORY.length} year in review videos built with react-wrapped and playing on Hype Stack: GitHub, Claude, ChatGPT, Stripe, X and more. Pick a platform and make yours.`,
      path: "/directory/",
      crumbs: [
        { label: "Home", path: "/" },
        { label: "Directory", path: "/directory/" },
      ],
    }),
  component: Directory,
});

/** Each card's stage: the video's own palette, made from the platform's colour, and always dark, as its link opens. */
const CONFIGS = new Map<string, WrappedConfig>(
  DIRECTORY.map((entry) => [
    entry.id,
    { ...DEFAULT_WRAPPED_CONFIG, palette: CUSTOM_PALETTE, accent: entry.accent, mode: "dark", format: "square" },
  ]),
);

const INSTALL = "pnpm add @react-wrapped/kit gsap";

const accentOf = (entry: DirectoryEntry) => ({ "--accent": entry.accent }) as CSSProperties;

/** A logo in its platform's colour; a black and white one takes the text colour and has none. */
const INKS = new Map(
  DIRECTORY.map((entry) => [entry.id, entry.plain ? undefined : ({ color: entry.accent } as CSSProperties)]),
);

/** Each logo in the hero's row: lit in its platform's colour, arriving a beat after the one before it. */
const INDEX_STYLES = new Map(
  DIRECTORY.map((entry, index) => [entry.id, { ...accentOf(entry), "--i": index } as CSSProperties]),
);

/** A shelf with how many Wrappeds are on it, for the chips. */
const COUNTS = new Map<ShelfId, number>(
  SHELVES.map((shelf) => [shelf.id, DIRECTORY.filter((entry) => entry.shelf === shelf.id).length]),
);

const FACTS = [
  { value: DIRECTORY.length, label: "Wrappeds live on Hype Stack today" },
  { value: SHELVES.length, label: "corners of a year: code, AI, sales, social, search" },
  { value: 3, label: "ways in: a username, an export, or one prompt" },
  { value: 0, label: "dollars. Free with a Hype Stack account" },
] as const;

const STEPS = [
  {
    title: "Pick a platform",
    text: "Wherever your year happened: your code, your AI, your sales, your posts. Make one for each.",
  },
  {
    title: "Bring your year",
    text: "A username, the platform's own export, or a file your AI writes from one prompt. Files are read in your browser.",
  },
  {
    title: "Post it",
    text: "Your year plays as a video. Share the link, keep the card, download the MP4.",
  },
] as const;

/**
 * A platform's logo, flat: in the platform's colour, in its own colours when it is made of several (Search Console),
 * or in the text colour for a brand that is black and white.
 */
function Logo({ entry, className }: { entry: DirectoryEntry; className?: string }) {
  const clip = useId();
  const layers = MARK_LAYERS[entry.mark];
  if (layers) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        {layers.map((layer, index) =>
          layer.within ? (
            <g key={`${layer.fill}-${layer.d}`}>
              <clipPath id={`${clip}-${index}`}>
                <path d={layer.within} />
              </clipPath>
              <path d={layer.d} fill={layer.fill} clipPath={`url(#${clip}-${index})`} />
            </g>
          ) : (
            <path key={`${layer.fill}-${layer.d}`} d={layer.d} fill={layer.fill} />
          ),
        )}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} style={INKS.get(entry.id)} fill="currentColor" aria-hidden>
      <path d={MARKS[entry.mark]} />
    </svg>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="d-dir-arrow" aria-hidden>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

/** One Wrapped: its opening scene playing in its own colours, what it shows, and how a year gets in. */
function Card({ entry }: { entry: DirectoryEntry }) {
  const config = CONFIGS.get(entry.id) ?? DEFAULT_WRAPPED_CONFIG;
  return (
    <a
      className="d-dir-card"
      href={hypeStack("docs-directory", entry.path)}
      target="_blank"
      rel="noopener"
      style={accentOf(entry)}
      data-glow
    >
      <span className="d-dir-stage">
        <Fit format="square" max={420}>
          {(width, on) => <SceneThumb scene={entry.scene} config={config} width={width} loop={on} />}
        </Fit>
      </span>
      <span className="d-dir-name">
        <Logo entry={entry} className="d-dir-logo" />
        <strong>{entry.name} Wrapped</strong>
        <Arrow />
      </span>
      <span className="d-dir-text">{entry.card}</span>
      <span className="d-dir-meta">
        <span className="d-dir-tag">{INTAKES[entry.intake]}</span>
        {entry.variants ? <span>{entry.variants.join(" · ")}</span> : null}
      </span>
      <span className="d-dir-go">Make your {entry.name} Wrapped</span>
    </a>
  );
}

function Directory() {
  const [shelf, setShelf] = useState<ShelfId | "all">("all");
  const shown = shelf === "all" ? DIRECTORY : DIRECTORY.filter((entry) => entry.shelf === shelf);
  return (
    <SiteFrame>
      <div className="d-home">
        <section className="d-hero">
          <div className="d-hero-copy">
            <p className="d-hero-kicker">
              <b>Live</b>
              <span>
                {DIRECTORY.length} Wrappeds built with react-wrapped, playing on{" "}
                <a href={hypeStack("docs-directory", "/wrapped")} target="_blank" rel="noopener">
                  Hype Stack
                </a>
              </span>
            </p>
            <h1>
              Your year, wrapped. <span className="d-mute">On every platform you use.</span>
            </h1>
            <p className="d-hero-lead">
              Your code, your prompts, your sales, your posts. Pick a platform and your last 12 months play as a video,
              with a share card and a link to post.
            </p>
            <div className="d-hero-actions">
              <a
                className="d-pill d-pill-solid"
                href={hypeStack("docs-directory", "/wrapped")}
                target="_blank"
                rel="noopener"
              >
                Make your Wrapped
              </a>
              <a className="d-pill" href="#all">
                Browse all {DIRECTORY.length}
              </a>
            </div>
          </div>
          <ul className="d-dir-index" aria-label="Jump to a platform">
            {DIRECTORY.map((entry) => (
              <li key={entry.id} style={INDEX_STYLES.get(entry.id)}>
                <a
                  href={`#${entry.id}`}
                  aria-label={`${entry.name} Wrapped`}
                  title={`${entry.name} Wrapped`}
                  onClick={() => setShelf("all")}
                >
                  <Logo entry={entry} />
                </a>
              </li>
            ))}
          </ul>
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

        <section className="d-band" aria-labelledby="all">
          <div className="d-head">
            <div>
              <p className="d-eyebrow">The directory</p>
              <h2 id="all">
                Pick a platform.
                <span className="d-mute">Watch your year play.</span>
              </h2>
            </div>
            <div className="d-chips" role="group" aria-label="Show">
              <button type="button" aria-pressed={shelf === "all"} onClick={() => setShelf("all")}>
                All <small>{DIRECTORY.length}</small>
              </button>
              {SHELVES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={shelf === entry.id}
                  onClick={() => setShelf(entry.id)}
                >
                  {entry.label} <small>{COUNTS.get(entry.id)}</small>
                </button>
              ))}
            </div>
          </div>
          <ul className="d-dir">
            {shown.map((entry) => (
              <li key={entry.id} id={entry.id}>
                <Card entry={entry} />
              </li>
            ))}
            <li>
              <SiteLink path="/docs/first-wrapped/" className="d-dir-card d-dir-build" data-glow>
                <span className="d-dir-ghost" aria-hidden>
                  <span className="d-dir-plus">+</span>
                  <small>Your Wrapped here</small>
                </span>
                <span className="d-dir-name">
                  <strong>Your product, next.</strong>
                  <Arrow />
                </span>
                <span className="d-dir-text">
                  Every card here is react-wrapped: the scenes, charts and transitions on this site. Give your own users
                  their year, free and MIT licensed.
                </span>
                <span className="d-dir-meta">
                  <code className="d-dir-tag">{INSTALL}</code>
                </span>
                <span className="d-dir-go">Build your first Wrapped</span>
              </SiteLink>
            </li>
          </ul>
          <p className="d-hero-note">Previews play a made-up year. Yours plays the real one.</p>
        </section>

        <section className="d-band" aria-labelledby="how" data-reveal>
          <div className="d-head">
            <div>
              <p className="d-eyebrow">How it works</p>
              <h2 id="how">
                Three steps.
                <span className="d-mute">Then it plays.</span>
              </h2>
            </div>
          </div>
          <ol className="d-dir-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="d-promo" aria-labelledby="live" data-reveal>
          <div>
            <p className="d-eyebrow">Free with a Hype Stack account</p>
            <h2 id="live">
              Your year already happened. <span className="d-mute">Go watch it.</span>
            </h2>
            <p>
              Sign in on Hype Stack, pick a platform, and your last 12 months play in a few seconds. Then do it again
              for the next one.
            </p>
          </div>
          <div className="d-promo-actions">
            <a
              className="d-pill d-pill-solid"
              href={hypeStack("docs-directory", "/wrapped")}
              target="_blank"
              rel="noopener"
            >
              Make your Wrapped
            </a>
            <a className="d-pill" href={hypeStack("docs-directory")} target="_blank" rel="noopener">
              What is Hype Stack?
            </a>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
