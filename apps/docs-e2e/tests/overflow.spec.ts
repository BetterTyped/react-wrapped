import { expect, type Page, test } from "@playwright/test";

import { at, hydrated } from "./helpers";

/* oxlint-disable no-await-in-loop -- the page is watched one look after another, and one screenful after another */

/*
 * The frame-overflow audit. The designs page plays every chart and every transition in a frame of its own; in each
 * of the three formats, nothing a scene shows may reach past the edge of its frame, where a video would cut it off.
 *
 * How a tile is measured. Its scene plays on a loop, so an element is only judged while it stands still: its box has
 * to be the same on three looks in a row, with the animation ticking between them. That keeps a title that is still
 * flying in, or a scene a transition is carrying out of the frame, from being called an overflow, and it means a
 * tile that was already half way through its loop when it scrolled into view is measured just the same.
 */

const FORMATS = [
  { label: "9:16", ratio: 9 / 16 },
  { label: "1:1", ratio: 1 },
  { label: "16:9", ratio: 16 / 9 },
] as const;

type Format = (typeof FORMATS)[number];

/** An element resting further out of its frame than this many pixels on screen is a failure. */
const ALLOWED_PX = 1;

/** How long each screenful of tiles is watched. Entrances take up to two seconds, then the picture holds. */
const WATCH_MS = 5000;

/** Tall enough for a few rows of tiles at once, so the page is audited in a handful of screens. */
test.use({ viewport: { width: 1440, height: 2000 } });

interface Sticking {
  /** The element, as "p.wr-lede". */
  element: string;
  /** The first words in it, to tell two of a kind apart. */
  text: string;
  side: string;
  /** How far past the frame's edge it rests, in pixels on screen. */
  px: number;
  /** The same distance in pixels of the frame at its real size. */
  framePx: number;
}

interface TileReport {
  /** The tile's caption: the name of the chart or the transition. */
  tile: string;
  kind: "chart" | "transition";
  /** How many elements were seen standing still and measured. */
  measured: number;
  /** Whether the scene's title was among them (charts only). */
  titleMeasured: boolean;
  sticking: Sticking[];
}

interface WatchInput {
  skip: number[];
  watchMs: number;
  allowedPx: number;
  only: string | null;
}

interface WatchOutput {
  audited: number[];
  reports: TileReport[];
}

/**
 * Runs in the page. Scrolls to the first tile nobody has looked at, watches every tile that fits on the screen for a
 * while, and says what rested outside its frame. Null when no tile is left.
 */
