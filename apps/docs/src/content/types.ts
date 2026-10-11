/*
 * A docs page as data. The same page is drawn as HTML on the site and written out as Markdown for people and
 * models that read text, so a page is never described twice.
 *
 * Text fields take a small subset of Markdown: `code`, **bold** and [links](/docs/charts/). Links to other pages are
 * written as site paths.
 */

/** What a preview shows. The page says which thing; the site decides how to draw it. */
export type Demo =
  | { type: "chart"; example: string }
  | { type: "transition"; id: string }
  | { type: "scene"; key: string }
  | { type: "part"; id: string };

export type CodeLanguage = "tsx" | "ts" | "css" | "bash" | "html";

export type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  | { kind: "steps"; items: readonly string[] }
  | { kind: "note"; text: string }
  | { kind: "code"; language: CodeLanguage; code: string; file?: string }
  | { kind: "table"; head: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: "preview"; demo: Demo; caption?: string }
  | { kind: "faq"; items: readonly { question: string; answer: string }[] }
  | { kind: "cards"; items: readonly { path: string; title: string; text: string; demo?: Demo }[] };

export type SectionId =
  | "get-started"
  | "scenes"
  | "charts"
  | "transitions"
  | "player"
  | "scanner"
  | "graphics"
  | "marks"
  | "guides";

export interface DocPage {
  /** Where the page lives, with both slashes: "/docs/charts/spark/". */
  path: string;
  section: SectionId;
  /** The H1. */
  title: string;
  /** A few words added after the title in the browser tab and in search results: "a glowing line over time". */
  tagline?: string;
  /** The short name in the sidebar. */
  nav: string;
  /** What a search result shows under the title: 50 to 170 characters. */
  description: string;
  /** The first paragraph: what this is and when to reach for it. */
  lead: string;
  blocks: readonly Block[];
  /** Paths of pages worth reading next. At least three on a finished page. */
  related: readonly string[];
  /** The day the content last changed, YYYY-MM-DD. */
  updated: string;
}

export interface Section {
  id: SectionId;
  title: string;
  pages: readonly DocPage[];
}

/** A heading's anchor: its words, lowercase, joined with hyphens. */
export const anchorOf = (text: string) =>
  text
    .toLowerCase()
    .replaceAll(/`/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
