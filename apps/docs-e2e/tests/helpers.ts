import type { Locator, Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * What the specs share: where the built site is, which pages it has, and the few things about the page that are
 * easy to get wrong twice (waiting for React, reading the example's player).
 */

/** Every address of the site starts with the repository's name, the way GitHub Pages serves it. */
export const BASE = "/react-wrapped/";

/** The built docs on disk. `DOCS_E2E_ROOT` points the tests and the server at a copy instead. */
export const SITE_ROOT = path.resolve(
  process.env.DOCS_E2E_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../../docs/dist/client"),
);

/** A path on the site ("/docs/charts/bars/") as the address the test server answers at. */
export const at = (sitePath: string) => `${BASE}${sitePath.replace(/^\/+/, "")}`;

/** A file of the built site, read from disk. */
export function builtFile(relative: string): string {
  const file = path.join(SITE_ROOT, relative);
  if (!existsSync(file)) {
    throw new Error(
      `${file} is missing. Build the docs first: pnpm --filter "./packages/*" build && pnpm --filter @react-wrapped/docs build`,
    );
  }
  return readFileSync(file, "utf8");
}

export interface SitePage {
  /** The public address, exactly as the sitemap has it. */
  url: string;
  /** The same page on the test server: "/react-wrapped/docs/charts/bars/". */
  path: string;
  /** Under /docs/: an article with a Markdown twin. */
  isDoc: boolean;
}

/** Every page the sitemap lists, read from the built file. */
export function sitemapPages(): SitePage[] {
  const xml = builtFile("sitemap.xml");
  const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc = ""]) => {
    const pathname = new URL(loc).pathname;
    return { url: loc, path: pathname, isDoc: pathname.startsWith(`${BASE}docs/`) };
  });
  if (pages.length === 0) throw new Error("sitemap.xml lists no pages.");
  return pages;
}

/** The first page of the sitemap whose path matches, for the specs that need "one chart page" or "one transition page". */
export function pageMatching(pattern: RegExp): SitePage {
  const found = sitemapPages().find((page) => pattern.test(page.path));
  if (!found) throw new Error(`No page in sitemap.xml matches ${pattern}.`);
  return found;
}

export const oneChartPage = () => pageMatching(/\/docs\/charts\/[^/]+\/$/);
export const oneTransitionPage = () => pageMatching(/\/docs\/transitions\/[^/]+\/$/);

/** Where the site says it lives ("https://bettertyped.github.io"), taken from the sitemap. */
export const publicOrigin = () => new URL(sitemapPages()[0]?.url ?? "").origin;

/**
 * Collects what the page complains about: console errors and uncaught exceptions. Start it before the page is
 * opened, read the list at the end.
 */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    errors.push(`page error: ${error.message}`);
  });
  return errors;
}

/**
 * Waits until React has taken over the server's HTML around an element. A click that lands before that does
 * nothing, and clicking again to be safe would flip a toggle twice. React marks every node it owns with a key of
 * its own, which is the one sign of hydration a page gives without being asked.
 */
export async function hydrated(page: Page, selector: string): Promise<void> {
  await page.waitForFunction((target) => {
    const node = document.querySelector(target);
    return node !== null && Object.keys(node).some((key) => key.startsWith("__reactFiber$"));
  }, selector);
}

/**
 * The em dash and the en dash, which the site never uses. Built from their code points so this file does not have
 * them in it either.
 */
const DASHES = new RegExp(`[${String.fromCodePoint(0x2013)}${String.fromCodePoint(0x2014)}]`, "g");

/** Every dash found in a text, each with a few words around it so it can be found on the page. */
export function dashesIn(text: string): string[] {
  return [...text.matchAll(DASHES)].map((match) => {
    const index = match.index ?? 0;
    return text.slice(Math.max(0, index - 30), index + 30).replace(/\s+/g, " ");
  });
}

/* ---------- the example's player ---------- */

export interface PlayerScene {
  key: string;
  label: string;
  /** Where the scene starts, in seconds of the video at normal speed. */
  time: number;
}

/** What the full example puts on `window.__wrapped`: its player's handle, or null while no video is mounted. */
interface PlayerHandle {
  play: () => void;
  pause: () => void;
  restart: () => void;
  seek: (seconds: number) => void;
  duration: () => number;
  scenes: () => readonly PlayerScene[];
}

declare global {
  interface Window {
    __wrapped?: PlayerHandle | null;
  }
}

/**
 * The one place the tests touch `window.__wrapped`. If the example hands its player out some other way one day,
 * this is all that changes.
 */
export const player = {
  /** Waits for a mounted video with scenes on its timeline. */
  async ready(page: Page): Promise<void> {
    await page.waitForFunction(() => {
      const handle = window.__wrapped;
      return Boolean(handle) && (handle?.duration() ?? 0) > 0 && (handle?.scenes().length ?? 0) > 0;
    });
  },
  /** Whether a video is mounted right now. */
  mounted: (page: Page): Promise<boolean> => page.evaluate(() => Boolean(window.__wrapped)),
  duration: (page: Page): Promise<number> => page.evaluate(() => window.__wrapped?.duration() ?? 0),
  scenes: (page: Page): Promise<PlayerScene[]> =>
    page.evaluate(() => (window.__wrapped?.scenes() ?? []).map(({ key, label, time }) => ({ key, label, time }))),
  /** Jumps to a moment and stays there. */
  seek: (page: Page, seconds: number): Promise<void> =>
    page.evaluate((to) => {
      window.__wrapped?.seek(to);
    }, seconds),
};

/* ---------- the library's stylesheet ---------- */

/**
 * The address of the library's stylesheet on the test server: the one the full example links whose rules style
 * `.wr-stage`. Read from the built files, so a test that only needs the stylesheet does not have to open the
 * example and play its video to find it.
 */
export function libraryStylesheetAddress(): string {
  const html = builtFile("examples/full-wrapped/index.html");
  const hrefs = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].flatMap(([link]) => {
    const href = /\bhref="([^"]+)"/.exec(link)?.[1];
    return href?.startsWith(BASE) ? [href] : [];
  });
  const found = hrefs.find((href) => builtFile(href.slice(BASE.length)).includes(".wr-stage"));
  if (!found) throw new Error(`None of the example's stylesheets has a .wr-stage rule: ${hrefs.join(", ")}`);
  return found;
}

/* ---------- computed styles ---------- */

/** The computed value of each named property of an element (the first one a locator finds). */
export function stylesOf(element: Locator, properties: readonly string[]): Promise<Record<string, string>> {
  return element.first().evaluate((node, names) => {
    const computed = getComputedStyle(node);
    return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]));
  }, properties);
}