async function watchScreenful({ skip, watchMs, allowedPx, only }: WatchInput): Promise<WatchOutput | null> {
  // Decoration that is meant to bleed past the frame, or that nobody is meant to read.
  const DECORATIVE = '[aria-hidden="true"], .wr-light, .wr-grain, .wr-mark, .wr-rings, [data-wr-cover]';
  const tiles = [...document.querySelectorAll<HTMLElement>(".d-shelf > li")].map((item, index) => ({
    index,
    caption: item.querySelector("strong")?.textContent?.trim() ?? `tile ${index + 1}`,
    stage: item.querySelector<HTMLElement>(".wr-stage"),
  }));
  const wanted = tiles.filter((tile) => !skip.includes(tile.index) && (only === null || tile.caption === only));
  const first = wanted[0];
  if (!first) return null;
  if (!first.stage) throw new Error(`The tile "${first.caption}" has no .wr-stage in it.`);

  window.scrollTo(0, window.scrollY + first.stage.getBoundingClientRect().top - 80);
  await new Promise((resolve) => setTimeout(resolve, 150));

  const onScreen = wanted.filter((tile) => {
    if (!tile.stage) return tile === first;
    const box = tile.stage.getBoundingClientRect();
    return tile === first || (box.top >= 0 && box.bottom <= window.innerHeight);
  });

  // Helpers live inside: this function is sent to the page as text, so it can use nothing from this file.
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const name = (node: Element) => {
    const classes = (node.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean);
    return [node.tagName.toLowerCase(), ...classes].join(".");
  };

  const watched = onScreen.map((tile) => ({
    tile,
    kind: (tile.stage?.querySelectorAll(".wr-scene").length ?? 0) > 1 ? ("transition" as const) : ("chart" as const),
    // For each element: the box it had on the last look, and for how many looks in a row it has had it.
    resting: new Map<Element, { box: string; looks: number }>(),
    measured: new Set<Element>(),
    sticking: new Map<Element, Sticking>(),
  }));

  // Two animation frames and a short pause: the animation has ticked at least once between two looks.
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- sent to the page with the rest
  const nextLook = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50)));
    });

  const started = performance.now();
  while (performance.now() - started < watchMs) {
    await nextLook();
    for (const entry of watched) {
      const stage = entry.tile.stage;
      if (!stage) continue;
      const frame = stage.getBoundingClientRect();
      // A stage is drawn at its real size and scaled down, so this is how many frame pixels one screen pixel is.
      const scale = stage.offsetWidth > 0 ? frame.width / stage.offsetWidth : 1;
      const scenes = [...stage.querySelectorAll<HTMLElement>(".wr-scene")];
      // A transition carries whole scenes around: only the scenes themselves are judged, not what is in them.
      const candidates: Element[] =
        entry.kind === "transition" ? scenes : scenes.flatMap((scene) => Array.from(scene.querySelectorAll("*")));
      for (const node of candidates) {
        if (entry.kind === "chart") {
          if (node.closest(DECORATIVE)) continue;
          // A drawing is measured as one thing: the svg, not the paths in it.
          if (node.closest("svg") && node.tagName.toLowerCase() !== "svg") continue;
        }
        // Not shown right now: opacity 0 or visibility hidden, its own or inherited from a wrapper.
        if (!node.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
          entry.resting.delete(node);
          continue;
        }
        const box = node.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        const key = `${box.left},${box.top},${box.width},${box.height}`;
        const before = entry.resting.get(node);
        const looks = before && before.box === key ? before.looks + 1 : 1;
        entry.resting.set(node, { box: key, looks });
        if (looks < 3) continue;

        entry.measured.add(node);
        const out = [
          { side: "left", px: frame.left - box.left },
          { side: "right", px: box.right - frame.right },
          { side: "top", px: frame.top - box.top },
          { side: "bottom", px: box.bottom - frame.bottom },
        ].toSorted((a, b) => b.px - a.px)[0];
        if (!out || out.px <= allowedPx) continue;
        const worst = entry.sticking.get(node);
        if (worst && worst.px >= out.px) continue;
        entry.sticking.set(node, {
          element: name(node),
          text: (node.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 32),
          side: out.side,
          px: Math.round(out.px * 10) / 10,
          framePx: Math.round(out.px / scale),
        });
      }
    }
  }

  return {
    audited: onScreen.map((tile) => tile.index),
    reports: watched.map((entry) => ({
      tile: entry.tile.caption,
      kind: entry.kind,
      measured: entry.measured.size,
      titleMeasured: [...entry.measured].some((node) => node.matches(".wr-title")),
      sticking: [...entry.sticking.values()],
    })),
  };
}

/** Opens the designs page in a format and waits until every frame on it has that shape. */
async function openDesigns(page: Page, format: Format): Promise<number> {
  await page.goto(at("/designs/"));
  await hydrated(page, ".d-look");
  const tiles = page.locator(".d-shelf > li");
  const before = await tiles.count();
  expect(before, "the designs page has tiles").toBeGreaterThan(0);

  await page.getByRole("group", { name: "Format" }).getByRole("button", { name: format.label }).click();

  await expect(tiles, `every tile is still on the page in ${format.label}`).toHaveCount(before);
  await expect
    .poll(
      () =>
        page.evaluate(
          ({ ratio }) => {
            const stages = [...document.querySelectorAll<HTMLElement>(".d-shelf .wr-stage")];
            // The shape of the frame, and the frame fitted to the box the page gave it.
            return stages.filter((stage) => {
              const box = stage.getBoundingClientRect();
              const room = stage.closest(".d-fit")?.getBoundingClientRect();
              const shaped = Math.abs(stage.offsetWidth / stage.offsetHeight - ratio) < 0.01;
              return !shaped || !room || Math.abs(box.width - room.width) > 1.5;
            }).length;
          },
          { ratio: format.ratio },
        ),
      { message: `frames that have not taken the ${format.label} shape yet` },
    )
    .toBe(0);
  await expect(page.locator(".d-shelf .wr-stage"), "one frame per tile").toHaveCount(before);
  return before;
}

