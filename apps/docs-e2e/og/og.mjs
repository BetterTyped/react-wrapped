import { chromium } from "@playwright/test";
/* oxlint-disable no-console -- a command line tool says what it did */
// Draws the share image of every section of the docs into apps/docs/public/og. Run it by hand after changing
// og.html or the list below:
//   node apps/docs-e2e/og/og.mjs
// It lives here because it needs Playwright's Chromium, which this project already has.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../docs/public/og");

/** One image per section. The file name is what `src/seo/head.ts` asks for. */
const IMAGES = [
  ["home", "Year in review videos, in React", "Scenes, charts and transitions on one timeline."],
  ["docs", "Documentation", "Install it, play a first video, make it yours."],
  ["charts", "21 charts", "Each a picture of its own numbers, each with its own entrance."],
  ["transitions", "19 transitions", "Covers in the palette's colours, and moves of the scene itself."],
  ["scenes", "11 scenes", "Ready-made, and a kit for writing your own."],
  ["player", "The player", "Controls, a timeline that is the editor, MP4 export."],
  ["scanner", "The year scan", "A beam sweeps the year and finds what is hidden in it."],
  ["graphics", "Graphics to keep", "A share card and a card per insight, as PNGs."],
  ["marks", "Marks", "What the stage presses into its corner."],
  ["guides", "Guides", "Custom scenes, transitions, palettes and pages."],
  ["designs", "Every design", "All charts and transitions, playing live on one page."],
  ["examples", "Full Wrapped", "A whole year in review, built with the library."],
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const [name, title, line] of IMAGES) {
  const url = pathToFileURL(path.join(here, "og.html"));
  url.searchParams.set("title", title);
  url.searchParams.set("line", line);
  await page.goto(url.href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(`og: ${name}.png`);
}
await browser.close();
