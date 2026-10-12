/*
 * Where the site lives and who it points at, in one place. The address is a GitHub Pages project site today; moving
 * to a domain of its own is a change to `origin` and `base` and nothing else.
 */

type Campaign = "docs-sidebar" | "docs-float" | "docs-footer" | "docs-home" | "docs-page";

export const SITE = {
  /** The package scope and the repository, as people type it. */
  name: "react-wrapped",
  /** The name as a title. */
  title: "React Wrapped",
  tagline: "Year in review videos for React",
  description:
    "React components for year in review videos: animated scenes, 21 charts, 19 transitions, a player with a timeline editor, a scanner and share cards.",
  origin: "https://bettertyped.github.io",
  /** Every address starts with the repository's name. Kept in step with `BASE` in vite.config.ts. */
  base: "/react-wrapped/",
  repo: "https://github.com/BetterTyped/react-wrapped",
  npm: "https://www.npmjs.com/package/@react-wrapped/kit",
  discord: "https://www.hype-stack.dev/discord",
  x: "https://x.com/maciej_pyrc",
  sponsor: "https://github.com/sponsors/prc5",
  organization: { name: "BetterTyped", url: "https://github.com/BetterTyped" },
  author: { name: "Maciej Pyrc", url: "https://github.com/prc5" },
} as const;

/** A link to Hype Stack that says which part of this site sent the visitor. */
export const hypeStack = (campaign: Campaign, path = "/") =>
  `https://www.hype-stack.dev${path}?ref=react-wrapped&utm_source=react-wrapped&utm_medium=referral&utm_campaign=${campaign}`;

/** The full address of a page, from its path on the site ("/docs/charts/spark/"). */
export const absoluteUrl = (path: string) => `${SITE.origin}${SITE.base}${path.replace(/^\/+/, "")}`;

/** The packages, in the order they depend on each other. */
export const PACKAGES = [
  { name: "@react-wrapped/core", holds: "The stage, the motion kit, palettes, formats and transitions." },
  { name: "@react-wrapped/charts", holds: "Twenty-one charts and their entrances." },
  { name: "@react-wrapped/scenes", holds: "Eleven ready-made scenes and the pixel art set." },
  { name: "@react-wrapped/player", holds: "The player, the timeline, the scene editor and the settings panel." },
  { name: "@react-wrapped/scan", holds: "The year scan that finds hidden drops." },
  { name: "@react-wrapped/graphics", holds: "Share cards, insight cards and the gallery under the video." },
  { name: "@react-wrapped/marks", holds: "The marks pressed into the bottom right corner of the stage." },
  { name: "@react-wrapped/kit", holds: "All of the above in one install, plus the whole page as one component." },
] as const;