/** Audits the tiles of the designs page in one format: all of them, or the one with a given caption. */
async function auditDesigns(page: Page, format: Format, only: string | null = null): Promise<TileReport[]> {
  await openDesigns(page, format);
  const reports: TileReport[] = [];
  const audited: number[] = [];
  // Screen by screen until no tile is left. The bound is only there so a page that never ends cannot hang the run.
  for (let screen = 0; screen < 60; screen += 1) {
    const result = await page.evaluate(watchScreenful, {
      skip: audited,
      watchMs: WATCH_MS,
      allowedPx: ALLOWED_PX,
      only,
    });
    if (!result) break;
    audited.push(...result.audited);
    reports.push(...result.reports);
  }
  return reports;
}

/** One line per element resting outside its frame, naming the tile, the format, the element and the distance. */
const describeSticking = (reports: readonly TileReport[], format: Format): string[] =>
  reports.flatMap((report) =>
    report.sticking.map(
      (found) =>
        `"${report.tile}" in ${format.label}: ${found.element}${found.text ? ` ("${found.text}")` : ""} sticks out of the frame by ${found.px} px on the ${found.side} (${found.framePx} px of the full-size frame)`,
    ),
  );

/**
 * Overflows the audit found that are real problems in the library, each waiting for a fix there. A case listed here
 * is left out of the format's main test and gets a `test.fixme` of its own below, so it stays visible in every run.
 * Add nothing here to make a red run green: only cases that were looked at and reported.
 */
const KNOWN_OVERFLOWS: readonly { format: Format["label"]; tile: string; note: string }[] = [];

/**
 * Formats the audit cannot get to today, each with what stops it. The test of a format listed here is a
 * `test.fixme`: the check is whole and waiting, and it runs again the day the entry is deleted.
 */
const BLOCKED: Partial<Record<Format["label"], string>> = {};

/** The audit of one format: every tile measured, nothing resting outside its frame. */
async function auditFormat(page: Page, format: Format) {
  test.slow();
  // Arrange
  const known = new Set(KNOWN_OVERFLOWS.filter((entry) => entry.format === format.label).map((entry) => entry.tile));

  // Act
  const reports = await auditDesigns(page, format);
  const judged = reports.filter((report) => !known.has(report.tile));

  // Assert
  expect(reports.length, "tiles audited").toBeGreaterThan(0);
  const unmeasured = judged
    .filter((report) => report.measured === 0 || (report.kind === "chart" && !report.titleMeasured))
    .map((report) => `"${report.tile}" in ${format.label}: ${report.measured} elements stood still long enough`);
  expect(unmeasured, "tiles the audit could not measure").toEqual([]);
  expect(describeSticking(judged, format)).toEqual([]);
}

for (const format of FORMATS) {
  const title = `nothing rests outside its frame on the designs page in ${format.label}`;
  const blocked = BLOCKED[format.label];
  if (blocked) test.fixme(`${title}. Blocked: ${blocked}`, ({ page }) => auditFormat(page, format));
  else test(title, ({ page }) => auditFormat(page, format));
}

for (const entry of KNOWN_OVERFLOWS) {
  const format = FORMATS.find((candidate) => candidate.label === entry.format);
  if (!format) throw new Error(`KNOWN_OVERFLOWS names a format that does not exist: ${entry.format}`);
  // A real overflow in the library, reported and not fixed yet. The note says what sticks out and by how much.
  test.fixme(`"${entry.tile}" stays inside its frame in ${entry.format}. Known overflow: ${entry.note}`, async ({
    page,
  }) => {
    // Act
    const reports = await auditDesigns(page, format, entry.tile);

    // Assert
    expect(reports.length, `the tile "${entry.tile}" is on the designs page`).toBe(1);
    expect(describeSticking(reports, format)).toEqual([]);
  });
}
