import { expect, type Page, test } from "@playwright/test";

import { at, player, watchErrors } from "./helpers";

/*
 * The full example is a whole Wrapped from one component, so it is the place to check that the parts work together:
 * the video plays, the settings change it, the scan adds scenes to it, and none of that logs an error.
 */

const EXAMPLE = at("/examples/full-wrapped/");

// One at a time, in this file only. The example is the heaviest page of the site, and several of them playing at
// once slow each other down enough to make "the clock moves within two seconds" a test of the machine.
test.describe.configure({ mode: "default" });

/** The frame of the video itself, not one of the small previews. */
const stage = (page: Page) => page.locator(".wr-stage:not(.wr-thumb)");

const controls = (page: Page) => page.getByRole("toolbar", { name: /Video controls/ });

/** "0:07 / 1:02": where the video is and how long it runs. */
const clock = (page: Page) => controls(page).locator("span", { hasText: /^\d+:\d\d \/ \d+:\d\d$/ });

/** The seconds the clock shows the video is at. */
async function clockSeconds(page: Page): Promise<number> {
  const [minutes = "0", seconds = "0"] = ((await clock(page).textContent()) ?? "").split(" / ")[0]?.split(":") ?? [];
  return Number(minutes) * 60 + Number(seconds);
}

const segments = (page: Page) => page.locator("[data-seg]");

/** Gallery tiles that are still closed: the scan has not found what they show. */
const lockedTiles = (page: Page) => page.locator("article", { hasText: "Still hidden" });

async function openExample(page: Page) {
  await page.goto(EXAMPLE);
  await player.ready(page);
  await expect(stage(page)).toBeVisible();
}

/* ---------- the steps, shared by the tests and by the tour that listens for errors ---------- */

/** A playing video moves its clock within two seconds. */
async function watchItPlay(page: Page, within = 2000) {
  const first = await clock(page).textContent();
  await expect.poll(() => clock(page).textContent(), { timeout: within, message: "the clock moves" }).not.toBe(first);
}

async function pauseThenPlay(page: Page) {
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  const paused = await clock(page).textContent();
  await page.waitForTimeout(1300);
  expect(await clock(page).textContent(), "a paused video stays where it is").toBe(paused);

  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect
    .poll(() => clock(page).textContent(), { timeout: 2500, message: "the clock moves again" })
    .not.toBe(paused);
}

const accent = (page: Page) =>
  stage(page).evaluate((node) => getComputedStyle(node).getPropertyValue("--wr-l4").trim());

async function pickGrape(page: Page) {
  const before = await accent(page);
  await page.getByRole("radiogroup", { name: "Palette" }).getByRole("radio", { name: "Grape" }).click();
  await expect.poll(() => accent(page), { message: "the stage takes the palette's brightest colour" }).not.toBe(before);
  expect(before, "the stage had a colour to begin with").not.toBe("");
}

async function pickSquare(page: Page) {
  const before = await stage(page).boundingBox();
  expect(before && before.height > before.width * 1.5, "the example opens as a 9:16 story").toBe(true);
  await page.getByRole("radiogroup", { name: "Format" }).getByRole("radio", { name: "1:1" }).click();
  await expect
    .poll(
      async () => {
        const box = await stage(page).boundingBox();
        return box ? Math.abs(box.width - box.height) : Number.NaN;
      },
      // A new format rebuilds every scene's timeline. On a busy machine that takes a while.
      { message: "the stage is as wide as it is tall", timeout: 20_000 },
    )
    .toBeLessThanOrEqual(1);
}

async function runTheScan(page: Page) {
  const scenesBefore = await segments(page).count();
  const lockedBefore = await lockedTiles(page).count();
  expect(lockedBefore, "the gallery starts with locked tiles").toBeGreaterThan(0);

  await page.getByRole("button", { name: "Scan my year" }).click();
  await page.getByRole("button", { name: "Find all" }).click();

  await expect
    .poll(() => segments(page).count(), { timeout: 30_000, message: "the timeline gains the found scenes" })
    .toBeGreaterThan(scenesBefore);
  await expect
    .poll(() => lockedTiles(page).count(), { timeout: 30_000, message: "the gallery opens tiles" })
    .toBeLessThan(lockedBefore);
}

async function startFromTheScan(page: Page) {
  await page.getByRole("button", { name: "Start from the scan" }).click();
  await expect(page.getByText("Your Wrapped is almost ready.")).toBeVisible();
  await expect(stage(page), "no video before the scan has run").toHaveCount(0);
  expect(await player.mounted(page), "no player before the scan has run").toBe(false);

  await page.getByRole("button", { name: "Find my scenes" }).click();
  await page.getByRole("button", { name: "Find all" }).click();

  await expect(stage(page), "the video takes the scan's place").toBeVisible({ timeout: 30_000 });
  await player.ready(page);
}

/* ---------- the tests ---------- */

test.describe("the full Wrapped example", () => {
  test("plays as soon as the page opens", async ({ page }) => {
    // Arrange
    await openExample(page);

    // Act and Assert
    await watchItPlay(page);
  });

  test("Pause stops the video and Play starts it again", async ({ page }) => {
    // Arrange
    await openExample(page);

    // Act and Assert
    await pauseThenPlay(page);
  });

  test("the player can be sent to a scene, and it waits there", async ({ page }) => {
    // Arrange
    await openExample(page);
    const scenes = await player.scenes(page);
    const target = scenes[Math.min(3, scenes.length - 1)];
    expect(scenes.length, "the video has scenes").toBe(await segments(page).count());
    expect(await player.duration(page)).toBeGreaterThan(target?.time ?? Number.POSITIVE_INFINITY);

    // Act
    await player.seek(page, target?.time ?? 0);

    // Assert
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect.poll(() => clockSeconds(page)).toBe(Math.floor(target?.time ?? 0));
  });

  test('the palette "Grape" recolours the stage', async ({ page }) => {
    // Arrange
    await openExample(page);

    // Act and Assert
    await pickGrape(page);
  });

  test('the format "1:1" makes the stage square', async ({ page }) => {
    // Arrange
    await openExample(page);

    // Act and Assert
    await pickSquare(page);
  });

  test("the scan adds its finds to the timeline and opens their graphics", async ({ page }) => {
    // Arrange
    await openExample(page);

    // Act and Assert
    await runTheScan(page);
  });

  test("started from the scan, there is no video until the scan has found the scenes", async ({ page }) => {
    // Arrange
    await openExample(page);

    // Act and Assert
    await startFromTheScan(page);
  });

  test("none of it logs a console error or throws", async ({ page }) => {
    test.slow();
    // Arrange: every error is kept with the step it happened in.
    const errors = watchErrors(page);
    const heard: string[] = [];
    const step = async (name: string, run: (page: Page) => Promise<void>) => {
      const before = errors.length;
      await run(page);
      heard.push(...errors.slice(before).map((error) => `while ${name}: ${error}`));
    };

    // Act
    await step("opening the page", openExample);
    // This test is about errors, not speed: on a busy machine the clock gets longer here than in its own test.
    await step("playing", (opened) => watchItPlay(opened, 8000));
    await step("pausing and playing", pauseThenPlay);
    await step("picking the Grape palette", pickGrape);
    await step("picking the 1:1 format", pickSquare);
    await step("running the scan", runTheScan);
    await step("starting from the scan", startFromTheScan);

    // Assert
    expect(heard).toEqual([]);
  });
});
